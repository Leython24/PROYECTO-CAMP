import test from 'node:test';
import assert from 'node:assert/strict';
import type {Question} from '../src/types';
import {initialQuestions, initialSources} from '../src/data/bank';
import {collectionOf, collectionQuestions, ORIGINAL_COLLECTION, PDF_COLLECTION} from '../src/data/collections';
import {attemptCollection, canGrade, canPractice, collectionStats, makeCollectionAttempt, needsReview} from '../src/engine/collections';
import {score, makeAttempt, selectQuestions, isCorrect, remaining} from '../src/engine/exam';
import {DEFAULT_FILTERS, filterQuestions} from '../src/engine/practice';
import {emptyProgress, loadProgress, saveProgress, withAttempt, recordResults} from '../src/engine/persistence';
import {parseBank, validateBank, validateProgress} from '../src/engine/validation';

function fixture(number: number, overrides: Partial<Question> = {}): Question {
  return {...structuredClone(initialQuestions[number % initialQuestions.length]), options:structuredClone(initialQuestions[number % initialQuestions.length].options).map(o=>({...o,contentOrigin:'original',explanationOrigin:'ia'})), id: PDF_COLLECTION + '-q' + String(number).padStart(3, '0'), stem: 'Caso de prueba ' + number + ': ' + initialQuestions[number % initialQuestions.length].stem, collectionId: PDF_COLLECTION, originalNumber: number, origin: 'externa', review: 'pendiente', contentOrigin: 'original-pdf', explanationOrigin: 'ia', grading: {status: 'material-key', note: 'Clave sintética usada solo por las pruebas; no procede del PDF.'}, provenance: {author: 'Fixture de prueba', resource: 'Prueba automatizada local', license: 'Dato sintético de prueba; no se publica en el banco.', note: 'Esta pregunta no se incluye en la aplicación.'}, ...overrides};
}

test('las dos colecciones añaden 300 preguntas PDF sin cambiar el banco original', () => {
  assert.equal(collectionQuestions.length, 300);
  assert.deepEqual(collectionStats(collectionQuestions, PDF_COLLECTION), {imported: 150, practice: 150, graded: 150, pending: 95});
  assert.deepEqual(collectionStats(initialQuestions, PDF_COLLECTION), {imported: 0, practice: 0, graded: 0, pending: 0});
  assert.equal(initialQuestions.length, 197);
});

test('la colección original permanece como filtro predeterminado y la mezcla exige selección', () => {
  const pdf = fixture(1, {review: 'contrastado', grading: {status: 'checked', note: 'Solo una prueba.'}}), bank = [...initialQuestions, pdf], p = emptyProgress();
  assert.ok(!filterQuestions(bank, DEFAULT_FILTERS, p).some(q => q.id === pdf.id));
  assert.deepEqual(filterQuestions(bank, {...DEFAULT_FILTERS, collection: PDF_COLLECTION}, p).map(q => q.id), [pdf.id]);
  assert.ok(filterQuestions(bank, {...DEFAULT_FILTERS, collection: 'all'}, p).some(q => q.id === pdf.id));
});

test('el simulacro ponderado original nunca añade preguntas PDF', () => {
  const pdf = fixture(1, {review: 'contrastado', grading: {status: 'checked', note: 'Solo una prueba.'}}), bank = [...initialQuestions, pdf];
  const ids = selectQuestions(bank, 150, [], [1, 2, 3, 4], true, 42);
  assert.equal(ids.length, 150);
  assert.ok(ids.every(id => collectionOf(bank.find(q => q.id === id)!) === ORIGINAL_COLLECTION));
});

test('el simulador PDF conserva numeración y selección propia sin cuotas oficiales', () => {
  const bank = Array.from({length:150},(_,i)=>fixture(150-i));
  const a = makeCollectionAttempt(bank, PDF_COLLECTION, [], {practice: false}, 1000);
  assert.deepEqual(a.questionIds, Array.from({length:150},(_,i)=>fixture(i+1).id));
  assert.equal(a.mode, 'pdf');
  assert.equal(a.shuffleOptions, false);
  assert.equal(a.questionOrder, 'original');
  assert.equal(a.collectionId, PDF_COLLECTION);
  assert.equal(remaining(JSON.parse(JSON.stringify(a)), 61000), 179 * 60000);
});

test('barajar preguntas conserva identidades y no incorpora otras colecciones', () => {
  const pdf = Array.from({length: 8}, (_, i) => fixture(i + 1));
  const a = makeCollectionAttempt([...initialQuestions, ...pdf], PDF_COLLECTION, [], {practice: true, shuffle: true}, 100);
  assert.deepEqual(new Set(a.questionIds), new Set(pdf.map(q => q.id)));
  assert.equal(new Set(a.questionIds).size, 8);
  assert.equal(a.questionOrder, 'shuffled');
});

test('una importación parcial no se presenta como simulacro completo de 150', () => {
  const bank = [fixture(1), fixture(2), fixture(3)];
  assert.throws(() => makeCollectionAttempt(bank, PDF_COLLECTION, [], {practice: false}), /requiere las 150/);
  assert.equal(makeCollectionAttempt(bank, PDF_COLLECTION, [], {practice: true, count: 2}).questionIds.length, 2);
});

test('selección por dominio, tema y cantidad utiliza solo preguntas del PDF', () => {
  const pdf = [fixture(1), fixture(2), fixture(3)];
  const a = makeCollectionAttempt([...initialQuestions, ...pdf], PDF_COLLECTION, [], {practice: true, domain: String(pdf[0].domain), topic: pdf[0].topicId, count: 1});
  assert.deepEqual(a.questionIds, [pdf[0].id]);
  assert.throws(() => makeCollectionAttempt(pdf, PDF_COLLECTION, [], {practice: true, count: 9}), /cantidad/);
});

