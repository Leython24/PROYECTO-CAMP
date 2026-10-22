# Colecciones PDF, versiones y diseño

La versión 1.2.0 conserva React + Vite + TypeScript y el diseño morado/naranja. La referencia visual consultada es el [PMI Media Kit](https://www.pmi.org/about/press-media/kit); los colores #4F17A8 y #FF610F son una adaptación y no se presentan como códigos oficiales exactos de marca.

La colección exitos-simulador-01 mantiene las 150 numeraciones y sus IDs. No se crean tarjetas ni preguntas para otros documentos pendientes. Las 197 preguntas originales se conservan aparte y las selecciones combinadas requieren una elección expresa.

| Versión de Éxitos | Importadas/disponibles | Calificables | Sin calificación | Pendientes de contraste |
|---|---:|---:|---:|---:|
| Original del documento, archivada como v1 | 150 | 95 | 55 | 150 |
| Actual, con revisión IA de las 55 | 150 | 150 | 0 | 95 |

La procedencia y la revisión son distintas. Las 95 claves no incluidas en el encargo de revisión siguen como material-key y pendientes. Las 55 revisadas tienen keyOrigin: ia-authored, estado checked, fecha, evidencias y explicación individual con enlaces. humanReviewed permanece false. «Contrastado» significa contraste efectuado por IA con las fuentes enlazadas, no revisión humana.

Las adaptaciones tienen clase clarified o replacement, motivo y número de revisión. El componente de pregunta permite consultar el ejercicio original del PDF. No se inventó una leyenda para 8–17 ni se atribuyen las preguntas equivalentes al autor original.

Los intentos nuevos guardan questionRevisions. En los anteriores, la ausencia de este campo significa versión 1. El motor, la revisión de resultados y el historial recuperan esa versión; las nuevas claves no recalifican intentos antiguos. Los validadores aceptan sus selecciones antiguas de hasta 14 opciones y rechazan versiones desconocidas.

Se conservan la clave de almacenamiento, los IDs, las notas y marcas. Los dos formatos de banco/progreso siguen usando versión 1, con campos opcionales nuevos. Los documentos fuente, las cinco imágenes y la transcripción íntegra no se modificaron.

El detalle de las 55 respuestas y todas sus alternativas está en REVISION_55_PREGUNTAS.md. La auditoría original de importación permanece como documento histórico; REVISION_55_AUDIT.json describe el estado actual.
