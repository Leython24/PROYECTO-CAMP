# CAPM · Centro de estudio de Leython

Proyecto existente de **React + Vite + TypeScript**, versión **1.4.1**, actualizado para estudio local en Visual Studio Code. No usa Sites.

## Ejecutar

Abre esta carpeta, la que contiene package.json, en Visual Studio Code. En su terminal:

```bash
npm install
npm run dev -- --open
```

Vite indica la dirección, normalmente http://localhost:5173/. Mantén la terminal abierta. Guardar cambios en src actualiza la aplicación mediante HMR/Fast Refresh.

**Node compatible:** ^20.19.0 o >=22.12.0. Probado con Node 24.14.1 y npm 11.11.0. La instalación inicial requiere acceso a npm; el estudio y la corrección usan los datos locales incluidos. Los enlaces externos de respaldo requieren Internet.

## Guardar, descartar y eliminar intentos

Durante una sesión, **Guardar y salir** abre un diálogo con tres opciones: seguir estudiando, guardar el avance o **Salir sin guardar**. Esta última descarta el intento, incluidas sus respuestas, dudas y tiempo. Si solo abriste las preguntas para mirar, no quedará un intento en tu historial al elegirla. Recargar la página sigue recuperando automáticamente una sesión guardada; cerrar la pestaña no la descarta.

En **Mis resultados** puedes eliminar cada resultado, gestionar las **Sesiones sin finalizar** y continuar un intento. Las tarjetas de cada PDF también permiten eliminar sus intentos. Toda eliminación requiere confirmación y afecta exclusivamente al intento elegido: no borra la colección, las preguntas, las otras sesiones ni tus notas y marcadores personales. Sus respuestas se retiran del historial y las estadísticas se actualizan. Una pregunta vista únicamente en el intento eliminado vuelve a estar disponible como nueva; se conserva si ya se había visto antes o hay respuestas de otras sesiones.

## Desplegar en Vercel

Este mismo repositorio incluye `vercel.json`: preset **Vite**, instalación **npm ci**, compilación **npm run build**, salida **dist**. Importa `Leython24/PROYECTO-CAMP`, rama **main**, directorio raíz **./**, con **Node 24.x**. No necesita variables de entorno ni servidor Node en producción. El router usa `#`, por lo que no necesita reglas de reescritura para sus pantallas. Los PDF, diagramas y bancos se sirven desde el mismo despliegue.

[Importar el repositorio en Vercel](https://vercel.com/new/import?s=https%3A%2F%2Fgithub.com%2FLeython24%2FPROYECTO-CAMP)

**Trasladar tu progreso:** antes de cambiar de localhost a Vercel, usa **Gestionar banco → Exportar progreso** en localhost. En la nueva dirección abre **Gestionar banco → Importar progreso** y elige ese archivo. Si añadiste preguntas propias, exporta e importa también el banco, primero. Cada dirección tiene almacenamiento independiente: publicar no transfiere automáticamente tus datos. La app mantiene el formato versión 1 y los identificadores actuales.

Referencias oficiales: [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite), [configuración estática](https://vercel.com/docs/project-configuration/vercel-json) y [versiones de Node](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions). La presencia de esta configuración no significa que exista un despliegue: la publicación requiere una cuenta conectada y un despliegue completado en Vercel.

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


## Diseño y experiencia 1.4.0

Interfaz unificada con Pico CSS, GSAP y Lenis; navegación adaptable y diálogos de salida y finalización. Mis resultados incluye historial, comparación, denominadores explícitos y acciones para revisar, practicar falladas/omitidas y repetir. Se conservan los 497 registros, las colecciones independientes y el almacenamiento versión 1.

Las bibliotecas visuales están incluidas en `vendor` como dependencias locales: `npm install` las enlaza sin descargar código de CDN. Node compatible: `^20.19.0 || >=22.12.0`.

Prueba adicional del rediseño: `npm run test:design`. El arnés de navegador utiliza Chrome instalado; en otro equipo puede configurarse `CAPM_CHROME_PATH`.

- [Diseño, accesibilidad e integración de bibliotecas](docs/DISENO_UX.md)
- [Comprobaciones y capturas](docs/VERIFICACION_DISENO.md)
