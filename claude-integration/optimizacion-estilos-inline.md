# Optimización: eliminación de estilos inline del JavaScript

**Fecha:** 2026-05-20  
**Autor:** Claude (asistente IA)  
**Tarea:** Fase 3 de optimización del frontend — separar presentación y lógica eliminando `.css()` inline del JS

---

## Contexto y problema

Uno de los principios fundamentales del desarrollo web es la **separación de responsabilidades**: el HTML define la estructura, el CSS define la presentación y el JavaScript define el comportamiento. Cuando el JS aplica estilos directamente mediante `.css()` de jQuery o atributos `style="..."` en strings HTML inyectadas, se viola este principio y se generan varios problemas:

- Los estilos quedan **repartidos entre dos lugares** (CSS y JS), dificultando encontrar el origen de un estilo concreto.
- **Cambiar el diseño** de un componente requiere modificar archivos JS, lo que no es responsabilidad del diseñador.
- Los estilos inline **tienen máxima especificidad CSS**, lo que hace muy difícil sobreescribirlos desde una hoja de estilos.
- Los strings HTML generados dinámicamente con `style="..."` son **más difíciles de leer y mantener** que los que usan clases semánticas.

Tras revisar los 17 archivos JS del frontend, se identificaron **cuatro categorías** de estilos inline que requerían corrección.

---

## Inventario de estilos inline detectados

### Categoría 1 — Validación de formularios

Presente en: `login.js`, `validacion_registro.js`, `formulario_contacto_comercio.js`, `validacion_productos.js`.

Cada archivo aplicaba bordes de colores directamente sobre los inputs para indicar estado de error o estado correcto:

```javascript
// Estado de error (borde rojo)
input.css('border', '2px solid red');

// Estado correcto / reset (borde gris)
input.css('border', '1px solid #ddd');
```

El mismo par de valores estaba **duplicado en 4 archivos distintos**, con el riesgo adicional de que si el color o el grosor cambiaban, habría que modificarlos en todos.

### Categoría 2 — Botón de confirmación del modal

Presente en: `utils.js`.

El botón `#modal-confirm-btn` recibía todos sus estilos base mediante un objeto `.css()` en cada llamada:

```javascript
btnConfirm.show().text(confirmText).css({
    'background-color': confirmColor,
    'color':            'white',
    'border':           'none',
    'padding':          '10px 20px',
    'margin-top':       '15px',
    'cursor':           'pointer',
    'border-radius':    '4px',
    'width':            '100%'
});
```

De estas propiedades, siete son **estáticas** (no cambian entre llamadas) y solo `background-color` es dinámica porque varía según la acción (verde para activar, rojo para eliminar, azul para confirmar).

### Categoría 3 — Color del título del modal según tipo

Presente en: `utils.js`.

El color del `<h3>` del modal se asignaba mediante un objeto de colores y `.css()`:

```javascript
var colors = { success: '#155724', confirm: '#856404', error: '#a94442' };
modalTitle.css('color', colors[type] || colors.error);
```

Esto era innecesario porque `utils.js` ya añade la clase `modal-error`, `modal-success` o `modal-confirm` al contenedor `#errorModal`, lo que permite dirigir el color del h3 desde CSS con selectores descendientes sin ningún JS.

### Categoría 4 — Mensajes de lista vacía con `style` inline en strings HTML

Presente en: `gestion_comercios_espera.js`, `carga_comercios_activos.js`, `solicitudesComercios.js`, `listado_productos.js`.

Cada archivo inyectaba párrafos de «no hay datos» con estilos embebidos directamente en el string:

```javascript
// gestion_comercios_espera.js
contenedor.append('<p style="text-align:center; width:100%;">No hay comercios pendientes.</p>');

// carga_comercios_activos.js
contenedor.append('<p style="text-align:center; padding:20px;">No hay comercios registrados.</p>');

// solicitudesComercios.js
container.append('<p style="text-align:center; padding:20px;">No hay solicitudes pendientes.</p>');
```

