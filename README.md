# ResurgeNet

Plataforma web para la gestión y recuperación de comercios locales afectados por catástrofes naturales. Permite a los comercios solicitar incorporación, gestionar sus productos y recibir pedidos de consumidores, con paneles diferenciados por rol de usuario.

Desarrollado como Trabajo de Fin de Grado (TFG).

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript, jQuery 3.6.0 |
| Backend | PHP 8, Laravel 10 |
| Base de datos | MySQL 8 |
| Servidor web | Nginx |
| Despliegue | Docker / Docker Compose |

---

## Estructura del repositorio

```
ResurgeNet/
├── api/                     # Backend Laravel
│   ├── app/Http/
│   │   ├── Controllers/     # AuthController: logica de negocio
│   │   └── Middleware/      # VerificarSesion: autenticacion y control de roles
│   ├── config/              # Configuracion Laravel (sesion, CORS, BD)
│   ├── routes/api.php       # Rutas REST agrupadas por rol
│   └── .env                 # Variables de entorno (no incluido en el repo)
├── frontend/
│   ├── js/
│   │   ├── config.js        # URL base de la API
│   │   ├── utils.js         # showModal, hideModal, inputError, inputOk
│   │   ├── evitar_atras.js  # Proteccion contra navegacion por historial
│   │   └── *.js             # Logica especifica de cada pagina
│   ├── style/
│   │   ├── main.css         # Variables CSS globales y estilos base
│   │   ├── components.css   # Clases dinamicas (validacion de formularios, modal)
│   │   └── *.css            # Estilos especificos de cada pagina
│   └── *.html               # Paginas de la aplicacion
├── nginx/
│   ├── front.conf           # Nginx frontend: estaticos + proxy inverso a /api/
│   └── back.conf            # Nginx backend: PHP-FPM + Laravel
├── db_backup/               # Script SQL de inicializacion de la BD
├── claude-integration/      # Documentacion tecnica del proceso de optimizacion
└── docker-compose.yml       # Orquestacion de contenedores
```

---

## Roles del sistema

| Rol | Valor | Acceso |
|---|---|---|
| Administrador | 1 | Gestion de consumidores y comercios |
| Consumidor | 2 | Perfil propio y pedidos |
| Validador | 3 | Revision y aprobacion de solicitudes de comercios |
| Comercio | 4 | Gestion de productos propios |

---

## Arquitectura de despliegue

```
Navegador (localhost:3000)
    |
    v
frontend  [Nginx]  — sirve HTML/CSS/JS
    |               — proxy inverso: /api/* -> backend
    v
backend   [Nginx]  — procesa PHP via FastCGI
    v
api       [PHP-FPM + Laravel]
    v
db        [MySQL]
```

Frontend y backend comparten origen (`localhost:3000`) gracias al proxy inverso, eliminando problemas de CORS y permitiendo cookies de sesion sin configuracion adicional.

---

## Puesta en marcha

### Requisitos

- Docker Engine >= 24
- Docker Compose >= 2

### Arrancar

```bash
git clone https://github.com/angelamgr/ResurgeNet.git
cd ResurgeNet
docker compose up -d
```

Acceder en `http://localhost:3000`.

### Comandos utiles

```bash
docker compose ps                # estado de los contenedores
docker compose logs -f           # logs en tiempo real
docker compose up -d --build     # reconstruir tras cambios en Dockerfile
docker compose down              # parar y eliminar contenedores
```

### Acceso a la base de datos

```bash
docker exec -it bd_new mysql -u root -prootpassword
```

---

## Variables de entorno para produccion

Crear `api/.env` con:

```env
APP_ENV=production
APP_KEY=                    # php artisan key:generate
DB_HOST=db
DB_DATABASE=ResurgeNet
DB_USERNAME=user
DB_PASSWORD=password
SESSION_SECURE_COOKIE=true
```