test('una pregunta sin clave requiere aviso expreso antes del intento', () => {
  const q = fixture(1, {correctIds: [], grading: {status: 'missing-key', note: 'No hay clave en esta prueba.'}});
  assert.ok(canPractice(q));
  assert.ok(!canGrade(q));
  assert.throws(() => makeCollectionAttempt([q], PDF_COLLECTION, [], {practice: true}), /sin calificación/);
  assert.equal(makeCollectionAttempt([q], PDF_COLLECTION, [], {practice: true, allowUngraded: true}).questionIds.length, 1);
});

test('sin clave y ambigüedad no se convierten en errores ni omisiones calificables', () => {
  const right = fixture(1), missing = fixture(2, {correctIds: [], grading: {status: 'missing-key', note: 'Pendiente.'}}), ambiguous = fixture(3, {correctIds: [], grading: {status: 'ambiguous', note: 'Falta una leyenda.'}});
  const bank = [right, missing, ambiguous], a = makeCollectionAttempt(bank, PDF_COLLECTION, [], {practice: true, allowUngraded: true});
  a.answers[right.id] = {selectedIds: right.correctIds, confirmed: false};
  a.answers[missing.id] = {selectedIds: [missing.options[0].id], confirmed: false};
  assert.deepEqual(score(a, bank), {total: 3, graded: 1, ungraded: 2, correct: 1, wrong: 0, omitted: 0, percent: 100});
  assert.equal(isCorrect(missing, a.answers[missing.id]), false);
});

test('contadores distinguen importación, práctica, clave y revisión', () => {
  const bank = [fixture(1), fixture(2, {practiceAvailable: false}), fixture(3, {correctIds: [], grading: {status: 'missing-key', note: 'Pendiente.'}})];
  assert.deepEqual(collectionStats(bank, PDF_COLLECTION), {imported: 3, practice: 2, graded: 1, pending: 3});
  assert.ok(needsReview(bank[0]));
});

test('importar una clave del material no la marca como contrastada', () => {
  const q = fixture(1);
  assert.deepEqual(validateBank({formatVersion: 1, questions: [q], sources: initialSources}), []);
  q.review = 'contrastado';
  assert.ok(validateBank({formatVersion: 1, questions: [q], sources: initialSources}).some(e => e.includes('no implica')));
});

test('el anexo no se admite como una pregunta 151 en esta colección', () => {
  const q = fixture(151);
  assert.ok(validateBank({formatVersion: 1, questions: [q], sources: initialSources}).some(e => e.includes('numeración original')));
});

test('un enunciado reproducido en otro documento conserva identidad e historial propios', () => {
  const q = fixture(1, {stem: initialQuestions[0].stem});
  assert.deepEqual(validateBank({formatVersion: 1, questions: [...initialQuestions, q], sources: initialSources}), []);
  const repeated = fixture(2, {stem: q.stem});
  assert.deepEqual(validateBank({formatVersion: 1, questions: [q, repeated], sources: initialSources}), []);
  assert.notEqual(q.id, repeated.id);
});

test('se rechaza atribuir al autor original una pregunta completada con IA', () => {
  const q = fixture(1, {contentOrigin: 'ia-completed'});
  assert.ok(validateBank({formatVersion: 1, questions: [q], sources: initialSources}).some(e => e.includes('no puede atribuirse')));
  q.origin = 'ia';
  assert.deepEqual(validateBank({formatVersion: 1, questions: [q], sources: initialSources}), []);
});

test('los datos incompletos de una colección se rechazan sin romper el validador', () => {
  const q = {...fixture(1), options: null, correctIds: null};
  assert.ok(validateBank({formatVersion: 1, questions: [q], sources: initialSources}).length);
});

test('el progreso anterior y el de colecciones conservan notas, marcas, tiempo y respuestas al exportar', () => {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {configurable: true, value: {getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value)}});
  const q = fixture(1), bank = [...initialQuestions, q];
  const legacy = emptyProgress();
  legacy.notes[initialQuestions[0].id] = 'Mi nota anterior';
  saveProgress(legacy);
  assert.deepEqual(loadProgress(bank).progress, legacy);
  const a = makeCollectionAttempt(bank, PDF_COLLECTION, [], {practice: true}, 1000);
  a.answers[q.id] = {selectedIds: q.correctIds, confirmed: false, at: 2000};
  a.flagged = [q.id];
  let p = withAttempt(legacy, a);
  p.bookmarks = [q.id]; p.notes[q.id] = 'Nota del PDF';
  saveProgress(p);
  const restored = loadProgress(bank);
  assert.equal(restored.error, null);
  assert.deepEqual(restored.progress, p);
  assert.deepEqual(validateProgress(JSON.parse(JSON.stringify(p)), bank), []);
  assert.equal(attemptCollection(p.attempts[0], bank), PDF_COLLECTION);
  assert.equal(parseBank(JSON.stringify({formatVersion: 1, questions: bank, sources: initialSources})).questions.length, 198);
  p = recordResults(withAttempt(p, {...a, finishedAt: 3000}), {...a, finishedAt: 3000});
  assert.equal(p.history[0].questionId, q.id);
  assert.equal(p.notes[initialQuestions[0].id], 'Mi nota anterior');
});

test('un intento no puede atribuir preguntas originales a una colección PDF', () => {
  const p = emptyProgress(), a = {...makeAttempt([initialQuestions[0].id], 'personalizado', [], 30), collectionId: PDF_COLLECTION};
  p.attempts = [a]; p.activeId = a.id;
  assert.ok(validateProgress(p, initialQuestions).some(e => e.includes('colección')));
});
