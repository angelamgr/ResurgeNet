# Optimización: creación de `main.css` y centralización de estilos globales

**Fecha:** 2026-05-22  
**Autor:** Claude (asistente IA)  
**Tarea:** Fase 5 de optimización del frontend — crear una base CSS global con variables y eliminar duplicaciones entre hojas de estilo

---

## 1. Contexto y problema

Antes de esta tarea, el frontend de ResurgeNet tenía 14 archivos CSS con un problema estructural grave: **los mismos bloques de código aparecían copiados en múltiples archivos**, y los valores concretos del diseño (colores, fuentes, radios de borde) estaban escritos directamente como literales en cada regla, sin ningún punto centralizado de control.

Esto generaba tres consecuencias directas:

**Problema 1 — Sin sistema de diseño.** El color primario `#06314C` aparecía en `estructura.css`, `incio_sesion.css`, `admin_dashboard.css` y `landing.css`. El rojo corporativo `#7a0c00` estaba en al menos 7 archivos. Cambiar la paleta de color del proyecto requería editar decenas de líneas repartidas por todo el frontend.

**Problema 2 — Modal duplicado en 5 archivos.** El bloque completo de `.modal`, `.modal-content`, `.close-button` y `.error-list` estaba copiado íntegro en `incio_sesion.css`, `registro.css`, `formulario_contacto_comercios.css`, `alta_productos.css` y `mis_datos_consumidor.css`. Cada copia tenía ligeras inconsistencias (en `registro.css` el `.close-button` tenía `float: right` además de `align-self: flex-end`, por ejemplo).

**Problema 3 — Header y footer duplicados.** `estructura.css` definía `header`, `footer` y `body`. `incio_sesion.css` los redefinía exactamente iguales (copiados línea por línea). Existían como dos fuentes de verdad para los mismos elementos.

**Problema 4 — Patrones de componentes duplicados.** `.form-grid` y sus hijos aparecían casi idénticos en `registro.css`, `alta_productos.css` y `mis_datos_consumidor.css`. `.comercio-row`, `.btn-icon` y `.pagination-container` estaban copiados en `gestion_comercio_alta_admin.css`, `dashboard_validador.css` y `listado_productos.css`.

---

## 2. Inventario de duplicaciones antes de la refactorización

| Bloque CSS | Archivos donde aparecía | Inconsistencias detectadas |
|---|---|---|
| `header` + `footer` + `body` | `estructura.css`, `incio_sesion.css` | Idénticos, pura copia |
| `.modal` + `.modal-content` + `.close-button` + `.error-list` | `incio_sesion.css`, `registro.css`, `formulario_contacto_comercios.css`, `alta_productos.css`, `mis_datos_consumidor.css` | `close-button` con `float:right` en `registro.css`; `.error-list li` sin `.error-list li strong` en `alta_productos.css` y `mis_datos_consumidor.css` |
| `button { background-color: #7a0c00 }` | `estructura.css`, `admin_dashboard.css`, `landing.css`, `incio_sesion.css`, `registro.css`, `gestion_cons_comer_admin.css` + más | Algunos con `font-family`, otros sin él; distintos `font-size` |
| `.form-grid` + `.form-grid label` + `.form-grid input` | `registro.css`, `alta_productos.css`, `mis_datos_consumidor.css` | `label width` diferente en cada uno (150px, 120px, 140px) |
| `.comercio-row` + `.btn-icon` + `.btn-icon span` | `gestion_comercio_alta_admin.css`, `dashboard_validador.css`, `listado_productos.css` | Idénticos en estructura, con ligeras variaciones en `listado_productos.css` |
| `.tabla-header` + `.header-label` + `.pagination-container` | `gestion_comercio_alta_admin.css`, `dashboard_validador.css`, `listado_productos.css` | Idénticos |
| `#06314C` (color primario) | `estructura.css`, `incio_sesion.css`, `admin_dashboard.css`, `landing.css` | — |
| `#7a0c00` (rojo corporativo) | 7+ archivos | — |
| `#5089A5` / `#5b8da5` (azul medio) | `admin_dashboard.css`, `incio_sesion.css`, `landing.css`, `gestion_cons_comer_admin.css`, `mis_pedidos_consumidor.css` | Dos variantes del mismo azul sin criterio claro |
| `Railway, sans-serif` | `estructura.css`, `incio_sesion.css`, `admin_dashboard.css`, `landing.css`, `formulario_contacto_comercios.css` | Nombre incorrecto (debería ser Raleway) |

---

## 3. Solución adoptada: `main.css`

Se crea el archivo `frontend/style/main.css` como **única hoja de estilos base** del proyecto. Contiene diez secciones:

### Sección 1 — Variables CSS (`:root`)

El cambio más importante de toda la tarea. Se definen variables CSS nativas para todos los valores que antes eran literales repetidos:

