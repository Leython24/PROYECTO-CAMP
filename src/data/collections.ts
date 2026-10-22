import type {Question, QuestionCollection, Source} from '../types';
import exitosQuestions from './collections/exitos-simulador-01.json';
import exitosSources from './collections/exitos-sources.json';
import reviewSources from './collections/exitos-review-sources.json';
import procesosQuestions from './collections/grupo-procesos-simulador-02.json';
import procesosSources from './collections/procesos-sources.json';

export const ORIGINAL_COLLECTION = 'banco-original';
export const PDF_COLLECTION = 'exitos-simulador-01';
export const PROCESS_COLLECTION = 'grupo-procesos-simulador-02';
export const collections: QuestionCollection[] = [
  {id: ORIGINAL_COLLECTION, name: 'Banco original · CAPM', kind: 'original', status: 'available'},
  {
    id: PDF_COLLECTION,
    name: 'Simulador 1 · Éxitos',
    kind: 'pdf',
    sourceName: 'Simulador_Exitos_150_COMPATIBLE.pdf + transcripción TXT',
    sourceUrl: '/collections/exitos-simulador-01/Simulador_Exitos_150_COMPATIBLE.pdf',
    expectedCount: 150,
    status: 'available',
    note: '150 preguntas disponibles. Las 55 antes sin calificación tienen respuesta elaborada por IA y respaldo documental; las 95 claves restantes proceden del material y siguen pendientes de contraste. Las adaptaciones conservan el original y los intentos anteriores.'
  },
  {
    id: PROCESS_COLLECTION,
    name: 'Simulador 2 · Grupo de Procesos',
    kind: 'pdf',
    sourceName: 'Grupo de Procesos Guía Práctica, p. 217 (1).pdf',
    sourceUrl: '/collections/grupo-procesos-simulador-02/Grupo_de_Procesos_150.pdf',
    expectedCount: 150,
    status: 'available',
    note: '150 preguntas y claves revisadas por IA con 18 fuentes primarias. Se precisaron 21 ejercicios; 13 alternativas de respuesta fueron corregidas y se identifican como elaboradas por IA. El texto, la clave y la explicación originales siguen consultables. No implica revisión humana ni claves oficiales de PMI.'
  }
];

export const collectionQuestions = [...exitosQuestions, ...procesosQuestions] as Question[];
export const collectionSources = [...exitosSources, ...reviewSources, ...procesosSources] as Source[];
export const collectionOf = (q: Question) => q.collectionId ?? ORIGINAL_COLLECTION;
export const collectionName = (id?: string) => id === 'mixed' ? 'Selección combinada' : collections.find(c => c.id === (id ?? ORIGINAL_COLLECTION))?.name ?? id ?? 'Colección';
