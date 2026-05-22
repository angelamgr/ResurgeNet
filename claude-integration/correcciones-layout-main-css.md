# Correcciones de layout tras la creación de main.css

**Fecha:** 2026-05-22  
**Autor:** Claude (asistente IA)  
**Tarea:** Fase 5b — corrección de regresiones visuales detectadas tras el refactor CSS

---

## 1. Contexto

Tras crear `main.css` en la Fase 5, se detectaron cuatro tipos de regresiones visuales en el navegador:

1. La **landing page** quedó desestructurada: el banner azul se cortaba a 80px de alto, dejando la imagen y los textos solapados.
2. El **nombre de rol** ("Administrador", "Consumidor", etc.) aparecía encima de la foto de perfil en el header de los dashboards.
3. Los **formularios** (login, registro, alta de productos, mis datos) mostraban botones desplazados o mal posicionados.
4. El **botón base** de `main.css` —con `position: absolute` heredado del header— se aplicaba incorrectamente a todos los botones de la página, desplazándolos fuera de su contenedor.

---

## 2. Análisis de causa raíz

### Causa A — `height: 80px` fijo en `.encabezado2`

El CSS original de `landing.css` tenía:
```css
.encabezado2 { height: 80px; ... }
```
La banda del encabezado contiene una imagen de 200px de alto y dos columnas de texto con `h2` y `h3`. Con `height: 80px` el contenedor no tenía espacio para su contenido y el desbordamiento no era visible (no había `overflow: visible` explícito en el contexto original). Al añadir `box-sizing: border-box` en el reset de `main.css`, el modelo de caja cambió y el desbordamiento quedó expuesto.

**Solución:** Sustituir `height: 80px` por `min-height: 240px` y `padding: 20px 30px`, permitiendo que el contenedor crezca con su contenido.

### Causa B — Posicionamiento del icono y nombre de usuario en el header

El header original en `estructura.css` no tenía `position: relative`, por lo que los elementos con `position: absolute` se anclaban al `<body>`. Al añadir `position: relative` al header en `main.css`, los porcentajes `top: 4.3%`, `top: 2%`, `top: 11%` y `top: 6.7%` pasaron a calcularse sobre la altura del propio header (~90px) en lugar del viewport. Esto hizo que `header p` (el nombre de rol) con `top: 11%` quedara casi en el mismo pixel que `header img#admin-icon` con `top: 2%`.

**Solución:** Sustituir los porcentajes frágiles por posicionamiento con `top: 50% + transform: translateY(-50%)` para centrar verticalmente el icono, y `top: calc(50% + 32px)` para colocar el nombre exactamente debajo del icono, independientemente de la altura del header.

```css
/* Antes — frágil, depende de la altura del viewport */
header img#admin-icon { top: 2%; left: 90%; }
header p             { top: 11%; left: 90%; }

/* Después — robusto, relativo al propio header */
header img#admin-icon {
    top: 50%; right: 3%; left: auto;
    transform: translateY(-50%);
}
header p {
    top: calc(50% + 32px); right: 3%; left: auto;
    font-size: 0.8rem; width: 80px; margin: 0;
}
```

### Causa C — El botón base aplicaba `position: absolute` a todos los botones

El CSS original de `estructura.css` solo estilizaba `header button` (botón dentro del header). Al crear `main.css` se generalizó la regla a `button`, añadiendo `position: absolute` y `transform` como parte del posicionamiento del botón del header. Esto desplazaba todos los botones de la página (submit de formularios, botones de listas, paginación, cierre de sesión) a `position: absolute` y los sacaba de su flujo normal.

**Solución:** Acotar el botón posicionado exclusivamente al header mediante selectores específicos:

```css
/* Solo el botón directamente dentro del header o dentro de un <a> dentro del header */
header > a > button,
header > button {
    position: absolute;
    top: 50%;
    right: 3%;
    transform: translateY(-50%);
    ...
}
```

Además, en cada CSS de página donde había botones con comportamiento diferente al base, se añade `position: static !important; transform: none !important;` para garantizar que el flujo normal no se vea afectado por herencia inesperada.

### Causa D — Formularios tapados por el footer fijo

