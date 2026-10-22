# Verificación de la revisión de 55 preguntas

Fecha: 22 de octubre de 2026. Proyecto: CAPM Centro de Estudio de Leython, versión 1.2.0.

## Contenido y procedencia

- La colección `exitos-simulador-01` contiene exactamente 150 identificadores únicos, desde `exitos-simulador-01-q001` hasta `exitos-simulador-01-q150`, en su orden original.
- Las 55 preguntas que antes no se calificaban tienen ahora una respuesta elaborada por IA, explicaciones individuales de todas sus alternativas y enlaces a 28 fuentes primarias. Se priorizaron PMI y sus documentos oficiales; se usaron también Scrum Guide, el Manifiesto Ágil, ASQ y Lean Enterprise Institute según el tema.
- Se precisaron o sustituyeron 33 ejercicios para evitar ambigüedades. De ellos, 18 son sustituciones equivalentes identificadas expresamente. Las preguntas 8–17 tienen casos sobre los roles e interesados correspondientes; no se inventó la leyenda del diagrama original.
- Los originales se conservan íntegros en el archivo de revisión 1 y se pueden consultar desde cada pregunta adaptada. El PDF, el TXT y los cinco diagramas originales siguen incluidos y se sirven correctamente desde localhost.
- Los nuevos intentos tienen 150 preguntas calificables. Las otras 95 claves proceden del material y siguen identificadas como pendientes de contraste independiente. Esta revisión de 55 no se presenta como una validación conceptual de esas otras 95, revisión humana ni aprobación de PMI.
- Las 197 preguntas, las 36 fuentes, las 19 tareas y los 89 módulos del banco original conservan sus archivos byte por byte. Los SHA-256 de referencia están en `ORIGINAL_DATA_SHA256.json`.

La explicación completa de cada caso está en `REVISION_55_PREGUNTAS.md`; los conteos, números y adaptaciones están en `REVISION_55_AUDIT.json`.

## Comprobaciones ejecutadas

Entorno: Windows, Node 24.14.1, npm 11.11.0 y Chrome 155.0.8059.85.

| Comando o prueba | Resultado observado |
|---|---|
| `npm install` | Dependencias y lockfile actualizados, sin errores |
| `npm test` | 53 pruebas aprobadas |
| `npm run audit:bank` | Integridad de 347 preguntas y 66 fuentes; colección Éxitos de 150 preguntas |
| `npm run build` | TypeScript y compilación de Vite completados |
| `npm run test:collections` | 13 grupos aprobados sobre Vite en localhost:5173 |
| `npm run test:dev` | 5 grupos aprobados: navegación, práctica, simulacro, HMR y Fast Refresh |
| `npm run test:browser` | 14 grupos de regresión aprobados sobre la compilación, incluidos los 89 módulos |
| Reproducción de la extracción y revisión | Los archivos de preguntas de revisión 1 y 2 resultaron idénticos a los datos ya comprobados |

La compilación emite el aviso de Vite sobre un fragmento de preguntas superior a 500 kB. No impide compilar ni ejecutar. Se separaron los datos de la interfaz y de React en fragmentos de carga.

## Prueba de las 150 preguntas y del puntaje

Las pruebas de navegador seleccionaron respuestas mediante los controles reales de React para las 150 preguntas del simulacro. Se recorrieron todas las preguntas sin mostrar las soluciones durante el intento. Al terminar se comprobó: **150 aciertos, 0 errores, 0 omisiones, 0 sin calificación y 100 %**. Se comprobó también un intento de práctica con respuestas incorrectas y omisiones, y selección múltiple sin crédito parcial.

Después de confirmar en práctica o terminar en simulacro, se comprobó que las 55 preguntas revisadas muestran su clave IA, las explicaciones de cada alternativa y los enlaces de respaldo. La pregunta 48 muestra la clave revisada y mantiene por separado el texto de la clave histórica del anexo.

El resultado 150/150 prueba el funcionamiento del motor con las claves incluidas; no sustituye el contraste documental de las respuestas ni afirma que las 95 claves restantes hayan recibido una revisión nueva.

## Recuperación del progreso

Se recargó un simulacro después de contestar 75 preguntas: se recuperaron respuestas, plazo del cronómetro, marcas y notas. Se exportaron banco y progreso, se vació únicamente el almacenamiento del perfil de prueba, se importaron ambos y se recargó; los intentos y sus versiones se recuperaron.

También se cargó un banco de la versión anterior y una sesión antigua con una pregunta del diagrama sin clave y una selección de 14 alternativas. Las preguntas y resultados antiguos se conservaron sin recalificarlos con las nuevas claves. Los intentos nuevos registran la revisión por pregunta y usan las respuestas revisadas. Las importaciones inválidas se rechazan antes de sobrescribir el estado.

El almacenamiento mantiene `leython-capm-v1` y la versión 1 del formato de progreso. Las pruebas usaron perfiles aislados; no se borró ni modificó el progreso del navegador personal del usuario.

## Alcance de la prueba del navegador

Se utilizó Chrome mediante CDP en perfiles aislados. El software local que inspecciona páginas interfería con la navegación inicial del navegador automatizado; el arnés proporcionó solo para esa primera petición el mismo HTML obtenido de Vite o de la compilación. Los módulos, los recursos, las peticiones y las actualizaciones HMR se probaron por HTTP local. Esto no modifica el navegador personal ni el código servido al usuario.

Los informes de ejecución y capturas se generan en `artifacts/` y se excluyen del repositorio junto con perfiles de navegador, cachés, `node_modules` y `dist`.

## Huellas de los datos de la colección

| Archivo | SHA-256 |
|---|---|
| `exitos-simulador-01-v1.json` | `062b357dad5dccc3e08d494de385624ff26af0002e8b239f346b6e309a877e83` |
| `exitos-simulador-01.json` | `d710e0611ece79d55c4be35eb1fb46d2d36009e7c14cdeb4bc76f7c6b233339d` |

Los documentos aportados no se alteraron. Sus huellas son:

- PDF: `37e023880590f8bb5de33db4559e36980c47136a0d3415b473e8b99abe368637`.
- TXT: `9dbe047f928d4b64473181b2d08746559b16c967bbfcd2af944b6bb31f5e80ef`.
