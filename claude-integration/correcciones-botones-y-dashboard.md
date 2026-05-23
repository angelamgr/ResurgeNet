# Correcciones: botones sin estilo en landing y texto desalineado en dashboards

**Fecha:** 2026-05-23  
**Autor:** Claude (asistente IA)  
**Tarea:** Fase 5c — corrección de nuevas regresiones visuales detectadas en ronda de pruebas

---

## 1. Problemas reportados

Tras la Fase 5b (correcciones de layout), se detectaron dos nuevos problemas visuales mediante capturas de pantalla:

1. **Landing page (`index.html`):** los botones "Contactanos", "Ver listado", "Colaboradores" y "Registro" aparecían sin estilo — fondo blanco, sin color rojo corporativo, sin border-radius redondeado. Visualmente idénticos a un `<button>` HTML sin ningún CSS aplicado.

2. **Dashboards de administrador, comercio y consumidor:** el texto del `<main>` ("Panel de Administración", el párrafo de bienvenida) aparecía alineado a la izquierda y pegado al borde izquierdo de la pantalla, solapando visualmente con el botón hamburguesa del sidebar.

---

## 2. Análisis de causa raíz

### Causa A — Botón base global ausente en `main.css`

En la Fase 5b se corrigió el problema de que `button { position: absolute }` se aplicaba a todos los botones de la página. La solución aplicada fue acotar el botón con posicionamiento absoluto exclusivamente al header mediante selectores específicos (`header > a > button`, `header > button`). Sin embargo, en ese proceso **se eliminó involuntariamente la regla `button { background-color, color, border-radius, ... }` base global** de `main.css`.

Sin esa regla, los botones de la landing, los formularios y los dashboards no tenían ningún estilo CSS aplicado y mostraban el aspecto por defecto del navegador.

La regla que faltaba:
```css
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
```

Nota importante: esta regla es **independiente** de la regla de posicionamiento del botón del header. El error fue confundirlas y eliminar ambas cuando solo se debía eliminar el `position: absolute` de la regla genérica.

### Causa B — `main { text-align: center }` ausente en `main.css`

Igualmente durante la Fase 5b, la regla `main { text-align: center }` que centraba el contenido de los dashboards también desapareció del `main.css`. Sin ella, el `<main>` de los dashboards heredaba la alineación por defecto del navegador (`text-align: left`) y el contenido se pegaba al borde izquierdo.

### Causa C — Sin margen izquierdo en el `<main>` de los dashboards

El botón hamburguesa `.toggle-btn` tiene `position: fixed; left: 10px; top: 95px`, lo que lo superpone sobre el contenido del `<main>`. Al estar el texto alineado a la izquierda sin ningún `padding-left`, el título del panel aparecía literalmente debajo del botón hamburguesa. La solución es añadir `padding-left: 60px` al `<main>` en `admin_dashboard.css` para empujar el contenido a la derecha del toggle.

---

## 3. Solución aplicada

### En `main.css`

Se restauraron las dos reglas eliminadas inadvertidamente:

```css
/* Centrado del contenido principal */
main {
    text-align: center;
}

/* Boton base global */
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
```

El selector de posicionamiento del header permanece separado e intacto:
```css
header > a > button,
header > button {
    position: absolute;
    top: 50%;
    right: 3%;
    transform: translateY(-50%);
    /* ... resto de propiedades especificas del header */
}
```

### En `admin_dashboard.css`

Se añadió sobreescritura de `main` para los dashboards:

```css
main {
    padding-top: 20px;
    padding-left: 60px;  /* evita que el toggle-btn tape el contenido */
}
```

También se aclaró en comentario que `.toggle-btn` es un `<p>` en el HTML (no un `<button>`), por lo que no hereda el boton base y sus `!important` son innecesarios. Se simplificaron.

Además se añadió `position: static !important; transform: none !important` al `#logout-btn` del sidebar como medida preventiva, aunque el selector `header > button` no afecta a botones dentro de `<nav>`, para evitar regresiones futuras.

### En `landing.css`

Se añadió sobreescritura de `main` para la landing, ya que este página no quiere `text-align: center` global ni el `padding-left` de los dashboards:

```css
main {
    text-align: left;
    padding-left: 0;
}
```

Se documentaron con comentarios los motivos por los que los botones de `.servicios` y `.encabezado2` heredan el estilo base correctamente y solo necesitan `position: static !important` como precaución.

---

## 4. Archivos modificados

| Archivo | Cambio |
|---|---|
| `frontend/style/main.css` | Restauradas `button { ... }` base y `main { text-align: center }` |
| `frontend/style/admin_dashboard.css` | Añadido `main { padding-top, padding-left }` para evitar solapamiento con toggle; simplificados `!important` innecesarios en `.toggle-btn` |
| `frontend/style/landing.css` | Añadido `main { text-align: left; padding-left: 0 }` para sobreescribir el centrado global; añadidos comentarios explicativos sobre herencia de botones |

---

## 5. Criterio de diseño consolidado para `button` en ResurgeNet

Tras esta corrección, el sistema de estilos de botones queda definido de la siguiente forma:

| Nivel | Selector | Qué define | Dónde |
|---|---|---|---|
| Base global | `button` | Color rojo, tipografía, border-radius pill, padding | `main.css` |
| Header | `header > a > button`, `header > button` | Position absolute, top/right/transform | `main.css` |
| Modal | `.close-button` | Background none, sin radius pill | `main.css` |
| Listas de gestión | `.btn-icon` | Background none, sin radius, tamaño fijo | `main.css` |
| Sidebar | `#logout-btn` | Position static, ancho 80% | `admin_dashboard.css` |
| Toggle hamburguesa | `.toggle-btn` | Es un `<p>`, no hereda boton base; estilizado directamente | `admin_dashboard.css` |
| Formularios de contacto | `.btn-submit` | Position static forzado | `formulario_contacto_comercios.css` |
| Gestión listas | `.btn-alta`, `.btn-eliminar` | Border-radius pequeño, position static | `gestion_cons_comer_admin.css` |
| Paginación pedidos | `.nav-item` | Background none, position static | `mis_pedidos_consumidor.css` |

Cualquier botón nuevo que no aparezca en esta tabla heredará automáticamente el estilo rojo corporativo base. Si necesita comportamiento visual diferente, debe sobreescribir solo las propiedades necesarias en su CSS de página.
