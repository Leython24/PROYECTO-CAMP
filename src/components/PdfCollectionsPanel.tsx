import {useState} from 'react';
import {BookOpen, FileText, Play, RotateCcw, Timer} from 'lucide-react';
import type {Attempt, Progress, Question, QuestionCollection} from '../types';
import {collections, collectionOf} from '../data/collections';
import {attemptCollection, canGrade, canPractice, collectionStats} from '../engine/collections';
import {topics, domains} from '../data/syllabus';
import {score} from '../engine/exam';

export interface PdfStartSettings {practice: boolean; count?: number; domain?: string; topic?: string; shuffle?: boolean; minutes?: number; allowUngraded?: boolean}
interface Props {bank: Question[]; progress: Progress; onStart: (id: string, settings: PdfStartSettings) => void; onResume: (attempt: Attempt) => void; onResult: (attempt: Attempt) => void}

function PdfCard({collection, bank, progress, onStart, onResume, onResult}: Props & {collection: QuestionCollection}) {
  const [practice, setPractice] = useState(false), [domain, setDomain] = useState(''), [topic, setTopic] = useState('');
  const [count, setCount] = useState(20), [shuffle, setShuffle] = useState(false), [acknowledged, setAcknowledged] = useState(false);
  const qs = bank.filter(q => collectionOf(q) === collection.id), stats = collectionStats(bank, collection.id);
  const chosen = qs.filter(q => canPractice(q) && (!practice || ((!domain || q.domain === +domain) && (!topic || q.topicId === topic))));
  const ordered = [...chosen].sort((a, b) => (a.originalNumber ?? 0) - (b.originalNumber ?? 0));
  const used = practice ? ordered.slice(0, Math.min(count, ordered.length)) : ordered;
  const ungraded = (practice && shuffle ? chosen : used).filter(q => !canGrade(q)).length;
  const materialKeys = (practice && shuffle ? chosen : used).filter(q => q.grading?.status === 'material-key').length;
  const attempts = progress.attempts.filter(a => attemptCollection(a, bank) === collection.id).sort((a, b) => b.startedAt - a.startedAt);
  const ready = stats.practice > 0;
  const complete = ready && (!collection.expectedCount || (qs.length === collection.expectedCount && stats.practice === collection.expectedCount && Array.from({length: collection.expectedCount}, (_, i) => i + 1).every(n => qs.some(q => q.originalNumber === n))));
  return <article className="panel pdf-collection-card" data-collection={collection.id}>
    <header className="collection-card-heading"><span className="collection-symbol"><FileText size={27}/></span><div><span className="eyebrow">COLECCIÓN INDEPENDIENTE</span><h3>{collection.name}</h3><p>{collection.sourceName}</p></div><span className={'badge ' + (complete ? 'teal' : 'amber')}>{complete ? 'Disponible' : ready ? 'Importación parcial' : 'Pendiente de lectura'}</span></header>
    <dl className="collection-counters"><div><dt>Importadas</dt><dd>{stats.imported}</dd></div><div><dt>Para practicar</dt><dd>{stats.practice}</dd></div><div><dt>Calificación automática</dt><dd>{stats.graded}</dd></div><div><dt>Pendientes de revisión</dt><dd>{stats.pending}</dd></div></dl>
    {!ready && <div className="collection-pending" role="status"><b>Este PDF todavía no está incorporado.</b><p>{collection.note}</p><p>Se esperan preguntas del 1 al {collection.expectedCount}, según el documento indicado. Ninguna está importada todavía.</p></div>}
    {ready && <p className="fine-print">{collection.note} {collection.sourceUrl && <a href={collection.sourceUrl} target="_blank" rel="noreferrer">Consultar PDF completo</a>}</p>}
    <div className="collection-mode" aria-label={'Modo de ' + collection.name}><button className={!practice ? 'selected' : ''} aria-pressed={!practice} onClick={() => setPractice(false)}><Timer size={17}/> Simulacro completo</button><button className={practice ? 'selected' : ''} aria-pressed={practice} onClick={() => setPractice(true)}><BookOpen size={17}/> Practicar una selección</button></div>
    {practice && <div className="collection-selection"><label className="field">Dominio<select value={domain} onChange={e => {setDomain(e.target.value); setTopic('');}} disabled={!ready}><option value="">Todos los dominios de este PDF</option>{domains.filter(d => qs.some(q => q.domain === d.id)).map(d => <option key={d.id} value={d.id}>D{d.id} · {d.short}</option>)}</select></label><label className="field">Tema<select value={topic} onChange={e => setTopic(e.target.value)} disabled={!ready}><option value="">Todos los temas de este PDF</option>{topics.filter(t => qs.some(q => q.topicId === t.id && (!domain || q.domain === +domain))).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label><label className="field">Cantidad<input type="number" min={1} max={chosen.length || 1} value={count} disabled={!ready} onChange={e => setCount(Math.max(1, Number(e.target.value)))}/></label></div>}
    <label className="collection-shuffle"><input type="checkbox" checked={shuffle} onChange={e => setShuffle(e.target.checked)} disabled={!ready}/> Barajar preguntas; las alternativas conservan su orden</label>
    <p className="fine-print">{practice ? 'Respuesta y explicación después de confirmar.' : '180 minutos continuos. Soluciones al terminar; el tiempo continúa al recargar.'} Por defecto se conserva el orden del documento. No se aplican cuotas por dominio.</p>
    {!!materialKeys && <div className="notice">La calificación utiliza claves del PDF pendientes de contraste independiente. No se presentan como respuestas verificadas.</div>}
    {!!ungraded && <div className="notice"><b>Hay {ungraded} preguntas sin clave utilizable en la selección{practice && shuffle ? ' de origen' : ''}.</b><p>Se mostrarán como «sin calificación» y no contarán como errores. Las claves del PDF se identifican como claves del material, no como verificadas.</p><label><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}/> Entiendo cómo se tratarán las preguntas sin clave.</label></div>}
    {stats.imported > stats.practice && <p className="fine-print">{stats.imported - stats.practice} preguntas importadas no tienen todavía contenido suficiente para responder y quedan fuera de este intento.</p>}
    {ready && !complete && !practice && <p className="notice">El simulacro completo requiere las {collection.expectedCount} preguntas disponibles y su numeración íntegra. Por ahora puedes practicar una selección importada.</p>}
    <button className="button primary" disabled={!ready || (!practice && !complete) || !chosen.length || (!!ungraded && !acknowledged)} onClick={() => onStart(collection.id, {practice, count: practice ? Math.min(count, chosen.length) : undefined, domain: practice ? domain : '', topic: practice ? topic : '', shuffle, minutes: 180, allowUngraded: acknowledged})}><Play size={18}/>{practice ? 'Practicar esta colección' : 'Iniciar este simulacro'}</button>
    <details className="collection-history"><summary>{attempts.length} intentos de esta colección</summary>{!attempts.length ? <p>Aún no hay intentos guardados.</p> : attempts.map(a => <div key={a.id}><span>{new Date(a.startedAt).toLocaleString('es-PE')} · {a.questionIds.length} preguntas{a.finishedAt ? ' · ' + (score(a, bank).graded ? score(a, bank).percent + '% en calificables' : 'Sin calificación') : ' · En curso'}</span><button className="button secondary small" onClick={() => a.finishedAt ? onResult(a) : onResume(a)}><RotateCcw size={15}/>{a.finishedAt ? 'Ver resultado' : 'Continuar'}</button></div>)}</details>
  </article>;
}

export default function PdfCollectionsPanel(props: Props) {
  return <section className="pdf-collections" aria-labelledby="pdf-collections-heading"><div className="section-heading"><div><span className="eyebrow">DOCUMENTOS PERSONALES</span><h2 id="pdf-collections-heading">Mis simulacros PDF</h2><p>Cada PDF conserva sus preguntas, su numeración y su historial.</p></div></div>{collections.filter(c => c.kind === 'pdf').map(collection => <PdfCard key={collection.id} collection={collection} {...props}/>)}</section>;
}
