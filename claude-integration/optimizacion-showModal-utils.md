# Optimización: extracción de `showModal` a `utils.js`

**Fecha:** 2026-05-18
**Autor:** Claude (asistente IA)
**Tarea:** Fase 1 de optimización del frontend — eliminar código duplicado del modal

---

## Contexto y problema

La función `showModal` (y su contraparte `hideModal`) estaba **copiada en 9 archivos JS distintos**, cada uno con variaciones ligeramente diferentes. Esto suponía:

- Cualquier cambio en el comportamiento del modal requería editar 9 ficheros.
- Las variaciones entre copias generaban inconsistencias (colores distintos, gestión del foco, soporte o no de Escape, etc.).
- Tres archivos usaban Vanilla JS (`document.addEventListener`, `fetch`) mientras el resto usaba jQuery, mezclando dos estilos sin criterio.

---

## Archivos afectados

### Archivos JS refactorizados (eliminada la función local `showModal`)

| Archivo | Variante original | Cambios realizados |
|---|---|---|
| `js/login.js` | jQuery simple | Eliminada `showModal`/`hideModal` local; eliminados `console.log` de depuración |
| `js/actualizar_prod.js` | jQuery simple | Eliminada `showModal` local |
| `js/mis_datos_consumidor.js` | jQuery simple | Eliminada `showModal`/`hideModal` local |
| `js/mis_pedidos_consumidor.js` | jQuery simple | Eliminada `showModal`/`hideModal` local (el soporte a `Escape` y `focus` se preserva en `utils.js`) |
| `js/cierre_sesion_admin.js` | jQuery simple | Eliminada `showModal`/`hideModal` local; eliminados los listeners del modal (ahora en `utils.js`) |
| `js/gestion_comercios_espera.js` | jQuery + botón confirm | Eliminada `showModal`/`hideModal` local; el `confirmText`/`confirmColor` se pasa ahora vía `options` |
| `js/gestion_consumidores.js` | jQuery + botón confirm | Ídem; texto "Eliminar permanentemente" y color rojo pasados via `options.confirmText/confirmColor` |
| `js/solicitudesComercios.js` | jQuery + botón confirm | Ídem; textos "Denegar solicitud" / "Aceptar solicitud" pasados via `options` |
| `js/validacion_registro.js` | **Vanilla JS → migrado a jQuery** | Reescrito completo: `document.addEventListener` → `$(document).ready`; `fetch` → `$.ajax`; `form.querySelector` → `form.find` |
| `js/formulario_contacto_comercio.js` | **Vanilla JS → migrado a jQuery** | Ídem; `fetch` → `$.ajax`; `document.querySelector` → `$('#workForm').find` |
| `js/validacion_productos.js` | **Vanilla JS → migrado a jQuery** | Ídem; `fetch` → `$.ajax`; selección de inputs con `form.find` |

### Archivo nuevo creado

**`frontend/js/utils.js`** — contiene la implementación única y definitiva de `showModal` y `hideModal`, además de los tres listeners globales del modal (botón ×, clic en el fondo, tecla Escape).

### HTMLs actualizados (añadido `utils.js` en el orden de carga)

Todos los HTMLs que usan el modal fueron actualizados para cargar `utils.js` entre `config.js` y el script de la página. Los dos que no tenían jQuery (`formulario_contacto_comercios.html`, ya cubierto en el primer commit) también recibieron el `<script>` de jQuery.

Páginas actualizadas: `inicio_sesion.html`, `registro_consumidores.html`, `formulario_contacto_comercios.html`, `alta_productos.html`, `actualizar_producto.html`, `admin_dashboard.html`, `comercio_dashboard.html`, `consumidor_dashboard.html`, `mis_datos_consumidor.html`, `mis_pedidos_consumidor.html`, `gestion_comercios_admin_espera.html`, `gestion_comercios_alta_admin.html`, `gestion_consumidores_admin.html`, `dashboard_validador.html`.

---

## Diseño de `utils.js`

### Firma de `showModal`

