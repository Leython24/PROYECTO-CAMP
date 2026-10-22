import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {initialQuestions,initialSources} from '../src/data/bank';
import {collectionQuestions,collectionSources,PROCESS_COLLECTION,PDF_COLLECTION} from '../src/data/collections';
import {collectionStats,makeCollectionAttempt} from '../src/engine/collections';
import {DEFAULT_FILTERS,filterQuestions} from '../src/engine/practice';
import {score} from '../src/engine/exam';
import {emptyProgress,withAttempt} from '../src/engine/persistence';
import {parseBank,validateProgress} from '../src/engine/validation';
import {mergeBuiltinQuestions,resolveAttemptQuestion} from '../src/engine/versioning';
import type {Question} from '../src/types';

const raw=JSON.parse(readFileSync('input/procesos-questions-extracted.json','utf8'));
const original=JSON.parse(readFileSync('src/data/collections/grupo-procesos-simulador-02-v1.json','utf8')) as Question[];
const qs=collectionQuestions.filter(q=>q.collectionId===PROCESS_COLLECTION);
const bank=[...initialQuestions,...collectionQuestions],sources=[...initialSources,...collectionSources];

test('Grupo de Procesos conserva exactamente 1–150, cuatro alternativas y explicación completa de sus 96 páginas',()=>{
  const pages=JSON.parse(readFileSync('input/procesos-pdf-extracted.json','utf8'));
  assert.equal(pages.pages.length,96);assert.deepEqual(pages.imageObjects,[]);
  assert.deepEqual(qs.map(q=>q.originalNumber),Array.from({length:150},(_,i)=>i+1));
  assert.equal(new Set(qs.map(q=>q.id)).size,150);
  for(let i=0;i<150;i++){
    assert.equal(original[i].stem,raw[i].stem);
    assert.equal(original[i].id,PROCESS_COLLECTION+'-q'+String(i+1).padStart(3,'0'));
    assert.deepEqual(original[i].options.map(o=>[o.id,o.text]),Object.entries(raw[i].options));
    assert.deepEqual(original[i].correctIds,[raw[i].key]);
    assert.equal(qs[i].documentExplanation,raw[i].explanation);
    assert.equal(qs[i].options.length,4);
  }
  assert.equal(qs[20].stem,raw[20].stem);
  assert.ok(qs[20].stem.startsWith('Un equipo está planificando un proyecto predictivo'));
  assert.ok(!qs[20].stem.includes('Pregunta 21'));
});

test('las claves se revisan antes de calificar y las formulaciones corregidas se identifican como IA',()=>{
  assert.deepEqual(collectionStats(bank,PROCESS_COLLECTION),{imported:150,practice:150,graded:150,pending:0});
  assert.equal(qs.filter(q=>q.adaptation).length,21);
  assert.deepEqual(qs.filter(q=>q.grading?.keyOrigin==='ia-authored').map(q=>q.originalNumber),[9,19,31,34,52,85,86,90,100,107,118,121,150]);
  for(const q of qs){
    assert.equal(q.review,'contrastado');assert.equal(q.humanReviewed,false);
    assert.equal(q.grading?.status,'checked');assert.ok(q.grading?.evidence?.length);
    assert.ok(q.grading?.reviewedAt);assert.equal(q.explanationOrigin,'ia');
    assert.ok(q.documentExplanation!.length>100);
    for(const o of q.options){assert.equal(o.explanationOrigin,'ia');assert.ok(o.explanation.length>80);assert.ok(o.sourceIds?.length);}
    const old=resolveAttemptQuestion(q,{questionRevisions:{[q.id]:1}});
    assert.equal(old.stem,raw[q.originalNumber!-1].stem);
  }
  assert.ok(qs[8].options[1].text.includes('Acta'));
  assert.ok(qs[18].options[0].text.includes('beneficios'));
  assert.ok(qs[149].options[0].text.includes('brechas de usabilidad'));
});

test('el PDF local está íntegro y todos los enlaces, referencias y 497 registros pasan la importación',()=>{
  for(const f of ['input/Grupo_de_Procesos_150.pdf','public/collections/'+PROCESS_COLLECTION+'/Grupo_de_Procesos_150.pdf']){
    assert.equal(createHash('sha256').update(readFileSync(f)).digest('hex'),'680f023075b201d6cdc1605434f3d4612d5b80d5081c8747bf6aea1ce067f81f');
  }
  const imported=parseBank(JSON.stringify({formatVersion:1,questions:bank,sources}));
  assert.equal(imported.questions.length,497);assert.equal(imported.sources.length,85);
  assert.deepEqual(imported.questions.filter(q=>q.collectionId===PROCESS_COLLECTION),qs);
  const invalid={...qs[0],documentExplanation:{invalid:true}};
  assert.throws(()=>parseBank(JSON.stringify({formatVersion:1,questions:[invalid],sources})),/explicación importada inválida/);
});

