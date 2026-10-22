# Diseño y experiencia · versión 1.4.0

La aplicación mantiene React, Vite, TypeScript y sus tres colecciones independientes: 197 preguntas originales, 150 de Éxitos y 150 de Grupo de Procesos. No se cambia ningún archivo de preguntas, fuente, PDF, diagrama, clave o revisión histórica en esta entrega.

## Identidad y componentes

Se utiliza Pico CSS 2.1.1 como base de componentes semánticos, con una capa visual propia para botones, campos, tarjetas, tablas, pestañas, diálogos, estados y navegación. La tipografía usa las fuentes del sistema y no descarga fuentes externas. La paleta morada y naranja es propia de esta aplicación, inspirada en PMI: no se atribuyen sus códigos como valores oficiales ni se utiliza el logotipo de PMI. Referencia oficial consultada: https://www.pmi.org/about/press-media/kit/.

Frontend Designer y Blender MCP no están disponibles en la sesión utilizada. El diseño se implementó directamente en React. La ilustración geométrica de inicio utiliza CSS y no carga modelos 3D.

## Resultados que explican el denominador

- El puntaje conserva la fórmula anterior: correctas / preguntas calificables × 100, redondeado. Las omisiones calificables permanecen en el denominador.
- Se muestra por separado la cobertura: respondidas / preguntas totales. Con una sola respuesta de 150 se destacan las 149 en blanco.
- Las preguntas sin clave no cuentan como errores ni omisiones calificables. También se muestran las omisiones totales, que sí incluyen preguntas sin clave dejadas en blanco.
- El acierto entre respondidas usa otro denominador y se etiqueta expresamente. No sustituye el puntaje de la sesión.
- Cada resultado conserva colección, fecha, duración, respuestas, versiones y procedencia de las claves: material, PDF revisado por IA, elaboración por IA y sin calificación.
- El historial admite búsqueda, filtros, ordenación y comparación de dos intentos. La comparación muestra denominadores y advierte cuando las sesiones pueden tener preguntas distintas.
- Acciones directas: revisar explicaciones, practicar falladas, practicar omitidas, repetir, volver a Simulacros y continuar la ruta. Repetir crea otro intento y utiliza las revisiones actuales, sin recalificar el anterior.

## Navegación y conservación

La salida y la finalización usan diálogos nativos con foco contenido, Escape y retorno al control anterior. Salir de un personalizado lo pausa; en un simulacro continuo se informa que el reloj seguirá corriendo. El cronómetro de un personalizado finalizado durante una pausa excluye ese descanso.

En móvil, el menú cerrado queda fuera del orden de teclado y el menú abierto contiene el foco. El historial puede desplegarse para cambiar de intento. Las acciones de sesión conservan posiciones comunes.

La ruta diferencia pendiente, lectura visitada y actividad completada. Completado significa lectura visitada y todos los ejercicios disponibles respondidos; no certifica dominio del contenido. Inicio muestra la sesión activa, métricas reales y actividad reciente. Práctica anticipa el conjunto de preguntas filtradas. Biblioteca añade búsqueda, filtros y paginación. Gestionar banco separa cantidades por colección y conserva la importación/exportación.

No hay migración de almacenamiento: continúan `leython-capm-v1`, `leython-capm-bank-v1` y el formato versión 1. La recuperación de intentos anteriores mantiene sus revisiones. El rendimiento por tema también utiliza la revisión correspondiente a cada respuesta histórica.

## Movimiento

GSAP 3.15.0 anima entradas, tarjetas, botones, barras, selecciones y resultados. Lenis 1.3.27 comparte el reloj de GSAP; sus eventos actualizan ScrollTrigger. Hay un solo bucle de animación. Se preserva el desplazamiento nativo en paneles y diálogos. Con `prefers-reduced-motion: reduce` no se instancia Lenis y se desactivan las animaciones de interfaz. Los cambios de preferencia se atienden sin recargar.

## Dependencias incluidas

Las conexiones salientes de npm están bloqueadas en el entorno de trabajo. Para mantener el proyecto instalable se incluyen paquetes locales mediante dependencias `file:vendor/...`, con código oficial y licencias conservadas:

| Biblioteca | Versión | Fuente |
|---|---|---|
| GSAP + ScrollTrigger | 3.15.0 | https://github.com/greensock/GSAP/tree/3.15.0/dist |
| Lenis, núcleo TypeScript | 1.3.27 | https://github.com/darkroomengineering/lenis/tree/v1.3.27/packages/core |
| Pico CSS | 2.1.1 | https://github.com/picocss/pico/tree/v2.1.1 |

GSAP incluye el núcleo y ScrollTrigger oficiales, con una declaración de tipos pequeña específica de esta integración. Su licencia estándar está en https://gsap.com/standard-license/. Lenis conserva el código del núcleo: únicamente se ajustó la ruta relativa de su `package.json` al empaquetado local y el tipo del temporizador a `ReturnType<typeof setTimeout>` para convivir con los tipos de Node. Lenis y Pico conservan sus licencias MIT. No hay dependencias de CDN durante el uso.

Node compatible: `^20.19.0 || >=22.12.0`. Los comandos habituales siguen siendo `npm install` y `npm run dev -- --open`. El proyecto se comprobó con Node 24.14.1 y npm 11.11.0.

## Verificación

Consulta [VERIFICACION_DISENO.md](VERIFICACION_DISENO.md) para los resultados de pruebas. Las capturas de esta documentación utilizan casos de prueba en un perfil aislado; no representan ni modifican el progreso personal de Leython.
