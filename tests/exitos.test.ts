import type {Question} from '../src/types';
import {captureQuestionRevisions,mergeBuiltinQuestions,resolveAttemptQuestion,resolveAttemptBank,historicalQuestion,isArchivedQuestion} from '../src/engine/versioning';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {collectionQuestions, collectionSources, PDF_COLLECTION, ORIGINAL_COLLECTION} from '../src/data/collections';
import {initialQuestions, initialSources} from '../src/data/bank';
import {validateBank, validateProgress, parseBank} from '../src/engine/validation';
import {makeCollectionAttempt, collectionStats} from '../src/engine/collections';
import {canGrade, canPractice} from '../src/engine/grading';
import {score, remaining, makeAttempt} from '../src/engine/exam';
import {emptyProgress, withAttempt, recordResults} from '../src/engine/persistence';
import {filterQuestions, DEFAULT_FILTERS} from '../src/engine/practice';

const archived=JSON.parse(readFileSync('src/data/collections/exitos-simulador-01-v1.json','utf8')) as Question[];
const pdf=collectionQuestions.filter(q=>q.collectionId===PDF_COLLECTION);
const all=[...initialQuestions,...pdf], sources=[...initialSources,...collectionSources];
const text=readFileSync('input/Simulador_Exitos_150_TEXTO.txt','utf8');
const [main,annex]=text.split('ANEXO: CLAVES DEL MATERIAL Y RESPUESTAS PROPUESTAS');
test('el archivo histórico conserva literalmente las 150 preguntas y alternativas del TXT',()=>{
  const starts=[...main.matchAll(/^(\d+)\. /gm)];
  assert.equal(starts.length,150);
  for(let i=0;i<starts.length;i++){
    const m=starts[i], q=archived[i], block=main.slice(m.index!+m[0].length,starts[i+1]?.index??main.length);
    const opts=[...block.matchAll(/^([a-z]{1,2})\) (.*)$/gm)];
    const stem=block.slice(0,opts[0].index).replace('\n[Esta pregunta incluye una figura: consultar el PDF.]','').trim();
    assert.equal(q.stem,stem,q.id);
    assert.equal(q.originalNumber,i+1);
    assert.equal(q.id,PDF_COLLECTION+'-q'+String(i+1).padStart(3,'0'));
    assert.deepEqual(q.options.map(o=>[o.id,o.text]),opts.map(m=>[m[1],m[2]]),q.id);
  }
  assert.equal(new Set(pdf.map(q=>q.id)).size,150);
});
test('el anexo se conserva por procedencia y no produce preguntas adicionales ni claves inventadas',()=>{
  const keys=[...annex.matchAll(/^Pregunta (\d+): (.*)$/gm)];
  assert.equal(keys.length,150);
  for(const q of archived){
    const k=keys[q.originalNumber!-1][2];
    assert.equal(q.grading?.sourceText,k);
    const letter=k.match(/^(Material|Propuesta): ([a-z]{1,2})\)/);
    assert.deepEqual(q.grading?.referenceIds,letter?[letter[2]]:[]);
    if(k.startsWith('Propuesta:')||k.startsWith('sin clave')){
      assert.equal(canGrade(q),false);
      assert.deepEqual(q.correctIds,[]);
    }
  }
  assert.equal(archived.filter(q=>q.grading?.keyOrigin==='ia-proposal').length,24);
  assert.equal(archived.filter(q=>q.grading?.keyOrigin==='none').length,23);
  assert.deepEqual(archived.filter(q=>q.contentOrigin==='mixed').map(q=>q.originalNumber),[50,68,84,98,115,122,130,137]);
  assert.equal(archived.filter(q=>q.explanationSource==='pdf-annex').length,9);
  assert.ok(archived.every(q=>q.review==='pendiente'&&!q.humanReviewed));
});
test('todo diagrama y ambos documentos están incluidos como recursos locales',()=>{
  const figures=new Set<string>();
  for(const q of [...pdf,...archived]) for(const d of q.diagrams??[]){
    assert.ok(existsSync('public'+d.src),d.src); figures.add(d.src);
  }
  assert.equal(figures.size,5);
  assert.deepEqual(archived.filter(q=>q.diagrams?.length).map(q=>q.originalNumber),[8,9,10,11,12,13,14,15,16,17,20,98,103,107]);
  for(const s of collectionSources){if(s.localUrl)assert.ok(existsSync('public'+s.localUrl));else assert.ok(s.url.startsWith('https:'));}
});
test('la colección revisada califica las 150 en orden original y mantiene su plazo',()=>{
  const a=makeCollectionAttempt(all,PDF_COLLECTION,[],{practice:false,allowUngraded:true},1000);
  assert.deepEqual(a.questionIds,pdf.map(q=>q.id));
  assert.equal(a.questionIds.length,150);
  for(const q of pdf) a.answers[q.id]={selectedIds:canGrade(q)?q.correctIds:[q.options[0].id],confirmed:false};
  assert.deepEqual(score(a,all),{total:150,graded:150,ungraded:0,correct:150,wrong:0,omitted:0,percent:100});
  assert.equal(remaining(JSON.parse(JSON.stringify(a)),61000),179*60000);
});
test('las preguntas 27-30 tienen contexto explícito y claves múltiples contrastadas',()=>{
  for(const n of [27,28,29,30]){
    const q=pdf[n-1];assert.ok(!q.selectionMode);assert.equal(q.options.length,14);
    assert.equal(q.choose,n<=28?4:3);assert.ok(canPractice(q));assert.equal(canGrade(q),true);
  }
  assert.deepEqual(pdf[29].options.map(o=>o.id),['o','p','q','r','s','t','u','v','w','x','y','z','aa','bb']);
  assert.equal(pdf[21].options.length,9);
});
test('banco completo y progreso con preguntas PDF pasan exportación/importación sin perder notas antiguas',()=>{
  assert.deepEqual(validateBank({formatVersion:1,questions:all,sources}),[]);
  const p=emptyProgress();p.notes[initialQuestions[0].id]='Nota anterior';p.bookmarks=[initialQuestions[0].id];
  const a=makeCollectionAttempt(all,PDF_COLLECTION,[],{practice:true,count:3,allowUngraded:true},1000);
  a.answers[pdf[0].id]={selectedIds:['a'],confirmed:true,at:1100};
  a.flagged=[pdf[1].id];p.notes[pdf[1].id]='Nota Éxitos';
  const saved=recordResults(withAttempt(p,{...a,finishedAt:2000}),{...a,finishedAt:2000});
  const restored=JSON.parse(JSON.stringify(saved));
  assert.deepEqual(validateProgress(restored,all),[]);
  assert.equal(restored.notes[initialQuestions[0].id],'Nota anterior');
  assert.equal(restored.notes[pdf[1].id],'Nota Éxitos');
  assert.equal(restored.attempts[0].flagged[0],pdf[1].id);
  assert.equal(parseBank(JSON.stringify({formatVersion:1,questions:all,sources})).questions.length,347);
});
test('filtros eligen el PDF expresamente y las estadísticas distinguen las cuatro cantidades',()=>{
  const p=emptyProgress();
  assert.equal(filterQuestions(all,DEFAULT_FILTERS,p).length,191);
  assert.equal(filterQuestions(all,{...DEFAULT_FILTERS,collection:PDF_COLLECTION,review:''},p).length,150);
  assert.equal(filterQuestions(all,{...DEFAULT_FILTERS,collection:'all',review:''},p).length,347);
  assert.deepEqual(collectionStats(all,PDF_COLLECTION),{imported:150,practice:150,graded:150,pending:95});
  assert.equal(initialQuestions.filter(q=>(q.collectionId??ORIGINAL_COLLECTION)===ORIGINAL_COLLECTION).length,197);
});


