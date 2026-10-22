import {collections} from '../data/collections';
import {domains, tasks, topics} from '../data/syllabus';
import type {Filters} from '../engine/practice';

export default function PracticeFilters({filters: f, onChange}: {filters: Filters; onChange: (key: keyof Filters, value: string) => void}) {
  return <div className="filters">
    <label className="field">Colección<select aria-label="Colección de práctica" value={f.collection} onChange={e => onChange('collection', e.target.value)}>{collections.map(c => <option key={c.id} value={c.id}>{c.name}{c.status === 'awaiting-source' ? ' · Pendiente' : ''}</option>)}<option value="all">Combinar todas · selección expresa</option></select></label>
    <label className="field">Dominio<select value={f.domain} onChange={e => onChange('domain', e.target.value)}><option value="">Todos los dominios</option>{domains.map(d => <option key={d.id} value={d.id}>D{d.id} · {d.short}</option>)}</select></label>
    <label className="field">Tema<select value={f.topic} onChange={e => onChange('topic', e.target.value)}><option value="">Todos los temas</option>{topics.filter(t => (!f.domain || Number(t.taskId[1]) === +f.domain) && (!f.task || t.taskId === f.task)).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
    <details className="more-filters"><summary>Más filtros</summary>
      <label className="field">Tarea<select value={f.task} onChange={e => onChange('task', e.target.value)}><option value="">Todas las tareas</option>{tasks.filter(t => !f.domain || t.domain === +f.domain).map(t => <option key={t.id} value={t.id}>{t.id} · {t.title}</option>)}</select></label>
      <label className="field">Tipo<select value={f.type} onChange={e => onChange('type', e.target.value)}><option value="">Todos</option><option value="conceptual">Conceptual</option><option value="situacional">Situacional</option><option value="calculo">Cálculo</option><option value="interpretacion">Interpretación</option></select></label>
      <label className="field">Dificultad estimada<select value={f.difficulty} onChange={e => onChange('difficulty', e.target.value)}><option value="">Todas</option><option value="basica">Básica</option><option value="intermedia">Intermedia</option><option value="avanzada">Avanzada</option></select></label>
      <label className="field">Origen<select value={f.origin} onChange={e => onChange('origin', e.target.value)}><option value="">Todos</option><option value="ia">Original o completada con IA</option><option value="externa">Importada del documento</option><option value="adaptada">Adaptada o con añadidos de IA</option></select></label>
      <label className="field">Revisión<select value={f.review} onChange={e => onChange('review', e.target.value)}><option value="contrastado">Fundamento contrastado</option><option value="">Todos los estados</option><option value="pendiente">Pendiente de revisión</option></select></label>
      <label className="field">Mi historial<select value={f.status} onChange={e => onChange('status', e.target.value)}><option value="">Todas las preguntas</option><option value="nuevas">Nuevas</option><option value="incorrectas">Con errores registrados</option><option value="marcadas">Marcadas para repasar</option></select></label>
      <label className="field">Buscar concepto<input value={f.search} onChange={e => onChange('search', e.target.value)} placeholder="EDT, interesado, calidad…"/></label>
    </details>
  </div>;
}
