# Huaraz Tech Live

Taller de 90 minutos (dos horas pedagógicas de 45 minutos). SENATI CFP Huaraz, Ingeniería de Software con IA, V semestre. Instructor: Ing. Carlos Alberto Duran Cueva.

## Qué se construye

Una API REST de inventario con una interfaz visual, CRUD, JSON, validaciones, autenticación JWT, control de acceso por token, política CORS, consultas SQL con SQLite, documentos de auditoría en NeDB y despliegue Docker con volumen persistente. El panel REST y SOAP ofrece una comparación y un mensaje SOAP ilustrativo; el servidor implementado es REST.

## Contenido

- `proyecto-inicial`: interfaz y conexiones preparadas, con un catálogo de lectura. Durante el taller se completa `server.js` con cuatro rutas.
- `solucion-docente`: proyecto completo para demostrar el resultado, comparar o recuperar el ritmo de clase.
- La guía docente Word se entrega por separado.

## Antes de clase

Instalar Node.js 24.x, Visual Studio Code y Docker Desktop (contenedores Linux). Preparar descargas con antelación: la instalación de estas herramientas y la primera descarga de imágenes no forman parte de los 90 minutos. Revisar que el puerto 3000 esté libre.

En `solucion-docente`, abrir una terminal PowerShell y ejecutar cada línea:

```powershell
npm ci
npm run preparar
npm start
```

Abrir http://localhost:3000. Credenciales locales de clase: usuario `instructor`, clave `Senati2026!`. Puede cambiar la clave en `.env`. `preparar.js` genera un secreto JWT aleatorio por proyecto y conserva una configuración existente. El token queda solo en la memoria de la pestaña y se pierde al recargarla.

Detener Node con Ctrl+C. Antes de clase, descargar y construir la imagen para que las capas queden en caché:

```powershell
docker pull node:24-alpine
docker compose build
```

## Desde una carpeta vacía

Crear una carpeta HuarazTech y copiar dentro el contenido de `proyecto-inicial`, incluidos sus archivos que empiezan con punto. Abrirla en VS Code. Ejecutar `npm ci`, `npm run preparar` y `npm start`. Completar las cuatro rutas de `server.js` según la guía, siempre antes de `iniciar()`. Reiniciar Node después de guardar. Los archivos `base.js`, `datos.js` y `public` son materiales de apoyo para concentrar el tiempo en API, pruebas y Docker.

## Docker

Con `.env` creado y el servidor local detenido:

```powershell
docker compose up -d --build --wait
docker compose ps
docker compose logs api
```

Abrir http://localhost:3000. El contenedor usa su propio volumen `datos_taller`; la primera ejecución inicializa seis productos y no copia los datos locales de la carpeta `datos`. Al reiniciar el contenedor se conservan las dos bases dentro del volumen. Para conservar el trabajo, usar `docker compose down` sin `-v`.

```powershell
docker compose restart api
docker compose down
```

## Prueba real de CORS en el navegador

Con la API local activa, abrir otra terminal en el mismo proyecto y ejecutar `node servir-cors.js`. Abrir http://127.0.0.1:5500. El botón consulta un servidor de origen distinto. La lista `origenes` de `base.js` permite ese origen; retirarlo y reiniciar la API demuestra el rechazo. Restaurar después la lista. En esta aplicación, además del mecanismo CORS del navegador, el callback rechaza explícitamente orígenes no permitidos con 403. Los clientes sin `Origin` siguen necesitando JWT para escribir: CORS no es autenticación.

## Endpoints

| Método | Ruta | Acceso y resultado |
|---|---|---|
| GET | /api/salud | Público, 200 |
| POST | /api/login | Credenciales, token, 200 o 401 |
| GET | /api/productos?q=texto | Público, arreglo JSON, 200 |
| GET | /api/productos/:id | Público, 200, 400 o 404 |
| POST | /api/productos | JWT, tres campos, 201 o 400/401 |
| PUT | /api/productos/:id | JWT, reemplaza nombre precio stock, 200 |
| DELETE | /api/productos/:id | JWT, 204 sin cuerpo |
| GET | /api/auditoria?accion=CREAR | JWT, documentos NoSQL, 200 |
| GET | /api/modelos | Público, consulta y filas SQL, 200 |

Los cuerpos de POST y PUT reciben `nombre` (3 a 60 caracteres), `precio` numérico no negativo y `stock` entero no negativo. Precio y stock tienen un máximo de 1 000 000. El id se genera en SQLite y no se modifica. Los precios se expresan en soles. El API responde errores JSON y controla JSON mal formado.

## Estructura para explicar

- `server.js`: rutas que el instructor escribe con los estudiantes.
- `base.js`: Express, middleware JSON, CORS, JWT, validación, archivos estáticos y errores.
- `datos.js`: consultas parametrizadas SQLite y documentos anidados NeDB.
- `preparar.js`: configuración local y creación del secreto.
- `public`: interfaz de apoyo que consume la API con fetch.
- `Dockerfile`, `compose.yaml`, `.dockerignore`: imagen, contenedor y persistencia.

La auditoría sirve a esta demostración de SQL y NoSQL; sus escrituras y las de SQLite son operaciones separadas, no una transacción distribuida. La autenticación utiliza una credencial local de taller, no un sistema completo de usuarios.

## Verificación del material

La solución pasó 17 verificaciones funcionales: CRUD, validaciones, id, JSON, JWT, roles, CORS, preflight, consultas SQL, documentos NoSQL y persistencia después de reiniciar Node. También se comprobó la interfaz con un navegador automatizado: iniciar sesión, crear, editar, eliminar y consultar auditoría. El entorno de preparación no dispone del motor Docker; el instructor debe comprobar la ejecución del contenedor en Docker Desktop antes de la clase.

## Fuentes oficiales

- https://expressjs.com/en/starter/basic-routing/
- https://expressjs.com/en/resources/middleware/cors/
- https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html
- https://www.npmjs.com/package/@seald-io/nedb
- https://github.com/auth0/node-jsonwebtoken
- https://docs.docker.com/guides/nodejs/
