# Estudio y decisión: gestión de `console.log` en producción

**Fecha:** 2026-05-20  
**Autor:** Claude (asistente IA)  
**Tarea:** Fase 4 de optimización del frontend — análisis y eliminación de trazas de depuración

---

## 1. Inventario de llamadas a `console` detectadas

Tras revisar los 17 archivos JS del frontend, se encontraron las siguientes llamadas:

| Archivo | Tipo | Mensaje | Contexto |
|---|---|---|---|
| `preinfo_producto.js` | `console.error` | `"No se encontró el id del producto en la URL"` | Guard clause al arrancar: id ausente en la URL |
| `preinfo_producto.js` | `console.error` | `"Error al cargar el producto:", err` | Callback `error` del `$.ajax` de carga de producto |

El resto de archivos JS ya tenían sus llamadas a `console` eliminadas en tareas anteriores (`login.js`, `gestion_comercios_espera.js`). El único archivo que aún las conserva es `preinfo_producto.js`, con dos `console.error` que no llegan al usuario de ninguna forma visible.

---

## 2. Las dos opciones posibles

### Opción A — Eliminar directamente

Consiste en borrar las líneas `console.error(...)` sin sustituirlas por nada, o en el caso del error de red, sustituirlas por una llamada a `showModal()` para que el usuario reciba feedback.

**Ventajas:**
- Código más limpio y sin lógica extra.
- Sin riesgo de que un flag mal configurado active logs en producción.
- Cero coste en tiempo de ejecución: ni siquiera se evalúa la condición del flag.
- Solución permanente: no requiere mantenimiento futuro del sistema de flags.

**Desventajas:**
- Si en el futuro se necesita depurar un error concreto, hay que volver a añadir logs manualmente.
- Se pierde el rastro de qué errores se consideraron suficientemente importantes para loguear.

### Opción B — Función `debug()` con flag de entorno

Consiste en crear en `utils.js` una función tipo:

```javascript
var DEBUG = (window.location.hostname === 'localhost');

function debug() {
    if (DEBUG) {
        console.log.apply(console, arguments);
    }
}
```

Y sustituir todos los `console.log` / `console.error` por llamadas a `debug()`.

**Ventajas:**
- Los mensajes de depuración siguen disponibles en local sin modificar código.
- Útil cuando el proyecto tiene muchos logs informativos distribuidos por el código (flujos complejos, estados de paginación, respuestas de múltiples APIs, etc.).
- Facilita el trabajo en equipos donde varios desarrolladores depuran simultáneamente.

**Desventajas:**
- Añade complejidad: una función y una variable global más en `utils.js`.
- El flag basado en `hostname` es frágil: falla en entornos de staging con dominio propio, en tests automatizados, o si alguien abre el proyecto en local con un servidor con dominio distinto de `localhost`.
- Alternativas más robustas al flag (variable de entorno, parámetro de URL, `localStorage`) requieren aún más infraestructura.
- **El beneficio solo se materializa si hay muchos logs valiosos que preservar.** Si los logs son escasos o no informativos, el sistema de flags es sobrediseño puro.
- La función `debug()` oculta el nivel del log (`log`, `error`, `warn`), lo que hace menos preciso el filtrado en DevTools.

---

## 3. Análisis aplicado a ResurgeNet

Para decidir correctamente, hay que evaluar la opción B contra la realidad concreta del proyecto, no de forma abstracta.

**Cantidad de logs:** Solo quedan 2 llamadas a `console.error` en todo el frontend, ambas en el mismo archivo (`preinfo_producto.js`). No es un proyecto con decenas de logs informativos distribuidos por el código.

**Calidad informativa de los logs:**
- `console.error("No se encontró el id del producto en la URL")` — Este caso ya se puede detectar visualmente: si no hay `?id=...` en la URL, el formulario aparece vacío. El log no añade información que no sea ya obvia.
- `console.error("Error al cargar el producto:", err)` — Este sí tiene cierto valor diagnóstico, pero el objeto `err` de jQuery ya está disponible en la pestaña Network de DevTools de forma más completa. Y el error en sí debería mostrarse al usuario con `showModal`, no solo a la consola.

**Madurez del proyecto:** ResurgeNet es un TFG en fase de desarrollo activo. La depuración se hace en local con DevTools abiertos. La función `debug()` añadiría valor en un proyecto con un equipo grande o en producción real donde no se puede abrir DevTools. Aquí, si se necesita depurar, se añade un `console.log` puntual y se quita al terminar.

**Conclusión del análisis:** La Opción B está diseñada para proyectos con alta densidad de logs útiles y entornos de despliegue complejos. Aplicarla aquí sería **sobrediseño**: se añade una abstracción cuyo único beneficio concreto es preservar 2 mensajes de consola de valor diagnóstico limitado. La Opción A es la correcta.

---

## 4. Decisión adoptada: Opción A — Eliminación directa con feedback al usuario

No se crea ninguna función `debug()`. Los dos `console.error` de `preinfo_producto.js` se tratan de la siguiente forma:

**Caso 1 — Id ausente en la URL:**
```javascript
// Antes
if (!id_producto) {
    console.error("No se encontró el id del producto en la URL");
    return;
}

// Después
if (!id_producto) {
    showModal('Error de navegación', 'No se ha podido identificar el producto. Vuelve al listado y selecciónalo de nuevo.');
    return;
}
```
Este caso puede ocurrirle a un usuario real (por ejemplo, si accede directamente a `actualizar_producto.html` sin `?id=`). Era un error silencioso que el usuario no podía entender. Ahora se convierte en feedback visible y accionable.

**Caso 2 — Error de red al cargar el producto:**
```javascript
// Antes
error: function(err) {
    console.error("Error al cargar el producto:", err);
}

// Después
error: function (xhr) {
    var msg = (xhr.responseJSON && xhr.responseJSON.message)
        ? xhr.responseJSON.message
        : 'No se pudieron cargar los datos del producto. Inténtalo de nuevo.';
    showModal('Error al cargar producto', msg);
}
```
Un error de red también afecta al usuario (el formulario queda vacío). Era otro error silencioso. Ahora se muestra con `showModal` usando el mensaje del servidor si está disponible, o uno genérico en caso contrario, siguiendo el patrón del resto de archivos JS del proyecto.

---

## 5. Resultado final

Tras esta tarea, **ningún archivo JS del frontend contiene llamadas a `console.log`, `console.error` ni `console.warn`**. La tabla de archivos modificados:

| Archivo | Cambio |
|---|---|
| `frontend/js/preinfo_producto.js` | Eliminados los 2 `console.error`; el primero sustituido por `showModal` de navegación; el segundo por `showModal` de error de red con mensaje del servidor |

---

## 6. Criterio para el futuro

Durante el desarrollo, se pueden añadir `console.log` o `console.error` libremente para depurar. Antes de hacer un commit que vaya a producción (o a la entrega del TFG), deben eliminarse o convertirse en `showModal` si el error es relevante para el usuario. No se introduce ningún mecanismo automático porque la disciplina manual es suficiente para un proyecto de este tamaño y no introduce complejidad adicional.
