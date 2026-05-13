# Documentación: mis_pedidos_consumidor

**Fecha:** 2026-05-13  
**Autor:** Claude (asistente IA)  
**Tarea:** Historia de usuario — el consumidor puede consultar el estado de sus pedidos desde el dashboard

---

## Cambio en la base de datos (a ejecutar manualmente)

La BD no tenía tabla de pedidos. Hay que crearla ejecutando este SQL en el gestor de BD:

```sql
CREATE TABLE pedido (
    id_pedido     INT AUTO_INCREMENT PRIMARY KEY,
    id_consumidor INT NOT NULL,
    id_comercio   INT NOT NULL,
    estado        ENUM('En preparación', 'En reparto', 'Entregado', 'Cancelado')
                  NOT NULL DEFAULT 'En preparación',
    fecha         DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_consumidor) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_comercio)   REFERENCES comercio(id)        ON DELETE CASCADE
);
```

---

## Archivos creados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `frontend/mis_pedidos_consumidor.html` | HTML | Página de listado de pedidos |
| `frontend/style/mis_pedidos_consumidor.css` | CSS | Estilos propios de la página |
| `frontend/js/mis_pedidos_consumidor.js` | JS | Lógica de carga y paginación |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/consumidor_dashboard.html` | Enlace “Mis pedidos” apunta a `mis_pedidos_consumidor.html` |
| `frontend/mis_datos_consumidor.html` | Enlace “Mis pedidos” apunta a `mis_pedidos_consumidor.html` |
| `api/app/Http/Controllers/AuthController.php` | Nuevo método `getPedidosConsumidor` |
| `api/routes/api.php` | Nueva ruta `GET /pedidos_consumidor/{id}` |

---

## Descripción funcional

### Página `mis_pedidos_consumidor.html`
- Misma estructura de header, sidebar y footer que el resto del proyecto.
- Sidebar con opciones: **Inicio** → `consumidor_dashboard.html` y **Mis datos** → `mis_datos_consumidor.html`.
- Tarjeta central azul (`#5b8da5`) con título “Estado de mis pedidos”.
- Cabecera de columnas: Nº de pedido | Nombre Comercio | Estado del pedido.
- Filas dinámicas en forma de píldora blanca generadas por JS.
- Botones Anterior / Siguiente para paginación (5 pedidos por página).
- Si no hay pedidos, muestra el mensaje “No tienes pedidos registrados.”

### Backend `getPedidosConsumidor($id)`
- Recibe `pagina` y `por_pagina` como query params.
- Hace JOIN entre `pedido` y `comercio` para obtener `nombreComercio`.
- Devuelve: `pedidos[]`, `total`, `pagina_actual`, `total_paginas`.
- Ordenado por `fecha DESC` (pedidos más recientes primero).

### Ruta
```
GET /api/pedidos_consumidor/{id}?pagina=1&por_pagina=5
```

---

## Pendiente
- La funcionalidad de **crear pedidos** (que un consumidor añada productos al carrito y genere un pedido) se desarrollará en una iteración futura.
