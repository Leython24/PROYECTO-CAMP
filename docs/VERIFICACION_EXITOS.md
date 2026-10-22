> Documento histórico de la versión 1.1.0. El estado actual de las 55 revisadas se documenta en REVISION_55_PREGUNTAS.md y VERIFICACION_REVISION_55.md.

# Verificación de la entrega Éxitos

Fecha: 22 de octubre de 2026. Proyecto React + Vite + TypeScript, versión 1.1.0.

## Resultado

- npm install: correcto (dependencias locales ya presentes, «up to date»).
- npm run dev -- --open: correcto; Vite detectó el servidor ya activo en 5173 y abrió 5174 para la comprobación. El proceso adicional de pruebas se cerró; el proyecto actualizado también se verificó en http://localhost:5173/.
- npm run build: TypeScript y Vite completados, sin errores.
- npm test: 46 pruebas correctas.
- npm run audit:bank: sin errores; banco original 197, PDF 150, total 347; 38 fuentes.
- npm run test:browser: 14 grupos correctos sobre compilación de producción, incluidos 89 módulos y simulacros originales.
- npm run test:dev: 5 grupos correctos; HMR de CSS y Fast Refresh de React conservan progreso.
- npm run test:collections: 13 grupos correctos sobre las 150 preguntas reales, con guardado, recarga, selección múltiple, propuestas de IA, figuras, resultados, importación/exportación y vistas de 320/390 píxeles.
- Documentos y cinco imágenes servidos por localhost: bytes iguales a sus recursos locales.
- JSON originales de preguntas, fuentes, tareas y temas: idénticos byte por byte al proyecto anterior; huellas en ORIGINAL_DATA_SHA256.json.
- Numeración: exactamente 1–150, IDs únicos, sin importar el anexo como preguntas.
- TXT/PDF: cotejo de todos los enunciados y alternativas, tipos y letras del anexo; extracción de las 48 páginas.

## Entorno y límites

Node probado: 24.14.1; npm 11.11.0; Vite 7.3.7 instalado. Compatibilidad declarada por las dependencias: Node ^20.19.0 o >=22.12.0.

npm install se ejecutó correctamente sobre el proyecto con sus dependencias presentes. La instalación desde cero requiere acceso al registro npm; este entorno tiene restricciones de red y no se presenta como comprobada una descarga nueva de todas las dependencias.

Chrome se ejecutó con perfiles de prueba aislados; no se borró ni se modificó el almacenamiento del navegador personal. Por la inyección del antivirus local, el HTML inicial de esos perfiles se entregó mediante interceptación desde la respuesta de Vite o desde dist. Los módulos, datos, recursos y HMR se solicitaron por HTTP real a localhost. Se concedió únicamente a esos perfiles el permiso de bucle local.

Las 95 preguntas corregibles usan claves marcadas del material, pendientes de revisión; no se afirma validación conceptual completa. Las otras 55 no entran en errores, omisiones calificables ni porcentaje. No se atribuye revisión humana.

## Uso

Extrae el ZIP y abre la carpeta CAPM_Centro_Estudio_Leython en Visual Studio Code. En su terminal:

```powershell
npm install
npm run dev -- --open
```

Para compilar: npm run build. Mantén el mismo navegador, host y puerto para recuperar el progreso local anterior. Para trasladarlo a otra dirección o equipo, exporta e importa el progreso desde Gestionar banco.

La incorporación de Éxitos está completa en los datos entregados. Los scripts Python incluidos son de mantenimiento y no deben ejecutarse para usar la aplicación.
