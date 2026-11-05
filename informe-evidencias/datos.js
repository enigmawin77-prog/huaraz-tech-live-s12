const { DatabaseSync } = require('node:sqlite');
const Datastore = require('@seald-io/nedb');
const fs = require('node:fs');
const path = require('node:path');
const carpeta = process.env.DATA_DIR || path.join(__dirname, 'datos');
fs.mkdirSync(carpeta, { recursive: true });
const sql = new DatabaseSync(path.join(carpeta, 'productos.sqlite'));
sql.exec(`CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  precio REAL NOT NULL CHECK(precio >= 0),
  stock INTEGER NOT NULL CHECK(stock >= 0)
); CREATE TABLE IF NOT EXISTS configuracion (clave TEXT PRIMARY KEY);`);
if (!sql.prepare("SELECT clave FROM configuracion WHERE clave = 'semilla'").get()) {
  const insertar = sql.prepare('INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)');
  sql.exec('BEGIN');
  try {
    [['Arduino UNO',75,8],['Kit IoT',160,3],['Sensor DHT22',35,12],['Raspberry Pi',650,2],['Cámara USB',95,6],['SSD NVMe',260,4]].forEach(p=>insertar.run(...p));
    sql.prepare('INSERT INTO configuracion (clave) VALUES (?)').run('semilla');
    sql.exec('COMMIT');
  } catch (e) { sql.exec('ROLLBACK'); throw e; }
}
const documentos = new Datastore({ filename: path.join(carpeta, 'auditoria.db') });
const listo = documentos.loadDatabaseAsync();
const productos = {
  listar: (q='') => sql.prepare('SELECT * FROM productos WHERE nombre LIKE ? ORDER BY id DESC').all('%'+q+'%'),
  buscar: id => sql.prepare('SELECT * FROM productos WHERE id = ?').get(id),
  crear: p => { const r=sql.prepare('INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)').run(p.nombre,p.precio,p.stock); return productos.buscar(Number(r.lastInsertRowid)); },
  actualizar: (id,p) => { sql.prepare('UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?').run(p.nombre,p.precio,p.stock,id); return productos.buscar(id); },
  eliminar: id => sql.prepare('DELETE FROM productos WHERE id = ?').run(id)
};
async function registrar(accion, producto, usuario) {
  await listo;
  await documentos.insertAsync({ accion, producto, usuario, fecha: new Date().toISOString() });
}
async function consultarAuditoria(accion) {
  await listo;
  return documentos.findAsync(accion ? {accion} : {}).sort({fecha:-1}).limit(30);
}
module.exports = { productos, registrar, consultarAuditoria, listo, cerrar:()=>sql.close() };
