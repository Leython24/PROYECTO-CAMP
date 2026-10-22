import {historicalQuestion} from './versioning';
import type {Question, Progress} from '../types';
import {collectionOf, ORIGINAL_COLLECTION} from '../data/collections';
import {canGrade, canPractice} from './grading';

export interface Filters {collection: string; domain: string; task: string; topic: string; type: string; difficulty: string; origin: string; review: string; status: string; search: string}
export const DEFAULT_FILTERS: Filters = {collection: ORIGINAL_COLLECTION, domain: '', task: '', topic: '', type: '', difficulty: '', origin: '', review: 'contrastado', status: '', search: ''};

export function filterQuestions(bank: Question[], f: Filters, p: Progress) {
  return bank.filter(q => canPractice(q) && (f.collection === 'all' || collectionOf(q) === (f.collection || ORIGINAL_COLLECTION)) &&
    (!f.domain || q.domain === Number(f.domain)) && (!f.task || q.taskId === f.task) && (!f.topic || q.topicId === f.topic) &&
    (!f.type || q.type === f.type) && (!f.difficulty || q.difficulty === f.difficulty) && (!f.origin || q.origin === f.origin) && (!f.review || q.review === f.review) &&
    (!f.search || (q.stem + ' ' + q.concept + ' ' + q.tags.join(' ')).toLowerCase().includes(f.search.toLowerCase())) &&
    (!f.status || (f.status === 'nuevas' ? !p.seen.includes(q.id) : f.status === 'marcadas' ? p.bookmarks.includes(q.id) : p.history.some(h => {if(h.questionId !== q.id)return false;const old=historicalQuestion(q,h.attemptId,p.attempts);return canGrade(old) && !(h.selectedIds.length === old.correctIds.length && h.selectedIds.every(id => old.correctIds.includes(id)))}))));
}
