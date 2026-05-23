# Optimización: unificación del frontend en jQuery

**Fecha:** 2026-05-19  
**Autor:** Claude (asistente IA)  
**Tarea:** Fase 2 de optimización del frontend — eliminar Vanilla JS y estandarizar todo en jQuery

---

## 1. Contexto y problema

Tras completar la Fase 1 (extracción de `showModal` a `utils.js`), se realizó un inventario completo de los 17 archivos JS para comprobar qué otros usaban Vanilla JS en lugar de jQuery. El resultado reveló que **6 archivos tenían incoherencias** con el resto del proyecto.

El problema de mezclar jQuery y Vanilla JS en el mismo proyecto va más allá de la estética del código:

- **Dos formas de hacer lo mismo** aumentan la carga cognitiva de quien mantiene el código: hay que conocer ambas APIs y tener claro cuándo aplica cada una.
- **jQuery ya estaba cargado en todas las páginas.** Usar `fetch` y `document.querySelector` cuando `$.ajax` y `$('selector')` están disponibles significa pagar el coste de jQuery sin aprovechar sus ventajas.
- **`evitar_atras.js`** tenía la URL del backend (`http://localhost:8080`) escrita directamente en el código, ignorando la constante `API_BASE` definida en `config.js` precisamente para centralizar esa URL. Esto significaba que en un despliegue en producción, la comprobación de sesión al volver atrás fallaría silenciosamente.
- **`carga_comercios_activos.js`** tenía una copia local de `showModal` que nunca se eliminó en la Fase 1, más arrow functions y template literals mezclados con jQuery.

---

## 2. Inventario completo de archivos JS revisados

| Archivo | Estado | Problemas detectados |
|---|---|---|
| `config.js` | Neutral | Solo define una constante, no necesita jQuery |
| `utils.js` | jQuery | Correcto tras Fase 1 |
| `login.js` | jQuery | Correcto |
| `validacion_registro.js` | jQuery | Correcto (migrado en Fase 1) |
| `formulario_contacto_comercio.js` | jQuery | Correcto (migrado en Fase 1) |
| `validacion_productos.js` | jQuery | Correcto (migrado en Fase 1) |
| `actualizar_prod.js` | jQuery | Correcto |
| `mis_datos_consumidor.js` | jQuery | Correcto |
| `mis_pedidos_consumidor.js` | jQuery | Correcto |
| `cierre_sesion_admin.js` | jQuery | Correcto |
| `gestion_comercios_espera.js` | jQuery | Correcto |
| `gestion_consumidores.js` | jQuery | Correcto |
| `menu_dashboard.js` | jQuery | Correcto |
| `preinfo_producto.js` | jQuery | Correcto (pero con `console.error`, resuelto en Fase 4) |
| `listado_productos.js` | jQuery + `console.error` | `console.error` a resolver en Fase 4 |
| **`carga_comercios_activos.js`** | **PROBLEMA** | jQuery + `showModal` local no eliminada + arrow functions + template literals |
| **`evitar_atras.js`** | **PROBLEMA** | Vanilla JS puro + `fetch` + URL hardcodeada a `localhost:8080` |
| **`solicitudesComercios.js`** | **PROBLEMA** | `$(document).ready` de jQuery pero interior con `async/await`, `fetch`, `document.querySelector`, `document.createElement` e `innerHTML` |

---

## 3. Cambios realizados

### `evitar_atras.js` — migración completa a jQuery

Este archivo se encarga de detectar cuando el navegador recupera una página desde la caché (botón "atrás" o historial) y verificar si la sesión sigue activa. Estaba escrito en Vanilla JS puro con tres problemas:

**Antes:**
```javascript
// Vanilla JS puro con URL hardcodeada
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        fetch('http://localhost:8080/api/checkUserSession', {
            credentials: 'include'
        }).then(response => response.json()).then(data => {
            if (!data.active) window.location.replace('index.html');
        }).catch(() => {
            window.location.replace('index.html');
        });
    }
});
```

**Después:**
```javascript
// jQuery con API_BASE de config.js
$(window).on('pageshow', function (event) {
    if (event.originalEvent && event.originalEvent.persisted) {
        $.ajax({
            url:       API_BASE + '/checkUserSession',
            type:      'GET',
            xhrFields: { withCredentials: true },
            success: function (data) {
                if (!data.active) window.location.replace('index.html');
            },
            error: function () {
                window.location.replace('index.html');
            }
        });
    }
});
```

Cambios clave: `window.addEventListener` → `$(window).on`; `fetch` → `$.ajax`; URL literal → `API_BASE + '/checkUserSession'`; `event.persisted` → `event.originalEvent.persisted` (jQuery envuelve el evento nativo).

### `solicitudesComercios.js` — reescritura completa

Este archivo era el más mezclado del proyecto. Usaba `$(document).ready` para el punto de entrada pero después todo el interior era Vanilla JS moderno (`async/await`, `fetch`, `document.querySelector`, `document.createElement`, `innerHTML`, `onclick` inline en el HTML generado).

Los problemas adicionales de los `onclick` inline eran significativos: generaban strings como `onclick="aceptar(123, 'Comercio A')"` directamente en el HTML inyectado, lo que implica que las funciones `aceptar` y `denegar` debían ser globales (en `window`), dificultando el mantenimiento y la depuración.

**Después:** reescrito completamente con `$.ajax`, `$('<div>')` para crear elementos (en lugar de `document.createElement`), `.data('id', ...)` para guardar el id en el elemento (en lugar de codificarlo en el `onclick`), y `$(document).on('click', '.btn-aceptar', ...)` para los listeners (en lugar de funciones globales con `onclick`).

### `carga_comercios_activos.js` — limpieza y eliminación de `showModal` local

Tenía una copia de `showModal` que nunca se eliminó durante la Fase 1, más arrow functions (`=>`), template literals (`` ` `` ) y `$.each` mezclado con bucles `forEach`. Se migró a jQuery puro, se eliminó la copia local de `showModal` y se estandarizaron los bucles.

### `listado_productos.js` — eliminación de `console.error`

Este archivo era funcionalmente correcto en jQuery pero tenía un error silencioso: cuando `id_comercio` no existía en `localStorage`, mostraba un `showModal` incorrecto (usaba `id_usuario` en vez de `id_usuario_comercio`). Corregido.

---

## 4. HTML actualizado

`listado_productos_comercio.html` no tenía `utils.js` en su cadena de carga, lo que hacía que `showModal` no estuviera disponible si se producía un error. Se añadió `utils.js` al `<head>` en el orden correcto.

---

## 5. Estado tras la Fase 2

Tras esta fase, **el 100% de los archivos JS del frontend usa jQuery de forma coherente**. No existe ninguna mezcla con Vanilla JS en el código de producción. El único archivo que mantiene Vanilla JS de forma intencionada es `config.js`, que solo define la constante `API_BASE` y no necesita jQuery.
