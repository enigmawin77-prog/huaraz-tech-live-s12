const {spawn}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'senati-s12-'));
const secret='secreto-de-prueba-'.repeat(4);
const jwt=require('./solucion-docente/node_modules/jsonwebtoken');
const base='http://127.0.0.1:3388';let server,token,logs='',passed=0;
async function start(){server=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'solucion-docente'),env:{...process.env,PORT:'3388',JWT_SECRET:secret,DEMO_PASSWORD:'Senati2026!',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);for(let i=0;i<100;i++){try{if((await fetch(base+'/api/salud')).ok)return;}catch{}await new Promise(r=>setTimeout(r,50));}throw new Error('No inició el servidor: '+logs);}
async function stop(){if(!server||server.exitCode!==null)return;await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM');});}
async function req(route,{method='GET',body,headers={},auth=false,raw}={}){if(auth)headers.Authorization='Bearer '+token;if(body!==undefined||raw!==undefined)headers['Content-Type']='application/json';const r=await fetch(base+route,{method,headers,body:raw??(body===undefined?undefined:JSON.stringify(body))});const t=await r.text();return {status:r.status,body:t?JSON.parse(t):null,headers:r.headers};}
async function test(name,fn){await fn();passed++;console.log('OK',name);}
(async()=>{try{await start();
 await test('API y catálogo inicial de seis productos',async()=>{const r=await req('/api/productos');assert.equal(r.status,200);assert.equal(r.body.length,6);});
 await test('401 al crear sin token',async()=>assert.equal((await req('/api/productos',{method:'POST',body:{nombre:'Demo',precio:10,stock:1}})).status,401));
 await test('login correcto e incorrecto',async()=>{assert.equal((await req('/api/login',{method:'POST',body:{usuario:'instructor',clave:'incorrecta'}})).status,401);const r=await req('/api/login',{method:'POST',body:{usuario:'instructor',clave:'Senati2026!'}});assert.equal(r.status,200);token=r.body.token;assert(token);});
 let id;
 await test('POST 201 con Location y persistencia SQLite',async()=>{const r=await req('/api/productos',{method:'POST',auth:true,body:{nombre:'Robótica de prueba',precio:185,stock:5}});assert.equal(r.status,201);id=r.body.id;assert.equal(r.headers.get('location'),'/api/productos/'+id);assert.equal((await req('/api/productos/'+id)).body.nombre,'Robótica de prueba');});
 await test('PUT 200 conserva id y datos',async()=>{const r=await req('/api/productos/'+id,{method:'PUT',auth:true,body:{nombre:'Robótica editada',precio:190,stock:3}});assert.equal(r.status,200);assert.equal(r.body.id,id);assert.equal(r.body.stock,3);});
 await test('validaciones 400 de nombre precio stock y tipos',async()=>{for(const body of [{nombre:'',precio:10,stock:1},{nombre:'Demo',precio:-1,stock:1},{nombre:'Demo',precio:'10',stock:1},{nombre:'Demo',precio:10,stock:1.5},{nombre:'Demo',precio:10,stock:-1},null,[]])assert.equal((await req('/api/productos',{method:'POST',auth:true,body})).status,400);});
 await test('JSON mal formado responde JSON 400',async()=>assert.equal((await req('/api/productos',{method:'POST',auth:true,raw:'{"nombre":'})).status,400));
 await test('id inválido 400 y producto inexistente 404',async()=>{assert.equal((await req('/api/productos/abc')).status,400);assert.equal((await req('/api/productos/9999999')).status,404);});
 await test('búsqueda parametrizada y texto de SQL no alteran datos',async()=>{const r=await req('/api/productos?q='+encodeURIComponent("' OR 1=1 --"));assert.equal(r.body.length,0);assert.equal((await req('/api/productos')).body.length,7);});
 await test('NeDB registra y consulta documentos anidados',async()=>{const r=await req('/api/auditoria?accion=CREAR',{auth:true});assert.equal(r.status,200);assert(r.body.some(d=>d.producto.id===id&&d.usuario==='instructor'&&d._id));});
 await test('CORS origen permitido y política de origen rechazado',async()=>{const r=await req('/api/productos',{headers:{Origin:'http://localhost:5500'}});assert.equal(r.headers.get('access-control-allow-origin'),'http://localhost:5500');assert.equal((await req('/api/productos',{headers:{Origin:'http://no-permitido.local'}})).status,403);});
 await test('preflight admite Authorization',async()=>{const r=await req('/api/productos',{method:'OPTIONS',headers:{Origin:'http://localhost:5500','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});assert.equal(r.status,204);assert(r.headers.get('access-control-allow-headers').includes('authorization'));});
 await test('token vencido inválido y rol no autorizado',async()=>{const old=token;token='invalido';assert.equal((await req('/api/auditoria',{auth:true})).status,401);token=jwt.sign({rol:'instructor'},secret,{issuer:'senati-s12',audience:'taller',expiresIn:-1});assert.equal((await req('/api/auditoria',{auth:true})).status,401);token=jwt.sign({rol:'lector'},secret,{issuer:'senati-s12',audience:'taller',expiresIn:100});assert.equal((await req('/api/auditoria',{auth:true})).status,403);token=old;});
 await test('ambas bases conservan sus datos después de reiniciar',async()=>{await stop();await start();assert.equal((await req('/api/productos/'+id)).body.stock,3);assert((await req('/api/auditoria',{auth:true})).body.some(d=>d.producto.id===id));});
 await test('DELETE 204 y posterior GET 404',async()=>{assert.equal((await req('/api/productos/'+id,{method:'DELETE',auth:true})).status,204);assert.equal((await req('/api/productos/'+id)).status,404);});
 await test('id autoincremental y auditoría de eliminación',async()=>{const r=await req('/api/productos',{method:'POST',auth:true,body:{nombre:'Otro producto',precio:10,stock:1}});assert(r.body.id>id);assert((await req('/api/auditoria?accion=ELIMINAR',{auth:true})).body.some(d=>d.producto.id===id));});
 await test('interfaz disponible con recursos locales',async()=>{for(const ruta of ['/','/styles.css','/app.js'])assert((await fetch(base+ruta)).ok);});
 console.log(`RESULTADO: ${passed} verificaciones correctas.`);
}catch(e){console.error(e);console.error(logs);process.exitCode=1;}finally{await stop();fs.rmSync(dir,{recursive:true,force:true});}})();
