import type {Attempt, Question} from '../types';
import {score, isCorrect, resume} from './exam';
import {canGrade} from './grading';
import {resolveAttemptBank} from './versioning';

export function attemptDuration(a: Attempt, now = Date.now()) {
  const end = a.pausedAt ?? a.finishedAt ?? now;
  if (a.mode === 'practica' || a.deadline === null) return Math.max(0, end - a.startedAt);
  return Math.max(0, Math.min(a.durationMs, a.durationMs - Math.max(0, a.deadline - end)));
}

export function formatDuration(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(x => String(x).padStart(2, '0')).join(':');
}

export function completeAttempt(a: Attempt, expired = false, now = Date.now()): Attempt {
  const base = a.pausedAt ? resume(a, now) : a;
  return {...base, pausedAt: null, finishedAt: expired && base.deadline ? base.deadline : now};
}

export function resultMetrics(a: Attempt, bank: Question[]) {
  const resolved = resolveAttemptBank(a, bank);
  const qs = a.questionIds.map(id => resolved.find(q => q.id === id)).filter((q): q is Question => !!q);
  const s = score(a, resolved);
  const answered = qs.filter(q => (a.answers[q.id]?.selectedIds.length ?? 0) > 0).length;
  const gradedAnswered = qs.filter(q => canGrade(q) && (a.answers[q.id]?.selectedIds.length ?? 0) > 0).length;
  const wrongIds = qs.filter(q => canGrade(q) && (a.answers[q.id]?.selectedIds.length ?? 0) > 0 && !isCorrect(q, a.answers[q.id])).map(q => q.id);
  const omittedIds = qs.filter(q => !(a.answers[q.id]?.selectedIds.length ?? 0)).map(q => q.id);
  const provenance = {material: 0, revised: 0, authored: 0, ungraded: 0};
  for (const q of qs) {
    if (!canGrade(q)) provenance.ungraded++;
    else if (q.grading?.keyOrigin === 'ia-authored' || q.grading?.keyOrigin === 'ia-proposal' || (!q.grading && q.origin === 'ia')) provenance.authored++;
    else if (q.grading?.status === 'checked') provenance.revised++;
    else provenance.material++;
  }
  return {...s, answered, gradedAnswered, omittedTotal: qs.length - answered, wrongIds, omittedIds,
    coverage: qs.length ? Math.round(answered / qs.length * 100) : 0,
    accuracy: gradedAnswered ? Math.round(s.correct / gradedAnswered * 100) : null,
    duration: attemptDuration(a), provenance};
}

export function repeatAttempt(a: Attempt, bank: Question[], seen: string[], now = Date.now()): Attempt {
  const ids = a.questionIds.filter(id => bank.some(q => q.id === id && q.practiceAvailable !== false));
  if (!ids.length) throw Error('Las preguntas de este intento no están disponibles en el banco actual.');
  return {id: 'a-' + now + '-' + Math.random().toString(36).slice(2, 7), mode: a.mode,
    collectionId: a.collectionId, collectionIds: a.collectionIds, questionIds: ids,
    questionRevisions: Object.fromEntries(ids.map(id => [id, bank.find(q => q.id === id)?.revision ?? 1])),
    newIds: ids.filter(id => !seen.includes(id)), answers: {}, flagged: [], index: 0,
    startedAt: now, deadline: a.mode === 'practica' ? null : now + a.durationMs,
    durationMs: a.durationMs, pausedAt: null, finishedAt: null, seed: now % 2147483647,
    shuffleOptions: a.shuffleOptions, questionOrder: a.questionOrder};
}
