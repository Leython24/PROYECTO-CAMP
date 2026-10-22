"""Reproducible import of the supplied TXT and all 48 PDF pages; no generated questions."""
from pathlib import Path
import re, json, hashlib, shutil, unicodedata
from collections import Counter
from exitos_study_notes import NOTES

ROOT=Path(__file__).resolve().parents[1]
CID='exitos-simulador-01'
TXT=ROOT/'input/Simulador_Exitos_150_TEXTO.txt'
PDF=ROOT/'input/Simulador_Exitos_150_COMPATIBLE.pdf'
text=TXT.read_text(encoding='utf-8-sig')
main,annex=text.split('ANEXO: CLAVES DEL MATERIAL Y RESPUESTAS PROPUESTAS',1)
matches=list(re.finditer(r'^(\d+)\. ',main,re.M))
keys=list(re.finditer(r'^Pregunta (\d+): (.*)$',annex,re.M))
assert [int(m[1]) for m in matches]==list(range(1,151))
assert [int(m[1]) for m in keys]==list(range(1,151))
pdf=json.loads((ROOT/'input/exitos-pdf-extracted.json').read_text(encoding='utf-8'))
assert len(pdf['pages'])==48
topics={t['id']:t for t in json.loads((ROOT/'src/data/topics.json').read_text(encoding='utf-8'))}
question_pages={}
question_text={}
for page in pdf['pages'][:41]:
    starts=list(re.finditer(r'^(\d+)\. ',page['text'],re.M))
    for i,m in enumerate(starts):
        n=int(m[1]); assert n not in question_pages
        question_pages[n]=page['page']
        question_text[n]=page['text'][m.end():starts[i+1].start() if i+1<len(starts) else len(page['text'])]
assert set(question_pages)==set(range(1,151))
pdf_keys={}
key_pages={}
for page in pdf['pages'][41:46]:
    lines=page['text'].splitlines()
    for i,line in enumerate(lines):
        if re.fullmatch(r'\d+',line) and i+1<len(lines) and re.match(r'Material:|Propuesta:|Sin marca',lines[i+1]):
            n=int(line)
            if n<1 or n>150: continue
            assert n not in pdf_keys
            pdf_keys[n]=lines[i+1]
            key_pages[n]=page['page']
assert set(pdf_keys)==set(range(1,151))
def normalized(s):
    return re.sub(r'\s+','',unicodedata.normalize('NFKC',s)).replace('’',"'").replace('‘',"'")
adapted={50,68,84,98,115,122,130,137}
ambiguities={
48:'La obligación contractual puede indicar dependencia obligatoria; el enunciado no identifica con claridad una actividad externa.',
62:'La comunicación con interesados puede pertenecer a varios dominios; falta contexto que discrimine.',
85:'La clave a del anexo no corresponde claramente a aceptación y satisfacción de interesados; hay alternativas plausibles.',
92:'Las expresiones deriva de lo terminado y movilidad de objetivos se solapan en el escenario; no hay clave confirmada.',
96:'La opción d mezcla pertenencia a prevención y evaluación; no todas las actividades son simultáneamente ambas.',
116:'Fechas, costos y ruta crítica son comparaciones posibles con líneas base; hay más de una alternativa plausible.',
118:'Enunciado incompleto: termina con dos puntos y no contiene una afirmación completa para verdadero/falso.',
119:'No se especifica si el denominador de eficiencia es tiempo total o tiempo sin valor agregado.',
131:'Las estrategias dependen de viabilidad y autoridad de compra no detalladas en el escenario.',
132:'La opción d mezcla aceptar con todas las anteriores; las cuatro estrategias pueden ser válidas según contexto.',
135:'No hay contexto que determine una periodicidad mensual como única correcta para identificar riesgos.',
145:'El propio anexo reconoce que b y d expresan características válidas de las estimaciones ágiles.'
}
for n in range(8,18):
    ambiguities[n]='Falta la leyenda que define los conjuntos de los círculos 1, 2 y 3; no se inventó una correspondencia.'
