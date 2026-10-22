import {captureQuestionRevisions} from './versioning';
import type {Attempt, Question} from '../types';
import {collectionOf, collections, ORIGINAL_COLLECTION} from '../data/collections';
import {makeAttempt, shuffle} from './exam';
import {canPractice, canGrade, needsReview} from './grading';
export {canPractice, canGrade, needsReview} from './grading';

export function collectionStats(bank: Question[], collectionId: string) {
  const qs = bank.filter(q => collectionOf(q) === collectionId);
  return {imported: qs.length, practice: qs.filter(canPractice).length, graded: qs.filter(canGrade).length, pending: qs.filter(needsReview).length};
}

export function makeCollectionAttempt(bank: Question[], collectionId: string, seen: string[], settings: {practice: boolean; count?: number; domain?: string; topic?: string; shuffle?: boolean; minutes?: number; allowUngraded?: boolean}, now = Date.now()): Attempt {
  const selected = bank.filter(q => collectionOf(q) === collectionId && canPractice(q) && (!settings.domain || q.domain === Number(settings.domain)) && (!settings.topic || q.topicId === settings.topic)).sort((a, b) => (a.originalNumber ?? 0) - (b.originalNumber ?? 0));
  if (!selected.length) throw Error('Esta colección todavía no tiene preguntas disponibles para practicar.');
  const expected = collections.find(c => c.id === collectionId)?.expectedCount;
  if (!settings.practice && expected && (selected.length !== expected || Array.from({length: expected}, (_, i) => i + 1).some(n => !selected.some(q => q.originalNumber === n)))) throw Error('El simulacro completo requiere las ' + expected + ' preguntas disponibles, sin números ausentes. Puedes practicar la selección importada.');
  const ordered = settings.shuffle ? shuffle(selected, now) : selected;
  const count = settings.count ?? ordered.length;
  if (!Number.isInteger(count) || count < 1 || count > ordered.length) throw Error('Elige una cantidad entre 1 y ' + ordered.length + '.');
  if (!settings.practice && count !== ordered.length) throw Error('El simulacro completo utiliza toda la colección. Usa práctica para elegir una selección.');
  const qs = ordered.slice(0, count);
  if (qs.some(q => !canGrade(q)) && !settings.allowUngraded) throw Error('Confirma que las preguntas sin clave quedarán sin calificación.');
  return {...makeAttempt(qs.map(q => q.id), settings.practice ? 'practica' : 'pdf', seen, settings.minutes ?? 180, now), collectionId, collectionIds: [collectionId], questionRevisions: captureQuestionRevisions(qs), shuffleOptions: false, questionOrder: settings.shuffle ? 'shuffled' : 'original'};
}

export function attemptCollection(a: Attempt, bank: Question[]) {
  if (a.collectionId) return a.collectionId;
  const ids = [...new Set(a.questionIds.map(id => bank.find(q => q.id === id)).filter((q): q is Question => !!q).map(collectionOf))];
  return ids.length === 1 ? ids[0] : ids.length ? 'mixed' : ORIGINAL_COLLECTION;
}
