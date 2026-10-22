import {ArrowRight, BookOpen, CheckCheck, ChevronRight, Clock, FileText, Play, Route, Target, Trophy} from 'lucide-react';
import type {Attempt, Progress, Question} from '../types';
import {collectionName} from '../data/collections';
import {attemptCollection, canGrade} from '../engine/collections';
import {resultMetrics, formatDuration} from '../engine/results';
import {topics} from '../data/syllabus';

interface Props {bank: Question[]; progress: Progress; active: Attempt | null; onGo: (page: string) => void; onTopic: (id: string) => void; onResult: (a: Attempt) => void;}

export function studyStatus(id: string, p: Progress, bank: Question[]) {
  const qs = bank.filter(q => q.topicId === id && q.practiceAvailable !== false);
  const answered = new Set(p.history.map(h => h.questionId));
  return p.visited.includes(id) && qs.length > 0 && qs.every(q => answered.has(q.id)) ? 'Completado' : p.visited.includes(id) ? 'Lectura visitada' : 'Pendiente';
}

export function RouteProgress({bank, progress, onTopic}: {bank: Question[]; progress: Progress; onTopic: (id: string) => void}) {
  const done = topics.filter(t => studyStatus(t.id, progress, bank) === 'Completado').length;
  const next = topics.find(t => studyStatus(t.id, progress, bank) !== 'Completado');
  return <section className="route-progress panel"><div><span className="eyebrow">TU AVANCE EN LA RUTA</span><h3>{done} de {topics.length} temas completados</h3><p>Completado = lectura visitada y todos sus ejercicios disponibles respondidos. Es avance de actividades; no acredita dominio del tema.</p><div className="progress-track" role="progressbar" aria-label="Temas completados" aria-valuenow={Math.round(done / topics.length * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{width: done / topics.length * 100 + '%', background: 'var(--purple)'}}/></div></div>{next && <button className="button primary" onClick={() => onTopic(next.id)}><Play size={17}/> Siguiente: {next.title}<ArrowRight size={16}/></button>}</section>;
}

export default function HomeDashboard({bank, progress: p, active, onGo, onTopic, onResult}: Props) {
  const recent = p.attempts.filter(a => a.finishedAt).sort((a, b) => b.finishedAt! - a.finishedAt!).slice(0, 3);
  const answered = new Set(p.history.map(h => h.questionId)).size;
  const next = topics.find(t => studyStatus(t.id, p, bank) !== 'Completado') ?? topics[0];
  const reading = Math.round(p.visited.filter(id => topics.some(t => t.id === id)).length / topics.length * 100);
  return <>
    <section className="welcome"><div><span className="eyebrow">TU PREPARACIÓN, UN PASO A LA VEZ</span><h1>Vamos por tu CAPM,<br/><em>Leython.</em></h1><p>Un lugar para estudiar, practicar y aprender de cada intento.</p><div className="button-row"><button className="button primary" onClick={() => active ? onGo(active.mode === 'practica' ? 'practica' : 'simulacros') : onTopic(next.id)}><Play size={18}/>{active ? 'Continuar donde lo dejé' : 'Continuar mi ruta'}<ArrowRight size={18}/></button><button className="button secondary" onClick={() => onGo('simulacros')}>Elegir simulacro</button></div></div><div className="study-orbit" aria-label={reading + '% de lecturas visitadas'}><div className="orbit-label"><span className="orbit-icon"><BookOpen size={25}/></span><b>Construye tu<br/>siguiente logro.</b><span>{p.visited.length} de {topics.length} lecturas visitadas</span><div className="progress-track" role="progressbar" aria-label="Lecturas visitadas" aria-valuenow={reading} aria-valuemin={0} aria-valuemax={100}><i style={{width: reading + '%', background: 'var(--orange)'}}/></div></div><div className="orbit-decoration" aria-hidden="true"><span/><span/><span/></div></div></section>
    {active && <section className="resume-strip"><span className="resume-icon"><Play size={24}/></span><div><span className="eyebrow">CONTINUAR DONDE LO DEJASTE</span><h2>{collectionName(attemptCollection(active, bank))}</h2><p>{active.mode === 'practica' ? 'Práctica' : 'Simulacro'} · Pregunta {active.index + 1} de {active.questionIds.length} · {Object.values(active.answers).filter(x => x.selectedIds.length).length} respondidas{active.pausedAt ? ' · En pausa' : active.mode !== 'practica' ? ' · El cronómetro sigue activo' : ''}</p></div><button className="button primary" onClick={() => onGo(active.mode === 'practica' ? 'practica' : 'simulacros')}>Retomar sesión <ArrowRight size={17}/></button></section>}
    <div className="stats-grid home-stats">{[
      {Icon: BookOpen, count: p.visited.length, tail: '/ ' + topics.length, label: 'Lecturas visitadas', tone: 'purple'},
      {Icon: CheckCheck, count: answered, tail: '/ ' + bank.length, label: 'Preguntas distintas respondidas', tone: 'blue'},
      {Icon: Trophy, count: p.attempts.filter(a => a.finishedAt).length, tail: '', label: 'Sesiones finalizadas', tone: 'sand'},
      {Icon: Target, count: bank.filter(canGrade).length, tail: '/ ' + bank.length, label: 'Con clave para calificar', tone: 'teal'}
    ].map(({Icon, count, tail, label, tone}) => <div className="stat" key={label}><span className={'stat-icon ' + tone}><Icon size={20}/></span><div><strong>{count}<small>{tail}</small></strong><p>{label}</p></div></div>)}</div>
    <div className="home-shortcuts"><button onClick={() => onTopic(next.id)}><span className="shortcut-icon"><Route size={22}/></span><span><b>Ruta de estudio</b><small>{next.title}</small></span><ChevronRight size={19}/></button><button onClick={() => onGo('practica')}><span className="shortcut-icon orange"><Target size={22}/></span><span><b>Practicar por tema</b><small>Tu colección, tus filtros, tu ritmo</small></span><ChevronRight size={19}/></button><button onClick={() => onGo('simulacros')}><span className="shortcut-icon"><FileText size={22}/></span><span><b>Mis simulacros PDF</b><small>Éxitos y Grupo de Procesos</small></span><ChevronRight size={19}/></button></div>
    <section className="recent-sessions"><div className="section-heading"><div><span className="eyebrow">CADA SESIÓN CUENTA</span><h2>Actividad reciente</h2></div><button className="link-button" onClick={() => onGo('resultados')}>Ver mis resultados <ArrowRight size={16}/></button></div>{recent.length ? <div className="panel recent-list">{recent.map(a => {const s = resultMetrics(a, bank); return <button key={a.id} onClick={() => onResult(a)}><span className="recent-icon"><Clock size={20}/></span><span><b>{collectionName(attemptCollection(a, bank))}</b><small>{new Date(a.finishedAt!).toLocaleString('es-PE', {dateStyle: 'short', timeStyle: 'short'})} · {a.mode === 'practica' ? 'Práctica' : 'Simulacro'} · {formatDuration(s.duration)}</small></span><span className="recent-score"><b>{s.graded ? s.percent + '%' : 'Sin nota'}</b><small>{s.answered}/{s.total} respondidas</small></span><ChevronRight size={18}/></button>;})}</div> : <div className="panel empty compact"><Clock size={28}/><h3>Aquí aparecerán tus sesiones</h3><p>Termina tu primera práctica para ver un resultado real.</p><button className="link-button" onClick={() => onGo('practica')}>Empezar una práctica <ArrowRight size={16}/></button></div>}</section>
  </>;
}
