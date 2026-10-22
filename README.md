# CAPM · Centro de estudio de Leython

Proyecto existente de **React + Vite + TypeScript**, actualizado para estudio local en Visual Studio Code. No usa Sites.

## Ejecutar

Abre esta carpeta, la que contiene package.json, en Visual Studio Code. En su terminal:

```bash
npm install
npm run dev -- --open
```

Vite indica la dirección, normalmente http://localhost:5173/. Mantén la terminal abierta. Guardar cambios en src actualiza la aplicación mediante HMR/Fast Refresh.

**Node compatible:** ^20.19.0 o >=22.12.0. Probado con Node 24.14.1 y npm 11.11.0. La instalación inicial requiere acceso a npm; el estudio y la corrección usan los datos locales incluidos. Los enlaces externos de respaldo requieren Internet.

## Simulador 1 · Éxitos

En **Simulacros → Mis simulacros PDF** elige simulacro completo o práctica de una selección. La colección estable exitos-simulador-01 contiene exactamente las preguntas 1–150; no se mezcla automáticamente con las 197 del banco original.

| Estado actual | Cantidad |
|---|---:|
| Disponibles para practicar y corregir | 150 |
| Respuestas elaboradas por IA y contrastadas con fuentes | 55 |
| Claves restantes del material, sin nuevo contraste independiente | 95 |
| Fuentes primarias consultadas para esta revisión | 28 |

Las 55 claves de esta revisión y sus explicaciones están identificadas como **respuesta elaborada por IA**. Todas las alternativas tienen explicación y enlaces de respaldo. Esto no implica revisión humana ni aprobación de PMI.

Los ejercicios sin información suficiente se precisaron o se sustituyeron por preguntas equivalentes, indicando el cambio. Los números 8–17 no reciben una leyenda inventada: tienen casos equivalentes sobre los mismos interesados y roles. El texto y los diagramas originales siguen consultables en cada adaptación. El PDF y el TXT no se modificaron.

- Revisión completa, pregunta por pregunta: [docs/REVISION_55_PREGUNTAS.md](docs/REVISION_55_PREGUNTAS.md).
- Auditoría de la revisión: [docs/REVISION_55_AUDIT.json](docs/REVISION_55_AUDIT.json).
- Verificación de esta versión: [docs/VERIFICACION_REVISION_55.md](docs/VERIFICACION_REVISION_55.md).

## Simulador 2 · Grupo de Procesos

En **Simulacros → Mis simulacros PDF → Simulador 2 · Grupo de Procesos** puedes iniciar sus 150 preguntas o practicar una selección, con orden original o barajado opcional. Su identificador es `grupo-procesos-simulador-02`; sus preguntas e historial son independientes de Éxitos y del banco original.

Se leyó el PDF aportado completo, de 96 páginas, y se extrajeron exactamente las preguntas 1–150 con sus cuatro alternativas, clave y explicación. La pregunta 21 se extrajo correctamente aunque el título estuviera unido al enunciado. El documento no contiene imágenes de diagramas que deban extraerse.

Las 150 claves se revisaron por IA con 18 fuentes primarias. Se precisaron 21 ejercicios, incluidos términos ambiguos y confusiones sobre alcance, beneficios e iteraciones. En 13 se corrigió el contenido de la alternativa de respuesta: se marca **respuesta elaborada por IA**. Las letras coinciden con las del documento, pero no se atribuye al PDF la formulación corregida. Las otras 137 conservan su alternativa original y muestran **clave del PDF revisada por IA**. Esto no implica revisión humana ni claves oficiales de PMI.

La explicación importada del documento se conserva completa, además del razonamiento de estudio y las explicaciones de alternativas añadidas con IA. Se revelan al confirmar en práctica o al finalizar en simulacro. Los originales de los ejercicios adaptados también se pueden consultar. Las citas internas del PDF no se dan por verificadas literalmente al importarlas.

- [Revisión de las 150 preguntas y fuentes](docs/REVISION_GRUPO_PROCESOS.md).
- [Auditoría de extracción y correcciones](docs/GRUPO_PROCESOS_AUDIT.json).
- [Verificación de integración](docs/VERIFICACION_GRUPO_PROCESOS.md).

