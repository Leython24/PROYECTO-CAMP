import test from 'node:test';
import assert from 'node:assert/strict';
import {makeAttempt, pause, resume} from '../src/engine/exam';
import {resultMetrics, repeatAttempt, attemptDuration, completeAttempt} from '../src/engine/results';
import questions from '../src/data/collections/grupo-procesos-simulador-02.json';
import {collectionQuestions} from '../src/data/collections';
import type {Question} from '../src/types';

const bank = questions as Question[];
test('1 respuesta correcta y 149 en blanco: cobertura y puntaje usan los denominadores reales', () => {
  const a = {...makeAttempt(bank.map(q => q.id), 'pdf', [], 180, 1000), finishedAt: 61000};
  a.answers[bank[0].id] = {selectedIds: bank[0].correctIds, confirmed: false};
  const s = resultMetrics(a, bank);
  assert.equal(s.answered, 1); assert.equal(s.omittedTotal, 149); assert.equal(s.omitted, 149);
  assert.equal(s.correct, 1); assert.equal(s.wrong, 0); assert.equal(s.graded, 150);
  assert.equal(s.percent, 1); assert.equal(s.coverage, 1); assert.equal(s.accuracy, 100);
  assert.equal(s.duration, 60000);
});
test('Responder un ítem sin clave no lo convierte en error; las omisiones totales incluyen los no calificables', () => {
  const ungraded = {...bank[1], id: 'ungraded-fixture', correctIds: [], grading: {status: 'missing-key' as const, note: 'Sin clave'}};
  const qs = [bank[0], ungraded];
  const a = makeAttempt(qs.map(q => q.id), 'practica', [], 0, 1000);
  a.answers[ungraded.id] = {selectedIds: ['a'], confirmed: true};
  const s = resultMetrics(a, qs);
  assert.equal(s.answered, 1); assert.equal(s.omittedTotal, 1); assert.equal(s.graded, 1);
  assert.equal(s.wrong, 0); assert.equal(s.ungraded, 1); assert.equal(s.accuracy, null);
  assert.deepEqual(s.wrongIds, []); assert.deepEqual(s.omittedIds, [bank[0].id]);
});
test('El reloj empleado excluye una pausa del modo personalizado sin añadir campos al progreso', () => {
  const a = makeAttempt([bank[0].id], 'personalizado', [], 30, 1000);
  const paused = pause(a, 61000), resumed = resume(paused, 181000);
  assert.equal(attemptDuration(paused, 180000), 60000);
  assert.equal(attemptDuration({...resumed, finishedAt: 241000}), 120000);
});
test('Finalizar estando en pausa no añade los minutos de descanso a la duración', () => {
  const a = makeAttempt([bank[0].id], 'personalizado', [], 30, 1000);
  const ended = completeAttempt(pause(a, 61000), false, 301000);
  assert.equal(ended.finishedAt, 301000); assert.equal(ended.pausedAt, null);
  assert.equal(attemptDuration(ended), 60000);
});
test('Repetir crea otro ID y usa revisiones actuales; no cambia respuestas, marcas ni versión del intento anterior', () => {
  const q = collectionQuestions.find(q => q.id === 'exitos-simulador-01-q027')!;
  const old = {...makeAttempt([q.id], 'pdf', [], 180, 1000), collectionId: 'exitos-simulador-01', questionRevisions: {[q.id]: 1}, finishedAt: 2000};
  old.answers[q.id] = {selectedIds: ['a'], confirmed: true}; old.flagged = [q.id];
  const before = JSON.stringify(old), next = repeatAttempt(old, collectionQuestions, [q.id], 10000);
  assert.notEqual(next.id, old.id); assert.equal(next.collectionId, old.collectionId);
  assert.deepEqual(next.questionIds, old.questionIds); assert.deepEqual(next.answers, {}); assert.deepEqual(next.flagged, []);
  assert.equal(next.questionRevisions?.[q.id], q.revision); assert.equal(next.finishedAt, null);
  assert.equal(JSON.stringify(old), before);
});
