# Gestión de intentos y preparación de Vercel · 1.4.1

Verificado el 22 de octubre de 2026 con Node 24.14.1, npm 11.11.0 y Chrome. Aplicación local en `http://localhost:5173/`. Las pruebas usan perfiles aislados y no acceden al progreso personal del usuario.

## Comportamiento

- Mis resultados permite eliminar un resultado individual con confirmación. Incluye las sesiones sin finalizar, con acciones para continuar o eliminar.
- El catálogo de simulacros y el historial de cada PDF también permiten eliminar intentos. La colección y sus preguntas permanecen.
- La salida de una sesión ofrece seguir estudiando, guardar o salir sin guardar. Descartar elimina respuestas, dudas y tiempo del intento, también si se abrió únicamente para mirar.
- Se quitan sus respuestas del historial y se actualizan las estadísticas. Las preguntas vistas antes del intento y las respaldadas por otra sesión no se reinician. Las notas, marcadores, reportes y visitas a temas son compartidos y se conservan.
- La comparación de resultados ignora los intentos eliminados sin intentar acceder a datos inexistentes.
- No se modificó el formato de progreso versión 1, sus claves de almacenamiento ni ningún identificador de preguntas o colecciones. No se requiere migración.

## Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| `npm test` | 70 pruebas aprobadas, incluidas 6 de eliminación y conservación del progreso |
| `npm run test:sessions` | 9 grupos aprobados en localhost: descartar, guardar, recuperar, cancelar, eliminar, comparación, último resultado y tarjetas PDF |
| `npm run test:design` | 12 grupos aprobados: persistencia previa, revisión, exportación/importación, pausa, teclado, movimiento reducido y pantallas a 1600, 900, 390 y 320 px |
| `npm run test:browser` | 14 grupos aprobados contra la compilación de producción: estudio, práctica, simulacros, recuperación, biblioteca y traslado JSON |
| `npm run audit:bank` | 497 preguntas, 85 fuentes; 197 + 150 + 150, sin errores |
| `npm run build` | TypeScript y Vite aprobados |

Se inspeccionaron las capturas de confirmación en escritorio y móvil. Las acciones muestran texto, foco visible y un diálogo nativo cancelable con Escape. Las comprobaciones de navegador no detectaron excepciones de la aplicación.

Vite mantiene el aviso de fragmentos de preguntas superiores a 500 kB. Los datos completos y sus revisiones históricas siguen incluidos; la compilación termina correctamente.

## Vercel

Se añadió `vercel.json` con preset Vite, instalación `npm ci`, compilación `npm run build` y salida `dist`. `.vercelignore` excluye únicamente las carpetas de trabajo de la raíz y conserva `vendor/gsap/dist`. El proyecto usa rutas con `#`; no requiere reglas de reescritura de pantallas ni variables de entorno.

La cuenta de Vercel no estaba conectada al realizar esta verificación. **No hay un despliegue ni una URL de aplicación Vercel verificados en esta entrega.** El enlace de importación del README abre la preparación de un despliegue; no es una aplicación publicada.

La instalación desde una copia limpia se intentó sin tocar el `node_modules` de trabajo: el modo sin red encontró `ENOTCACHED` para `yallist-3.1.1.tgz`; el intento con red recibió `EACCES` al acceder a npm y terminó con `Exit handler never called`. Por esa restricción no se afirma haber completado una instalación limpia ni una compilación en Linux/Vercel. La compilación y las pruebas anteriores sí se ejecutaron con las dependencias instaladas del proyecto existente.

Para trasladar el progreso a Vercel, exportarlo desde localhost e importarlo en la nueva dirección. Si hay preguntas propias, trasladar también el banco antes del progreso. El almacenamiento local no se sincroniza entre direcciones.

Detalle de pruebas: [VERIFICACION_SESIONES.json](VERIFICACION_SESIONES.json).
