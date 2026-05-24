# Implementación de paginación en las listas de gestión

**Fecha:** 2026-05-24  
**Autor:** Claude (asistente IA)  
**Tarea:** Añadir paginación funcional a todas las listas con botones Anterior/Siguiente

---

## 1. Estado previo

Solo `getPedidosConsumidor` en el backend y `mis_pedidos_consumidor.js` en el frontend tenían paginación implementada. Los demás 5 endpoints devolvían **arrays planos** con todos los datos de una vez, y sus botones Anterior/Siguiente estaban en el HTML pero sin ninguna funcionalidad JS asociada.

---

## 2. Qué se implementaó

### Backend — `api/app/Http/Controllers/AuthController.php`

Se añadió paginación a los 5 métodos que la necesitaban, siguiendo el mismo patrón ya existente en `getPedidosConsumidor`:

| Método | Clave de datos en respuesta | Tabla consultada |
|---|---|---|
| `getConsumers` | `usuarios` | `usuario` (rol=2) |
| `getComerciosEspera` | `comercios` | `solicitudComercio` (estado='aceptada') |
| `getComerciosGestion` | `comercios` | `usuario` JOIN `comercio` |
| `getSolicitudesComercio` | `solicitudes` | `solicitudComercio` (estado='pendiente') |
| `getProductosComercio` | `productos` | `productos` |

Cada método lee dos parámetros opcionales de la query string:
- `pagina` (por defecto: 1)
- `por_pagina` (por defecto: 3)

Y devuelve siempre la misma estructura:
```json
{
  "<clave_datos>": [...],
  "total":         15,
  "pagina_actual": 1,
  "total_paginas": 5
}
```

### Frontend — archivos JS

Se añadió el mismo patrón de paginación a los 6 archivos JS de listas:

| Archivo JS | Lista que controla |
|---|---|
| `gestion_comercios_espera.js` | Comercios en espera de alta |
| `gestion_consumidores.js` | Consumidores registrados |
| `carga_comercios_activos.js` | Comercios dados de alta |
| `solicitudesComercios.js` | Solicitudes del validador |
| `listado_productos.js` | Productos del comercio |
| `mis_pedidos_consumidor.js` | Pedidos del consumidor (ya existía, actualizado a 3) |

Cada archivo tiene:
- Variables `paginaActual`, `porPagina` y `totalPaginas` al inicio.
- Función `actualizarBotones()` que añade/quita la clase `nav-disabled` y el atributo `disabled` según la página actual.
- La URL del `$.ajax` incluye `?pagina=N&por_pagina=N`.
- Listeners en `#btn-anterior` y `#btn-siguiente`.

---

## 3. Cómo cambiar el número de elementos por página

### Cambio global (afecta a todas las listas a la vez)

El número de elementos se controla desde el **frontend**. Basta con cambiar el valor de `porPagina` en cada archivo JS. Si quieres cambiarlo en todas las listas a la vez, modifica la variable en los 6 archivos:

```
frontend/js/gestion_comercios_espera.js   → var porPagina = 3;
frontend/js/gestion_consumidores.js       → var porPagina = 3;
frontend/js/carga_comercios_activos.js    → var porPagina = 3;
frontend/js/solicitudesComercios.js       → var porPagina = 3;
frontend/js/listado_productos.js          → var porPagina = 3;
frontend/js/mis_pedidos_consumidor.js     → var porPagina = 3;
```

Cambia el `3` por el número que quieras. El backend se adapta automáticamente porque lee el parámetro `por_pagina` de la query string que envía el frontend.

### Cambio individual (solo una lista)

Si quieres que una lista concreta muestre un número diferente de elementos, solo modifica `porPagina` en su archivo JS. Por ejemplo, para mostrar 5 productos en el listado del comercio pero 3 en el resto:

```javascript
// frontend/js/listado_productos.js
var porPagina = 5; // solo este archivo
```

### Cambio del valor por defecto en el backend

El backend tiene un valor por defecto de `3` elementos por página, que se usa si el frontend no envía el parámetro `por_pagina`. Puedes cambiar este valor en **cada método** del controlador:

```
api/app/Http/Controllers/AuthController.php
```

Dentro de cada método, la línea a modificar es:
```php
$porPagina = intval($request->query('por_pagina', 3)); // cambia el 3
```

Los métodos afectados son: `getConsumers`, `getComerciosEspera`, `getComerciosGestion`, `getSolicitudesComercio`, `getProductosComercio` y `getPedidosConsumidor`.

> **Nota:** En condiciones normales no hace falta tocar el backend, porque el frontend siempre envía el parámetro `por_pagina` explícitamente. El valor por defecto del backend solo actúa si se llama al endpoint directamente desde un navegador o herramienta externa sin ese parámetro.

---

## 4. Cómo funciona internamente

```
Usuario pulsa "Siguiente"
    ↓
JS incrementa paginaActual
    ↓
JS llama a $.ajax con ?pagina=2&por_pagina=3
    ↓
Backend calcula offset = (2-1) * 3 = 3
Backend hace SELECT ... SKIP 3 TAKE 3
Backend devuelve { datos: [...], total_paginas: 5, pagina_actual: 2 }
    ↓
JS vacía el contenedor y renderiza los 3 nuevos elementos
JS llama a actualizarBotones():
  - Si pagina_actual == 1 → btn-anterior desactivado
  - Si pagina_actual == total_paginas → btn-siguiente desactivado
  - En otro caso → ambos activos
```

---

## 5. Consideración sobre los HTMLs con botones de paginación

Los botones Anterior/Siguiente de las páginas de gestión en grid (comercios en espera, consumidores) usan IDs `#btn-anterior` y `#btn-siguiente` en los HTMLs `gestion_comercios_admin_espera.html` y `gestion_consumidores_admin.html`. Si el HTML no tiene esos IDs en los botones, la paginación no funcionará. Verificar que el HTML usa exactamente esos IDs si se añaden nuevas páginas con paginación en el futuro.
