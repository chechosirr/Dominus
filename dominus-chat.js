/* =====================================================================
   Dominus — Chat de Ayuda propio + experiencia de administrador
   (PREVIEW 2026-11-06 — solo en la copia preview-chat, NO en producción)

   Chat: backend propio en el VPS, base https://puente.ragerservices.net/dominus/chat
     POST /send {name, contact?, text, conv?} -> {ok, conv, total}
          (al crear la conversación llega el saludo automático
           «Hola, ¿cómo podemos ayudarte hoy?»)
     GET  /poll?conv=<id>&after=<n> -> {ok, total, messages:[{f:"v"|"a",t,ts}]}
     GET  /health
     Panel de respuestas: https://puente.ragerservices.net/dominus/chat/admin

   Estado del visitante (localStorage):
     dominus_chat_conv  — id de la conversación
     dominus_chat_name  — nombre que dio la primera vez
     dominus_chat_contact — contacto opcional

   Experiencia de administrador: Dominus reconoce al admin con el MISMO
   marcador que ya usa todo el sitio: la fila del usuario en la tabla
   `profiles` de Supabase con es_admin = true (ver supabase-admin.sql;
   así lo comprueban cuenta.html al entrar, goMiCuenta() en
   index/zapatos/cuenta y la puerta de admin.html). Solo si
   es_admin === true: la sesión va DIRECTA al panel (admin.html),
   sin ver escaparates ni tienda; el panel abre en su página de
   inicio «Bienvenido, señor.» y su menú ☰ lleva las secciones
   (Resumen, Compradores, Inventario zapatos, Ventas zapatos,
   Historial zapatos, Pedidos de hoy, Chat con traspaso de sesión
   y Cerrar sesión). Sin es_admin no se toca nada.
   ===================================================================== */