questions=[]
for i,m in enumerate(matches):
    n=int(m[1])
    block=main[m.end():matches[i+1].start() if i+1<len(matches) else len(main)].strip()
    source=block.split('\nFuente: ',1)[1]
    body=block.split('\nFuente: ',1)[0]
    note=''
    if '\nNota: ' in body:
        body,note=body.split('\nNota: ',1)
    has_figure='[Esta pregunta incluye una figura: consultar el PDF.]' in body
    body=body.replace('\n[Esta pregunta incluye una figura: consultar el PDF.]','')
    alternatives=list(re.finditer(r'^([a-z]{1,2})\) (.*)$',body,re.M))
    stem=body[:alternatives[0].start()].strip()
    opts=[{'id':a[1],'label':a[1],'text':a[2]} for a in alternatives]
    assert 2<=len(opts)<=14
    # Verify every supplied stem and alternative against the text extracted from PDF.
    assert normalized(stem) in normalized(question_text[n]), ('PDF/TXT stem mismatch',n)
    for o in opts:
        assert normalized(o['id']+') '+o['text']) in normalized(question_text[n]), ('PDF/TXT option mismatch',n,o['id'])
    k=keys[i]
    key_text=k[2]
    section=annex[k.end():keys[i+1].start() if i+1<len(keys) else len(annex)].strip()
    supplied_explanation=section.removeprefix('Explicación añadida: ') if section.startswith('Explicación añadida: ') else ''
    key_match=re.match(r'(Material|Propuesta): ([a-z]{1,2})\)',key_text)
    reference_ids=[key_match[2]] if key_match else []
    origin='material' if key_match and key_match[1]=='Material' else 'ia-proposal' if key_match else 'none'
    # Cross-check annex type and letter against the PDF, not just the TXT.
    pdf_key=pdf_keys[n]
    if key_match: assert pdf_key.startswith(key_match[1]+': '+key_match[2]+')'), ('PDF/TXT key mismatch',n)
    else: assert pdf_key.startswith('Sin marca'), ('PDF/TXT missing-key mismatch',n)
    assert all(any(o['id']==id for o in opts) for id in reference_ids)
    status='ambiguous' if n in ambiguities else 'material-key' if origin=='material' else 'missing-key'
    correct_ids=reference_ids if status=='material-key' else []
    note_key=ambiguities.get(n) or ('Clave marcada en el material, sin validación conceptual independiente.' if origin=='material' else 'Respuesta propuesta en el anexo con IA; no es una clave confirmada y no se usa para calificar.' if origin=='ia-proposal' else 'El anexo indica que no hay una clave visible o confirmada. No se añadió una solución.')
    teaching=NOTES[n]
    assert teaching['topic'] in topics
    topic=topics[teaching['topic']]
    ai_options=teaching['options']
    if ai_options: assert len(ai_options)==len(opts),('number of explanations',n)
    for j,o in enumerate(opts):
        if ai_options: explanation=ai_options[j]
        else:
            # True/false questions retain their exact choices; pedagogical guidance is explicitly AI.
            assert len(opts)==2
            explanation=('Esta alternativa afirma el enunciado. ' if j==0 else 'Esta alternativa niega el enunciado. ')+teaching['reason']
        o.update(explanation=explanation,explanationOrigin='ia',contentOrigin='mixed' if n in adapted else 'original')
    reasons=['Clave del material pendiente de contraste independiente.'] if status=='material-key' else [note_key]
    if n in adapted: reasons.append('Enunciado o alternativas adaptados con IA en el documento; no se atribuyen íntegramente a Project Now.')
    if origin=='ia-proposal' and n in ambiguities: reasons.append('El anexo solo propone una respuesta; se conserva como referencia, no como clave.')
    q={
      'id':f'{CID}-q{n:03d}','collectionId':CID,'originalNumber':n,
      'domain':int(topic['taskId'][1]),'taskId':topic['taskId'],'topicId':topic['id'],
      'tags':['Éxitos','PMBOK 7',topic['title']],
      'type':'calculo' if n==101 else 'interpretacion' if has_figure or n==84 else 'situacional' if len(stem)>260 else 'conceptual',
      'difficulty':'intermedia' if n==101 or len(stem)>260 else 'basica',
      'origin':'adaptada' if n in adapted else 'externa','contentOrigin':'mixed' if n in adapted else 'original-pdf',
      'review':'pendiente','humanReviewed':False,
      'stem':stem,'sourceNote':note,'sourcePage':question_pages[n],
      'options':opts,'correctIds':correct_ids,'choose':len(opts) if n in range(27,31) else 1,
      'selectionMode':'multiple' if n in range(27,31) else 'single',
      'practiceAvailable':True,
      'explanation':supplied_explanation or teaching['reason'],
      'explanationOrigin':'ia','explanationSource':'pdf-annex' if supplied_explanation else 'app-ai',
      'concept':topic['title'],'confusion':teaching['reason'],
      'refs':[{'sourceId':'exitos-pdf-01','section':f'Pregunta {n}, página {question_pages[n]}; anexo de claves, página {key_pages[n]}'},
              {'sourceId':'exitos-txt-01','section':f'Pregunta {n} y entrada Pregunta {n} del anexo'}],
      'consultedAt':'2026-10-22','terms':topic['terms'],
      'provenance':{'author':'Material atribuido a Project Now en la compilación aportada' if n not in adapted else 'Compilación del material aportado con adaptaciones de IA',
                    'resource':'Simulador_Exitos_150_COMPATIBLE.pdf y Simulador_Exitos_150_TEXTO.txt',
                    'license':'Material aportado por el usuario para estudio personal; licencia de republicación no comprobada.',
                    'note':source+' · Clasificación temática y orientaciones de estudio añadidas con IA en la aplicación. Las explicaciones importadas del anexo también son añadidos de IA, no explicaciones originales del autor.'},
      'grading':{'status':status,'note':note_key,'sourcePage':key_pages[n],'keyOrigin':origin,'referenceIds':reference_ids,'sourceText':key_text},
      'reviewReasons':reasons,
    }
    if has_figure:
        obj=20 if 8<=n<=17 else {20:34,98:74,103:79,107:82}[n]
        assert any(d['file']==f'diagrama-obj-{obj}.png' for d in pdf['pages'][question_pages[n]-1]['images'])
        q['diagrams']=[{'src':f'/collections/{CID}/diagrama-obj-{obj}.png',
                        'alt':{20:'Tres círculos concéntricos numerados 1, 2 y 3, sin leyenda de sus conjuntos.',34:'Ciclo con seis recuadros numerados 1 a 6 conectados con flechas.',74:'Gráfico de costo relativo del cambio desde requisitos hasta producción, con valores ilustrativos de 1x a 150x.',79:'Tablero de estados de ánimo de Tom y Lucy por días, representados con emojis.',82:'Tablero Kanban desde Listo hasta Completado; la leyenda advierte variabilidad del tiempo de entrega.'}[obj],
                        'caption':f'Figura extraída del PDF aportado, página {question_pages[n]}.'}]
    questions.append(q)