```javascript
showModal(title, content, type, options)
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `title` | `string` | Texto del `<h3>` del modal |
| `content` | `string \| Array \| null` | String → un `<li>` de texto. Array de `{campo, problema[, ejemplo]}` → una fila por error. `null` → lista oculta (usado en modales de éxito sin detalle) |
| `type` | `'error' \| 'success' \| 'confirm'` | Controla el color del título y la clase CSS del modal. Por defecto `'error'` |
| `options` | `Object` | Opcional. Solo relevante cuando `type === 'confirm'` |
| `options.confirmText` | `string` | Texto del botón de confirmación. Por defecto `'Confirmar'` |
| `options.confirmColor` | `string` | Color de fondo del botón. Por defecto `'#28a745'` (verde) |
| `options.onConfirm` | `Function` | Callback ejecutado al pulsar el botón. Después se llama `hideModal()` automáticamente |

### Cómo cada archivo pasaba su variante de confirm (antes y después)

**Antes** — cada archivo definía su propio botón con CSS inline distinto:
```javascript
// gestion_consumidores.js (antes)
btnConfirm.text('Eliminar permanentemente').css({ 'background-color': '#d9534f', ... });

// gestion_comercios_espera.js (antes)
btnConfirm.text('Validar y Activar').css({ 'background-color': '#28a745', ... });
```

**Después** — se pasa via `options`:
```javascript
// gestion_consumidores.js (ahora)
showModal('Confirmar Eliminación', mensaje, 'confirm', {
    confirmText:  'Eliminar permanentemente',
    confirmColor: '#d9534f',
    onConfirm:    function() { /* llamada DELETE */ }
});

// gestion_comercios_espera.js (ahora)
showModal('Confirmar Alta', mensaje, 'confirm', {
    confirmText:  'Validar y Activar',
    confirmColor: '#28a745',
    onConfirm:    function() { /* llamada PUT */ }
});
```

### Comportamiento preservado de cada variante

| Comportamiento | Origen | Preservado en `utils.js` |
|---|---|---|
| Foco al botón × al abrir | `mis_pedidos_consumidor.js` | ✅ Sí |
| Cerrar con tecla Escape | `mis_pedidos_consumidor.js` | ✅ Sí |
| Cerrar al clic en el fondo | Todas las variantes jQuery | ✅ Sí |
| Lista oculta en modal success sin detalle | `formulario_contacto_comercio.js` | ✅ Sí (`content = null`) |
| Formato `{campo, problema, ejemplo}` | `validacion_registro.js`, `validacion_productos.js`, `formulario_contacto_comercio.js` | ✅ Sí |
| Formato `{campo, problema}` (sin ejemplo) | `login.js`, `actualizar_prod.js` | ✅ Sí (el campo `ejemplo` es opcional) |
| Formato string simple | Todas | ✅ Sí |
| Botón confirm con texto y color custom | `gestion_comercios_espera.js`, `gestion_consumidores.js`, `solicitudesComercios.js` | ✅ Sí (via `options`) |

---

## Orden de carga de scripts (obligatorio)

```html
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="js/config.js"></script>
<script src="js/utils.js"></script>
<!-- scripts específicos de la página a partir de aquí -->
<script src="js/login.js"></script>
```

`utils.js` **debe cargarse antes** que cualquier script de página porque estos últimos llaman a `showModal()` sin redefinirla localmente. Si `utils.js` se carga después, `showModal is not defined` en el primer error del formulario.

---

## Notas para futuras modificaciones

- Para **cambiar el estilo visual del modal** (colores, tipografía, animación), editar únicamente `utils.js` y el CSS correspondiente en `admin_dashboard.css`. No es necesario tocar ningún archivo JS de página.
- Para **añadir un nuevo tipo de modal** (por ejemplo `'warning'`), añadir el color en el objeto `colors` de `showModal` y la clase CSS `modal-warning` en el CSS.
- Para **añadir un nuevo archivo JS** que necesite el modal, basta con asegurarse de que el HTML carga `utils.js` antes que ese script. No hay que copiar nada.
- `solicitudesComercios.js` mantiene funciones globales (`aceptar`, `denegar`, `cargarSolicitudes`) porque el HTML las llama con `onclick="aceptar(...)"`. Esto es una deuda técnica aparte, no relacionada con este refactor.