(function(){
'use strict';
var CHAT_BASE = 'https://puente.ragerservices.net/dominus/chat';
var CHAT_ADMIN_URL = CHAT_BASE + '/admin';
var SB_URL = (typeof window !== 'undefined' && window.SUPABASE_URL) || 'https://mmmkwkjzfyijnffniykt.supabase.co';
var SB_ANON = (typeof window !== 'undefined' && window.SUPABASE_ANON) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbWt3a2p6Znlpam5mZm5peWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTIzNDUsImV4cCI6MjEwNzY2ODM0NX0.xa-0G0E1vbGZGUvfvWsAMS9vNdg17pR68ee-kU8aur4';
var OPTS = window.DOMINUS_CHAT_OPTS || {};
var BASE = OPTS.base || '';               /* '../' en páginas dentro de subcarpeta */
var FLOATING = OPTS.floating !== false;   /* botón flotante: escaparate y tienda */

/* ---------------- estilos (paleta Dominus: #2a2a2e + plateado) ---------------- */
var CSS = ''
+ '#dc-help-btn{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:120;display:inline-flex;align-items:center;gap:8px;background:rgba(24,20,16,.28);color:#fff;border:1px solid rgba(255,255,255,.45);border-radius:999px;padding:12px 20px;font-family:inherit;font-size:15px;font-weight:700;letter-spacing:.02em;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.18);text-shadow:0 1px 3px rgba(0,0,0,.5);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}'
+ '#dc-help-btn:active{transform:scale(.97)}'
+ '#dc-help-btn.dc-top{bottom:auto;top:calc(66px + env(safe-area-inset-top))}'
+ '#dc-panel{position:fixed;right:16px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:130;width:min(370px,calc(100vw - 24px));height:min(540px,calc(100dvh - 110px));background:#fff;border:1px solid #e2e5ea;border-radius:20px;box-shadow:0 24px 60px rgba(10,10,15,.35);display:none;flex-direction:column;overflow:hidden;font-family:inherit}'
+ '#dc-panel.open{display:flex}'
+ '@media (max-width:640px){#dc-panel{right:0;left:0;bottom:0;width:100%;height:82dvh;border-radius:20px 20px 0 0}}'
+ '.dc-head{background:#2a2a2e;color:#f2f4f8;padding:14px 16px;display:flex;align-items:center;gap:10px}'
+ '.dc-head .dc-title{font-weight:800;font-size:16px;letter-spacing:.02em}'
+ '.dc-head .dc-sub{font-size:12px;color:#c9ccd4;margin-top:1px}'
+ '.dc-x{margin-left:auto;background:none;border:0;color:#f2f4f8;font-size:20px;cursor:pointer;font-family:inherit;padding:4px 8px;line-height:1}'
+ '.dc-msgs{flex:1;overflow-y:auto;padding:14px 12px;background:#f7f7f9;display:flex;flex-direction:column;gap:8px}'
+ '.dc-msg{max-width:82%;padding:9px 12px;border-radius:16px;font-size:14.5px;line-height:1.4;white-space:pre-wrap;word-break:break-word}'
+ '.dc-msg.a{align-self:flex-start;background:#fff;border:1px solid #e2e5ea;border-bottom-left-radius:6px;color:#17171a}'
+ '.dc-msg.v{align-self:flex-end;background:#2a2a2e;color:#fff;border-bottom-right-radius:6px}'
+ '.dc-msg .dc-ts{display:block;font-size:10.5px;opacity:.65;margin-top:4px;text-align:right}'
+ '.dc-hint{align-self:center;color:#8a8f99;font-size:12.5px;text-align:center;padding:6px 10px}'
+ '.dc-gate{padding:16px;border-top:1px solid #e2e5ea;background:#fff}'
+ '.dc-gate p{font-size:14px;margin:0 0 10px;line-height:1.45}'
+ '.dc-gate input{width:100%;box-sizing:border-box;border:1.5px solid #d0d4da;border-radius:12px;padding:11px 13px;font-family:inherit;font-size:15px;margin:0 0 9px}'
+ '.dc-lab{display:block;font-size:14px;font-weight:700;color:#17171a;margin:0 0 5px}'
+ '.dc-lab span{color:#8a8f99;font-size:12.5px;font-weight:400}'
+ '.dc-send{display:block;width:100%;background:linear-gradient(135deg,#ffffff 0%,#d9dee6 30%,#a9b2c0 50%,#f2f4f8 70%,#c3cad4 100%);color:#0a0c10;border:0;border-radius:12px;padding:12px;font-family:inherit;font-weight:800;font-size:15px;cursor:pointer}'
+ '.dc-composer{display:flex;gap:8px;padding:10px;border-top:1px solid #e2e5ea;background:#fff;align-items:flex-end}'
+ '.dc-composer textarea{flex:1;box-sizing:border-box;border:1.5px solid #d0d4da;border-radius:14px;padding:10px 12px;font-family:inherit;font-size:15px;resize:none;max-height:96px;min-height:42px}'
+ '.dc-composer button{flex:none;width:46px;height:42px;border:0;border-radius:14px;background:#2a2a2e;color:#fff;font-size:18px;cursor:pointer;font-family:inherit}'
+ '.dc-composer button:disabled{opacity:.5}'
+ '.dc-status{font-size:12px;color:#8a8f99;padding:0 14px 8px;background:#fff;display:none}'
+ '.dc-status.show{display:block}'
+ '.dc-finbar{display:flex;gap:8px;padding:9px 10px;border-top:1px solid #e2e5ea;background:#fff}'
+ '.dc-finbar button{flex:1;border:1px solid #f0c4c4;background:#fdf1f1;color:#b3261e;border-radius:10px;padding:9px;font-family:inherit;font-weight:700;font-size:13.5px;cursor:pointer}'
+ '.dc-closed{padding:22px 16px;text-align:center;background:#fff;border-top:1px solid #e2e5ea}'
+ '.dc-closed b{font-size:16px;color:#17171a}'
+ '.dc-closed p{color:#8a8f99;font-size:13.5px;margin:8px 0 14px}'
+ '.dc-closed button{background:#2a2a2e;color:#fff;border:0;border-radius:999px;padding:11px 20px;font-family:inherit;font-weight:800;font-size:14px;cursor:pointer}'
+ '.dc-hist{flex:1;overflow-y:auto;padding:12px;background:#f7f7f9;display:none;flex-direction:column;gap:9px}'
+ '.dc-hist.open{display:flex}'
+ '.dc-hi{text-align:left;background:#fff;border:1px solid #e2e5ea;border-radius:14px;padding:11px 13px;font-family:inherit;cursor:pointer;width:100%}'
+ '.dc-hi .d{font-size:11.5px;color:#8a8f99}'
+ '.dc-hi .p{font-size:14px;color:#17171a;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
+ '.dc-tag{font-size:10.5px;font-weight:800;border-radius:999px;padding:1px 8px;margin-left:7px;background:#eceef1;color:#8a8f99}'
+ '.dc-tag.on{background:#d9f2dc;color:#1c5c26}'
+ '.dc-viewbar{display:none;align-items:center;gap:8px;padding:8px 12px;background:#fff;border-bottom:1px solid #e2e5ea;font-size:12.5px;color:#8a8f99}'
+ '.dc-viewbar.open{display:flex}'
+ '.dc-viewbar button{margin-left:auto;background:#eceef1;border:0;border-radius:8px;padding:6px 10px;font-family:inherit;font-weight:700;font-size:12.5px;cursor:pointer;color:#17171a}'
+ '.dc-back{align-self:flex-start;background:none;border:0;color:#2a2a2e;font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;padding:2px 0}'
+ '#dc-welcome{position:fixed;inset:0;z-index:300;background:#2a2a2e;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity .6s ease}'
+ '#dc-welcome.dc-out{opacity:0}'
+ '#dc-welcome .dc-wtxt{font-family:Archivo,\'Source Sans 3\',Arial,sans-serif;font-weight:900;font-size:clamp(34px,9vw,64px);letter-spacing:.02em;text-align:center;padding:0 20px;background:linear-gradient(120deg,#ffffff 0%,#c2c9d4 35%,#f4f6f9 55%,#98a2b1 80%,#e8ecf1 100%);-webkit-background-clip:text;background-clip:text;color:transparent}'
;
var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }

/* ---------------- estructura del chat ---------------- */
var btn = null;
if(FLOATING){
  btn = document.createElement('button');
  btn.id = 'dc-help-btn'; btn.type = 'button';
  btn.setAttribute('aria-label', 'Ayuda — abrir el chat de Dominus');
  btn.innerHTML = 'Ayuda';
  document.body.appendChild(btn);
  btn.addEventListener('click', function(){ toggleChat(); });
  /* En la tienda, el escaparate de clases (#catview) ocupa toda la pantalla
     y sus botones quedan abajo: ahí el botón Ayuda sube bajo el header
     para no tapar Hombre/Mujer/Niños. */
  var catview = document.getElementById('catview');
  if(catview){
    var placeBtn = function(){
      var vis = catview.style.display !== 'none' && catview.offsetParent !== null;
      btn.classList.toggle('dc-top', !!vis);
    };
    new MutationObserver(placeBtn).observe(catview, { attributes: true, attributeFilter: ['style', 'class'] });
    setInterval(placeBtn, 1500); placeBtn();
  }
}

var panel = document.createElement('div');
panel.id = 'dc-panel';
panel.setAttribute('role', 'dialog');
panel.setAttribute('aria-label', 'Chat de ayuda de Dominus');
panel.innerHTML =
  '<div class="dc-head"><div><div class="dc-title">Ayuda · Dominus</div><div class="dc-sub">Escríbenos aquí mismo, te respondemos en este chat.</div></div>'
  + '<button class="dc-x" type="button" aria-label="Cerrar">✕</button></div>'
  + '<div class="dc-msgs" id="dc-msgs"><div class="dc-hint">Cargando…</div></div>'
  + '<div class="dc-gate" id="dc-gate" style="display:none">'
  + '<label class="dc-lab" for="dc-name">¿Cómo te llamas?</label>'
  + '<input id="dc-name" type="text" placeholder="Tu nombre" autocomplete="name">'
  + '<label class="dc-lab" for="dc-contact">Contacto <span>(opcional: WhatsApp o correo)</span></label>'
  + '<input id="dc-contact" type="text" placeholder="Opcional" autocomplete="tel">'
  + '<button class="dc-send" id="dc-gate-btn" type="button">Empezar chat</button></div>'
  + '<div class="dc-status" id="dc-status"></div>'
  + '<div class="dc-viewbar" id="dc-viewbar"><span>Conversación finalizada · solo lectura</span><button id="dc-view-hist" type="button">← Mis chats</button></div>'
  + '<div class="dc-hist" id="dc-hist"><button class="dc-back" id="dc-hist-back" type="button">← Volver al chat</button><div id="dc-hist-list"></div></div>'
  + '<div class="dc-finbar" id="dc-finbar" style="display:none"><button id="dc-fin-btn" type="button">Finalizar chat</button></div>'
  + '<div class="dc-closed" id="dc-closed" style="display:none"><b>Chat finalizado. Gracias por escribirnos.</b><p>Si necesitas algo más, puedes empezar un chat nuevo.</p></div>'
  + '<div class="dc-finbar" id="dc-againbar" style="display:none"><button id="dc-again" type="button">Iniciar un chat nuevo</button></div>'
  + '<div class="dc-composer" id="dc-composer" style="display:none">'
  + '<textarea id="dc-input" rows="1" placeholder="Escribe tu mensaje…"></textarea>'
  + '<button id="dc-send-btn" type="button" aria-label="Enviar">➤</button></div>';
document.body.appendChild(panel);

var msgsEl = panel.querySelector('#dc-msgs');
var gateEl = panel.querySelector('#dc-gate');
var compEl = panel.querySelector('#dc-composer');
var inputEl = panel.querySelector('#dc-input');
var sendBtn = panel.querySelector('#dc-send-btn');
var statusEl = panel.querySelector('#dc-status');
var finbarEl = panel.querySelector('#dc-finbar');
var closedEl = panel.querySelector('#dc-closed');
var againbarEl = panel.querySelector('#dc-againbar');
var histEl = panel.querySelector('#dc-hist');
var histListEl = panel.querySelector('#dc-hist-list');
var viewbarEl = panel.querySelector('#dc-viewbar');

var conv = lsGet('dominus_chat_conv') || null;
/* Registro local de conversaciones de ESTE dispositivo («Mis
   chats»): cada conversación que el cliente usa queda anotada;
   las finalizadas siguen en la lista para poder releerlas. */
var convIds = [];
try{ convIds = JSON.parse(lsGet('dominus_chat_convs') || '[]') || []; }catch(e){ convIds = []; }
function noteConv(id){ if(!id) return; if(convIds.indexOf(id) < 0){ convIds.push(id); if(convIds.length > 30) convIds = convIds.slice(-30); lsSet('dominus_chat_convs', JSON.stringify(convIds)); } }
if(conv) noteConv(conv);
var finalizada = false;   /* la conversación actual quedó cerrada */
var viewing = null;       /* conv abierta en solo lectura desde «Mis chats» */
var myName = lsGet('dominus_chat_name') || '';
var myContact = lsGet('dominus_chat_contact') || '';
/* Cliente CON sesión (Supabase, clave dominus_session): entra
   DIRECTO al chat, sin el formulario de visitante, y sus mensajes
   van con su token para que el servidor asocie la conversación a
   su cuenta. Su conversación se guarda aparte de la de visitante. */
var sbSession = null;
try{ sbSession = JSON.parse(lsGet('dominus_session') || 'null'); }catch(e){}
var acct = null;
if(sbSession && sbSession.access_token && sbSession.user && sbSession.user.id){
  acct = {
    name: (sbSession.user.user_metadata && (sbSession.user.user_metadata.nombre || sbSession.user.user_metadata.name)) || sbSession.user.email || 'Cliente',
    email: sbSession.user.email || '',
    token: sbSession.access_token
  };
  conv = lsGet('dominus_chat_conv_acc') || null;
}
function convKey(){ return acct ? 'dominus_chat_conv_acc' : 'dominus_chat_conv'; }
function ensureAcctConv(){
  if(!acct || conv) return Promise.resolve();
  return fetch(CHAT_BASE + '/myconv', { headers: { 'Authorization': 'Bearer ' + acct.token } })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){ if(j && j.conv){ conv = j.conv; noteConv(conv); lsSet('dominus_chat_conv_acc', conv); rendered = 0; } })
    .catch(function(){});
}
var opening = false;
/* El saludo existe DESDE que el cliente entra al chat (orden de
   Sergio): al entrar —con sesion, directo; el visitante, al enviar
   sus datos— la conversacion se crea en el servidor con su saludo
   ya puesto, sin esperar a su primer mensaje. */