```css
:root {
    --color-primary:      #06314C;   /* Azul oscuro — header, footer, toggle */
    --color-primary-mid:  #5089A5;   /* Azul medio — sidebar, fondos de card */
    --color-primary-card: #5b8da5;   /* Azul card — variante ligeramente diferente */
    --color-accent:       #7a0c00;   /* Rojo corporativo — botones de acción */
    --color-accent-hover: #5a0900;   /* Rojo oscuro — hover */
    --color-bg:           #d2e3ee;   /* Fondo de página */
    --color-white:        #ffffff;
    --color-text-dark:    #333333;
    --color-text-black:   #000000;
    --color-border:       #ddd;
    --font-main:          Raleway, sans-serif;
    --radius-pill:        100px;
    --radius-input:        50px;
    --radius-card:         15px;
    --radius-card-lg:      40px;
    --radius-modal:        12px;
    --radius-btn-sm:       20px;
    --shadow-card:  0 4px 15px rgba(0, 0, 0, 0.1);
    --shadow-modal: 0 10px 25px rgba(0, 0, 0, 0.3);
    --shadow-btn:   0 4px 6px rgba(0, 0, 0, 0.1);
}
```

A partir de ahora, para cambiar el color primario del proyecto basta con editar `--color-primary` en un único lugar. El cambio se propaga automáticamente a todos los elementos que usan esa variable.

Se aprovecha también para **corregir el nombre de la fuente**: en todos los archivos originales se usaba `Railway, sans-serif`, que no existe — la fuente correcta es `Raleway`. La variable `--font-main: Raleway, sans-serif` corrige esto en todos los usos de una sola vez.

### Sección 2 — Reset mínimo y base

```css
*, *::before, *::after { box-sizing: border-box; }
body { background-color: var(--color-bg); font-family: var(--font-main); margin: 0; }
main { text-align: center; }
```

`box-sizing: border-box` es una práctica estándar moderna: hace que `padding` y `border` se incluyan dentro del ancho declarado, evitando desbordamientos inesperados. Estaba ausente en el proyecto original.

### Sección 3 y 4 — Header y footer

Absorben completamente `estructura.css`, que queda vacío (pero mantenido como archivo para no romper hipotéticas referencias externas). El header incluye ahora `position: relative` de base, que faltaba en `estructura.css` pero era necesario para que los `position: absolute` de los elementos hijos funcionaran correctamente.

### Sección 5 — Botón base

Definición única del estilo base de `<button>`. Antes estaba en 6+ archivos con variaciones. Los CSS de página sobreescriben solo lo que necesitan cambiar (por ejemplo, `gestion_cons_comer_admin.css` sobreescribe el `border-radius` para los botones de lista).

### Sección 6 — Modal (definición única)

El bloque completo del modal — `.modal`, `.modal-content`, `.modal-content h3`, `.close-button`, `.error-list`, `.error-list li`, `.error-list li strong`, y la variante `.modal-success` — se define una sola vez aquí. Se toma la versión más completa y correcta (la de `admin_dashboard.css`) y se eliminan las otras cinco copias de los CSS de página.

### Sección 7 — `.form-grid` base

El grid de formularios se define con el `label width` de 130px como valor base. Los CSS de página que necesitan un ancho diferente lo sobreescriben en una sola línea:

```css
/* registro.css */
.form-grid label { width: 150px; }

/* mis_datos_consumidor.css */
.form-grid label { width: 140px; }
```

En lugar de redefinir todo el bloque `.form-grid` completo (25+ líneas) en cada archivo.

### Sección 8 — Filas píldora de listas de gestión

`.comercio-row`, `.comercio-nombre`, `.acciones`, `.btn-icon`, `.btn-icon span`, `.btn-icon:hover` y `.pagination-container` se definen aquí. Los tres CSS que los usaban (gestión alta, validador, listado productos) pasan a contener solo los colores e iconos específicos de sus botones de acción.

### Sección 9 — Tabla header de listas

`.tabla-header` y `.header-label` se extraen aquí. `dashboard_validador.css` sobreescribe `.tabla-header` con `justify-content: flex-start` (porque su cabecera tiene una columna de motivo que necesita alineación diferente).

### Sección 10 — Utilidades

`.sr-only` (accesibilidad) y `main { text-align: center }`, antes en `admin_dashboard.css`.

---

## 4. Qué queda en cada CSS de página

