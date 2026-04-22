-- MySQL dump 10.13  Distrib 9.2.0, for Linux (x86_64)
--
-- Host: localhost    Database: ResurgeNet
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `comercio`
--

DROP TABLE IF EXISTS `comercio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comercio` (
  `id` int NOT NULL,
  `ciudad` varchar(30) NOT NULL,
  `direccion` varchar(30) NOT NULL,
  `n_telefono` varchar(10) NOT NULL,
  `tiene_web` tinyint(1) DEFAULT '0',
  `estado` enum('validacion','activo','desactivado tmp') DEFAULT 'validacion',
  `nombreComercio` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `comercio_ibfk_1` FOREIGN KEY (`id`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comercio`
--

LOCK TABLES `comercio` WRITE;
/*!40000 ALTER TABLE `comercio` DISABLE KEYS */;
INSERT INTO `comercio` VALUES (3,'Granada','Calle Don Quijote 5','666899760',1,'activo','cultivoSaludable'),(14,'Valencia','Valencia','666089550',0,'activo','RecambiosTodoCoche'),(15,'Granada','Granada','678905678',1,'activo','EntreLineas');
/*!40000 ALTER TABLE `comercio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consumidor`
--

DROP TABLE IF EXISTS `consumidor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consumidor` (
  `id` int NOT NULL,
  `direccion` varchar(30) NOT NULL,
  `ciudad` varchar(30) NOT NULL,
  `cod_postal` int NOT NULL,
  `n_telefono` int NOT NULL,
  `email` varchar(40) NOT NULL,
  `fecha_nac` date NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `consumidor_ibfk_1` FOREIGN KEY (`id`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consumidor`
--

LOCK TABLES `consumidor` WRITE;
/*!40000 ALTER TABLE `consumidor` DISABLE KEYS */;
INSERT INTO `consumidor` VALUES (9,'Gran Vía 5','Madrid',15002,666085950,'sofiP_22@gmail.com','1996-05-12');
/*!40000 ALTER TABLE `consumidor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id_producto` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(20) NOT NULL,
  `tipo` varchar(30) NOT NULL,
  `descripcion` text NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int NOT NULL,
  `imagen` varchar(255) NOT NULL,
  `id_comercio` int NOT NULL,
  PRIMARY KEY (`id_producto`),
  KEY `fk_producto_comercio` (`id_comercio`),
  CONSTRAINT `fk_producto_comercio` FOREIGN KEY (`id_comercio`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'Alas de Onix','Libro Fantasía','Tercera entrega de la saga Empirio escrito por Rebeca Yarros',30.00,5,'uploads/productos/1767438955_alas_onix.jpg',3),(2,'La Asistenta','Thriller','Primera entrega del thriller superventas escrito por Freida McFadden',20.99,4,'uploads/productos/1767439069_LaAsistenta.jpg',3);
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol`
--

DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `tipo_rol` varchar(30) NOT NULL,
  PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol`
--

LOCK TABLES `rol` WRITE;
/*!40000 ALTER TABLE `rol` DISABLE KEYS */;
INSERT INTO `rol` VALUES (1,'Administrador'),(2,'Consumidor'),(3,'Validador_comercio'),(4,'Comercio');
/*!40000 ALTER TABLE `rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudComercio`
--

DROP TABLE IF EXISTS `solicitudComercio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudComercio` (
  `id_solicitud` int NOT NULL AUTO_INCREMENT,
  `nombrePropietario` varchar(50) NOT NULL,
  `nombreComercio` varchar(50) NOT NULL,
  `email` varchar(40) NOT NULL,
  `ciudad` varchar(40) NOT NULL,
  `n_telefono` varchar(10) NOT NULL,
  `motivoSolicitud` varchar(300) NOT NULL,
  `tiene_web` tinyint(1) NOT NULL,
  `estado` enum('pendiente','aceptada','denegada','alta admin') DEFAULT 'pendiente',
  PRIMARY KEY (`id_solicitud`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudComercio`
--

LOCK TABLES `solicitudComercio` WRITE;
/*!40000 ALTER TABLE `solicitudComercio` DISABLE KEYS */;
INSERT INTO `solicitudComercio` VALUES (1,'Miguel Heredia','RecambiosTodoCoche','angelamgr@correo.ugr.es','Valencia','666089550','Tras las inundaciones sufridas en la DANA mi comercio se vio afectado pero he conseguido salvar piezas que me gustara vender',0,'alta admin'),(3,'Laura Martinez','EntreLineas','laura.martin@gmail.com','Granada','678905678','Retomar la venta de los libros guardados en almacen, la tienda se la llevo la ultima riada',1,'alta admin');
/*!40000 ALTER TABLE `solicitudComercio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(30) NOT NULL,
  `usuario` varchar(20) NOT NULL,
  `password` char(64) NOT NULL,
  `rol` int NOT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `rol` (`rol`),
  CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`rol`) REFERENCES `rol` (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'Angela Garrido','angelamgr','25f43b1486ad95a1398e3eeb3d83bc4010015fcc9bedb35b432e00298d5021f7',1),(2,'David Lopez','david03','e52473318e65c0bd9ecc1c94141e9b34688906b7776f2f72824dbb0c9e366cd8',3),(3,'Manuel Garrido','manuGr','460a1446ca3e5c2707a62fb405cb643a7bf95dc0752a1505a40f638af4ced341',4),(9,'Sofia Perez','sofi22','1018bdb757f02e266e25810e9dcb87c861c864bbf08d71d992c4483f9fdcbc82',2),(13,'Javier Garcia','javigar','64d7de35447e6943b365232c6bfdf560f86873ade1233f07e5d238dda88ab149',4),(14,'Miguel Heredia','RecambiosTodoCoche','112b31df65d811e50e5771525a5f4f81fd1f1ba9fbbe8e6d28209d18ae2b8c33',3),(15,'Laura Martinez','EntreLineas','88459fe78d7b07408fc021547c1d267b8cc128973ed16e2208674db3639c6659',3);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_usuario_insert` BEFORE INSERT ON `usuario` FOR EACH ROW BEGIN
    SET NEW.password = SHA2(NEW.password, 256);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_usuario_update` BEFORE UPDATE ON `usuario` FOR EACH ROW BEGIN
    -- Solo re-hashea si la contrasea cambi
    IF NEW.password <> OLD.password THEN
        SET NEW.password = SHA2(NEW.password, 256);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-22 13:55:13