Cada archivo usaba valores ligeramente distintos (`width:100%` en unos, `padding:20px` en otros), generando inconsistencia visual entre páginas similares.

---

## Solución adoptada

### Archivo CSS nuevo: `frontend/style/components.css`

Se crea un único archivo CSS para centralizar todos los estilos que antes vivían en el JS. Se organiza en cuatro secciones correspondientes a las cuatro categorías del inventario:

```css
/* 1. Validación de formularios */
.input-error { border: 2px solid red !important; }
.input-ok    { border: 1px solid #ddd !important; }

/* 2. Botón de confirmación del modal */
#modal-confirm-btn {
    display: block;
    width: 100%;
    padding: 10px 20px;
    margin-top: 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: white;
    font-size: 15px;
}

/* 3. Color del título del modal según tipo */
#errorModal.modal-error   .modal-content h3 { color: #a94442; }
#errorModal.modal-success .modal-content h3 { color: #155724; }
#errorModal.modal-confirm .modal-content h3 { color: #856404; }

/* 4. Mensajes de lista vacía */
.lista-vacia {
    text-align: center;
    width: 100%;
    padding: 20px;
    color: #555;
}
```

**Por qué `!important` en `.input-error` e `.input-ok`:** Los CSS de página (como `incio_sesion.css` o `registro.css`) definen bordes sobre los inputs con selectores de especificidad media. Como `components.css` se carga antes que los CSS de página, necesita `!important` para que las clases de validación prevalezcan cuando se añaden dinámicamente. Esto es un uso legítimo y acotado de `!important`: las clases de estado de validación deben tener siempre la última palabra sobre el estilo del borde.

**Por qué `background-color` sigue en JS:** El color de fondo del botón confirm sigue asignándose mediante `.css('background-color', confirmColor)` porque es genuinamente dinámico: varía en cada llamada a `showModal` según la gravedad de la acción (verde `#28a745` para activar, rojo `#d9534f` para eliminar, etc.). No es posible definirlo en CSS sin conocer de antemano qué acciones existirán. El resto de propiedades del botón, que sí son estáticas, se han trasladado a `components.css`.

### Cambios en `utils.js`

**Eliminado:** el bloque `.css({ ... })` con las 7 propiedades estáticas del botón confirm. Solo permanece `.css('background-color', confirmColor)` para el color dinámico.

**Eliminado:** `modalTitle.css('color', colors[type] || colors.error)` y el objeto `colors`. El color del título ahora lo gestiona `components.css` mediante los selectores de clase del modal.

**Añadidas:** dos funciones de utilidad globales, `inputError($input)` e `inputOk($input)`, que encapsulan el manejo de clases de validación. Al estar en `utils.js`, cualquier archivo JS de validación presente o futuro puede llamarlas directamente sin repetir la lógica:

```javascript
function inputError($input) {
    $input.removeClass('input-ok').addClass('input-error');
}

function inputOk($input) {
    $input.removeClass('input-error').addClass('input-ok');
}
```

El motivo de usar `removeClass` antes de `addClass` es garantizar que nunca coexistan ambas clases en el mismo input, lo que podría generar conflictos de especificidad.

### Cambios en los archivos JS de validación

En `login.js`, `validacion_registro.js`, `formulario_contacto_comercio.js` y `validacion_productos.js` se sustituyen todas las llamadas a `.css('border', ...)` por las nuevas funciones de `utils.js`:

| Antes | Después |
|---|---|
| `input.css('border', '2px solid red')` | `inputError(input)` |
| `input.css('border', '1px solid #ddd')` | `inputOk(input)` |

Las funciones internas `addError()` y `campoVacio()` presentes en cada archivo se actualizan para usar las nuevas funciones, de modo que el cambio es transparente para la lógica de validación.

### Cambios en los archivos JS con listas vacías

En `gestion_comercios_espera.js`, `carga_comercios_activos.js`, `solicitudesComercios.js` y `listado_productos.js` se elimina el atributo `style` de los párrafos de lista vacía y se sustituye por la clase `lista-vacia`:

