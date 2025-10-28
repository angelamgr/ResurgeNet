# 🌟 ResurgeNet 🌟

Bienvenido al repositorio de mi TFG. El proyecto se basa en la gestión de comercios afectados por una catástrofe natural.  
Este proyecto está compuesto por un **frontend** con HTML, CSS y JS, un **backend** con PHP y el marco **Laravel**, y una base de datos **MySQL**, todo desplegado en **Docker**.

---

## 📁 Estructura del Proyecto

```plaintext
📂 
├── 📁 api          # Código PHP del backend con Laravel
├── 📁 frontend     # Archivos HTML, CSS, JS del frontend
├── 📁 nginx        # Configuraciones de Nginx para frontend y backend
├── 📁 db_data      # Datos persistentes de la base de datos MySQL
├── docker-compose.yml # Orquesta todos los contenedores

```

### 📂 api
Contiene el código PHP del backend. Utilizamos el framework Laravel para su desarrollo


### 📂 frontend
Aquí van los archivos HTML, CSS, JS del frontend para el que usaremos la librería jQuery de JavaScrpit. Esta librería no hay que instalarla para usarla es suficiente añadirla como un script en los HTMLs.

### 📂 nginx
Contiene las configuraciones de Nginx:

- front.conf → configura Nginx para servir el frontend estático en el puerto 3000.

- back.conf → configura Nginx para hacer proxy hacia la API Laravel en el puerto 8080

### 📂 db_data
Contiene los archivos de datos de la base de datos montada en MySQL, son archivos binarios que MySQL utiliza para gestionar los datos de cada base de datos. También contiene los archivos de configuración y logs.

He creado una BD dentro de MySQL para el proyecto, que se llama ResurgeNet. Para conectarnos a la BD tenemos que hacer los siguientes pasos:

    docker exec -it db bash #Comando en la terminal para acceder a MySQL
    mysql -u root -p #ponemos la contraseña rootpassword
    USE ResurgeNet #una vez dentro de MySQL nos conectamos a la BD del proyecto

Este volumen asegura que los datos de la base de datos persistan incluso después de reiniciar los contenedores

## 🚀 Despliegue con Docker
Para ejecutar el proyecto, utiliza el archivo docker-compose.yml en la raíz del repositorio:

```bash
docker-compose up --build
```
Este comando construirá y ejecutará los contenedores para cada servicio (base de datos, backend y frontend).

para parar ```CTRL-C```

para borrar ```docker compose down```

___
## Docker

### Instalación

Para la instalación de docker seguir los pasos de la documentación oficial disponible en este [enlace](https://docs.docker.com/engine/install/)

TLDR (Ubuntu):
```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

Para comprobar si se ha instalado correctamente: ```docker run hello-world```.

En el caso de errores revisar el estado de servicio y habilitarlo de ser necesario:
```
# Ver el estado
systemctl status dockerd

# Activar
systemctl start dockerd

# Habilitar para que se auto inicie siempre
systemctl enable dockerd
```


### Configuración
En el archivo ```docker-compose.yml``` vienen definidos los servicios que se van a desplegar y son los siguientes:
- webapp (nginx)
- db (mysql)
- api (php)

Para la información sobre la sintáxis consultar la documentación oficial disponible en este  [enlace](https://docs.docker.com/compose/)

### Despliegue
Haremos uso del modulo docker compose para desplegar una serie de contenedores dependientes. Para ello abrir terminal
en la raiz del proyecto y ejecutar ```docker compose up``` y para parar  CTRL-C

TLDR:

```
# desplegar contenedores
docker compose up

#  elimnar contenedores junto con sus redes y volumenes
docker compose down

# si he cambiado la configuración -> reconstruir
docker compose up --build
```


