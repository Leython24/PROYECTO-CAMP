# Verificación · Simulador 2 · Grupo de Procesos

Fecha: 22 de octubre de 2026. Versión de la aplicación: 1.3.0.

## Integración

Se modificó el proyecto React/Vite existente. La colección `grupo-procesos-simulador-02`, visible como **Simulador 2 · Grupo de Procesos**, contiene exactamente las preguntas 1–150 del PDF aportado, con identificadores propios y cuatro alternativas por pregunta. No se mezclan automáticamente con las 150 de Éxitos ni con las 197 del banco original.

Se extrajeron las 96 páginas mediante los mapas Unicode y operadores de texto del PDF. La normalización NFKC convierte ligaduras tipográficas como «fi» en caracteres de texto. Se conservan página de origen, enunciados, alternativas, claves y explicaciones completas. El extractor comprueba que no se omitan operadores de texto ni glifos desconocidos. La 21 se reconoce aunque su título esté unido al enunciado; la 28 conserva su clave aunque «Respuesta correcta» esté repartido entre líneas. No hay objetos de imagen en este documento ni preguntas que requieran un diagrama omitido.

El archivo local utilizado tiene el mismo nombre y tamaño que el adjunto identificado y se conserva sin alteración. Su SHA-256 es:

`680f023075b201d6cdc1605434f3d4612d5b80d5081c8747bf6aea1ce067f81f`

La revisión está documentada en `REVISION_GRUPO_PROCESOS.md` y `GRUPO_PROCESOS_AUDIT.json`.

## Claves y explicaciones

Las 150 claves recibieron contraste conceptual por IA con 18 fuentes primarias, priorizando PMI. Se precisaron 21 ejercicios; en 13 se corrigió la formulación de la alternativa correcta y se identifica la respuesta como elaborada por IA. Las letras coinciden con las del material: las correcciones son de contenido o contexto, no cambios de letra ficticios. Las otras 137 conservan la alternativa original del PDF y se identifican como revisadas por IA.

Se corrigieron, entre otros, la confusión entre acta y hoja de ruta, el plan de realización de beneficios, el alcance frente a la gestión del producto, la identificación de paquetes de trabajo, las «unidades lógicas» ambiguas de las preguntas 118 y 121 y la limitación incorrecta del rol del analista en la 150. Se conserva una revisión original para comparar los ejercicios adaptados.

El razonamiento de estudio y las explicaciones individuales de las alternativas son añadidos de IA. La explicación importada del PDF se conserva completa en un apartado separado, disponible después de confirmar en práctica o finalizar en simulacro. Las citas bibliográficas dentro del PDF son atribuciones del documento y no se declaran verificadas literalmente por importarlas. Ninguna clave se presenta como revisión humana o clave oficial de PMI.

Las 95 claves de Éxitos que ya estaban pendientes de contraste independiente mantienen ese estado. Esta incorporación no cambia sus datos ni los de sus otras 55 preguntas revisadas.

## Comprobaciones ejecutadas

Entorno: Windows, Node 24.14.1, npm 11.11.0, Vite 7.3.7 y Chrome 155.

| Comprobación | Resultado |
|---|---|
| `npm test` | 59 pruebas aprobadas |
| `npm run build` | TypeScript y compilación de producción completados |
| `npm run audit:bank` | 497 preguntas y 85 fuentes válidas; 19 tareas y 89 módulos conservados |
| `npm run test:procesos` | 9 grupos aprobados en Vite sobre localhost:5173 |
| `npm run test:collections` | 13 grupos de regresión de Éxitos aprobados en el mismo Vite |
| Reproducción de extracción y de ambos importadores | Los datos finales de ambas colecciones y el banco descargable mantienen sus huellas |
| Comparación de originales con el commit anterior | Banco, fuentes, tareas y módulos originales y ambas revisiones de Éxitos permanecen idénticos byte por byte |

El aviso de Vite por fragmentos de datos superiores a 500 kB no impide la compilación ni la ejecución. Se mantienen separados los datos de las colecciones, sus originales y la interfaz en los fragmentos de producción.

## Recorrido real en navegador

En un perfil de prueba aislado se abrieron y respondieron las 150 preguntas de Grupo de Procesos usando los controles de React. No se revelaron respuestas durante el simulacro. Al finalizar se comprobó **150 aciertos, 0 errores, 0 omisiones, 0 sin calificación y 100 %**. Se revisaron los 150 ejercicios, sus cuatro alternativas, sus explicaciones importadas y sus enlaces de respaldo.

También se ejecutó una práctica con respuestas correctas, una incorrecta y preguntas omitidas: el resultado fue **3 aciertos, 1 error y 21 omisiones**, sin preguntas sin calificación. La respuesta de la 21 se confirmó correctamente y su nota se recuperó tras recargar.

La prueba de 150/150 demuestra la correspondencia entre selección y claves incluidas, no una validación humana del contenido. El contraste documental y las correcciones se describen por separado en la revisión.

Se comprobaron ambas tarjetas y las explicaciones a 390 y 320 píxeles sin desbordamiento horizontal. El PDF y su TXT extraído se descargaron desde localhost y coincidieron byte por byte con los archivos incluidos.

## Progreso anterior y recuperación

- Se cargó un banco previo de 347 preguntas junto con un simulacro Éxitos en curso: se recuperaron preguntas, respuestas, plazo del reloj, marcas y notas. La nueva colección se añadió sin modificar ese intento.
- Se recargó el simulacro nuevo después de 75 respuestas y se recuperaron selección, índice, plazo, notas y marcas.
- Se exportaron las 497 preguntas, las 85 fuentes y los tres intentos del perfil de prueba. Se vació únicamente ese perfil, se importó un banco previo y el progreso exportado y se recargó. Se recuperaron los intentos y las notas del banco original, de Éxitos y de Grupo de Procesos.
- La regresión de Éxitos también recuperó un intento antiguo con 14 alternativas seleccionadas y las preguntas entonces sin clave, sin recalificarlo con claves nuevas.

El formato de progreso y la clave `leython-capm-v1` no cambian. Las versiones se registran por pregunta. No se tocó el almacenamiento ni el progreso del navegador personal del usuario.

## Alcance del arnés de navegador

Se usó Chrome mediante CDP con perfiles separados. Para evitar la interferencia del software local que inspecciona páginas, el arnés proporcionó en la primera petición de documento el mismo HTML obtenido de Vite. Los módulos, los datos, los recursos y la interacción de React se probaron por HTTP local. El arnés tolera el cambio de contexto que ocurre durante una recarga. No modifica el código servido al navegador personal.

Los informes y capturas se generan en `artifacts/procesos-qa/` y `artifacts/review-qa/`; esos perfiles y archivos temporales se excluyen de Git.
