# Modificaciones en el Despliegue de la Base de Datos

Fecha: 02/05/2026  
Realizado con asistencia de: Claude Sonnet 4.6 (Anthropic)

---

## Contexto y problema de partida

El proyecto ResurgeNet utiliza Docker para orquestar todos sus servicios: frontend, backend (API Laravel) y base de datos (MySQL). La configuración de estos servicios se define en el fichero `docker-compose.yml` en la raíz del proyecto.

Desde el inicio del proyecto, la base de datos se configuró de la siguiente manera en el `docker-compose.yml`:

```yaml
db:
  image: mysql:latest
  container_name: bd_new
  restart: always
  environment:
    MYSQL_ROOT_PASSWORD: rootpassword
    MYSQL_DATABASE: ResurgeNet
    MYSQL_USER: user
    MYSQL_PASSWORD: password
  volumes:
    - ./db_data:/var/lib/mysql
  networks:
    - my_network
```

Esta configuración tenía **dos problemas graves** que impedían que cualquier persona que clonara el repositorio pudiera levantar el proyecto correctamente.

---

## Problema 1: El volumen de datos era una carpeta local excluida del repositorio

### ¿Qué es un volumen en Docker?

Cuando MySQL arranca dentro de un contenedor, necesita guardar los datos de la base de datos en algún sitio. Si no se configurara ningún volumen, esos datos vivirían únicamente dentro del contenedor y se perderían cada vez que se parara. Para evitar esto, Docker permite montar volúmenes que persisten los datos fuera del contenedor.

### ¿Cómo estaba configurado antes?

La línea `- ./db_data:/var/lib/mysql` indica que Docker debía usar la carpeta `./db_data` (es decir, una carpeta llamada `db_data` dentro del propio proyecto) para guardar los ficheros internos de MySQL. MySQL almacena ahí ficheros binarios propios (`.ibd`, `.ibt`, logs, configuración interna, etc.) que gestiona de forma autónoma.

### ¿Por qué era un problema?

Esta carpeta `db_data` estaba correctamente incluida en el `.gitignore` del proyecto:

```
# MySQL / Base de datos
db_data/
db_data_backup/
```

Esto es correcto porque esos ficheros binarios de MySQL son pesados, están vinculados a la máquina donde se generaron, y no tienen sentido en un repositorio de código. Sin embargo, el problema es que **sin esa carpeta, el contenedor de MySQL no tenía dónde escribir los datos**.

Cuando alguien clonaba el repositorio en una máquina nueva y ejecutaba `docker compose up --build`, Docker intentaba montar `./db_data` pero esa carpeta no existía. Docker la creaba vacía, MySQL arrancaba y generaba una base de datos completamente vacía, sin tablas ni datos.

### ¿Cómo se ve esto en local?

En el ordenador de desarrollo, la carpeta `db_data` existe y tiene el candado naranja característico de carpetas protegidas por root, ya que Docker la crea y gestiona con permisos de superusuario. Cualquier persona que clonara el proyecto desde cero no tendría esa carpeta.

---

## Problema 2: El backup SQL existía en el repo pero no se usaba

### ¿Qué es el backup?

En el directorio `db_backup/` del repositorio existe el fichero `resurgenet_backup22Abril.sql`. Este fichero es un volcado completo de la base de datos generado con `mysqldump`, que contiene todas las instrucciones SQL necesarias para recrear la estructura de tablas y los datos del proyecto tal como estaban el 22 de Abril.

### ¿Por qué no se usaba?

A pesar de estar en el repositorio, este fichero no estaba referenciado en ningún sitio del `docker-compose.yml`. Docker no sabe de su existencia a menos que se le indique explícitamente. Por tanto, aunque el fichero estaba ahí, nunca se ejecutaba al levantar el proyecto.

### ¿Cuál era el resultado?

Cualquier persona que clonara el repositorio y ejecutara `docker compose up --build` obtenía:
- Los contenedores de frontend, backend y base de datos arrancados correctamente
- La base de datos MySQL **completamente vacía** — sin tablas, sin datos
- El backend intentando conectarse a una BD vacía, causando errores en todas las operaciones