sources=[]
for id,name,lid,local,section in [
 ('exitos-pdf-01','Simulador 150 Preguntas · Éxitos · PDF completo','libfile_81013a18f7448191be276bc829aea67d','Simulador_Exitos_150_COMPATIBLE.pdf','48 páginas: preguntas, figuras, anexo y explicaciones añadidas'),
 ('exitos-txt-01','Simulador 150 Preguntas · Éxitos · Transcripción TXT','libfile_2ba8ca9f43148191ad79c904e1ec849e','Simulador_Exitos_150_TEXTO.txt','Enunciados, alternativas y claves del anexo')]:
    sources.append({'id':id,'title':name,'author':'Compilación aportada por el usuario; material atribuido a Project Now y añadidos de IA',
                    'url':f'https://chatgpt.com/api/library/files/{lid}/download','localUrl':f'/collections/{CID}/{local}',
                    'section':section,'edition':'Versión compatible de 150 preguntas','accessed':'2026-10-22','status':'consultada',
                    'usage':'Enunciados y alternativas importados literalmente; claves diferenciadas por procedencia, sin verificarlas automáticamente.',
                    'note':'Incluida localmente para consulta sin Google Drive ni Sites. Las referencias de apoyo del anexo no equivalen a verificación de todas las claves.'})
out=ROOT/'src/data/collections'
out.mkdir(parents=True,exist_ok=True)
for name,data in [('exitos-simulador-01-v1.json',questions),('exitos-sources.json',sources)]:
    (out/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
public=ROOT/f'public/collections/{CID}'
for f in [TXT,PDF]: shutil.copyfile(f,public/f.name)
report={'stage':'immutable-original-import-v1','collectionId':CID,'imported':len(questions),'practice':150,'graded':sum(bool(q['correctIds']) for q in questions),
        'ungraded':sum(not q['correctIds'] for q in questions),'reviewPending':150,
        'annexTypes':dict(Counter(q['grading']['keyOrigin'] for q in questions)),
        'gradingStates':dict(Counter(q['grading']['status'] for q in questions)),
        'adaptedQuestions':sorted(adapted),'figures':len(pdf['images']),'questionsWithFigures':[q['originalNumber'] for q in questions if q.get('diagrams')],
        'ungradedQuestions':[q['originalNumber'] for q in questions if not q['correctIds']],
        'ambiguousQuestions':sorted(ambiguities),'pageCount':48,
        'inputSha256':{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in [TXT,PDF]},
        'checks':'TXT/PDF: se cotejaron las 150 numeraciones, todos los enunciados, alternativas, tipos y letras de claves; anexo excluido como preguntas.',
        'explanations':'9 explicaciones de IA importadas del anexo; resto y explicaciones individuales añadidas con IA para orientación, sin crear claves.'}
(ROOT/'docs/EXITOS_IMPORT_AUDIT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=True))


# Apply the documented review after reproducing the original import.
import subprocess, sys
subprocess.run([sys.executable, str(ROOT/'scripts/review-exitos.py')], check=True)
