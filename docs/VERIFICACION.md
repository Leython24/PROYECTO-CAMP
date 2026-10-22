# Verificación de la aplicación

Fecha: 22 de octubre de 2026. React 19, Vite 7, TypeScript 5.9; Node.js 24.14.1. Navegador de prueba: Chrome 155, perfil aislado.

## Resultado

| Comprobación ejecutada | Resultado |
|---|---|
| TypeScript y compilación de producción (`npm run build`) | Correctos; recursos divididos en paquetes inferiores a 500 kB, sin esa advertencia de tamaño |
| Pruebas del motor y validadores (`npm test`) | 22 aprobadas |
| Auditoría del banco (`npm run audit:bank`) | 197 IDs únicos; referencias y respuestas válidas; 10 cálculos recalculados; 9 múltiples; sin enunciados idénticos o pares por encima del umbral léxico de 0,82 |
| Selección de simulacro completo | 150 IDs sin repetición; D1 54, D2 26, D3 30, D4 40; pendientes excluidas |
| Navegador (`npm run test:browser`) | 14 grupos de comprobaciones aprobados |
| Escritorio | Captura revisada a 1440 × 1100; inicio, práctica y resultados |
| Móvil | Captura revisada a 390 × 844; inicio, menú, módulo, práctica y respuesta por teclado; sin desbordamiento horizontal detectado |

## Casos de navegador comprobados

1. Inicio con cuatro dominios y métricas de estado vacío reales.
2. Las siete pantallas se abren.
3. Los 89 módulos se abren; visitarlos no añade respuestas al historial.
4. Práctica oculta soluciones antes de confirmar, bloquea confirmación vacía y guarda notas y marcas.
5. Recargar recupera selección, confirmación y explicaciones.
6. Un acierto y un error producen 50% en dos preguntas; ambas pueden revisarse.
7. Selección múltiple limita cantidad y muestra faltantes y sobrantes.
8. Biblioteca separa recursos externos de enunciados externos y busca por autor.
9. Simulacro personalizado oculta soluciones, conserva fecha límite al recargar y permite pausa con pregunta oculta.
10. Completo contiene 150 únicas con cuotas exactas, no ofrece pausa y finaliza al recuperar una fecha límite vencida.
11. JSON inválido, referencias inexistentes y progreso incompatible se rechazan sin sobrescribir.
12. Importación válida de progreso y ampliación del banco conservan integridad.
13. Descargas JSON de banco y progreso contienen formato y conteos esperados.
14. Navegación móvil, ausencia de desbordamiento y selección mediante teclado.

## Condiciones y límites de la prueba

- La inspección detectó un script externo inyectado por el antivirus en respuestas HTML locales que bloqueaba la carga en el navegador aislado. Para la prueba E2E se sirvieron mediante el protocolo de depuración **los bytes originales de `dist/index.html`**, sin modificar sus componentes ni datos. Las solicitudes de recursos restantes utilizaron HTTP local. El script de prueba conserva este procedimiento reproducible; no modifica la configuración del antivirus ni el perfil habitual del usuario.
- Se verificó por separado que el servidor local devuelve HTTP 200 y la página CAPM. La prueba E2E bajo ese aislamiento no equivale a comprobar todas las configuraciones de seguridad o red de una instalación real.
- La expiración se probó recuperando una fecha límite vencida; no se esperaron tres horas reales. La regla de tiempo también tiene pruebas unitarias con fechas controladas.
- La persistencia se comprobó en almacenamiento local, recargas y exportación/importación. No hay sincronización entre dispositivos o navegadores.
- La auditoría automática y el contraste por IA no sustituyen la revisión editorial humana. Cero preguntas tienen revisión humana registrada.
- No se afirma haber completado 300 preguntas: hay 197, de las que seis están pendientes de contraste. No hay validación psicométrica ni garantía de aprobación.
- Los formatos oficiales de zonas activas, arrastre, animaciones y el descanso tras 75 preguntas no se reproducen.
- Se intentó sincronizar el proyecto para publicarlo con Sites, pero la conexión de red al repositorio de alojamiento fue bloqueada por el entorno. No hay una URL publicada verificada. La entrega es el paquete local completo, con código y `dist/` compilado.
- Se comprobó también el inicio rápido `node scripts/serve.mjs`: servidor en 127.0.0.1:5173 y respuesta HTTP 200 con la página CAPM.

Resultados ejecutables: `tests/engine.test.ts`, `scripts/audit.ts`, `scripts/browser-qa.mjs`. Los archivos de evidencia se generan en `artifacts/`; se excluyen del código distribuido para evitar incluir perfiles temporales y datos de prueba.
