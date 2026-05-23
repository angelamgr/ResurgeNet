# Auditoría inicial del frontend — ResurgeNet

**Fecha:** 2026-05-18  
**Autor:** Claude (asistente IA)  
**Tarea:** Análisis previo a la fase de optimización del frontend

---

## 1. Contexto

Antes de iniciar cualquier optimización, se realizó una lectura completa de todos los archivos del frontend: 17 archivos JavaScript, 14 hojas CSS y 16 páginas HTML. El objetivo era obtener un mapa exhaustivo del estado real del código antes de modificar nada, identificar todos los problemas existentes, clasificarlos por severidad y prioridad, y establecer el orden lógico de las fases de optimización.

Este documento recoge ese análisis inicial. Cada problema identificado aquí tiene una fase de optimización correspondiente documentada en un archivo separado dentro de esta carpeta.

---

## 2. Estructura del frontend en el momento del análisis

```
frontend/
├── style/          14 archivos CSS
├── js/             17 archivos JavaScript
├── imagenes/       Imágenes del proyecto
└── *.html          16 páginas HTML
```

**Stack tecnológico del frontend:**
- HTML5 estático servido por Nginx
- CSS puro sin preprocesador
- JavaScript con jQuery 3.6.0 (cargado desde CDN)
- Sin sistema de build, sin bundler, sin transpilador

---

## 3. Problemas detectados por categoría

### Categoría A — Mantenibilidad del código JavaScript

#### A1 — Función `showModal` duplicada en 9 archivos JS — Prioridad ALTA

La función encargada de mostrar el modal de errores y confirmaciones estaba copiada en `login.js`, `validacion_registro.js`, `gestion_comercios_espera.js`, `gestion_consumidores.js`, `solicitudesComercios.js`, `mis_datos_consumidor.js`, `mis_pedidos_consumidor.js`, `actualizar_prod.js` y `cierre_sesion_admin.js`. Cada copia tenía variaciones ligeramente diferentes:

- Tres variantes: jQuery simple, jQuery con botón de confirmación, y Vanilla JS puro.
- Gestión del foco al abrir el modal solo en `mis_pedidos_consumidor.js`.
- Soporte de la tecla Escape solo en algunas versiones.
- Colores e iconos del botón confirm distintos en cada archivo.

**Impacto:** cualquier cambio en el comportamiento del modal exige editar 9 ficheros, con alto riesgo de introducir inconsistencias.

**Resolución:** Fase 1 — `optimizacion-showModal-utils.md`

#### A2 — Mezcla de jQuery y Vanilla JS sin criterio — Prioridad ALTA

Tres archivos usaban Vanilla JS (`document.addEventListener`, `fetch`, `document.querySelector`, `document.createElement`, `innerHTML`) mientras el resto del proyecto usaba jQuery. Concretamente:
- `validacion_registro.js`: Vanilla JS completo
- `formulario_contacto_comercio.js`: Vanilla JS completo
- `validacion_productos.js`: Vanilla JS completo
- `solicitudesComercios.js`: `$(document).ready` de jQuery pero interior con `async/await`, `fetch` y DOM nativo
- `evitar_atras.js`: Vanilla JS puro con URL del backend hardcodeada
- `carga_comercios_activos.js`: jQuery + `showModal` local que nunca se eliminó en refactors anteriores

**Impacto:** dificultad de mantenimiento al mezclar dos paradigmas; `evitar_atras.js` tenía la URL del backend hardcodeada a `localhost:8080` en lugar de usar `API_BASE` de `config.js`.

**Resolución:** Fase 2 — `optimizacion-jquery-unificado.md`

#### A3 — `console.log` y `console.error` en código de producción — Prioridad ALTA

Se encontraron llamadas a `console` en `login.js` (exponiendo datos de respuesta del servidor), `gestion_comercios_espera.js` (exponiendo texto de respuesta de error) y `preinfo_producto.js` (dos `console.error` que dejaban errores silenciosos sin feedback al usuario).

**Impacto:** exposición de información sensible en la consola del navegador; errores que el usuario no puede ver ni entender.

