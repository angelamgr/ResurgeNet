# Análisis de reutilizabilidad del header y footer

**Fecha:** 2026-05-23  
**Autor:** Claude (asistente IA)  
**Tarea:** Análisis técnico — ¿son el header y el footer reutilizables actualmente?

---

## 1. Conclusión directa

**No. El header y el footer no son reutilizables en el sentido técnico del término.**

Están copiados manualmente en los 16 archivos HTML del proyecto. Cualquier cambio —un enlace, el texto del footer, el logo, el nombre de la aplicación— exige editar los 16 ficheros a mano. Esto es exactamente el mismo problema que ya se resolvió con `showModal` y con `main.css`: código duplicado sin una fuente única de verdad.

---

## 2. Inventario de variantes del header

Tras leer los 16 HTMLs se identifican **tres variantes distintas** del header:

### Variante 1 — Páginas públicas (sin sesión)
Presente en: `index.html`, `inicio_sesion.html`, `registro_consumidores.html`, `formulario_contacto_comercios.html`.

```html
<header>
    <h1 id="nombre">ResurgeNet</h1>
    <img id="logo" src="imagenes/logo .png" alt="Imagen logo" width="80" height="80" />
    <a href="..."><button type="button">Texto</button></a>
</header>
```

Características: logo enlazado a `index.html` (excepto en `index.html` donde no es enlace), botón variable ("Iniciar Sesión", "Registro", "Inicio Sesión").

### Variante 2 — Dashboards con perfil de usuario
Presente en: `admin_dashboard.html`, `comercio_dashboard.html`, `consumidor_dashboard.html`, `mis_datos_consumidor.html`, `mis_pedidos_consumidor.html`, `gestion_comercios_admin_espera.html`, `gestion_comercios_alta_admin.html`, `gestion_consumidores_admin.html`, `actualizar_producto.html`, `alta_productos.html`, `listado_productos_comercio.html`.

```html
<header>
    <h1 id="nombre">ResurgeNet</h1>
    <a href="index.html"><img id="logo" src="imagenes/logo .png" ... /></a>
    <img id="admin-icon" src="imagenes/foto_ini.png" ... />
    <p>Nombre del rol</p>
</header>
```

Características: logo enlazado, icono de perfil fijo (`foto_ini.png`), texto de rol variable ("Administrador", "Nombre comercio", "Consumidor", "N. Comercio", "Validador C.").

### Variante 3 — Dashboard validador (sin sidebar)
Presente en: `dashboard_validador.html`.

Idéntico a la Variante 2 pero el botón de cerrar sesión no está dentro del sidebar sino fuera de él, por lo que el header tampoco lleva sidebar adjunto.

---

## 3. Inventario del footer

El footer es **idéntico en los 16 archivos**:

```html
<footer><p>Quien somos</p><p>Contacto</p></footer>
```

No hay ningún tipo de variante. Es el candidato más claro y más fácil de extraer como componente.

---

## 4. Por qué no son reutilizables ahora: las razones técnicas

### Razón 1 — El proyecto es HTML estático servido por PHP sin motor de plantillas

ResurgeNet sirve archivos `.html` directamente. PHP tiene su propio sistema de inclusión (`include`, `require`), pero solo funciona con archivos `.php`. Como los archivos del frontend son `.html`, PHP no los procesa y no puede inyectar fragmentos en ellos en el lado del servidor.

Esto elimina la solución más natural para proyectos PHP (partials de blade, smarty, twig, o simplemente `<?php include 'header.php'; ?>`).

### Razón 2 — No se usa ningún framework frontend

Frameworks como React, Vue o Angular tienen componentes nativos que permiten definir `<Header />` una vez y usarlo en todas las páginas. ResurgeNet usa jQuery puro sobre HTML estático, sin ningún sistema de componentes.

### Razón 3 — No hay sistema de build

Herramientas como Vite, Webpack o Parcel permiten usar plantillas HTML con inclusión de fragmentos en tiempo de compilación. El proyecto no tiene ningún paso de build, por lo que tampoco esta vía está disponible.

---

## 5. Las opciones disponibles para hacerlos reutilizables

### Opción A — Carga dinámica con jQuery (fetch + `$.load`)

Crear `header.html` y `footer.html` como fragmentos y cargarlos con jQuery en el `$(document).ready`:

```javascript
// En utils.js o en un nuevo layout.js
$('header').load('header.html');
$('footer').load('footer.html');
```

**Ventajas:** Simple, sin dependencias nuevas, compatible con el stack actual.  
**Desventajas:** El header y footer aparecen *después* de que la página carga (flash of unstyled content). El `<title>` de cada página sigue siendo individual. Las variantes del header (con o sin icono de perfil, con botón diferente) complican el fragmento único: necesitarían lógica condicional en JS o fragmentos múltiples. Además, para el TFG, jQuery ya está marcado como deuda técnica a eliminar en fases futuras.