test('las 55 claves revisadas son IA con fuentes y las otras 95 preguntas no se modifican',()=>{
  const reviewed=pdf.filter(q=>q.revision===2);
  assert.equal(reviewed.length,55);
  const expected:Record<number,string[]>={
    2:['a'],3:['b'],7:['b'],8:['a'],9:['b'],10:['c'],11:['a'],12:['b'],13:['c'],14:['a'],15:['b'],16:['c'],17:['a'],
    27:['a','e','i','l'],28:['c','g','h','j'],29:['b','f','n'],30:['r','y','aa'],34:['d'],41:['b'],48:['c'],50:['b'],53:['b'],60:['b'],61:['d'],62:['c'],68:['b'],69:['a'],70:['c'],77:['b'],78:['b'],84:['c'],85:['b'],91:['c'],92:['a'],96:['a'],98:['d'],115:['a'],116:['a'],118:['a'],119:['a'],122:['c'],123:['d'],130:['b'],131:['a'],132:['d'],135:['a'],137:['d'],138:['c'],139:['a'],145:['d'],146:['a'],147:['b'],148:['b'],149:['d'],150:['a']
  };
  for(const q of pdf){
    const old=archived.find(o=>o.id===q.id)!;
    if(q.revision!==2){assert.deepEqual(q,old);continue}
    assert.deepEqual(q.correctIds,expected[q.originalNumber!]);
    assert.equal(q.grading?.keyOrigin,'ia-authored');
    assert.equal(q.grading?.status,'checked');
    assert.equal(q.humanReviewed,false);
    assert.equal(q.review,'contrastado');
    assert.equal(q.grading?.sourceText,old.grading?.sourceText);
    assert.ok(q.grading?.evidence?.length);
    for(const o of q.options){
      assert.ok(o.explanation.length>25);
      assert.ok(o.sourceIds?.length);
      for(const id of o.sourceIds??[])assert.ok(sources.some(s=>s.id===id&&s.status==='consultada'&&s.url.startsWith('https:')));
    }
  }
});
test('los ejercicios sin leyenda se reemplazan sin adjudicar una clave al diagrama original',()=>{
  for(let n=8;n<=17;n++){
    const q=pdf[n-1];
    assert.equal(q.adaptation?.kind,'replacement');
    assert.equal(q.contentOrigin,'ia-completed');
    assert.equal(q.origin,'ia');
    assert.ok(!q.diagrams?.length);
    assert.deepEqual(archived[n-1].correctIds,[]);
    assert.ok(archived[n-1].diagrams?.length);
  }
});
test('todas las respuestas erróneas y las omisiones producen un puntaje correcto sobre 150',()=>{
  const a=makeCollectionAttempt(all,PDF_COLLECTION,[],{practice:false},1000);
  for(const q of pdf)a.answers[q.id]={selectedIds:[q.options.find(o=>!q.correctIds.includes(o.id))!.id],confirmed:false};
  assert.deepEqual(score(a,all),{total:150,graded:150,ungraded:0,correct:0,wrong:150,omitted:0,percent:0});
  delete a.answers[pdf[0].id];
  assert.deepEqual(score(a,all),{total:150,graded:150,ungraded:0,correct:0,wrong:149,omitted:1,percent:0});
});
test('un intento anterior conserva enunciados y sus 55 preguntas sin calificación, sin recalcularlas con las nuevas claves',()=>{
  const legacy=makeAttempt(archived.map(q=>q.id),'pdf',[],180,1000);
  legacy.collectionId=PDF_COLLECTION;legacy.collectionIds=[PDF_COLLECTION];
  for(const q of archived)legacy.answers[q.id]={selectedIds:q.correctIds.length?q.correctIds:[q.options[0].id],confirmed:false};
  assert.deepEqual(score(legacy,all),{total:150,graded:95,ungraded:55,correct:95,wrong:0,omitted:0,percent:100});
  assert.equal(resolveAttemptQuestion(pdf[7],legacy).stem,archived[7].stem);
  const p=withAttempt(emptyProgress(),legacy);
  assert.deepEqual(validateProgress(JSON.parse(JSON.stringify(p)),all),[]);
});
test('selecciones múltiples antiguas de hasta 14 opciones siguen siendo válidas al recuperar el progreso',()=>{
  const q=archived[26],a=makeAttempt([q.id],'practica',[],0,1000);
  a.answers[q.id]={selectedIds:q.options.map(o=>o.id),confirmed:true,at:1100};
  const p=recordResults(withAttempt(emptyProgress(),a),a);
  p.notes[q.id]='Mi nota previa';p.bookmarks=[q.id];
  assert.deepEqual(validateProgress(p,all),[]);
  assert.equal(resolveAttemptBank(a,all).find(x=>x.id===q.id)!.choose,14);
  assert.equal(historicalQuestion(pdf[26],a.id,p.attempts).grading?.status,'missing-key');
  assert.equal(filterQuestions(all,{...DEFAULT_FILTERS,collection:PDF_COLLECTION,review:'',status:'incorrectas'},p).length,0);
});
test('los intentos nuevos registran versiones y conservan calificación, respuestas y notas al serializar',()=>{
  const a=makeCollectionAttempt(all,PDF_COLLECTION,[],{practice:false},1000);
  for(const q of pdf)a.answers[q.id]={selectedIds:q.correctIds,confirmed:false,at:1100};
  const p=withAttempt(emptyProgress(),a);p.notes[pdf[7].id]='Nota sobre la adaptación';p.attempts[0].flagged=[pdf[7].id];
  const restored=JSON.parse(JSON.stringify(p));
  assert.deepEqual(validateProgress(restored,all),[]);
  assert.equal(a.questionRevisions?.[pdf[7].id],2);
  assert.equal(score(restored.attempts[0],all).correct,150);
  assert.equal(restored.notes[pdf[7].id],p.notes[pdf[7].id]);
  assert.deepEqual(captureQuestionRevisions(pdf),a.questionRevisions);
});
test('el banco antiguo se actualiza sin perder preguntas del banco original y las versiones desconocidas se rechazan',()=>{
  const merged=mergeBuiltinQuestions([...initialQuestions,...archived],pdf);
  assert.equal(merged.length,347);
  assert.ok(merged.some(q=>q.id===pdf[7].id&&q.revision===2));
  assert.ok(isArchivedQuestion(archived[7]));
  const a=makeCollectionAttempt(all,PDF_COLLECTION,[],{practice:true,count:10},1000);
  a.questionRevisions![pdf[7].id]=999;
  assert.ok(validateProgress(withAttempt(emptyProgress(),a),all).some(e=>e.includes('Versión')));
});