**Resolución:** Fase 4 — `estudio-gestion-console-logs.md`

#### A4 — Estilos inline en JavaScript — Prioridad MEDIA

Varios archivos aplicaban estilos directamente con `.css()` de jQuery en lugar de clases CSS:
- `login.js`, `validacion_registro.js`, `formulario_contacto_comercio.js`, `validacion_productos.js`: `input.css('border', '2px solid red')` para marcar campos inválidos.
- `utils.js` (tras Fase 1): `.css({ 'background-color', 'color', 'border', 'padding', ... })` sobre el botón de confirmación del modal.
- `gestion_comercios_espera.js`, `carga_comercios_activos.js`, `solicitudesComercios.js`, `listado_productos.js`: `style="text-align:center; ..."` en strings HTML inyectadas.

**Impacto:** mezcla de responsabilidades (presentación en la capa de comportamiento); estilos con máxima especificidad que no pueden sobreescribirse desde CSS; cambios de diseño requieren tocar archivos JS.

**Resolución:** Fase 3 — `optimizacion-estilos-inline.md`

---

### Categoría B — Estructura CSS

#### B1 — Sin sistema de diseño: valores de color, fuente y radio duplicados en 14 archivos — Prioridad ALTA

Los valores concretos del diseño aparecían como literales en cada regla CSS:
- `#06314C` (azul primario): en 4+ archivos
- `#7a0c00` (rojo corporativo): en 7+ archivos
- `Railway, sans-serif` (nombre incorrecto de la fuente, debería ser `Raleway`): en 5 archivos
- `100px`, `50px` (radios de borde): repetidos sin sistema

**Impacto:** cambiar la paleta de color del proyecto exige editar decenas de líneas en múltiples archivos; el typo en el nombre de la fuente hacía que el navegador cayera al sans-serif del sistema en todos los navegadores.

**Resolución:** Fase 5 — `optimizacion-main-css.md`

#### B2 — Bloque del modal duplicado en 5 archivos CSS — Prioridad ALTA

El bloque completo de `.modal`, `.modal-content`, `.close-button` y `.error-list` estaba copiado en `incio_sesion.css`, `registro.css`, `formulario_contacto_comercios.css`, `alta_productos.css` y `mis_datos_consumidor.css`, con inconsistencias entre copias (`.close-button` con `float: right` en `registro.css` además de `align-self: flex-end`, generando conflicto en un contenedor flex).

**Resolución:** Fase 5 — `optimizacion-main-css.md`

#### B3 — Header, footer y body duplicados entre `estructura.css` e `incio_sesion.css` — Prioridad ALTA

`estructura.css` definía los tres elementos base. `incio_sesion.css` los redefinía idénticos (copia línea por línea). Dos fuentes de verdad para los mismos selectores.

**Resolución:** Fase 5 — `optimizacion-main-css.md`

#### B4 — `.form-grid`, `.comercio-row`, `.btn-icon` y otros patrones duplicados en 3+ archivos — Prioridad MEDIA

`.form-grid` y sus hijos en `registro.css`, `alta_productos.css` y `mis_datos_consumidor.css`. `.comercio-row`, `.btn-icon`, `.tabla-header` y `.pagination-container` en `gestion_comercio_alta_admin.css`, `dashboard_validador.css` y `listado_productos.css`.

**Resolución:** Fase 5 — `optimizacion-main-css.md`

#### B5 — Typo en nombre de archivo CSS — Prioridad BAJA

`incio_sesion.css` (falta la `i` de `inicio`). El archivo existía con ese nombre y todas las referencias usaban el nombre erróneo. Se decidió mantener el nombre para no romper referencias, documentando el typo.

---

### Categoría C — Estructura HTML

#### C1 — Header y footer copiados en los 16 HTML sin mecanismo de reutilización — Prioridad MEDIA

El footer (idéntico en las 16 páginas) y el header (con tres variantes: páginas públicas, dashboards con perfil, validador) se copian manualmente en cada HTML. No existe ningún mecanismo de inclusión de fragmentos.

