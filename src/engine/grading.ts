import type {Question} from '../types';

export function canPractice(q: Question) {
  return q.practiceAvailable !== false && q.options.length >= 2 && q.choose > 0 && (q.choose < q.options.length || (q.selectionMode === 'multiple' && q.choose === q.options.length));
}

export function canGrade(q: Question) {
  return canPractice(q) && q.grading?.keyOrigin !== 'ia-proposal' && !['missing-key', 'ambiguous'].includes(q.grading?.status ?? '') && q.correctIds.length === q.choose && q.correctIds.every(id => q.options.some(o => o.id === id));
}

export function needsReview(q: Question) {
  return !canGrade(q) || q.review === 'pendiente' || q.grading?.status === 'material-key' || !!q.reviewReasons?.length;
}