| Archivo CSS | Contenido tras la refactorización |
|---|---|
| `estructura.css` | Vacío (mantenido por compatibilidad) |
| `admin_dashboard.css` | Solo sidebar y toggle-btn |
| `incio_sesion.css` | Solo la tarjeta azul de login y sus inputs |
| `registro.css` | Solo `.form-container` con padding lateral; `label width: 150px`; margen del botón |
| `landing.css` | Solo `.encabezado2` y `.servicios` con sus secciones |
| `formulario_contacto_comercios.css` | Solo el grid de dos columnas específico de este formulario, el `.btn-submit` y el select con flecha SVG |
| `alta_productos.css` | Solo el `#altaProduForm` con fondo semitransparente y el botón de submit centrado |
| `mis_datos_consumidor.css` | Solo el `#misDatosForm` con fondo semitransparente; `label width: 140px` |
| `gestion_cons_comer_admin.css` | Solo `.form-container` azul, `.grid-comercios`, `.caja-blanca`, `.botones-acciones` y botones `.btn-alta`/`.btn-eliminar` |
| `gestion_comercio_alta_admin.css` | Solo colores e iconos de `.btn-activar`, `.btn-desactivar`, `.btn-eliminar`, `.btn-editar` y `.btn-disabled` |
| `dashboard_validador.css` | Solo sobreescritura de `.tabla-header` para alineación izquierda; columna `.motivo-solicitud`; botones `.btn-aceptar`/`.btn-denegar`; posición del `#logout-btn` |
| `listado_productos.css` | Solo el `.btn-editar` con `all: unset` y margen negativo específico de esta página |
| `mis_pedidos_consumidor.css` | Solo tabla semántica de pedidos, `.main-card`, `.nav-item` y `.nav-disabled` |
| `components.css` | Sin cambios: estados dinámicos de JS (`input-error`, `input-ok`, modal confirm, lista vacía) |

---

## 5. Actualización de los HTMLs

Todos los HTML del frontend (16 en total) fueron actualizados para reflejar el nuevo orden de carga:

```html
<!-- Antes -->
<link rel="stylesheet" href="style/estructura.css" />
<link rel="stylesheet" href="style/admin_dashboard.css" />

<!-- Después -->
<link rel="stylesheet" href="style/main.css" />
<link rel="stylesheet" href="style/components.css" />
<link rel="stylesheet" href="style/admin_dashboard.css" />
```

Los HTMLs que no tenían `components.css` (como `formulario_contacto_comercios.html`) lo recibieron en esta actualización, cerrando la deuda pendiente de la Fase 3.

Páginas actualizadas: `index.html`, `inicio_sesion.html`, `registro_consumidores.html`, `formulario_contacto_comercios.html`, `admin_dashboard.html`, `comercio_dashboard.html`, `consumidor_dashboard.html`, `gestion_comercios_admin_espera.html`, `gestion_comercios_alta_admin.html`, `gestion_consumidores_admin.html`, `dashboard_validador.html`, `alta_productos.html`, `actualizar_producto.html`, `listado_productos_comercio.html`, `mis_datos_consumidor.html`, `mis_pedidos_consumidor.html`.

---

## 6. Correcciones adicionales aplicadas durante el proceso

**Typo en `font-family`:** Todos los archivos usaban `Railway, sans-serif`. La fuente correcta es `Raleway`. Corregido en la variable `--font-main` de `main.css`, propagándose a todos los usos.

**`position: relative` en `header`:** Faltaba en `estructura.css` original, lo que hacía que los `position: absolute` de los hijos (logo, botón) funcionaran referenciados al `<body>` en lugar del `<header>`. Añadido en `main.css`.

**`box-sizing: border-box` global:** Ausente en el proyecto. Añadido en el reset de `main.css` siguiendo la práctica estándar moderna.

**Incosistencia en `.close-button`:** En `registro.css` tenía `float: right` además de `align-self: flex-end`, lo que causaba conflicto en un contexto flex. En `main.css` solo permanece `align-self: flex-end`, que es la propiedad correcta para un contenedor `flex-direction: column`.

**`gap: 20 px`:** `gestion_comercio_alta_admin.css` y `listado_productos.css` tenían un espacio erróneo dentro del valor (`20 px` en lugar de `20px`), haciendo que el `gap` fuera inválido y se ignorara. Corregido en `main.css` como `gap: 20px`.

---

## 7. Cómo usar el sistema de variables en el futuro

Para cualquier nuevo CSS de página o componente, se deben usar las variables de `main.css` en lugar de valores literales:

```css
/* MAL — valor literal */
.mi-componente { background-color: #06314C; border-radius: 100px; }

/* BIEN — variable */
.mi-componente { background-color: var(--color-primary); border-radius: var(--radius-pill); }
```

Si se necesita un nuevo color o valor de diseño que no existe en `:root`, añadirlo allí primero antes de usarlo. Nunca añadir literales de color o radio directamente en los CSS de página salvo que sean valores únicos y locales sin posibilidad de reutilización.

---

## 8. Commits realizados

| SHA | Descripción |
|---|---|
| `914821a` | Creación de `main.css` con variables globales y base compartida |
| `ac8fbbf` | Limpieza de CSS de páginas simples (estructura, incio_sesion, registro, landing, formulario) |
| `e0482f9` | Limpieza de CSS de páginas de gestión; uso de variables de main.css |
| `86a0ef0` | Sustitución de `estructura.css` por `main.css` en páginas públicas |
| `141a03d` | Sustitución de `estructura.css` por `main.css` en todos los dashboards y páginas de gestión |
