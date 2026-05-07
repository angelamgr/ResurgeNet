# Documentación: mis_datos_consumidor

**Fecha:** 2026-05-07  
**Autor:** Claude (asistente IA)  
**Tarea:** Desarrollo de la página estática de modificación de datos del consumidor

---

## Archivos creados

### 1. `frontend/mis_datos_consumidor.html`
Página HTML que implementa el formulario de "Modificación de tus datos" para el consumidor.

### 2. `frontend/style/mis_datos_consumidor.css`
Hoja de estilos específica para la página anterior.

---

## Descripción funcional

Esta página es accesible desde el dashboard del consumidor (`consumidor_dashboard.html`) a través del menú lateral desplegable. En el boceto original la opción se llamaba "Actualización de mis datos"; se ha renombrado en el menú del dashboard a **"Mis datos"** para que coincida con el enunciado del requerimiento.

### Estructura de la página

| Zona | Descripción |
|------|-------------|
| **Header** | Idéntico al del dashboard del consumidor: logo (izq.), título "ResurgeNet" (centro), icono de usuario + etiqueta "Consumidor" (dcha.) |
| **Sidebar (nav)** | Menú lateral desplegable con dos opciones: **Inicio** → `consumidor_dashboard.html` y **Mis pedidos** → `#` (placeholder hasta desarrollo futuro) |
| **Main** | Panel/tarjeta central con fondo azul oscuro redondeado que contiene el formulario en grid de 2 columnas |
| **Footer** | Idéntico al resto de páginas: "Quién somos" y "Contacto" |
| **Modal** | Modal de mensajes reutilizando la estructura existente en otros dashboards |

### Campos del formulario (8 campos, 2 columnas × 4 filas)

| Columna izquierda | Columna derecha |
|-------------------|-----------------|
| Nombre | Ciudad |
| Email | Nº Teléfono |
| Dirección | Fecha Nacimiento |
| Cod. Postal | Contraseña |

---

## Decisiones de diseño

### CSS reutilizado (sin modificar)
- `estructura.css` → estilos de header, footer y body (color de fondo `#d2e3ee`).
- `admin_dashboard.css` → sidebar, botón de toggle, estilos de modal y botón global (rojo oscuro `#7a0c00`, border-radius 100px).

### CSS nuevo (`mis_datos_consumidor.css`)
- `.datos-main`: centra el contenido vertical y horizontalmente usando flexbox, con márgenes que respetan la altura del header fijo (~127 px) y el footer fijo (~103 px).
- `.datos-container`: tarjeta con `background-color: #2C6080` (azul oscuro del boceto), bordes redondeados (20 px) y sombra.
- `.datos-grid`: grid de 2 columnas con `gap` para separación entre campos.
- `.campo`: fila flex con label (ancho fijo 120 px, alineado a la derecha) + input (flex-grow, bordes pill).
- `.datos-btn-container`: centra el botón Guardar.
- El botón Guardar hereda el estilo global de `button` de `admin_dashboard.css` (fondo `#7a0c00`).

### Scripts reutilizados
- `jquery-3.6.0.min.js` (CDN)
- `js/menu_dashboard.js` → lógica del sidebar desplegable (toggle + cierre al hacer click fuera)
- `js/cierre_sesion_admin.js` → lógica del botón "Cerrar Sesión"
- `js/evitar_atras.js` → previene navegación con el botón atrás del navegador

---

## Pendiente / Notas para el desarrollo futuro

- El enlace **"Mis pedidos"** en el sidebar apunta a `#` hasta que se desarrolle esa página.
- La lógica de **carga de datos actuales** del consumidor (pre-rellenar inputs desde la API) y el **guardado** (llamada PUT/PATCH al backend) deberá implementarse en un nuevo archivo `js/mis_datos_consumidor.js`.
- El campo **Contraseña** muestra un input de tipo `password`. Si se desea que sea opcional (solo cambiar si se rellena), habrá que contemplarlo en la validación JS y en el endpoint de la API.
- Considerar añadir un campo de **confirmación de contraseña** en una iteración futura.
- El enlace del dashboard al que apunta "Inicio" es `consumidor_dashboard.html`; revisar si la ruta relativa es correcta según el servidor de producción.
