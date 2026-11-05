const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const archivo = path.join(__dirname, '.env');
if (!fs.existsSync(archivo)) {
  fs.writeFileSync(archivo, `PORT=3000\nJWT_SECRET=${crypto.randomBytes(48).toString('hex')}\nDEMO_PASSWORD=Senati2026!\n`, { mode: 0o600 });
  console.log('Configuración creada. Usuario: instructor | Clave de clase: Senati2026!');
} else console.log('Se conserva la configuración .env existente.');
fs.mkdirSync(path.join(__dirname, 'datos'), { recursive: true });
console.log('Siguiente paso: npm start. Abrir http://localhost:3000');
