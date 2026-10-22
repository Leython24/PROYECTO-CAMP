import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProgress, removeAttempt, withAttempt, recordResults} from '../src/engine/persistence';
import {makeAttempt} from '../src/engine/exam';
import {validateProgress} from '../src/engine/validation';
import {initialQuestions} from '../src/data/bank';

const [q1, q2, q3] = initialQuestions;

test('Descartar un intento abierto solo para mirar recupera el progreso anterior', () => {
  const before = {...emptyProgress(), seen: [q1.id], notes: {[q1.id]: 'Nota previa'}, bookmarks: [q1.id]};
  const attempt = makeAttempt([q1.id, q2.id], 'practica', before.seen, 0, 1000);
  const opened = withAttempt(before, {...attempt, index: 1, flagged: [q2.id]});
  assert.deepEqual(removeAttempt(opened, attempt.id), before);
  assert.deepEqual(validateProgress(removeAttempt(opened, attempt.id), initialQuestions), []);
});

test('Descartar práctica confirmada elimina sus respuestas e historial sin borrar notas o marcadores', () => {
  const p = {...emptyProgress(), seen: [q1.id], notes: {[q2.id]: 'Nota compartida'}, bookmarks: [q2.id]};
  const a = makeAttempt([q1.id, q2.id], 'practica', p.seen, 0, 1000);
  a.answers[q2.id] = {selectedIds: q2.correctIds, confirmed: true, at: 2000};
  const saved = recordResults(withAttempt({...p, seen: [q1.id, q2.id]}, a), a);
  const serialized = JSON.stringify(saved);
  const removed = removeAttempt(saved, a.id);
  assert.deepEqual(removed, p);
  assert.equal(JSON.stringify(saved), serialized, 'No modifica el objeto anterior');
});

test('Eliminar un resultado conserva otra sesión y el estado visto respaldado por ella', () => {
  const p = emptyProgress();
  const first = {...makeAttempt([q1.id, q2.id], 'practica', [], 0, 1000), finishedAt: 3000};
  first.answers[q1.id] = {selectedIds: q1.correctIds, confirmed: true};
  first.answers[q2.id] = {selectedIds: q2.correctIds, confirmed: true};
  const second = makeAttempt([q1.id, q3.id], 'personalizado', [q1.id, q2.id], 30, 4000);
  second.answers[q1.id] = {selectedIds: q1.correctIds, confirmed: false};
  const saved = withAttempt(recordResults(withAttempt({...p, seen: [q1.id, q2.id]}, first), first), second);
  const removed = removeAttempt(saved, first.id);
  assert.deepEqual(removed.attempts, [second]);
  assert.equal(removed.activeId, second.id);
  assert.deepEqual(removed.history, []);
  assert.deepEqual(removed.seen, [q1.id]);
  assert.deepEqual(validateProgress(removed, initialQuestions), []);
});

test('Historial previo sin intento asociado se conserva y respalda preguntas ya vistas', () => {
  const a = makeAttempt([q1.id], 'practica', [], 0, 1000);
  const prior = {questionId: q1.id, selectedIds: q1.correctIds, at: 500, attemptId: 'legacy-history', wasNew: true};
  const p = withAttempt({...emptyProgress(), seen: [q1.id], history: [prior]}, a);
  assert.deepEqual(removeAttempt(p, a.id).history, [prior]);
  assert.deepEqual(removeAttempt(p, a.id).seen, [q1.id]);
});

test('Eliminar último resultado deja un progreso válido exportable e importable', () => {
  const a = {...makeAttempt([q1.id], 'practica', [], 0, 1000), finishedAt: 3000};
  a.answers[q1.id] = {selectedIds: q1.correctIds, confirmed: true};
  const p = recordResults(withAttempt({...emptyProgress(), seen: [q1.id]}, a), a);
  const restored = JSON.parse(JSON.stringify(removeAttempt(p, a.id)));
  assert.deepEqual(restored, emptyProgress());
  assert.deepEqual(validateProgress(restored, initialQuestions), []);
});

test('Intento desconocido no cambia los datos', () => {
  const p = emptyProgress();
  assert.equal(removeAttempt(p, 'missing'), p);
});
