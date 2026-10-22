import type {Attempt, Question} from '../types';
import originalExitos from '../data/collections/exitos-simulador-01-v1.json';
import originalProcesos from '../data/collections/grupo-procesos-simulador-02-v1.json';

const archived = new Map(([...originalExitos, ...originalProcesos] as Question[]).map(q => [q.id, q]));

export function captureQuestionRevisions(questions: Question[]) {
  return Object.fromEntries(questions.map(q => [q.id, q.revision ?? 1]));
}

export function resolveAttemptQuestion(question: Question, attempt?: Pick<Attempt, 'questionRevisions'>) {
  const revision = attempt?.questionRevisions?.[question.id] ?? 1;
  if (revision === (question.revision ?? 1)) return question;
  if (revision === 1 && (question.revision ?? 1) > 1) return archived.get(question.id) ?? question;
  return question;
}

export function resolveAttemptBank(attempt: Pick<Attempt, 'questionRevisions'>, bank: Question[]) {
  return bank.map(q => resolveAttemptQuestion(q, attempt));
}

export function historicalQuestion(question: Question, attemptId: string, attempts: Attempt[]) {
  return resolveAttemptQuestion(question, attempts.find(a => a.id === attemptId));
}

export function originalPdfQuestion(id: string) {
  return archived.get(id);
}

export function attemptUsesLegacyExitos(attempt: Attempt) {
  return attempt.questionIds.some(id => {
    const original = archived.get(id);
    return original && !original.correctIds.length && (attempt.questionRevisions?.[id] ?? 1) === 1;
  });
}

export function isArchivedQuestion(question: Question) {
  const original = archived.get(question.id);
  const canonical = (value: unknown): string => {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([key,item]) => JSON.stringify(key)+':'+canonical(item)).join(',') + '}';
    return JSON.stringify(value);
  };
  return !!original && canonical(original) === canonical(question);
}

export function mergeBuiltinQuestions(stored: Question[], builtins: Question[]) {
  const current = new Map(builtins.map(q => [q.id, q]));
  return [
    ...stored.map(q => {
      const next = current.get(q.id);
      return next && (next.revision ?? 1) > (q.revision ?? 1) ? next : q;
    }),
    ...builtins.filter(q => !stored.some(old => old.id === q.id))
  ];
}

export function validateQuestionRevisions(attempt: Attempt, bank: Question[]) {
  const revisions = attempt.questionRevisions;
  if (revisions === undefined) return [];
  if (!revisions || typeof revisions !== 'object' || Array.isArray(revisions)) return ['Versiones de preguntas inválidas'];
  const map = new Map(bank.map(q => [q.id, q]));
  for (const [id, revision] of Object.entries(revisions)) {
    const q = map.get(id);
    if (!attempt.questionIds.includes(id) || !q || !Number.isInteger(revision) || revision < 1) return ['Versión de pregunta inválida: ' + id];
    if (revision !== (q.revision ?? 1) && !(revision === 1 && archived.has(id))) return ['Versión de pregunta no disponible: ' + id];
  }
  return [];
}

