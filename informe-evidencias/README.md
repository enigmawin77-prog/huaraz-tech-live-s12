# Huaraz Tech Live - API RESTful de Inventario (Semana 12)

**SENATI CFP Huaraz**  
**Carrera:** Ingeniería de Software con Inteligencia Artificial  
**Semestre:** V Semestre  
**Proyecto:** Taller de Implementación de API RESTful con SQL (SQLite), NoSQL (NeDB), Autenticación JWT, Política CORS y Contenedores Docker.

---

## 1. Descripción del Proyecto
Huaraz Tech Live es una solución backend y frontend para la gestión de inventario y auditoría de operaciones tecnológicas. La aplicación implementa una API RESTful completa con persistencia híbrida:
- **Modelo Relacional (SQL):** Almacenamiento estructurado del catálogo de productos mediante **SQLite** nativo (`node:sqlite`).
- **Modelo Documental (NoSQL):** Registro y trazabilidad de eventos de auditoría (creaciones, modificaciones y eliminaciones) como documentos JSON con **NeDB**.
- **Seguridad:** Autenticación sin estado basada en **JSON Web Tokens (JWT)** para operaciones de escritura y auditoría.
- **Control de Acceso:** Política estricta de intercambio de recursos de origen cruzado (**CORS**).
- **Despliegue:** Contenerización multi-etapa con **Docker** y orquestación con **Docker Compose**, garantizando la persistencia mediante volúmenes de datos.

---

## 2. Tecnologías Utilizadas
- **Node.js 24.x** (motor de ejecución ECMAScript con módulo nativo SQLite `DatabaseSync`).
- **Express.js 5.x** (enrutador y servidor web HTTP).
- **SQLite** (base de datos relacional para el catálogo).
- **@seald-io/nedb** (almacén de documentos NoSQL para auditoría).
- **jsonwebtoken** (firma y verificación de tokens de acceso HS256).
- **cors** (middleware de control de cabeceras de origen HTTP).
- **Docker & Docker Compose** (contenedorización con imagen base `node:24-alpine`).
- **HTML5, CSS3, JavaScript Vanilla** (cliente web SPA y cliente de prueba CORS).

---

## 3. Requisitos Previos
- **Node.js:** Versión 24.x instalada (`node -v`).
- **npm:** Versión 11.x o superior (`npm -v`).
- **Docker Desktop:** En ejecución con soporte para contenedores Linux (`docker compose version`).
- Puerto de red `3000` y `5500` disponibles en `localhost`.

---

## 4. Instalación y Preparación

### Paso 1: Instalación de dependencias
En una terminal abierta en la raíz del proyecto:
```bash
npm ci
```

### Paso 2: Preparación del entorno
Genera el archivo de entorno `.env` con un secreto criptográfico seguro para JWT y crea el directorio `datos/`:
```bash
npm run preparar
```

---

## 5. Ejecución Local (Node.js)

Para iniciar el servidor en modo local:
```bash
npm start
```
- **URL de la aplicación:** [http://localhost:3000](http://localhost:3000)
- **Endpoint de salud:** [http://localhost:3000/api/salud](http://localhost:3000/api/salud)

### Credenciales de práctica
- **Usuario:** `instructor`
- **Contraseña:** `Senati2026!`

---

## 6. Endpoints de la API REST

| Método | Ruta | Acceso | Código Éxito | Descripción |
|---|---|---|---|---|
| `GET` | `/api/salud` | Público | `200 OK` | Verificación de estado del servidor. |
| `POST` | `/api/login` | Público | `200 OK` | Autentica y genera el token JWT. |
| `GET` | `/api/productos` | Público | `200 OK` | Lista todos los productos o filtra por query `?q=`. |
| `GET` | `/api/productos/:id` | Público | `200 OK` | Obtiene un producto por su identificador. |
| `POST` | `/api/productos` | Protegido (JWT) | `201 Created` | Registra un nuevo producto (incluye header `Location`). |
| `PUT` | `/api/productos/:id` | Protegido (JWT) | `200 OK` | Actualiza nombre, precio y stock del producto. |
| `DELETE` | `/api/productos/:id` | Protegido (JWT) | `204 No Content` | Elimina el producto indicado. |
| `GET` | `/api/auditoria` | Protegido (JWT) | `200 OK` | Consulta los registros de auditoría en NeDB. |
| `GET` | `/api/modelos` | Público | `200 OK` | Muestra comparativa SQL vs NoSQL. |

---

## 7. Ejemplos de Solicitudes HTTP

### A. Autenticación (`POST /api/login`)
```http
POST /api/login HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "usuario": "instructor",
  "clave": "Senati2026!"
}
```
**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": "instructor",
  "duracion": "2 horas"
}
```

### B. Crear Producto (`POST /api/productos`)
```http
POST /api/productos HTTP/1.1
Host: localhost:3000
Authorization: Bearer <TOKEN_JWT>
Content-Type: application/json

{
  "nombre": "Kit de monitoreo ambiental",
  "precio": 120,
  "stock": 3
}
```
**Respuesta:** `201 Created` con encabezado `Location: /api/productos/8`.

---

## 8. Seguridad y Control de Acceso

### Autenticación con JWT
- Las operaciones de modificación (`POST`, `PUT`, `DELETE`) y consulta de auditoría requieren la cabecera `Authorization: Bearer <TOKEN>`.
- El middleware `proteger` verifica la firma con el secreto local `JWT_SECRET`, la expiración y el rol del usuario (`instructor`).
- Los intentos sin token devuelven `401 Unauthorized`.

### Política de Origen Cruzado (CORS)
- Orígenes permitidos por defecto: `http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:5500`, `http://127.0.0.1:5500`.
- Para probar el cliente CORS:
  ```bash
  node servir-cors.js
  ```
  Abrir `http://127.0.0.1:5500` en el navegador y presionar el botón de prueba.

---

## 9. Despliegue con Docker y Persistencia

### Construir y levantar el contenedor:
```bash
docker compose up -d --build --wait
```

### Comprobar el contenedor:
```bash
docker compose ps
docker compose logs api
```

### Prueba de persistencia con volumen:
1. Crear un producto mediante la interfaz o API (ej. `Producto Docker`).
2. Reiniciar el contenedor:
   ```bash
   docker compose restart api
   ```
3. Comprobar que el producto sigue existiendo. Los datos se almacenan de manera persistente en el volumen `datos_taller`.

### Detener el servicio conservando los datos:
```bash
docker compose down
```
*(No usar la bandera `-v` para no destruir el volumen de datos persistente).*

---

## 10. Estructura del Proyecto Entregable

```text
Apellido_Nombre_S12_HuarazTech/
├── server.js            # Rutas REST de la API implementadas
├── base.js              # Configuración de Express, CORS, JWT y validadores
├── datos.js             # Acceso a datos SQLite y NeDB
├── preparar.js          # Generación inicial del archivo .env y carpetas
├── package.json         # Definición de dependencias y scripts npm
├── package-lock.json    # Árbol exacto de dependencias
├── Dockerfile           # Definición de la imagen de producción
├── compose.yaml         # Configuración de Docker Compose y volúmenes
├── .dockerignore        # Archivos excluidos del contexto Docker
├── README.md            # Documentación completa del proyecto
├── cliente-cors.html    # Cliente HTML para demostración de CORS
├── servir-cors.js       # Servidor estático en puerto 5500 para CORS
├── public/              # Interfaz web visual de la aplicación
└── evidencias/          # Archivo pruebas.csv y capturas de pantalla
```

