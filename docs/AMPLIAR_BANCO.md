# Cómo ampliar el banco con revisión

1. Busca una necesidad de cobertura en `docs/COBERTURA.md` y conserva IDs de dominio, tarea y subtema. Para un nuevo subtema, añade primero su registro en `src/data/topics.json`.
2. Lee una referencia accesible. Registra autor, título, edición, URL y sección. Solo añade página si la comprobaste. Para videos, registra minuto únicamente después de revisar su contenido.
3. Distingue origen del enunciado y respaldo de la respuesta. Que una página sea pública no autoriza copiarla. Sin permiso compatible, enlázala y escribe un ejercicio original sobre el concepto.
4. Redacta un caso con información suficiente, alternativas plausibles y una mejor respuesta defendible. En múltiples, indica cuántas elegir. Usa IDs de opción estables; nunca uses su posición visible para corregir.
5. Explica cada alternativa, la idea evaluada y la confusión habitual. La dificultad se estima; no se presenta como calibrada.
6. Si hay cálculo, añade fórmula, variables, sustitución, operaciones, unidades, resultado e interpretación. Registra también `calculation.check` para recalcular el resultado por una ruta independiente.
7. Mantén `review: "pendiente"` si el fundamento no fue contrastado. El estado contrastado exige referencias consultadas. `humanReviewed` es independiente y solo se activa después de una revisión humana real.
8. Ejecuta pruebas y auditoría, revisa duplicados y prueba la pregunta en la app. `npm run audit:bank` valida el banco incluido; una importación también valida sus datos antes de guardar.

## Formato de importación

Un JSON de banco contiene `formatVersion: 1`, `questions` y `sources`. Exporta el banco incluido como ejemplo completo del formato; los tipos exactos se encuentran en `src/types.ts`.

Cada pregunta requiere `id`, `domain`, `taskId`, `topicId`, `tags`, `type`, `difficulty`, `origin`, `review`, `humanReviewed`, `stem`, `options`, `correctIds`, `choose`, `explanation`, `concept`, `confusion`, `refs`, `consultedAt`, `terms` y `provenance`.

| Campo | Valores / regla |
|---|---|
| `origin` | `ia`, `externa`, `adaptada` |
| `review` | `contrastado`, `pendiente` |
| `type` | `conceptual`, `situacional`, `calculo`, `interpretacion` |
| `difficulty` | `basica`, `intermedia`, `avanzada` |
| `choose` | Entero positivo igual al tamaño de `correctIds`; menor que el número de alternativas |
| `options` | 3–8 registros con `id`, `text`, `explanation`; IDs y textos únicos |
| `refs` | Lista de `sourceId` existente y `section` específica |
| `provenance` | Autor y nota; origen externo/adaptado exige recurso y licencia o autorización |

La importación usa los subtemas conocidos por esta versión. No añade arbitrariamente tareas o módulos desde un JSON de preguntas. Una nueva estructura académica requiere editar el temario y reconstruir la aplicación.

El banco importado se incorpora solo a este navegador. Para distribuir una ampliación como nueva versión, integra las preguntas revisadas en `src/data/questions.json`, las fuentes en `sources.json`, regenera los informes con `node scripts/finalize.mjs`, ejecuta las comprobaciones y recompila.

Los archivos JSON son la fuente de contenido de la aplicación, no componentes de interfaz.