---

## Solución aplicada

Se modificó el fichero `docker-compose.yml` con dos cambios en el servicio `db` y una adición al final del fichero.

### Cambio 1: Volumen gestionado por Docker en lugar de carpeta local

**Antes:**
```yaml
volumes:
  - ./db_data:/var/lib/mysql
```

**Después:**
```yaml
volumes:
  - db_data:/var/lib/mysql
  - ./db_backup/resurgenet_backup22Abril.sql:/docker-entrypoint-initdb.d/init.sql:ro
```

**Y al final del fichero se añadió:**
```yaml
volumes:
  db_data:
```

### ¿Qué diferencia hay entre `./db_data` y `db_data`?

| | `./db_data` (antes) | `db_data` (después) |
|---|---|---|
| Tipo | Bind mount (carpeta local) | Volumen gestionado por Docker |
| Ubicación | `./db_data/` dentro del proyecto | `/var/lib/docker/volumes/resurgenet_db_data/` |
| Necesita carpeta en el repo | Sí | No |
| Funciona en cualquier máquina | No | Sí |
| Visible en el explorador de archivos | Sí (con candado) | No directamente |
| Requiere `sudo` para borrar | Sí | No (se borra con `docker compose down -v`) |

Al usar un volumen gestionado por Docker (`db_data` sin `./`), Docker se encarga de crear y gestionar el espacio de almacenamiento internamente. No hace falta que exista ninguna carpeta en el proyecto, funciona igual en cualquier máquina donde se clone el repositorio.

### Cambio 2: Montar el backup SQL para inicialización automática

La segunda línea añadida en los volúmenes del servicio `db`:

```yaml
- ./db_backup/resurgenet_backup22Abril.sql:/docker-entrypoint-initdb.d/init.sql:ro
```

Esta línea monta el fichero SQL del backup dentro del contenedor de MySQL en la ruta `/docker-entrypoint-initdb.d/init.sql`. El sufijo `:ro` indica que se monta en modo de solo lectura (read-only), ya que no necesitamos que MySQL modifique ese fichero.

### ¿Por qué funciona `/docker-entrypoint-initdb.d/`?

La imagen oficial de MySQL en Docker tiene un comportamiento especial: **la primera vez que arranca con un volumen vacío**, ejecuta automáticamente todos los ficheros `.sql` y `.sh` que encuentre en el directorio `/docker-entrypoint-initdb.d/`. Esto está diseñado exactamente para este caso de uso: inicializar la base de datos con un esquema y datos predefinidos.

Es importante entender que esto **solo ocurre la primera vez**, cuando el volumen está vacío. En arranques posteriores, MySQL detecta que ya tiene datos en el volumen y omite completamente la ejecución de esos scripts. Esto es el comportamiento correcto: no queremos que se reinicialice la BD cada vez que levantamos los contenedores.

---

## Cómo afecta esto al acceso a la base de datos

El acceso a la base de datos desde la terminal **no cambia en absoluto**. Los comandos del README siguen siendo exactamente los mismos:

```bash
# Acceder al contenedor de MySQL
docker exec -it bd_new bash

# Conectarse a MySQL dentro del contenedor
mysql -u root -p
# Contraseña: rootpassword

# Seleccionar la base de datos del proyecto
USE ResurgeNet;
```

El nombre del contenedor (`bd_new`), las credenciales, el nombre de la base de datos y todo lo demás permanece igual. El cambio es únicamente en cómo Docker almacena internamente los ficheros de datos.

### ¿Dónde se guardan ahora los cambios que hago en la BD?

Los cambios que se realicen en la base de datos (insertar registros, modificar tablas, etc.) se guardan en el volumen gestionado por Docker `db_data`. Este volumen **persiste entre reinicios** de los contenedores — hacer `docker compose down` y volver a levantar con `docker compose up` conserva todos los datos.

Solo se pierden los datos si se ejecuta:

```bash
docker compose down -v
```

