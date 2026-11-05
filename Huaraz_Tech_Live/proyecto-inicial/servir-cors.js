const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
// Ejecutar en otra terminal: node servir-cors.js
// El API ya permite http://localhost:5500. Cambiar SOLO origenes en base.js
// para retirar ese origen y observar el rechazo al hacer fetch desde este cliente.
const html = fs.readFileSync(path.join(__dirname,'cliente-cors.html'));
http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);}).listen(5500,'127.0.0.1',()=>console.log('Cliente de otro origen: http://127.0.0.1:5500'));