**Análisis de viabilidad:** el stack (PHP + HTML estático sin build) impide una solución limpia sin cambios arquitecturales. Documentado en `analisis-reutilizabilidad-header-footer.md`.

#### C2 — IDs duplicados en la misma página — Prioridad ALTA

`inicio_sesion.html` tenía `id="logo"` en dos elementos distintos: el logo corporativo del header y el icono de la sección de login. Los IDs deben ser únicos en un documento HTML; la duplicación provoca comportamiento indefinido en JavaScript (`getElementById` retorna solo el primero) y accesibilidad rota.

**Resolución:** corregido durante la actualización de los HTML en la Fase 5.

#### C3 — Typo en ruta de imagen del logo — Prioridad ALTA

Todos los HTML referenciaban `src="imagenes/logo .png"` (con espacio antes de `.png`). El archivo existe con ese nombre en el servidor, por lo que funcionaba, pero es un nombre de archivo no válido según las convenciones web y puede causar problemas en algunos servidores o herramientas de build. Se documenta como deuda técnica; no se renombra para no romper el servidor sin coordinar con el equipo.

#### C4 — Sin metadatos SEO ni favicon — Prioridad BAJA

Ninguna página tiene `<meta name="description">`, `<meta property="og:title">` ni `favicon.ico`. Los títulos de algunas páginas eran genéricos (`Logging` en `inicio_sesion.html`). Deuda técnica documentada, no corregida en esta fase por estar fuera del alcance de la optimización de rendimiento/mantenibilidad.

---

### Categoría D — Rendimiento

#### D1 — jQuery cargado desde CDN externo en todas las páginas — Prioridad MEDIA

JQuery 3.6.0 se carga desde `code.jquery.com` en cada página mediante `<script>` síncrono, bloqueando el render. Algunas páginas no necesitaban jQuery (usaban Vanilla JS). Tras la Fase 2 (unificación en jQuery), todas las páginas con JS lo usan, por lo que la carga está justificada. Mejora pendiente: añadir `defer` al tag `<script>`.

#### D2 — Sin minificación ni bundling — Prioridad BAJA

Los 17 JS y 14 CSS se sirven sin minificar. Mejora posible con un paso de build (esbuild, vite), pero fuera del alcance del TFG por requerir cambios en la infraestructura de despliegue.

#### D3 — Imágenes sin optimización ni lazy loading — Prioridad BAJA

No se usa formato WebP y no se aplica `loading="lazy"` a imágenes que no están en el primer render. Deuda técnica documentada.

---

## 4. Resumen de prioridades

| ID | Problema | Prioridad | Estado |
|---|---|---|---|
| A1 | `showModal` duplicada en 9 archivos | Alta | Resuelto — Fase 1 |
| A2 | Mezcla jQuery / Vanilla JS | Alta | Resuelto — Fase 2 |
| A3 | `console.log` en producción | Alta | Resuelto — Fase 4 |
| A4 | Estilos inline en JS | Media | Resuelto — Fase 3 |
| B1 | Sin variables CSS globales | Alta | Resuelto — Fase 5 |
| B2 | Modal duplicado en 5 CSS | Alta | Resuelto — Fase 5 |
| B3 | Header/footer duplicados en CSS | Alta | Resuelto — Fase 5 |
| B4 | Patrones de componentes duplicados | Media | Resuelto — Fase 5 |
| B5 | Typo en nombre de archivo CSS | Baja | Documentado, no corregido |
| C1 | Header/footer no reutilizables en HTML | Media | Analizado — no implementado (ver justificación) |
| C2 | IDs duplicados en HTML | Alta | Resuelto — Fase 5 |
| C3 | Typo en ruta de imagen | Alta | Documentado, pendiente coordinación |
| C4 | Sin metadatos SEO | Baja | Documentado, fuera de alcance |
| D1 | jQuery desde CDN sin defer | Media | Documentado, pendiente |
| D2 | Sin minificación | Baja | Documentado, fuera de alcance |
| D3 | Imágenes sin optimizar | Baja | Documentado, fuera de alcance |