El flag `-v` indica a Docker que también elimine los volúmenes. En ese caso, la próxima vez que se levante el proyecto, el volumen estará vacío y MySQL volverá a inicializarse con el backup SQL.

---

## Pasos realizados en local para adaptar el proyecto al nuevo docker-compose.yml

Una vez que Claude subió el nuevo `docker-compose.yml` al repositorio, fue necesario realizar los siguientes pasos en el ordenador de desarrollo para adaptar el entorno local a la nueva configuración.

### Paso 1: Parar los contenedores y eliminar volúmenes

```bash
docker compose down -v
```

Este comando para todos los contenedores, elimina las redes creadas por Docker Compose y, gracias al flag `-v`, elimina también los volúmenes. Era necesario porque el volumen antiguo (`./db_data`) ya no es compatible con la nueva configuración.

**Salida obtenida:**
```
Container backend    Removed
Container frontend   Removed
Container api        Removed
Container bd_new     Removed
Network resurgenet_my_network  Removed
```

### Paso 2: Eliminar la carpeta local db_data

```bash
sudo rm -rf ./db_data
```

Era necesario usar `sudo` porque la carpeta fue creada por Docker con permisos de root. Si no se eliminara, podría causar conflictos al intentar usar el nuevo volumen gestionado.

### Paso 3: Traer los cambios del repositorio

```bash
git add .
git commit -m "cambios frontend"
git pull origin main
```

Antes del `git pull` fue necesario hacer commit de los cambios locales del frontend que estaban pendientes, ya que Git no permite hacer pull cuando hay cambios sin fusionar. Además, el repositorio estaba en estado "detached HEAD" (sin rama activa), por lo que fue necesario:

```bash
git checkout main
git pull origin main
```

### Paso 4: Levantar el proyecto con la nueva configuración

```bash
docker compose up --build
```

Al ejecutar este comando con el nuevo `docker-compose.yml`:
1. Docker crea el volumen gestionado `db_data` vacío
2. Arranca el contenedor de MySQL
3. MySQL detecta que el volumen está vacío
4. MySQL ejecuta automáticamente el fichero `db_backup/resurgenet_backup22Abril.sql`
5. Se crean todas las tablas y se insertan todos los datos del backup
6. El proyecto queda completamente operativo

---

## Comportamiento del sistema según el escenario

| Escenario | Comportamiento |
|---|---|
| Primera vez que se levanta (volumen vacío) | MySQL carga el backup automáticamente |
| Arranques posteriores (volumen con datos) | MySQL usa los datos existentes, ignora el backup |
| `docker compose down` sin `-v` | Los datos persisten en el volumen |
| `docker compose down -v` | El volumen se destruye, próximo arranque carga el backup |
| Cambios en la BD durante el desarrollo | Se guardan en el volumen, persisten entre reinicios |
| Clonar el repo en una máquina nueva | Funciona directamente con `docker compose up --build` |

---

## Cómo actualizar el backup cuando se hagan cambios en la BD

Cuando se realicen cambios significativos en la estructura o datos de la base de datos y se quiera que esos cambios queden reflejados en el repositorio para que otros puedan clonar el proyecto con la BD actualizada, hay que generar un nuevo backup:

```bash
# Con los contenedores corriendo, exportar la BD actual
docker exec bd_new mysqldump -u user -ppassword ResurgeNet > db_backup/resurgenet_backupFECHA.sql

# Añadir el nuevo backup al repositorio
git add db_backup/
git commit -m "chore: actualizar backup de la BD"
git push
```

Y luego actualizar la referencia en `docker-compose.yml` para que apunte al nuevo fichero SQL.

---

## Resumen de ficheros modificados

| Fichero | Tipo de cambio | Descripción |
|---|---|---|
| `docker-compose.yml` | Modificado | Cambio de volumen bind mount a volumen gestionado + montaje del backup SQL |
| `claude-integration/README.md` | Creado | Documentación del proceso de integración con Claude |
| `claude-integration/modificaciones-despliegue-base-de-datos.md` | Creado | Este fichero |