function ensureOpen(){
  if(conv || opening) return Promise.resolve();
  if(!myName && !acct) return Promise.resolve();
  opening = true;
  var body = acct ? { auth: acct.token } : { name: myName, contact: myContact };
  return fetch(CHAT_BASE + '/open', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      opening = false;
      if(j && j.ok && j.conv){ conv = j.conv; noteConv(conv); lsSet(convKey(), conv); rendered = 0; if(isOpen) poll(true); }
    })
    .catch(function(){ opening = false; });
}
if(acct){
  /* El nombre bueno es el de su perfil (profiles.nombre); el del
     metadata o el correo es solo el de arranque. */
  fetch(SB_URL + '/rest/v1/profiles?user_id=eq.' + encodeURIComponent(sbSession.user.id) + '&select=nombre', {
    headers: { 'apikey': SB_ANON, 'Authorization': 'Bearer ' + acct.token }
  }).then(function(r){ return r.ok ? r.json() : []; })
    .then(function(rows){ if(rows && rows[0] && rows[0].nombre) acct.name = rows[0].nombre; })
    .catch(function(){});
  ensureAcctConv();
}
var rendered = 0;          /* cuántos mensajes ya se pintaron (= after del poll) */
var pollTimer = null;
var sending = false;
var isOpen = false;

