const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('node:path');
const datos = require('./datos');
const port = Number(process.env.PORT || 3000);
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) throw new Error('Ejecute npm run preparar antes de npm start. JWT_SECRET debe tener 32 caracteres o más.');
if (!process.env.DEMO_PASSWORD) throw new Error('Defina DEMO_PASSWORD en .env.');
const app = express();
app.disable('x-powered-by');
const origenes = new Set([`http://localhost:${port}`, `http://127.0.0.1:${port}`, 'http://localhost:5500','http://127.0.0.1:5500']);
app.use(cors({ origin(origen,callback) {
  if (!origen || origenes.has(origen)) return callback(null,true);
  const error=new Error('Origen no permitido por la política del taller'); error.status=403; callback(error);
}}));
app.use(express.json({limit:'32kb'}));
app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff'); next();});
function errorHttp(status,mensaje) { const error=new Error(mensaje);error.status=status;return error; }
function obtenerId(valor) {
  const id=Number(valor);
  if (!/^\d+$/.test(valor) || !Number.isSafeInteger(id) || id<1) throw errorHttp(400,'El id debe ser un entero positivo');
  return id;
}
function validar(cuerpo) {
  if (!cuerpo || Array.isArray(cuerpo) || typeof cuerpo!=='object') throw errorHttp(400,'Se requiere un objeto JSON');
  const {nombre,precio,stock}=cuerpo;
  if (typeof nombre!=='string' || nombre.trim().length<3 || nombre.trim().length>60) throw errorHttp(400,'Nombre: entre 3 y 60 caracteres');
  if (typeof precio!=='number' || !Number.isFinite(precio) || precio<0 || precio>1000000) throw errorHttp(400,'Precio: número entre 0 y 1000000');
  if (!Number.isSafeInteger(stock) || stock<0 || stock>1000000) throw errorHttp(400,'Stock: entero entre 0 y 1000000');
  return {nombre:nombre.trim(),precio,stock};
}
function proteger(req,res,next) {
  const encabezado=req.get('Authorization') || '';
  if (!encabezado.startsWith('Bearer ')) return next(errorHttp(401,'Se requiere Authorization: Bearer TOKEN'));
  try {
    req.usuario=jwt.verify(encabezado.slice(7),secret,{algorithms:['HS256'],issuer:'senati-s12',audience:'taller'});
    if (req.usuario.rol!=='instructor') return next(errorHttp(403,'El rol no permite esta operación'));
    next();
  } catch { next(errorHttp(401,'Token inválido o vencido')); }
}
app.get('/api/salud',(req,res)=>res.json({estado:'operativa',curso:'SENATI CFP Huaraz',semana:12}));
app.post('/api/login',(req,res)=>{
  if (req.body?.usuario!=='instructor' || req.body?.clave!==process.env.DEMO_PASSWORD) throw errorHttp(401,'Usuario o clave incorrectos');
  const token=jwt.sign({rol:'instructor'},secret,{algorithm:'HS256',subject:'instructor',issuer:'senati-s12',audience:'taller',expiresIn:'2h'});
  res.json({token,usuario:'instructor',duracion:'2 horas'});
});
app.get('/api/auditoria',proteger,async(req,res)=>{
  const accion=req.query.accion;
  if (accion!==undefined && !['CREAR','ACTUALIZAR','ELIMINAR'].includes(accion)) throw errorHttp(400,'Acción no válida');
  res.json(await datos.consultarAuditoria(accion));
});
app.get('/api/modelos',(req,res)=>res.json({
  relacional:{motor:'SQLite',consulta:'SELECT * FROM productos WHERE nombre LIKE ? ORDER BY id DESC',parametro:'%'+String(req.query.q||'')+'%',filas:datos.productos.listar(String(req.query.q||''))},
  documental:{motor:'NeDB',consulta:'documentos.findAsync({ accion: "CREAR" }).sort({ fecha: -1 }).limit(30)',descripcion:'Documentos de auditoría con campos anidados. Acceso protegido en /api/auditoria.'}
}));
app.use(express.static(path.join(__dirname,'public')));
function iniciar() {
  app.use((req,res,next)=>next(errorHttp(404,'Ruta no encontrada')));
  app.use((error,req,res,next)=>{
    const status=error.type==='entity.parse.failed'?400:(error.status||500);
    const mensaje=error.type==='entity.parse.failed'?'JSON mal formado':(status>=500?'Error interno del servidor':error.message);
    if(status>=500) console.error(error);
    res.status(status).json({error:mensaje});
  });
  datos.listo.then(()=>{
    app.listen(port,'0.0.0.0',()=>console.log(`Huaraz Tech Live en http://localhost:${port} | SQL + NoSQL listos`));
  }).catch(error=>{console.error(error);process.exit(1);});
}
module.exports = { app, productos:datos.productos, registrar:datos.registrar, validar, proteger, obtenerId, errorHttp, iniciar };
