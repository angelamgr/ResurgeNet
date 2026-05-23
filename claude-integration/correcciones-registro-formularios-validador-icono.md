# Correcciones: registro sin fondo, formularios estrechos, logout validador y tamaño icono

**Fecha:** 2026-05-23  
**Autor:** Claude (asistente IA)  
**Tarea:** Fase 5d — correcciones visuales detectadas en ronda de pruebas manual

---

## 1. Problemas reportados

1. **Formulario de registro sin fondo azul** — los campos aparecían sobre el fondo gris de la página sin la tarjeta azul que identifica los formularios del proyecto.
2. **Formularios de alta y actualización de productos demasiado estrechos** — el grid de dos columnas se comprimia y los inputs quedaban muy pequeños.
3. **Botón "Cerrar Sesión" del validador demasiado grande y muy abajo** — aparecía como una barra roja de ancho completo empujada hacia el final de la página, por debajo del contenido visible sin hacer scroll.
4. **Icono de perfil de usuario demasiado pequeño** — el CSS de `main.css` forzaba `width: 60px; height: 60px` sobreescribiendo los `width="100" height="100"` del atributo HTML.

---

## 2. Análisis y solución de cada problema

### Problema 1 — Registro sin fondo azul

**Causa:** `incio_sesion.css` definía el fondo azul con el selector `section.form-container > section`, que espera una `<section>` hija directa de `section.form-container`. Pero la estructura HTML de `registro_consumidores.html` es:

```html
<main>
  <section class="form-container">
    <form id="loginForm">   ← hijo directo es un <form>, no un <section>
```

El selector no coincidía y el fondo azul nunca se aplicaba.

**Solución:** Se trasladó el estilo del fondo azul al propio `registro.css` usando el selector correcto para la estructura real del HTML:

```css
/* registro.css */
.form-container > form {
    background-color: var(--color-primary-mid);
    color: var(--color-white);
    padding: 30px 40px;
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    width: 100%;
    max-width: 900px;
}
```

También se añadió `color: var(--color-white)` a `.form-grid label` dentro del registro para que las etiquetas sean legibles sobre el fondo azul.

---

### Problema 2 — Formularios de producto demasiado estrechos

**Causa:** `admin_dashboard.css` aplica `padding-left: 60px` al `<main>` para que el contenido no quede tapado por el botón hamburguesa fijo. Esto recortaba el ancho disponible del formulario. Con `max-width: 900px` en `#altaProduForm` y 60px ya consumidos por el padding, el formulario quedaba visiblemente estrecho en pantallas de 1400px o menos.

**Solución:** Se amplió el `max-width` de los formularios de producto de 900px a 1100px, compensando el padding consumido por el sidebar. Se aplicó el mismo cambio a `#misDatosForm` en `mis_datos_consumidor.css` por consistencia.

```css
/* alta_productos.css */
#altaProduForm {
    max-width: 1100px;  /* antes: 900px */
    padding: 30px 40px; /* padding horizontal aumentado también */
}
```

---

### Problema 3 — Botón cerrar sesión del validador

**Causa:** En `dashboard_validador.html` el `<button id="logout-btn">` está colocado directamente en el `<body>`, fuera de cualquier contenedor. Al heredar el botón base (`width` no definido, `display` block por contexto), ocupa el 100% del ancho de la página. El `margin-top: 130px` que tenía en el CSS anterior lo empuñaba lejos del contenido visible.

Esta página es especial: no tiene sidebar, por lo que el logout no puede ir dentro de un `<nav>`. La solución más limpia sin modificar el HTML es posicionarlo de forma fija en una esquina.

**Solución:** Se cambió a `position: fixed; bottom: 55px; right: 20px; width: auto` en `dashboard_validador.css`:

```css
#logout-btn {
    position: fixed;
    bottom: 55px;   /* justo encima del footer fijo (height ~40px + margen) */
    right: 20px;
    width: auto;
    padding: 10px 25px;
    z-index: 500;
    transform: none !important;
    top: auto !important;
}
```

El botón queda visible en la esquina inferior derecha, sin tapar el contenido y sin requerir scroll.

---

### Problema 4 — Icono de perfil demasiado pequeño

**Causa:** En `main.css`, la regla `header img#admin-icon` definía `width: 60px; height: 60px`. Los estilos CSS tienen prioridad sobre los atributos `width` y `height` del HTML, por lo que los `width="100" height="100"` del HTML se ignoraban. El resultado era un icono de 60px en lugar de los 80px que se tenían antes del refactor.

**Solución:** Se cambió a `width: 80px; height: 80px` en `main.css`. Con el header de `min-height: 90px` y el icono centrado verticalmente con `top: 50%; transform: translateY(-50%)`, un icono de 80px encaja con 5px de margen superior e inferior, sin necesidad de agrandar el header.

También se actualizaron las coordenadas del nombre de rol para que siga apareciendo justo debajo del icono más grande:

```css
header p {
    top: calc(50% + 42px); /* antes: calc(50% + 32px), ajustado a icono de 80px */
}
```

---

## 3. Archivos modificados

| Archivo | Cambio |
|---|---|
| `frontend/style/main.css` | `admin-icon`: 60px → 80px; `header p top`: +42px en lugar de +32px |
| `frontend/style/registro.css` | Añadido fondo azul en `.form-container > form`; labels en blanco; padding ajustado |
| `frontend/style/alta_productos.css` | `max-width`: 900px → 1100px; `padding` horizontal aumentado |
| `frontend/style/mis_datos_consumidor.css` | `max-width`: 900px → 1100px por consistencia |
| `frontend/style/dashboard_validador.css` | `#logout-btn`: `position: fixed; bottom: 55px; right: 20px; width: auto` |
| `frontend/style/admin_dashboard.css` | Añadido `padding-right: 20px` al `main` para simetría |