**Valoración para ResurgeNet:** Viable para el footer (idéntico en todas las páginas). Más complejo para el header por sus tres variantes.

### Opción B — Cambiar extensión a `.php` y usar `include`

Renombrar los `.html` a `.php` y usar inclusión nativa de PHP:

```php
<?php include 'partials/header_publico.php'; ?>
```

**Ventajas:** El fragmento se inyecta en el servidor antes de enviar la respuesta, sin flash visual. Soporte nativo en el stack (el backend ya es PHP/Laravel). Las variantes del header se manejan con variables PHP (`$titulo`, `$mostrarIconoPerfil`, etc.).  
**Desventajas:** Requiere renombrar los 16 ficheros y actualizar todas las referencias internas. Si el servidor web no está configurado para servir `.php` directamente desde la carpeta `frontend/`, hay que ajustar la configuración de Nginx/Apache.

**Valoración para ResurgeNet:** Es la solución más limpia dado el stack. Pero implica una decisión arquitectural que va más allá de la optimización CSS/JS y debería tomarse conscientemente.

### Opción C — Web Components nativos (`<header-app>`)

Definir un custom element con la API nativa de Web Components:

```javascript
class AppHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `<header>...</header>`;
    }
}
customElements.define('app-header', AppHeader);
```

**Ventajas:** Nativo del navegador, sin dependencias, encapsulamiento real.  
**Desventajas:** Mayor complejidad que las otras opciones para un proyecto de este tamaño. Las variantes de header requieren atributos o slots. Poca familiaridad en proyectos académicos. Tampoco resuelve el flash visual.

**Valoración para ResurgeNet:** Sobrediseño para el contexto del TFG.

---

## 6. Recomendación razonada

Dada la situación concreta del proyecto —stack PHP + jQuery, sin build, sin framework, en fase de TFG— la recomendación es:

**No implementar la reutilización del header y footer en este momento.**

Las razones son:

1. **El footer es idéntico en todas las páginas pero trivialmente simple** (dos párrafos). El coste de mantenerlo duplicado es bajo; el coste de introducir una nueva dependencia de carga dinámica es desproporcionado.

2. **El header tiene tres variantes** con contenido dinámico (nombre de rol, tipo de botón). Un fragmento compartido necesitaría lógica condicional que añade complejidad sin aportar valor claro en esta fase.

3. **La Opción B (renombrar a `.php`)** es la única que resuelve el problema correctamente sin efectos secundarios visuales, pero es una decisión arquitectural que afecta al servidor y debe coordinarse con el equipo.

4. **En el contexto del TFG**, la duplicación del header y footer es un problema conocido y documentado, lo cual es suficiente. Los correctores valoran que se identifiquen las limitaciones y se razone la decisión, no solo que se implemente todo.

**Si en el futuro se decide implementarlo**, la ruta recomendada es la Opción B: renombrar los archivos a `.php`, crear `partials/header_publico.php`, `partials/header_dashboard.php` y `partials/footer.php`, y usar `<?php include ?>` en cada página.

---

## 7. Estado actual documentado

| HTML | Variante de header | Footer |
|---|---|---|
| `index.html` | Pública — sin enlace en logo, botón "Iniciar Sesión" | Idéntico |
| `inicio_sesion.html` | Pública — botón "Registro" | Idéntico |
| `registro_consumidores.html` | Pública — botón "Inicio Sesión" | Idéntico |
| `formulario_contacto_comercios.html` | Pública — botón "Inicio Sesión" | Idéntico |
| `admin_dashboard.html` | Dashboard — icono + "Administrador" | Idéntico |
| `comercio_dashboard.html` | Dashboard — icono + "Nombre comercio" | Idéntico |
| `consumidor_dashboard.html` | Dashboard — icono + "Nombre consumidor" | Idéntico |
| `gestion_comercios_admin_espera.html` | Dashboard — icono + "Administrador" | Idéntico |
| `gestion_comercios_alta_admin.html` | Dashboard — icono + "Administrador" | Idéntico |
| `gestion_consumidores_admin.html` | Dashboard — icono + "Administrador" | Idéntico |
| `dashboard_validador.html` | Dashboard — icono + "Validador C." | Idéntico |
| `alta_productos.html` | Dashboard — icono + "Nombre comercio" | Idéntico |
| `actualizar_producto.html` | Dashboard — icono + "N. Comercio" | Idéntico |
| `listado_productos_comercio.html` | Dashboard — icono + "N. Comercio" | Idéntico |
| `mis_datos_consumidor.html` | Dashboard — icono + "Consumidor" | Idéntico |
| `mis_pedidos_consumidor.html` | Dashboard — icono + "Consumidor" | Idéntico |