Esta versión incluye **497 preguntas: 197 originales + 150 de Éxitos + 150 de Grupo de Procesos**, en tres colecciones separadas. No se modifica la selección de ningún PDF para forzar porcentajes oficiales. Combinar colecciones en práctica requiere elegir expresamente la selección combinada.

## Progreso y versiones

Se mantienen los IDs originales y el almacenamiento leython-capm-v1, versión de progreso 1. Las notas, marcas, historial y respuestas no se borran. Un banco anterior recibe las preguntas revisadas por su número de revisión.

**Los intentos ya guardados conservan su versión anterior y su puntaje.** Esto incluye las 55 preguntas que entonces no se calificaban y las selecciones múltiples de hasta 14 alternativas. Al iniciar un intento nuevo se registra la versión revisada para poder calificar las 150 sin alterar resultados anteriores. Una sesión antigua muestra un aviso para distinguirla de un intento nuevo.

Usa el mismo navegador, protocolo, host y puerto. localhost:5173 y localhost:5174 tienen almacenamientos diferentes. Para cambiar de dirección o equipo utiliza **Gestionar banco → Exportar progreso / Importar progreso**; traslada también el banco si añadiste preguntas propias.

La importación valida antes de modificar el estado y conserva un respaldo del progreso anterior. Un banco de la versión previa puede importarse sin reemplazar las adaptaciones nuevas por sus originales archivados.

## Funciones conservadas

- Cuatro dominios, 19 tareas y 89 módulos de estudio.
- Banco original de 197 preguntas, con sus datos y 36 fuentes intactos.
- Práctica con colección, dominio y tema; filtros secundarios en «Más filtros».
- Simulacros personalizados del banco original y colección PDF independiente.
- Orden original por defecto y barajado opcional.
- Explicaciones después de confirmar en práctica y al terminar el simulacro.
- Notas, marcas, dudas, tiempo, intentos y resultados persistentes.
- Importación y exportación JSON de banco y progreso.
- Diseño morado y naranja, con fondos claros y controles legibles.

Las cuotas de dominios se aplican solo al simulacro ponderado del banco original. El documento Éxitos usa sus propias 150 preguntas y 180 minutos continuos. Las preguntas se califican por coincidencia exacta de alternativas; no se concede crédito parcial. Las claves del material que no se revisaron no se presentan como verificadas.

## Comandos de comprobación

```bash
npm test
npm run audit:bank
npm run build
```

Con Vite activo y Chrome disponible:

```bash
npm run test:collections
npm run test:procesos
npm run test:dev
```

Para la regresión del proyecto compilado:

```bash
npm run test:browser
```

Las pruebas de navegador usan perfiles aislados; no cambian el progreso personal. Se puede indicar otra instalación de Chrome mediante CAPM_CHROME_PATH y otra dirección de Vite mediante CAPM_DEV_URL.

## Archivos principales

| Ruta | Contenido |
|---|---|
| src/data/questions.json | Banco original de 197 preguntas |
| src/data/collections/exitos-simulador-01.json | 150 preguntas actuales, incluidas las 55 revisadas |
| src/data/collections/exitos-simulador-01-v1.json | Archivo íntegro de la importación original, para intentos anteriores |
| src/data/collections/exitos-review-sources.json | 28 fuentes de respaldo de la revisión |
| src/engine/versioning.ts | Recuperación de versiones y actualización del banco |
| public/collections/exitos-simulador-01/ | PDF, TXT y cinco diagramas originales |
| docs/ | Revisión, fuentes, auditorías y verificación |

Los scripts Python de extracción y revisión se conservan para mantenimiento; los datos finales ya están incorporados y **no es necesario ejecutarlos para estudiar**. Si se reproduce la importación original, el script aplica después la revisión documentada.

El material aportado se conserva para estudio personal. No se atribuye una licencia de republicación a fuentes ajenas. No se copian contenidos completos de las referencias oficiales; se enlazan como respaldo del razonamiento.
