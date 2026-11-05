const { app, productos, registrar, validar, proteger,
  obtenerId, errorHttp, iniciar } = require('./base');

// 1. CONSULTAR. Esta ruta es pública y permite buscar por nombre.
app.get('/api/productos', (req, res) => {
  if (req.query.q !== undefined && typeof req.query.q !== 'string')
    throw errorHttp(400, 'La búsqueda debe ser texto');
  res.json(productos.listar(req.query.q || ''));
});

// 2. CONSULTAR UN PRODUCTO. El parámetro id llega como texto.
app.get('/api/productos/:id', (req, res) => {
  const producto = productos.buscar(obtenerId(req.params.id));
  if (!producto) throw errorHttp(404, 'Producto no encontrado');
  res.json(producto);
});

// 3. CREAR. Proteger exige un JWT válido antes del controlador.
app.post('/api/productos', proteger, async (req, res) => {
  const producto = productos.crear(validar(req.body));
  await registrar('CREAR', producto, req.usuario.sub);
  res.location('/api/productos/' + producto.id).status(201).json(producto);
});

// 4. ACTUALIZAR. PUT requiere los tres campos del producto.
app.put('/api/productos/:id', proteger, async (req, res) => {
  const id = obtenerId(req.params.id);
  if (!productos.buscar(id)) throw errorHttp(404, 'Producto no encontrado');
  const producto = productos.actualizar(id, validar(req.body));
  await registrar('ACTUALIZAR', producto, req.usuario.sub);
  res.json(producto);
});

// 5. ELIMINAR. 204 significa que la respuesta no lleva cuerpo.
app.delete('/api/productos/:id', proteger, async (req, res) => {
  const id = obtenerId(req.params.id);
  const producto = productos.buscar(id);
  if (!producto) throw errorHttp(404, 'Producto no encontrado');
  productos.eliminar(id);
  await registrar('ELIMINAR', producto, req.usuario.sub);
  res.status(204).end();
});

iniciar();