```javascript
// Antes
contenedor.append('<p style="text-align:center; width:100%;">No hay comercios pendientes.</p>');

// Después
contenedor.append('<p class="lista-vacia">No hay comercios pendientes.</p>');
```

Además, en `gestion_comercios_espera.js` se eliminó un `console.error()` que quedaba de depuración y que exponía el contenido de la respuesta del servidor en la consola del navegador.

---

## Relación completa de archivos modificados

| Archivo | Tipo de cambio | Descripción |
|---|---|---|
| `frontend/style/components.css` | **Nuevo** | CSS centralizado para todos los estilos que antes estaban en JS |
| `frontend/js/utils.js` | Modificado | Eliminado `.css()` del botón confirm (excepto `background-color`); eliminado `.css('color')` del título; añadidas `inputError()` e `inputOk()` |
| `frontend/js/login.js` | Modificado | `.css('border', ...)` → `inputError()` / `inputOk()` |
| `frontend/js/validacion_registro.js` | Modificado | Ídem |
| `frontend/js/formulario_contacto_comercio.js` | Modificado | Ídem |
| `frontend/js/validacion_productos.js` | Modificado | Ídem; también eliminada función `limpiarEstilo()` local, sustituida por `inputOk()` de utils |
| `frontend/js/actualizar_prod.js` | Sin cambios | No tenía estilos inline |
| `frontend/js/gestion_comercios_espera.js` | Modificado | `style="..."` en string HTML → `class="lista-vacia"`; eliminado `console.error()` |
| `frontend/js/carga_comercios_activos.js` | Modificado | Ídem |
| `frontend/js/solicitudesComercios.js` | Modificado | Ídem |
| `frontend/js/listado_productos.js` | Modificado | Ídem |

---

## Cómo añadir `components.css` a los HTMLs

`components.css` debe cargarse en **todos los HTML del frontend**, ya que sus clases pueden ser necesarias en cualquier página que tenga formularios o listas dinámicas. El orden correcto dentro del `<head>` es:

```html
<link rel="stylesheet" href="style/estructura.css" />
<link rel="stylesheet" href="style/components.css" />
<!-- CSS específicos de la página a continuación -->
<link rel="stylesheet" href="style/incio_sesion.css" />
```

`components.css` debe ir **después de `estructura.css`** (estilos base de la estructura) pero **antes de los CSS de página**, para que las clases de página puedan sobreescribir los valores base si fuera necesario, excepto en los casos de validación donde `!important` garantiza la precedencia correcta.

> **Nota:** La tarea de añadir `components.css` al `<head>` de cada HTML queda pendiente de aplicar en los ficheros HTML del repositorio. Puede hacerse de forma progresiva página por página o en un único commit que actualice todos los HTMLs a la vez.

---

## Notas para futuras modificaciones

- Para **cambiar el color de error de los inputs** (por ejemplo, usar naranja en lugar de rojo), basta con editar la propiedad `border` en `.input-error` dentro de `components.css`. No hay que tocar ningún archivo JS.
- Para **añadir un nuevo tipo de modal** (por ejemplo `'warning'`), añadir en `components.css` la regla `#errorModal.modal-warning .modal-content h3 { color: ...; }` y en `utils.js` solo registrar la clase. Sin `.css()` adicional.
- Para **crear un nuevo archivo JS con validación de formulario**, importar `utils.js` en el HTML correspondiente y usar directamente `inputError($campo)` e `inputOk($campo)`. No es necesario redefinir nada.
- Para **añadir un nuevo mensaje de lista vacía**, usar la clase `lista-vacia` en el párrafo inyectado. El estilo es consistente con el del resto de páginas automáticamente.
- La función `limpiarEstilo()` que existía en `validacion_productos.js` ha sido eliminada ya que era un duplicado local de lo que ahora hace `inputOk()` en `utils.js`.
