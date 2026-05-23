# Índice de optimizaciones del frontend — ResurgeNet

**Período:** Mayo 2026  
**Autor:** Claude (asistente IA) bajo supervisión de la alumna  

---

## Visión general

Tras la integración de Claude con el repositorio (documentada en el `README.md`), se realizó una fase completa de optimización del frontend de ResurgeNet. Esta fase comprendió **5 áreas principales** de mejora, cada una documentada en un archivo independiente.

El punto de partida fue una **auditoría inicial** que identificó 16 problemas clasificados por prioridad. Todos los problemas de prioridad alta fueron resueltos. Los de prioridad media y baja fueron resueltos o documentados con justificación de por qué no se implementaron.

---

## Mapa de documentos

### Previo a las optimizaciones

| Documento | Descripción |
|---|---|
| [`auditoria-inicial-frontend.md`](auditoria-inicial-frontend.md) | Análisis completo del estado del código antes de cualquier cambio. 16 problemas identificados, clasificados por categoría y prioridad. Punto de referencia para evaluar el impacto de las optimizaciones. |

### Fase 1 — Código JavaScript duplicado

| Documento | Descripción |
|---|---|
| [`optimizacion-showModal-utils.md`](optimizacion-showModal-utils.md) | Extracción de la función `showModal` (copiada en 9 archivos con 3 variantes distintas) a un único archivo `utils.js` compartido. Diseño de la API unificada con soporte para error, éxito y confirmación. |

### Fase 2 — Estandarización en jQuery

| Documento | Descripción |
|---|---|
| [`optimizacion-jquery-unificado.md`](optimizacion-jquery-unificado.md) | Inventario de los 6 archivos con mezcla de jQuery y Vanilla JS. Migración de `evitar_atras.js` (URL hardcodeada), `solicitudesComercios.js` (reescritura completa) y `carga_comercios_activos.js` (showModal local no eliminada). |

### Fase 3 — Estilos inline en JavaScript

| Documento | Descripción |
|---|---|
| [`optimizacion-estilos-inline.md`](optimizacion-estilos-inline.md) | Inventario de 4 categorías de estilos inline en JS (validación de inputs, botón confirm del modal, color del título del modal, mensajes de lista vacía). Creación de `components.css` y funciones `inputError()`/`inputOk()` en `utils.js`. |

### Fase 4 — Console.log en producción

| Documento | Descripción |
|---|---|
| [`estudio-gestion-console-logs.md`](estudio-gestion-console-logs.md) | Estudio comparativo entre eliminar los logs y envolverlos en una función `debug()` con flag de entorno. Decisión razonada: eliminación directa con conversión de errores silenciosos en `showModal` visibles al usuario. |

### Fase 5 — Sistema de estilos CSS global

| Documento | Descripción |
|---|---|
| [`optimizacion-main-css.md`](optimizacion-main-css.md) | Creación de `main.css` con variables CSS en `:root` y base global. Eliminación de ~400 líneas de código duplicado entre los 14 archivos CSS. Actualización de los 16 HTML. |
| [`correcciones-layout-main-css.md`](correcciones-layout-main-css.md) | Correcciones de las regresiones visuales detectadas tras el refactor: landing desestructurada, nombre de rol sobre foto de perfil, botones desplazados, formularios tapados por el footer. Análisis de causa raíz de cada regresión. |

### Análisis técnico complementario

| Documento | Descripción |
|---|---|
| [`analisis-reutilizabilidad-header-footer.md`](analisis-reutilizabilidad-header-footer.md) | Análisis de por qué el header y el footer no son reutilizables. Inventario de las 3 variantes del header. Estudio de las 3 opciones técnicas disponibles (jQuery `$.load`, PHP `include`, Web Components). Recomendación razonada de no implementarlo en esta fase. |

---

## Documentos previos a la fase de optimización

Estos documentos pertenecen a iteraciones anteriores del TFG y documentan funcionalidades desarrolladas antes de la integración con Claude:

| Documento | Descripción |
|---|---|
| [`mis_datos_consumidor.md`](mis_datos_consumidor.md) | Documentación de la funcionalidad de edición de datos del consumidor |
| [`mis_pedidos_consumidor.md`](mis_pedidos_consumidor.md) | Documentación de la funcionalidad de listado de pedidos del consumidor |
| [`modificaciones-despliegue-base-de-datos.md`](modificaciones-despliegue-base-de-datos.md) | Documentación de las modificaciones en la configuración de Docker y base de datos |

---

## Impacto cuantitativo de las optimizaciones

| Métrica | Antes | Después |
|---|---|---|
| Archivos JS con `showModal` local | 9 | 0 |
| Archivos JS con Vanilla JS | 6 | 0 |
| Archivos JS con `console.log`/`console.error` | 3 | 0 |
| Archivos JS con estilos inline (`.css()`) | 8 | 0 |
| Archivos CSS con el bloque del modal | 5 | 1 (`main.css`) |
| Archivos CSS con colores literales duplicados | 14 | 0 (solo variables) |
| Líneas de CSS duplicadas eliminadas | — | ~400 |
| Variables CSS centralizadas | 0 | 20 (en `:root`) |
