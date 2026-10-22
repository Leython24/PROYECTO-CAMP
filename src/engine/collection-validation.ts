import type {Question, Attempt} from '../types';
import {collectionOf, collections, ORIGINAL_COLLECTION} from '../data/collections';

export function validateCollectionQuestion(q: Question): string[] {
  const errors: string[] = [];
  if (!q.collectionId || q.collectionId === ORIGINAL_COLLECTION) return errors;
  if (typeof q.collectionId !== 'string' || !Array.isArray(q.options) || !Array.isArray(q.correctIds)) return ['datos de colección incompletos'];
  if (!/^[a-z][a-z0-9-]{2,55}$/.test(q.collectionId)) errors.push('identificador de colección inválido');
  const expected = collections.find(c => c.id === q.collectionId)?.expectedCount;
  if (!Number.isInteger(q.originalNumber) || q.originalNumber! < 1 || (expected && q.originalNumber! > expected)) errors.push('numeración original inválida');
  else if (q.id !== q.collectionId + '-q' + String(q.originalNumber).padStart(3, '0')) errors.push('ID y número original no coinciden');
  if (!['original-pdf', 'ia-completed', 'mixed'].includes(q.contentOrigin ?? '')) errors.push('falta distinguir contenido original y completado con IA');
  if (q.contentOrigin === 'ia-completed' && q.origin !== 'ia') errors.push('una pregunta completada con IA no puede atribuirse al autor original');
  if (q.contentOrigin === 'mixed' && q.origin !== 'adaptada') errors.push('contenido mixto requiere procedencia adaptada');
  if (!['original', 'ia', 'none'].includes(q.explanationOrigin ?? '')) errors.push('falta procedencia de la explicación');
  if (q.documentExplanation !== undefined && (typeof q.documentExplanation !== 'string' || !q.documentExplanation.trim())) errors.push('explicación importada inválida');
  if (!q.grading || !['material-key', 'checked', 'missing-key', 'ambiguous'].includes(q.grading.status) || typeof q.grading.note !== 'string' || !q.grading.note.trim()) errors.push('falta estado real de la clave');
  else {
    if (['missing-key', 'ambiguous'].includes(q.grading.status) && q.correctIds.length) errors.push('una pregunta sin clave o ambigua no debe contener una solución inventada');
    if (q.grading.status === 'material-key' && q.review === 'contrastado') errors.push('la clave del material no implica fundamento contrastado');
    if (q.grading.sourcePage !== undefined && (!Number.isInteger(q.grading.sourcePage) || q.grading.sourcePage < 1)) errors.push('página de clave inválida');
  }
  if (q.revision !== undefined && (!Number.isInteger(q.revision) || q.revision < 1)) errors.push('revisión de contenido inválida');
  if (q.adaptation && (!['clarified','replacement'].includes(q.adaptation.kind) || typeof q.adaptation.note !== 'string' || !q.adaptation.note.trim() || !['mixed','ia-completed'].includes(q.contentOrigin ?? ''))) errors.push('adaptación sin procedencia coherente');
  if (q.grading?.keyOrigin === 'ia-authored' && (q.grading.status !== 'checked' || q.review !== 'contrastado' || !q.grading.reviewedAt || !Array.isArray(q.grading.evidence) || !q.grading.evidence.length)) errors.push('respuesta elaborada por IA sin contraste documentado');
  if (q.selectionMode !== undefined && !['single','multiple'].includes(q.selectionMode)) errors.push('modo de selección inválido');
  if (q.grading?.keyOrigin === 'ia-proposal' && (q.correctIds.length || q.grading.status === 'material-key' || q.grading.status === 'checked')) errors.push('una propuesta de IA no es una clave confirmada');
  if (q.grading?.referenceIds && (!Array.isArray(q.grading.referenceIds) || new Set(q.grading.referenceIds).size !== q.grading.referenceIds.length || q.grading.referenceIds.some(id => !q.options.some(o => o.id === id)))) errors.push('referencia de respuesta inválida');
  if (q.practiceAvailable !== undefined && typeof q.practiceAvailable !== 'boolean') errors.push('disponibilidad inválida');
  if (q.reviewReasons && (!Array.isArray(q.reviewReasons) || q.reviewReasons.some(x => typeof x !== 'string'))) errors.push('motivos de revisión inválidos');
  if (q.diagrams && (!Array.isArray(q.diagrams) || q.diagrams.some(d => !d || typeof d.src !== 'string' || !d.src.startsWith('/collections/' + q.collectionId + '/') || d.src.includes('..') || typeof d.alt !== 'string' || !d.alt.trim()))) errors.push('diagrama local o descripción inválidos');
  for (const o of q.options ?? []) {
    if (!o || typeof o !== 'object') continue;
    if (!['original', 'ia', 'mixed'].includes(o.contentOrigin ?? '')) errors.push('falta procedencia de alternativa');
    if (!['original', 'ia', 'none'].includes(o.explanationOrigin ?? '')) errors.push('falta procedencia de explicación de alternativa');
    if (['ia','mixed'].includes(o.contentOrigin ?? '') && q.contentOrigin === 'original-pdf') errors.push('las alternativas añadidas con IA requieren contenido mixto o completado con IA');
  }
  return errors;
}

export function validateAttemptCollections(a: Attempt, bank: Question[]) {
  const qs = a.questionIds.map(id => bank.find(q => q.id === id)).filter((q): q is Question => !!q);
  const actual = [...new Set(qs.map(collectionOf))];
  const errors: string[] = [];
  if (a.collectionId && (a.collectionId === 'mixed' ? actual.length < 2 : actual.some(id => id !== a.collectionId))) errors.push('La colección del intento no coincide con sus preguntas');
  if (a.collectionIds && (!Array.isArray(a.collectionIds) || new Set(a.collectionIds).size !== a.collectionIds.length || a.collectionIds.length !== actual.length || actual.some(id => !a.collectionIds!.includes(id)))) errors.push('Colecciones del intento inválidas');
  if (a.shuffleOptions !== undefined && typeof a.shuffleOptions !== 'boolean') errors.push('Preferencia de barajado inválida');
  if (a.mode === 'pdf' && (!a.collectionId || actual.length !== 1 || actual[0] === ORIGINAL_COLLECTION || a.deadline === null || a.pausedAt !== null)) errors.push('Reglas de simulacro PDF inválidas');
  return errors;
}
