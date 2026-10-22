import {Check, X, Minus, CircleHelp, CalendarDays, Clock, ShieldCheck, Sparkles} from 'lucide-react';
import type {Attempt, Question} from '../types';
import {resultMetrics, formatDuration} from '../engine/results';
import {attemptCollection} from '../engine/collections';
import {attemptUsesLegacyExitos} from '../engine/versioning';
import {collectionName} from '../data/collections';
import type {ReactNode} from 'react';

export default function ResultOverview({attempt: a, bank, actions}: {attempt: Attempt; bank: Question[]; actions?: ReactNode}) {
  const s = resultMetrics(a, bank), circumference = 2 * Math.PI * 52;
  const provenance = [
    ['material', 'Clave del material', 'Importada; pendiente de contraste independiente.'],
    ['revised', 'Clave del PDF revisada por IA', 'Conservada tras contrastar su fundamento.'],
    ['authored', 'Respuesta elaborada por IA', 'No se atribuye como clave original del PDF.'],
    ['ungraded', 'Sin calificación', 'Excluida del porcentaje y de los errores.']
  ] as const;
  return <>
    <section className="result-hero">
      <div className="result-score">
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle className="score-track" cx="60" cy="60" r="52"/><circle className="score-arc" cx="60" cy="60" r="52" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - s.percent / 100)} data-offset={circumference * (1 - s.percent / 100)}/></svg>
        <div><b>{s.graded ? s.percent : '—'}{s.graded > 0 && <small>%</small>}</b><span>{s.graded ? 'Puntaje del intento' : 'Sin calificación'}</span></div>
      </div>
      <div className="result-intro"><span className="badge teal"><Check size={14}/> Sesión finalizada</span><h2>{collectionName(attemptCollection(a, bank))}</h2>
        <div className="result-meta"><span><CalendarDays size={16}/>{new Date(a.finishedAt ?? a.startedAt).toLocaleString('es-PE', {dateStyle: 'medium', timeStyle: 'short'})}</span><span><Clock size={16}/>{formatDuration(s.duration)} · {a.mode === 'practica' ? 'tiempo transcurrido' : 'tiempo empleado'}</span></div>
        <p className="score-denominator"><b>{s.correct} de {s.graded} preguntas calificables</b>. El porcentaje incluye {s.omitted} omitidas calificables{s.ungraded ? ' y excluye ' + s.ungraded + ' sin clave utilizable' : ''}.</p>
        <span className="fine-print">{a.mode === 'practica' ? 'Práctica' : 'Simulacro'} · {s.total} preguntas · {a.newIds.length} nuevas al iniciar · {s.total - a.newIds.length} ya estudiadas</span>
      </div>
    </section>
    <section className={'response-coverage ' + (s.omittedTotal ? 'incomplete' : 'complete')} aria-label="Cobertura de respuestas">
      <div><span className="eyebrow">LO QUE RESPONDISTE</span><h3>{s.answered} de {s.total} respondidas <span>({s.coverage}%)</span></h3><p>{s.omittedTotal ? <><b>{s.omittedTotal} de {s.total} quedaron en blanco.</b> Responder pocas preguntas no equivale a completar el intento.</> : 'Respondiste todas las preguntas de esta sesión.'}</p></div>
      <div className="coverage-meter"><div className="progress-track" role="progressbar" aria-label="Preguntas respondidas" aria-valuenow={s.coverage} aria-valuemin={0} aria-valuemax={100}><i style={{width: s.coverage + '%', background: 'var(--purple)'}}/></div><span>{s.answered} respondidas / {s.omittedTotal} omitidas en total</span></div>
    </section>
    {actions}
    <div className="stats-grid result-stats">{[
      {Icon: Check, count: s.correct, label: 'Correctas', tone: 'success'},
      {Icon: X, count: s.wrong, label: 'Incorrectas', tone: 'danger'},
      {Icon: Minus, count: s.omitted, label: 'Omitidas calificables', tone: 'warning'},
      {Icon: CircleHelp, count: s.ungraded, label: 'Sin calificación', tone: 'muted'}
    ].map(({Icon, count, label, tone}) => <div className={'stat ' + tone} key={label}><span className="stat-icon"><Icon size={20}/></span><div><strong>{count}</strong><p>{label}</p></div></div>)}</div>
    <div className="result-explainer"><ShieldCheck size={19}/><p><b>Cómo se calcula:</b> correctas ({s.correct}) ÷ calificables ({s.graded}) × 100{s.graded ? ' = ' + s.percent + '% (redondeado)' : ': sin porcentaje'}. {s.accuracy !== null && <>Acierto entre respondidas calificables: {s.correct}/{s.gradedAnswered} ({s.accuracy}%). Este indicador usa otro denominador.</>} Las preguntas sin clave no cuentan como errores. Es un resultado de estudio, no una nota oficial de PMI.</p></div>
    {attemptUsesLegacyExitos(a) && <div className="notice">Intento histórico: se conservan sus preguntas y claves originales. Repetirlo usará la versión actual sin alterar este resultado.</div>}
    <details className="panel result-provenance"><summary><Sparkles size={18}/> Procedencia de las claves de este intento <span>{s.total} preguntas</span></summary><div className="provenance-grid">{provenance.map(([key, label, text]) => <div key={key}><b>{s.provenance[key]}</b><div><h4>{label}</h4><p>{text}</p></div></div>)}</div><p className="fine-print">Una revisión por IA no equivale a revisión humana ni aprobación de PMI. Cada pregunta muestra su procedencia y sus enlaces de respaldo al revisar la solución.</p></details>
  </>;
}
