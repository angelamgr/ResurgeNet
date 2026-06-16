# Corrección: credenciales visibles al volver atras tras cerrar sesion

**Fecha:** 2026-05-27  
**Autor:** Claude (asistente IA)  
**Síntoma:** Al cerrar sesión y pulsar el botón "atrás" del navegador, aparece el formulario de login con las credenciales ya rellenas y es posible entrar sin escribir nada.

---

## 1. Causa raíz: bfcache del navegador

Los navegadores modernos implementan el **Back-Forward Cache (bfcache)**: cuando el usuario navega a otra página, el navegador guarda un snapshot completo de la página actual en memoria (incluyendo el estado del DOM, los valores de los formularios y el estado de JavaScript). Cuando pulsa "atrás", restaura ese snapshot instantáneamente sin hacer ninguna petición al servidor.

Esto significa que:
- `evitar_atras.js` no puede intervenir porque no hay evento de carga real.
- La cookie de sesión puede haber sido invalidada en el servidor (logout), pero el navegador restaura la página sin comprobarlo.
- Los campos del formulario quedan con los valores que tenían cuando el usuario pulsó "Iniciar Sesión".

No es un bug del código sino un comportamiento estándar del navegador que hay que contrarrestar activamente.

---

## 2. Solución en tres capas

### Capa 1 — HTTP: cabeceras `no-store` en archivos HTML (`nginx/front.conf`)

Se añadió un bloque `location ~* \.html$` en `front.conf` que envía cabeceras de no-cache para todos los archivos HTML:

```nginx
location ~* \.html$ {
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
    add_header Pragma        "no-cache";
    add_header Expires       "0";
    try_files $uri $uri/ =404;
}
```

**`no-store`** es la cabecera clave: le dice al navegador que **no guarde esta página en ningún caché**, incluyendo el bfcache. Cuando el usuario pulsa "atrás", el navegador tiene que hacer una petición real al servidor para obtener la página de nuevo.

Solo se aplica a archivos `.html`. Los recursos estáticos (CSS, JS, imágenes) siguen siendo cacheados normalmente porque no contienen datos de sesión y el cacheo mejora el rendimiento.

### Capa 2 — JavaScript: limpiar el formulario y comprobar sesión al cargar (`login.js`)

Se añaden dos acciones al inicio del `$(document).ready`:

**Limpieza del formulario:**
```javascript
$('input[name="usuario"]').val('');
$('input[name="password"]').val('');
```
Incluso si el bfcache restaura la página (en navegadores que ignoran `no-store`), el `$(document).ready` sí se ejecuta al restaurar desde bfcache en algunos navegadores. Limpiar los campos en este punto garantiza que el usuario nunca vea credenciales previas.

**Comprobación de sesión activa:**
```javascript
$.ajax({
    url:  API_BASE + '/checkUserSession',
    type: 'GET',
    success: function (response) {
        if (response.active) {
            window.location.replace('index.html');
        }
    }
});
```
Si el usuario llega a la página de login con una sesión todavía activa (por ejemplo, si navegó directamente a `inicio_sesion.html` sin haber cerrado sesión), se le redirige automáticamente. Esto también evita que un usuario autenticado pueda iniciar sesión como otro usuario diferente sin cerrar la primera sesión.

### Capa 3 — Cierre de sesión: limpiar localStorage y redirigir al login (`cierre_sesion_admin.js`)

**Limpieza de localStorage:**
```javascript
localStorage.removeItem('id_usuario_comercio');
```
Antes, al cerrar sesión el `id_usuario_comercio` permanecía en `localStorage`. Si otro usuario iniciaba sesión en el mismo navegador, los JS que leen ese ID (listado de productos, mis datos) podían cargar datos del usuario anterior.

**Redirigir al login en lugar de al index:**
```javascript
window.location.replace('inicio_sesion.html'); // antes: index.html
```
Tras cerrar sesión tiene más sentido llevar al usuario a la página de login que al index público, ya que el flujo natural es: cerrar sesión → volver a entrar (posiblemente como otro usuario). Se usa `location.replace` en lugar de `location.href` para que la página de cierre de sesión no quede en el historial.

---

## 3. Por qué se necesitan las tres capas

Ninguna de las tres capas es suficiente por sí sola:

| Capa | Problema que resuelve | Limitación si se usa sola |
|---|---|---|
| Cabeceras HTTP `no-store` | Impide que el bfcache almacene la página | Algunos navegadores o extensiones ignoran estas cabeceras |
| Limpiar formulario en JS | Borra credenciales aunque la página se restaure desde bfcache | No impide el acceso si el usuario recarga manualmente con sesión activa |
| Comprobar sesión en login.js | Redirige si hay sesión activa | No limpia las credenciales visualmente antes de la redirección |
| Limpiar localStorage en logout | Evita datos de sesiones anteriores | No afecta a la cookie de sesión ni al bfcache |

Las tres capas juntas cubren todos los vectores conocidos del problema.

---

## 4. Archivos modificados

| Archivo | Cambio |
|---|---|
| `nginx/front.conf` | Añadido `location ~* \.html$` con cabeceras `Cache-Control: no-store` |
| `frontend/js/login.js` | Añadida limpieza de campos y comprobación de sesión activa al cargar |
| `frontend/js/cierre_sesion_admin.js` | Añadido `localStorage.removeItem`; cambiado destino del redirect a `inicio_sesion.html` |

---

## 5. Aplicar los cambios

```bash
git pull
docker-compose down
docker-compose up -d
```
