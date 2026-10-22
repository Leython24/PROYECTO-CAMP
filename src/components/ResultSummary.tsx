import {resolveAttemptBank,attemptUsesLegacyExitos} from '../engine/versioning';
import {Clock} from 'lucide-react';
import type {Attempt, Question} from '../types';
import {score} from '../engine/exam';
import {attemptCollection} from '../engine/collections';
import {collectionName} from '../data/collections';

function time(ms: number) {const s = Math.max(0, Math.ceil(ms / 1000)); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, '0')).join(':');}

export default function ResultSummary({attempt: a, bank}: {attempt: Attempt; bank: Question[]}) {
  bank = resolveAttemptBank(a, bank);
  const s = score(a, bank);
  const aiAnswers = bank.filter(q=>a.questionIds.includes(q.id)&&q.grading?.keyOrigin==='ia-authored').length;
  const ms = a.mode === 'practica' ? (a.finishedAt ?? Date.now()) - a.startedAt : a.deadline ? Math.max(0, Math.min(a.durationMs, a.durationMs - (a.deadline - (a.finishedAt ?? a.deadline)))) : 0;
  const materialKey = a.questionIds.some(id => bank.find(q => q.id === id)?.grading?.status === 'material-key');
  return <>
    <section className="result-hero"><div className="result-score"><b>{s.graded ? s.percent : '—'}{s.graded > 0 && <small>%</small>}</b><span>{s.graded ? 'En preguntas calificables' : 'Sin calificación'}</span></div><div><span className="badge teal">Sesión finalizada</span><h2>Resultado de tu intento</h2><p><b>{collectionName(attemptCollection(a, bank))}</b></p><p>{s.correct} aciertos de {s.graded} preguntas calificables · {s.total} preguntas en el intento.</p><div className="chip-row"><span className="badge">{a.newIds.length} nuevas al iniciar</span><span className="badge">{a.questionIds.length - a.newIds.length} ya estudiadas</span><span className="badge"><Clock size={15}/> {time(ms)}</span></div></div></section>
    {attemptUsesLegacyExitos(a) && <div className="notice">Este intento conserva la versión original de las preguntas y su calificación anterior. Un nuevo intento utiliza las respuestas y adaptaciones revisadas.</div>}
    {!!aiAnswers && <div className="notice">{aiAnswers} respuestas de este intento fueron elaboradas por IA y contrastadas con fuentes. No se atribuyen como claves originales del PDF ni revisiones humanas.</div>}
    {!!s.ungraded && <div className="notice">{s.ungraded} preguntas sin calificación: quedan fuera del porcentaje y no cuentan como errores ni omisiones calificables.</div>}
    {materialKey && <div className="notice">Este resultado usa claves del material sin contraste independiente. Importarlas no equivale a verificarlas.</div>}
    <div className="stats-grid result-stats">{[['✓', s.correct, 'Aciertos'], ['✕', s.wrong, 'Errores'], ['—', s.omitted, 'Omitidas calificables'], ['○', s.ungraded, 'Sin calificación']].map(([sign, num, label]) => <div className="stat" key={label}><span className="stat-icon">{sign}</span><div><strong>{num}</strong><p>{label}</p></div></div>)}</div>
    <div className="fresh-results">{[true, false].map(fresh => {const ids = a.questionIds.filter(id => a.newIds.includes(id) === fresh), v = score({...a, questionIds: ids}, bank); return <span key={String(fresh)}><b>{fresh ? 'Nuevas' : 'Ya estudiadas'}:</b> {v.correct}/{v.graded} aciertos {v.graded ? '· ' + v.percent + '%' : '· Sin preguntas calificables'}</span>;})}</div>
  </>;
}