function setStatus(t){ statusEl.textContent = t || ''; statusEl.classList.toggle('show', !!t); }
function fmtTs(ts){
  if(ts == null || ts === '') return '';
  var d;
  if(typeof ts === 'number') d = new Date(ts < 1e12 ? ts * 1000 : ts);
  else { d = new Date(ts); if(isNaN(d) && /^\d+$/.test(String(ts))) d = new Date(Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts)); }
  if(!d || isNaN(d)) return '';
  try{ return d.toLocaleTimeString('es-NI', { hour: 'numeric', minute: '2-digit' }); }catch(e){ return ''; }
}
function paintMsg(m){
  var div = document.createElement('div');
  div.className = 'dc-msg ' + (m.f === 'v' ? 'v' : 'a');
  var ts = fmtTs(m.ts);
  div.innerHTML = esc(m.t) + (ts ? '<span class="dc-ts">' + esc(ts) + '</span>' : '');
  msgsEl.appendChild(div);
}
function scrollDown(){ msgsEl.scrollTop = msgsEl.scrollHeight; }

function poll(after0){
  if(!conv || viewing) return Promise.resolve();
  return fetch(CHAT_BASE + '/poll?conv=' + encodeURIComponent(conv) + '&after=' + (after0 ? 0 : rendered))
    .then(function(r){ if(!r.ok) throw new Error('poll ' + r.status); return r.json(); })
    .then(function(j){
      if(!j || !j.ok) throw new Error('poll');
      setStatus('');
      var list = j.messages || [];
      if(after0){ msgsEl.innerHTML = ''; rendered = 0; }
      /* Si el servidor reinició la conversación, repintar todo */
      if(typeof j.total === 'number' && j.total < rendered){ msgsEl.innerHTML = ''; rendered = 0; return poll(true); }
      list.forEach(function(m){ paintMsg(m); rendered++; });
      if(list.length) scrollDown();
      if(j.finalizada) showClosed();
    })
    .catch(function(){ setStatus('Sin conexión con el chat por ahora; seguimos intentando…'); });
}