El footer tiene `position: fixed; bottom: 0`, lo que lo superpone sobre el contenido de la página. En el proyecto original, los formularios y listas tenían espacio suficiente porque sus contenedores eran más cortos. Con el nuevo layout más preciso, el footer comenzó a tapar la parte inferior de algunos formularios.

**Solución:** Añadir `padding-bottom: 80px` a los contenedores principales de cada página con footer fijo:
- `incio_sesion.css` → `.form-container { padding-bottom: 80px }`
- `registro.css` → `.form-container { padding-bottom: 80px }`
- `alta_productos.css` → `.form-container { padding: 0 20px 80px 20px }`
- `mis_datos_consumidor.css` → `.form-container { padding: 0 20px 80px 20px }`
- `formulario_contacto_comercios.css` → `.form-container { margin-bottom: 100px }`
- `gestion_cons_comer_admin.css` → `.form-container { margin-bottom: 80px }`
- `mis_pedidos_consumidor.css` → `.form-container { padding-bottom: 80px }`
- `landing.css` → `.servicios { margin-bottom: 60px }`

---

## 3. Relación completa de archivos corregidos

| Archivo | Correcciones aplicadas |
|---|---|
| `frontend/style/main.css` | Header con `min-height: 90px`, `display: flex`, `align-items: center`; icono y nombre de rol con `top: 50%` + `transform`; botón del header acotado a `header > a > button` y `header > button`; `.close-button` con `background: none !important` para no heredar el rojo base; `.btn-icon` con `border-radius: 0 !important` y `padding: 0` |
| `frontend/style/landing.css` | `.encabezado2`: `height: 80px` → `min-height: 240px`; `.servicios`: `height: 220px` → `min-height: 220px` + `align-items: stretch`; `margin-bottom: 60px` para evitar footer |
| `frontend/style/admin_dashboard.css` | `.sidebar top` ajustado a `90px`; `.toggle-btn` con `background-color: var(--color-primary) !important` y `border-radius: 4px !important` para no heredar el pill base; `#logout-btn` con margen propio |
| `frontend/style/incio_sesion.css` | `padding-bottom: 80px`; botón de submit con `position: static; transform: none` |
| `frontend/style/registro.css` | `padding-bottom: 80px`; botón de submit con `position: static; transform: none` |
| `frontend/style/alta_productos.css` | `padding-bottom: 80px`; botón guardar con `position: static; transform: none` |
| `frontend/style/mis_datos_consumidor.css` | `padding-bottom: 80px`; botón guardar con `position: static; transform: none` |
| `frontend/style/formulario_contacto_comercios.css` | `margin-bottom: 100px`; `.btn-submit` con `position: static !important; transform: none !important`; labels con `color: var(--color-white)` restaurado |
| `frontend/style/gestion_cons_comer_admin.css` | `margin-bottom: 80px`; `.btn-alta` y `.btn-eliminar` con `position: static !important; border-radius: var(--radius-btn-sm) !important` |
| `frontend/style/mis_pedidos_consumidor.css` | `.nav-item` con `position: static !important; transform: none !important; background: none !important` para no heredar el fondo rojo del botón base |

---

## 4. Lección aprendida — diseño del botón base

El error de raíz fue definir `button { ... position: absolute }` en la regla base. Un reset de botón global nunca debe incluir posicionamiento; el posicionamiento es siempre específico del contexto.

La regla correcta para futuros añadidos es:

```css
/* En main.css: solo tipografía, color y forma — nunca posición */
button {
    font-family: var(--font-main);
    background-color: var(--color-accent);
    color: var(--color-white);
    border: none;
    padding: 10px 20px;
    border-radius: var(--radius-pill);
    cursor: pointer;
    font-size: 16px;
}

/* El posicionamiento, siempre en el selector específico */
header > a > button,
header > button {
    position: absolute;
    top: 50%;
    right: 3%;
    transform: translateY(-50%);
}
```

Cualquier botón nuevo que necesite comportamiento visual diferente al base debe sobreescribir solo las propiedades necesarias en su CSS de página, nunca asumir que heredará un posicionamiento neutro.