test('las 150 puntúan por respuesta, los errores y omisiones no reciben puntos y el orden no fuerza cuotas',()=>{
  const a=makeCollectionAttempt(bank,PROCESS_COLLECTION,[],{practice:false},1000);
  assert.deepEqual(a.questionIds,qs.map(q=>q.id));assert.equal(a.deadline,10801000);
  assert.ok(a.questionIds.every(id=>id.startsWith(PROCESS_COLLECTION)));
  for(const q of qs)a.answers[q.id]={selectedIds:q.correctIds,confirmed:false,at:2000};
  assert.deepEqual(score(a,bank),{total:150,graded:150,ungraded:0,correct:150,wrong:0,omitted:0,percent:100});
  for(const q of qs)a.answers[q.id]={selectedIds:[q.options.find(o=>!q.correctIds.includes(o.id))!.id],confirmed:false,at:2000};
  assert.equal(score(a,bank).wrong,150);
  delete a.answers[qs[20].id];assert.equal(score(a,bank).wrong,149);assert.equal(score(a,bank).omitted,1);
});

test('el banco anterior recibe la colección nueva sin modificar su banco ni sus intentos y notas',()=>{
  const old=bank.filter(q=>q.collectionId!==PROCESS_COLLECTION);
  const stored=mergeBuiltinQuestions(old,collectionQuestions);
  assert.equal(stored.length,497);assert.deepEqual(stored.slice(0,347),old);
  const p=emptyProgress();p.notes[initialQuestions[0].id]='Nota del banco original';p.notes[old[200].id]='Nota de Éxitos';
  const before=makeCollectionAttempt(old,PDF_COLLECTION,[],{practice:true,count:20},1000);
  before.answers[before.questionIds[0]]={selectedIds:old.find(q=>q.id===before.questionIds[0])!.correctIds,confirmed:true};
  p.attempts=[before];p.activeId=before.id;p.bookmarks=[before.questionIds[0]];
  assert.deepEqual(validateProgress(p,stored),[]);
  const after=makeCollectionAttempt(stored,PROCESS_COLLECTION,[],{practice:false},3000);
  after.answers[qs[20].id]={selectedIds:qs[20].correctIds,confirmed:false,at:4000};after.flagged=[qs[20].id];
  const moved=withAttempt(p,after);moved.notes[qs[20].id]='Nota de la pregunta 21';
  const recovered=JSON.parse(JSON.stringify(moved));
  assert.deepEqual(validateProgress(recovered,stored),[]);
  assert.deepEqual(recovered.attempts.find((a:any)=>a.id===before.id),before);
  assert.equal(recovered.notes[initialQuestions[0].id],'Nota del banco original');
  assert.equal(recovered.notes[old[200].id],'Nota de Éxitos');
  assert.equal(recovered.notes[qs[20].id],'Nota de la pregunta 21');
  assert.deepEqual(recovered.attempts.find((a:any)=>a.id===after.id).flagged,[qs[20].id]);
});

test('los filtros y el barajado mantienen aislado el simulador 2 salvo selección explícita de todos',()=>{
  const p=emptyProgress();
  assert.equal(filterQuestions(bank,DEFAULT_FILTERS,p).length,191);
  assert.equal(filterQuestions(bank,{...DEFAULT_FILTERS,collection:PROCESS_COLLECTION,review:''},p).length,150);
  assert.equal(filterQuestions(bank,{...DEFAULT_FILTERS,collection:PDF_COLLECTION,review:''},p).length,150);
  assert.equal(filterQuestions(bank,{...DEFAULT_FILTERS,collection:'all',review:''},p).length,497);
  const a=makeCollectionAttempt(bank,PROCESS_COLLECTION,[],{practice:true,domain:'4',shuffle:true,count:15},1000);
  assert.equal(a.questionIds.length,15);
  assert.ok(a.questionIds.every(id=>qs.some(q=>q.id===id&&q.domain===4)));
});
