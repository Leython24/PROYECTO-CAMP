# Verificación de la entrega local

Fecha: 22 de octubre de 2026. Node 24.14.1, npm 11.11.0, Vite 7.3.7.

## Resultado de esta adaptación

- npm install terminó correctamente con las dependencias existentes copiadas del proyecto original: up to date in 2s. El primer intento limpio no pudo descargar desde npm por EACCES en la conexión del entorno; no se afirma una instalación desde cero verificada. La carpeta local ya tiene sus dependencias instaladas.
- npm run dev -- --open inicia el servidor real de Vite en http://localhost:5173/ y solicita abrir el navegador. Se comprobó una respuesta HTTP 200.
- npm run build: TypeScript y compilación de producción correctos.
- npm test: 22 pruebas aprobadas.
- npm run audit:bank: sin errores; 197 preguntas, 36 fuentes, 19 tareas y 89 subtemas.
- npm run test:browser: 14 grupos de comprobaciones aprobados sobre la compilación final. Incluyen estudio, selección única y múltiple, explicaciones, resultados, cronómetros, recuperación, notas e importación/exportación JSON.
- npm run test:dev: 5 comprobaciones aprobadas con Vite activo. Se probaron la vista inicial, práctica con notas, recuperación tras recargar, simulacro de 150 preguntas, HMR de CSS y Fast Refresh de React. Los cambios de prueba se restauran al terminar.
- Los 15 archivos de src/ tienen el mismo contenido que los originales. No se cambiaron preguntas, módulos, fuentes ni el motor de progreso.

## Ajustes del entorno local

La configuración se llama vite.config.mjs; el código de la aplicación sigue en TypeScript/TSX. El cargador nativo de Vite evita que esbuild busque configuración en carpetas superiores bloqueadas. scripts/esbuild-node-resolver.mjs permite al optimizador resolver y leer las dependencias mediante Node en este entorno restringido. La compilación sigue siendo la de Vite y el servidor mantiene HMR real.

La caché de npm se coloca en .npm-cache/ dentro del proyecto para evitar un error de acceso a la caché global. No es necesario usar una terminal de administrador. Al añadir una biblioteca nueva, incluye también su importación de entrada en la lista dependencies de vite.config.mjs para que se optimice junto con las existentes.

La política de contenido de desarrollo permite la preconfiguración de React Refresh y la conexión WebSocket de Vite. La compilación conserva la política original.

## Alcance de la prueba de navegador

Chrome se ejecuta con un perfil de prueba aislado. En este equipo se observó una inyección de HTML del antivirus que bloquea la navegación automatizada directa. Para aislarla, las pruebas entregan al navegador el HTML real obtenido del servidor correspondiente; scripts, estilos y recursos se sirven por HTTP. En la prueba de desarrollo se concede únicamente al perfil aislado el permiso loopback-network para conectar el WebSocket local de Vite. No se modifican los permisos de tu perfil habitual. La navegación automatizada directa sin esa intercepción no llegó a renderizar en este entorno; no se declara verificada por esa ruta.

Estas condiciones no sustituyen el servidor por archivos estáticos: se comprobó que editar el CSS y el componente React actualiza la interfaz abierta por Vite sin recarga manual y sin perder el progreso.

## Abrir y estudiar

Abre la carpeta que contiene este README y package.json en Visual Studio Code. En su terminal:

```powershell
npm install
npm run dev -- --open
```

Mantén esa terminal abierta. Si ya hay un servidor en 5173, Vite muestra el siguiente puerto libre. Usa siempre la misma dirección y puerto para conservar el mismo almacenamiento local, o utiliza la importación/exportación de progreso para trasladarlo.
