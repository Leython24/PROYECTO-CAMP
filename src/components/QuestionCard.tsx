import {originalPdfQuestion} from '../engine/versioning';
import {useMemo, useState} from 'react';
import {Bookmark, Check, ExternalLink, Lightbulb, PenLine, ShieldCheck, TriangleAlert} from 'lucide-react';
import type {Attempt, Progress, Question, Source} from '../types';
import {isCorrect, shuffle} from '../engine/exam';
import {canGrade} from '../engine/grading';
import {collectionName, collectionOf} from '../data/collections';

interface Props {
  q: Question; attempt: Attempt; progress: Progress; sources: Source[];
  onAnswer: (ids: string[], confirm?: boolean) => void;
  onBookmark: () => void; onNote: (text: string) => void; onReport: (text: string) => void;
  solution?: boolean; locked?: boolean; shuffleOptions?: boolean;
}

const types = {conceptual: 'Conceptual', situacional: 'Situacional', calculo: 'Cálculo', interpretacion: 'Interpretación'};
const difficulties = {basica: 'Básica', intermedia: 'Intermedia', avanzada: 'Avanzada'};
const explanationLabel = (origin?: string) => origin === 'original' ? 'Explicación original del documento' : origin === 'none' ? 'Sin explicación en el documento' : 'Explicación añadida con IA';

