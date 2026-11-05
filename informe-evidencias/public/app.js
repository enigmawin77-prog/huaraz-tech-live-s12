const $=id=>document.getElementById(id);
let token='', productos=[], requests=0, history=[], deleteId=null, toastTimer;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const soles=n=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',maximumFractionDigits:0}).format(n);
function notify(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4200);}
function showTab(tab){document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.id===tab));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));$('page-title').textContent={panel:'Panel de inventario',laboratorio:'Laboratorio API',datos:'SQL y NoSQL',servicios:'REST y SOAP',docker:'Docker'}[tab];}
document.querySelectorAll('.nav').forEach(x=>x.onclick=()=>showTab(x.dataset.tab));
document.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>$(x.dataset.close).close());
function record(method,path,status,ms,data,track=true){
  if(track)$('k-requests').textContent=++requests;
  $('last-method').textContent=method;$('last-path').textContent=path;$('last-status').textContent='HTTP '+status;$('last-time').textContent=ms+' ms';
  $('live-json').textContent=status===204?'204 No Content\nLa respuesta no contiene cuerpo.':JSON.stringify(data,null,2);
  if(track)history.unshift({method,path,status,ms});history=history.slice(0,12);
  $('history').innerHTML=history.map(h=>`<div class="history-row"><span class="method">${esc(h.method)}</span><code>${esc(h.path)}</code><span>${h.status}</span><small>${h.ms} ms</small></div>`).join('');
}
async function api(path,{method='GET',body,auth=true}={}){
  if(!path.startsWith('/api/'))throw new Error('Utiliza una ruta que comience con /api/');
  const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(auth&&token)headers.Authorization='Bearer '+token;
  const start=performance.now();const res=await fetch(path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const text=await res.text();let data;try{data=text?JSON.parse(text):null;}catch{data=text;}
  const ms=Math.round(performance.now()-start);record(method,path,res.status,ms,data);
  return {ok:res.ok,status:res.status,data,ms,headers:Object.fromEntries(res.headers.entries())};
}
async function cargar(){
  const r=await api('/api/productos'+($('search').value?'?q='+encodeURIComponent($('search').value):''));
  if(!r.ok)throw new Error(r.data.error||'No se pudo consultar el catálogo');productos=r.data;
  $('products').innerHTML=productos.length?productos.map(p=>`<tr><td><div class="product-name"><span class="product-initial">${esc(p.nombre.charAt(0))}</span><div>${esc(p.nombre)}<small>PRODUCTO #${p.id}</small></div></div></td><td>${soles(p.precio)}</td><td><span class="stock ${p.stock<=3?'low':''}">${p.stock} unidades</span></td><td><div class="row-actions"><button data-edit="${p.id}">Editar</button><button data-delete="${p.id}">Eliminar</button></div></td></tr>`).join(''):'<tr><td colspan="4">No se encontraron productos.</td></tr>';
  $('result-count').textContent=productos.length+' productos en la consulta';
  $('k-count').textContent=productos.length;$('k-value').textContent=soles(productos.reduce((n,p)=>n+p.precio*p.stock,0));$('k-low').textContent=productos.filter(p=>p.stock<=3).length;
}
function requireLogin(){if(token)return true;$('login-error').textContent='Inicia sesión para modificar productos.';$('login-dialog').showModal();return false;}
function productDialog(p){if(!requireLogin())return;$('product-id').value=p?.id||'';$('product-title').textContent=p?'Editar producto':'Nuevo producto';$('product-name').value=p?.nombre||'';$('product-price').value=p?.precio??'';$('product-stock').value=p?.stock??'';$('product-error').textContent='';$('product-dialog').showModal();}
$('hero-create').onclick=()=>productDialog();$('create-btn').onclick=()=>productDialog();
$('products').onclick=e=>{const edit=e.target.closest('[data-edit]');const del=e.target.closest('[data-delete]');if(edit)productDialog(productos.find(p=>p.id===Number(edit.dataset.edit)));if(del&&requireLogin()){deleteId=Number(del.dataset.delete);$('delete-message').textContent='¿Deseas eliminar '+productos.find(p=>p.id===deleteId).nombre+'?';$('delete-error').textContent='';$('delete-dialog').showModal();}};
$('product-form').onsubmit=async e=>{e.preventDefault();$('product-save').disabled=true;try{const id=$('product-id').value;const body={nombre:$('product-name').value,precio:Number($('product-price').value),stock:Number($('product-stock').value)};const r=await api('/api/productos'+(id?'/'+id:''),{method:id?'PUT':'POST',body});if(!r.ok)throw new Error(r.data.error);$('product-dialog').close();await cargar();record(id?'PUT':'POST','/api/productos'+(id?'/'+id:''),r.status,r.ms,r.data,false);notify('HTTP '+r.status+' · '+(id?'Producto actualizado':'Producto registrado')+' · Auditoría guardada');}catch(e){$('product-error').textContent=e.message;}finally{$('product-save').disabled=false;}};
$('delete-form').onsubmit=async e=>{e.preventDefault();try{const r=await api('/api/productos/'+deleteId,{method:'DELETE'});if(!r.ok)throw new Error(r.data.error);$('delete-dialog').close();await cargar();record('DELETE','/api/productos/'+deleteId,r.status,r.ms,r.data,false);notify('HTTP 204 · Producto eliminado');}catch(e){$('delete-error').textContent=e.message;}};
$('login-btn').onclick=()=>{if(token){token='';$('login-btn').textContent='Iniciar sesión';notify('Sesión cerrada. Las operaciones de escritura requieren un token.');}else{$('login-error').textContent='';$('login-dialog').showModal();}};
$('login-form').onsubmit=async e=>{e.preventDefault();try{const r=await api('/api/login',{method:'POST',auth:false,body:{usuario:$('username').value,clave:$('password').value}});if(!r.ok)throw new Error(r.data.error);token=r.data.token;$('login-btn').textContent='Cerrar sesión · instructor';$('login-dialog').close();notify('Token JWT recibido. Ya puedes modificar el inventario.');}catch(e){$('login-error').textContent=e.message;}};
$('refresh-btn').onclick=()=>cargar().catch(e=>notify(e.message));let searchTimer;$('search').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>cargar().catch(e=>notify(e.message)),220);};
$('simulate-400').onclick=async()=>{if(!requireLogin())return;const r=await api('/api/productos',{method:'POST',body:{nombre:'',precio:-10,stock:2}});notify('HTTP '+r.status+' · '+(r.data?.error||'Respuesta recibida'));};
$('simulate-401').onclick=async()=>{const r=await api('/api/productos',{method:'POST',auth:false,body:{nombre:'Prueba de token',precio:40,stock:1}});notify('HTTP '+r.status+' · '+(r.data?.error||'Respuesta recibida'));};
$('simulate-404').onclick=async()=>{const r=await api('/api/productos/999999999');notify('HTTP '+r.status+' · '+(r.data?.error||'Respuesta recibida'));};
$('lab-send').onclick=async()=>{try{const method=$('lab-method').value;const body=['POST','PUT'].includes(method)?JSON.parse($('lab-body').value):undefined;const r=await api($('lab-path').value.trim(),{method,body});$('lab-status').textContent='HTTP '+r.status+' · '+r.ms+' ms';$('lab-response').textContent=JSON.stringify({headers:r.headers,cuerpo:r.data},null,2);}catch(e){$('lab-status').textContent='Revisa la solicitud';$('lab-response').textContent=e.message;}};
$('sql-btn').onclick=async()=>{const r=await api('/api/modelos');$('sql-data').textContent=JSON.stringify(r.data.relacional,null,2);};
$('audit-btn').onclick=async()=>{if(!requireLogin())return;const accion=$('audit-filter').value;const r=await api('/api/auditoria'+(accion?'?accion='+accion:''));$('audit-data').textContent=JSON.stringify(r.data,null,2);};
$('rest-example').onclick=async()=>{const r=await api('/api/productos/1');showTab('laboratorio');$('lab-path').value='/api/productos/1';$('lab-method').value='GET';$('lab-status').textContent='HTTP '+r.status;$('lab-response').textContent=JSON.stringify(r.data,null,2);};
(async()=>{try{const r=await fetch('/api/salud');if(!r.ok)throw new Error();$('api-status').textContent='API operativa';await cargar();}catch{$('api-status').textContent='API sin conexión';$('api-status').classList.add('offline');$('result-count').textContent='Inicia el servidor y vuelve a actualizar.';}})();