function showGateOrComposer(){
  if(!myName && !acct){
    /* Pantalla de datos primero (igual que NEXO): la conversación
       no se ve hasta que el visitante envía sus datos. */
    msgsEl.style.display = 'none';
    gateEl.style.display = 'block'; compEl.style.display = 'none';
    if(!conv && !rendered) msgsEl.innerHTML = '<div class="dc-hint">Hola 👋 Este es el chat de ayuda de Dominus.<br>Déjanos tu nombre y escríbenos: te respondemos aquí mismo.</div>';
  } else {
    msgsEl.style.display = '';
    gateEl.style.display = 'none'; compEl.style.display = 'flex';
    if(conv) poll(rendered === 0);
    else if(acct) ensureAcctConv().then(function(){
      if(!isOpen) return;
      if(conv) poll(true);
      else ensureOpen();
    });
    else ensureOpen();
  }
  syncBars();
}

/* ----- Finalizar chat / chat nuevo / «Mis chats» (registro) ----- */
function syncBars(){
  var started = !!myName || !!acct;
  var inHist = histEl.classList.contains('open');
  if(started) compEl.style.display = (!finalizada && !viewing && !inHist) ? 'flex' : 'none';
  finbarEl.style.display = (started && conv && !finalizada && !viewing && !inHist) ? 'flex' : 'none';
  closedEl.style.display = (started && finalizada && !viewing && !inHist) ? 'block' : 'none';
  againbarEl.style.display = (started && finalizada && !viewing && !inHist) ? 'flex' : 'none';
  viewbarEl.classList.toggle('open', !!viewing);
}
function showClosed(){ finalizada = true; syncBars(); }
function doFinalizar(){
  if(!conv || finalizada) return;
  fetch(CHAT_BASE + '/finalizar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conv: conv }) })
    .catch(function(){})
    .then(function(){ showClosed(); });
}
function newChat(){
  finalizada = false; viewing = null; rendered = 0;
  try{ localStorage.removeItem(convKey()); }catch(e){}
  conv = null;
  msgsEl.innerHTML = '';
  histEl.classList.remove('open');
  showGateOrComposer();
}
function fmtFecha(ts){
  if(!ts) return '';
  var d = new Date(ts < 1e12 ? ts * 1000 : ts);
  if(isNaN(d)) return '';
  try{ return d.toLocaleDateString('es', { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' }); }catch(e){ return ''; }
}
function loadHist(){
  histListEl.innerHTML = '<div class="dc-hint">Cargando…</div>';
  var p = acct
    ? fetch(CHAT_BASE + '/myhistory', { headers: { 'Authorization': 'Bearer ' + acct.token } }).then(function(r){ return r.json(); })
    : fetch(CHAT_BASE + '/myhistory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: convIds }) }).then(function(r){ return r.json(); });
  p.then(function(j){
    var chats = (j && j.chats) || [];
    if(!chats.length){ histListEl.innerHTML = '<div class="dc-hint">Todavía no tienes chats guardados.</div>'; return; }
    histListEl.innerHTML = '';
    chats.forEach(function(it){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'dc-hi';
      var tag = it.finalizada ? '<span class="dc-tag">Finalizada</span>' : (it.activa ? '<span class="dc-tag on">Activa</span>' : '<span class="dc-tag">Anterior</span>');
      b.innerHTML = '<span class="d">' + esc(fmtFecha(it.updated || it.created)) + '</span>' + tag + '<div class="p">' + esc((it.last_f === 'v' ? 'Tú: ' : '') + (it.last || '')) + '</div>';
      b.addEventListener('click', function(){ openHistItem(it); });
      histListEl.appendChild(b);
    });
  }).catch(function(){ histListEl.innerHTML = '<div class="dc-hint">No se pudo cargar tu registro.</div>'; });
}
function openHistory(){
  openChat();
  viewing = null;
  gateEl.style.display = 'none'; msgsEl.style.display = 'none';
  histEl.classList.add('open');
  syncBars();
  loadHist();
}
function closeHistToChat(){
  histEl.classList.remove('open');
  viewing = null;
  rendered = 0; msgsEl.innerHTML = '';
  showGateOrComposer();
  if(conv) poll(true);
}
function openHistItem(it){
  if(it.conv === conv && !it.finalizada){ closeHistToChat(); return; }
  viewing = it.conv;
  histEl.classList.remove('open');
  msgsEl.style.display = '';
  viewbarEl.querySelector('span').textContent = it.finalizada ? 'Conversación finalizada · solo lectura' : 'Conversación anterior · solo lectura';
  syncBars();
  msgsEl.innerHTML = '';
  fetch(CHAT_BASE + '/poll?conv=' + encodeURIComponent(it.conv) + '&after=0')
    .then(function(r){ return r.json(); })
    .then(function(j){ if(j && j.ok){ (j.messages || []).forEach(paintMsg); scrollDown(); } })
    .catch(function(){});
}

function openChat(opts){
  opts = opts || {};
  isOpen = true;
  panel.classList.add('open');
  histEl.classList.remove('open');
  viewing = null;
  showGateOrComposer();
  if(opts.prefill && myName){ inputEl.value = opts.prefill; }
  if(opts.prefill && !myName){ panel.setAttribute('data-prefill', opts.prefill); }
  if(pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(function(){ if(!isOpen) return; if(conv) poll(false); else if(myName || acct) ensureOpen(); }, 4000);
  setTimeout(function(){
    if(myName || acct) inputEl.focus(); else { var n = panel.querySelector('#dc-name'); if(n) n.focus(); }
  }, 60);
}
function closeChat(){
  isOpen = false;
  panel.classList.remove('open');
  if(pollTimer){ clearInterval(pollTimer); pollTimer = null; }
}
function toggleChat(){ isOpen ? closeChat() : openChat(); }

panel.querySelector('.dc-x').addEventListener('click', closeChat);

panel.querySelector('#dc-gate-btn').addEventListener('click', function(){
  var n = panel.querySelector('#dc-name').value.trim();
  var c = panel.querySelector('#dc-contact').value.trim();
  if(!n){ panel.querySelector('#dc-name').focus(); setStatus('Escribe tu nombre para empezar.'); return; }
  myName = n; myContact = c;
  lsSet('dominus_chat_name', n);
  if(c) lsSet('dominus_chat_contact', c);
  setStatus('');
  var pf = panel.getAttribute('data-prefill');
  showGateOrComposer();
  if(pf){ inputEl.value = pf; panel.removeAttribute('data-prefill'); }
  inputEl.focus();
});

function doSend(){
  var text = inputEl.value.trim();
  if(!text || sending) return;
  if(!myName && !acct){ showGateOrComposer(); return; }
  sending = true; sendBtn.disabled = true;
  setStatus('Enviando…');
  var body;
  if(acct){ body = { text: text, auth: acct.token }; if(conv) body.conv = conv; }
  else { body = { name: myName, text: text }; if(myContact) body.contact = myContact; if(conv) body.conv = conv; }
  fetch(CHAT_BASE + '/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }).then(function(r){ return r.json().then(function(j){ return { status: r.status, j: j }; }); })
    .then(function(res){
      if(res.status === 409){ inputEl.value = ''; setStatus(''); showClosed(); return; }
      var j = res.j;
      if(!j || !j.ok || !j.conv) throw new Error('send');
      if(j.conv !== conv){ conv = j.conv; noteConv(conv); lsSet(convKey(), conv); }
      inputEl.value = '';
      setStatus('');
      return poll(rendered === 0);
    })
    .catch(function(){ setStatus('No se pudo enviar. Revisa tu conexión e intenta de nuevo.'); })
    .then(function(){ sending = false; sendBtn.disabled = false; inputEl.focus(); });
}
sendBtn.addEventListener('click', doSend);
inputEl.addEventListener('keydown', function(e){
  if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); doSend(); }
});

panel.querySelector('#dc-fin-btn').addEventListener('click', doFinalizar);
panel.querySelector('#dc-again').addEventListener('click', newChat);
panel.querySelector('#dc-hist-back').addEventListener('click', closeHistToChat);
panel.querySelector('#dc-view-hist').addEventListener('click', openHistory);

window.DominusChat = { open: openChat, close: closeChat, toggle: toggleChat, adminUrl: CHAT_ADMIN_URL, openHistory: openHistory };
window.DominusChatOpen = function(e){ if(e){ e.preventDefault(); e.stopPropagation(); } openChat(); return false; };
window.DominusChatOpenHistory = function(e){ if(e){ e.preventDefault(); e.stopPropagation(); } openHistory(); return false; };

/* ---------------- experiencia de administrador ----------------
   Mismo marcador del sitio: profiles.es_admin === true, comprobado con
   la sesión guardada (dominus_session) contra Supabase REST, igual que
   goMiCuenta() y la puerta de admin.html. */
function adminExperience(){
  var menu = document.getElementById('menu');
  var s = null;
  try{ s = JSON.parse(localStorage.getItem('dominus_session') || 'null'); }catch(e){}
  if(!s || !s.access_token || !s.user || !s.user.id) return;
  fetch(SB_URL + '/rest/v1/profiles?user_id=eq.' + encodeURIComponent(s.user.id) + '&select=tipo,es_admin', {
    headers: { 'apikey': SB_ANON, 'Authorization': 'Bearer ' + s.access_token }
  }).then(function(r){ return r.json(); }).then(function(rows){
    var p = rows && rows[0];
    if(!p || p.es_admin !== true) return;   /* sesión normal: NO se toca nada */

    /* Sesión de administrador: su sitio es el PANEL, no la tienda
       (pedido de Sergio: «cuando entro como administrador no quiero
       que me muestres los escaparates ni nada de eso. Solo quiero
       ver el panel de administrador»). Al confirmarse es_admin en
       cualquier página que no sea el panel, va DIRECTO a admin.html
       con location.replace (el escaparate no queda en el historial).
       El panel abre en su página de inicio «Bienvenido, señor.» y
       las secciones se eligen desde su menú ☰. En admin.html este
       archivo no se carga, así que no hay bucle de redirección. */
    if(!/admin\.html$/.test(location.pathname)){
      location.replace(BASE + 'admin.html');
    }
  }).catch(function(){ /* sin red o sin perfil: el sitio queda como siempre */ });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', adminExperience);
else adminExperience();
})();