export default function QuestionCard({q, attempt, progress, sources, onAnswer, onBookmark, onNote, onReport, solution = false, locked = false, shuffleOptions = true}: Props) {
  const [report, setReport] = useState('');
  const selected = attempt.answers[q.id]?.selectedIds ?? [];
  const graded = canGrade(q);
  const original = q.adaptation ? originalPdfQuestion(q.id) : undefined;
  const correct = graded && isCorrect(q, attempt.answers[q.id]);
  const opts = useMemo(() => shuffleOptions ? shuffle(q.options, attempt.seed + q.id.split('').reduce((n, c) => n + c.charCodeAt(0), 0)) : q.options, [q, attempt.seed, shuffleOptions]);
  const origin = q.adaptation?.kind === 'replacement' ? 'Pregunta equivalente elaborada con IA' : q.adaptation ? 'Adaptada con IA en esta versión' : q.contentOrigin === 'ia-completed' ? 'Completada con IA en el PDF' : q.contentOrigin === 'mixed' ? 'Contenido original y añadidos de IA' : q.origin === 'ia' ? 'Original de IA' : q.origin === 'adaptada' ? 'Adaptada' : 'Importada del documento';
  function toggle(id: string) {
    if (locked || solution) return;
    onAnswer(q.selectionMode !== 'multiple' && q.choose === 1 ? [id] : selected.includes(id) ? selected.filter(x => x !== id) : selected.length < q.choose ? [...selected, id] : selected);
  }
  return <article className="question-card">
    <div className="question-top"><div className="chip-row">
      <span className="badge">{types[q.type]}</span><span className="badge">{difficulties[q.difficulty]} · estimada</span>
      <span className={'badge ' + (q.review === 'contrastado' ? 'teal' : 'amber')}>{q.review === 'contrastado' ? <ShieldCheck size={14}/> : <TriangleAlert size={14}/>} {q.review === 'contrastado' ? 'Fundamento contrastado' : 'Pendiente de revisión'}</span>
      {q.grading?.keyOrigin === 'ia-authored' && <span className="badge teal">Respuesta elaborada por IA</span>}
      {q.grading?.keyOrigin === 'material' && q.grading.status === 'checked' && <span className="badge teal">Clave del PDF revisada por IA</span>}
      {!graded && <span className="badge amber">Sin calificación</span>}
      {q.grading?.status === 'material-key' && <span className="badge amber">Clave del PDF sin verificar</span>}
    </div><button className={'icon-button ' + (progress.bookmarks.includes(q.id) ? 'is-marked' : '')} onClick={onBookmark} aria-label={progress.bookmarks.includes(q.id) ? 'Quitar marca de repaso' : 'Marcar para repasar'}><Bookmark size={21} fill={progress.bookmarks.includes(q.id) ? 'currentColor' : 'none'}/></button></div>
    <p className="question-id">{collectionName(collectionOf(q))} {q.originalNumber ? '· N.º ' + q.originalNumber : ''} · {origin}</p>
    <h2 className="question-stem">{q.stem}</h2>{q.sourceNote && <p className="notice source-note">{q.sourceNote}</p>}
    {q.adaptation && <aside className="adaptation-note"><b>{q.adaptation.kind === 'replacement' ? 'Pregunta equivalente elaborada por IA' : 'Enunciado precisado por IA'}</b><p>{q.adaptation.note}</p></aside>}
    {original && <details className="original-question"><summary>Consultar el ejercicio original del PDF</summary><p>{original.stem}</p>{original.diagrams?.map(d=><figure className="question-diagram" key={d.src}><img src={d.src} alt={d.alt}/><figcaption>Diagrama original conservado; no se inventó su leyenda.</figcaption></figure>)}<ol>{original.options.map(o=><li key={o.id}><b>{o.label ?? o.id})</b> {o.text}</li>)}</ol><p className="fine-print">Original conservado para trazabilidad. La pregunta que se responde en este intento es la adaptación mostrada arriba.</p></details>}
    {q.diagrams?.map((d, i) => <figure className="question-diagram" key={d.src + i}><img src={d.src} alt={d.alt}/>{d.caption && <figcaption>{d.caption}</figcaption>}</figure>)}
    <p className="select-hint">{q.selectionMode !== 'multiple' && q.choose === 1 ? 'Selecciona una alternativa.' : q.selectionMode === 'multiple' ? 'Selecciona todas las alternativas que consideres adecuadas; la cantidad correcta no está confirmada.' : 'Selección múltiple: elige exactamente ' + q.choose + ' alternativas.'}</p>
    <fieldset className="options"><legend className="sr-only">Alternativas de respuesta</legend>{opts.map((o, i) => {
      const chosen = selected.includes(o.id), right = graded && q.correctIds.includes(o.id);
      return <label key={o.id} className={'option ' + (chosen ? 'selected ' : '') + (solution && graded ? right ? 'right ' : chosen ? 'wrong ' : '' : '')}>
        <input type={q.selectionMode !== 'multiple' && q.choose === 1 ? 'radio' : 'checkbox'} name={q.id} value={o.id} checked={chosen} disabled={locked || solution || (!chosen && q.choose > 1 && selected.length >= q.choose)} onChange={() => toggle(o.id)}/>
        <span className="option-letter">{q.collectionId ? (o.label ?? o.id.toUpperCase()) : String.fromCharCode(65 + i)}</span><span className="option-text">{o.text}{['ia','mixed'].includes(o.contentOrigin ?? '') && <span className="badge">{o.contentOrigin === 'mixed' ? 'Bloque adaptado con IA en el documento' : 'Alternativa añadida con IA'}</span>}
          {solution && <small className="option-feedback"><b>{!graded ? 'Sin calificación' : right ? '✓ Correcta' : chosen ? '✕ Elegida, incorrecta' : '— Incorrecta'}{chosen && right ? ' · Tu elección' : ''}</b><span className="explanation-origin">{explanationLabel(o.explanationOrigin ?? q.explanationOrigin)}</span>{o.explanation || 'El material no incluye una explicación de esta alternativa.'}{!!o.sourceIds?.length && <span className="option-sources">{o.sourceIds.map(id=>{const source=sources.find(s=>s.id===id);return source ? <a key={id} href={source.localUrl ?? source.url} target="_blank" rel="noreferrer"><ExternalLink size={13}/> {source.title}</a> : null;})}</span>}</small>}
        </span>{solution && right && <Check size={19}/>}</label>;
    })}</fieldset>
    {!solution && attempt.mode === 'practica' && <button className="button primary" onClick={() => onAnswer(selected, true)} disabled={locked || (q.selectionMode === 'multiple' ? !selected.length : selected.length !== q.choose)}>Confirmar respuesta <Check size={18}/></button>}
    {solution && <div className={'solution ' + (!graded ? 'ungraded' : correct ? 'success' : 'error')}>
      <h3>{!graded ? 'Sin calificación · pendiente de revisión' : correct ? '✓ Respuesta correcta' : !selected.length ? '— Pregunta omitida' : '✕ Hay algo que repasar'}</h3>
      {!graded && <p>Esta pregunta no se cuenta como error ni entra en el porcentaje de aciertos.</p>}
      {graded && q.choose > 1 && <p>Faltaron: {q.correctIds.filter(id => !selected.includes(id)).map(id => q.options.find(o => o.id === id)?.text).join('; ') || 'ninguna'}. Sobraron: {selected.filter(id => !q.correctIds.includes(id)).map(id => q.options.find(o => o.id === id)?.text).join('; ') || 'ninguna'}.</p>}
      <span className="explanation-origin">{explanationLabel(q.explanationOrigin)}{q.explanationSource === 'pdf-annex' ? ' · importada del anexo' : q.explanationSource === 'app-ai' ? ' · orientación de estudio de esta aplicación' : ''}</span><p>{q.explanation || 'No hay explicación disponible en el documento.'}</p>
      {q.grading?.keyOrigin === 'ia-authored' && <p className="ai-answer"><b>Respuesta elaborada por IA:</b> {q.correctIds.map(id=>{const o=q.options.find(o=>o.id===id)!;return (o.label??o.id)+') '+o.text}).join('; ')}. Contrastada con fuentes; no es una clave original del PDF ni una revisión humana.</p>}
      {q.documentExplanation && <details className="original-question document-explanation"><summary>Explicación importada del PDF</summary><p>{q.documentExplanation}</p><p className="fine-print">Texto del documento aportado. Su autoría y las citas bibliográficas que incluye no se verifican automáticamente al importarlo. El razonamiento de estudio y las fuentes de esta revisión se muestran por separado.</p></details>}
      {q.grading?.sourceText && <p className="reference-answer"><b>Clave original del documento, conservada como referencia: </b>{q.grading.sourceText}{q.grading.keyOrigin === 'ia-authored' ? ' · No sustituye la respuesta razonada de esta revisión.' : !graded ? ' · No se utiliza para calificar.' : ''}</p>}

      {q.grading && <p className="key-note"><b>{q.grading.status === 'material-key' ? 'Clave del material, aún sin contraste independiente: ' : 'Estado de la clave: '}</b>{q.grading.note}{q.grading.sourcePage ? ' · Fuente de la clave, página ' + q.grading.sourcePage : ''}</p>}
      {!!q.reviewReasons?.length && <ul>{q.reviewReasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}
      {q.calculation && <div className="calculation"><h4>Desarrollo del cálculo</h4><p><b>Fórmula:</b> {q.calculation.formula}</p><p><b>Variables:</b> {q.calculation.variables}</p><p><b>Sustitución:</b> {q.calculation.substitution}</p><p><b>Operaciones:</b> {q.calculation.operations}</p><p><b>Resultado:</b> {q.calculation.result.toLocaleString('es-PE')} {q.calculation.unit}</p><p><b>Interpretación:</b> {q.calculation.interpretation}</p></div>}
      <div className="concept-box"><Lightbulb size={20}/><div><b>La confusión que conviene evitar</b><p>{q.confusion}</p></div></div>
      {!!q.terms.length && <p className="terms">{q.terms.join(' · ')}</p>}
      <h4>Referencias de la respuesta</h4><div className="refs">{[...new Set(q.refs.map(r => r.sourceId))].map(id => {const s = sources.find(s => s.id === id); return s ? <a key={id} href={s.localUrl ?? s.url} target="_blank" rel="noreferrer"><ExternalLink size={15}/><span>{s.title}<small>{s.author} · {s.section}</small></span></a> : null;})}</div>
      <p className="fine-print">{q.provenance.note} Revisión humana: {q.humanReviewed ? 'registrada' : 'no realizada'}.</p>
    </div>}
    <details className="question-tools"><summary><PenLine size={16}/> Mi nota y reporte de ambigüedad</summary><label>Nota personal<textarea maxLength={10000} value={progress.notes[q.id] ?? ''} onChange={e => onNote(e.target.value)} placeholder="Qué recordar, dónde me confundí…"/></label><label>Reportar una ambigüedad<textarea maxLength={5000} value={report} onChange={e => setReport(e.target.value)} placeholder="Describe qué dato falta o qué alternativas parecen posibles."/></label><button className="button secondary small" disabled={!report.trim()} onClick={() => {onReport(report.trim()); setReport('');}}>Guardar reporte local</button><p className="fine-print">Las notas y los reportes se guardan con el identificador estable de esta pregunta.</p></details>
    <details className="provenance"><summary>Procedencia del enunciado</summary><p>{origin} · {q.provenance.author}</p><p>{q.provenance.resource ?? 'Creado para este centro de estudio.'}</p><p>{q.provenance.license ?? 'No se atribuye una licencia a materiales ajenos.'}</p><small>{q.id}</small></details>
  </article>;
}
