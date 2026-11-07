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
  btn.innerHTML = '💬 Ayuda';
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

var conv = lsGet('dominus_chat_conv') || null;
var myName = lsGet('dominus_chat_name') || '';
var myContact = lsGet('dominus_chat_contact') || '';
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
  if(!conv) return Promise.resolve();
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
    })
    .catch(function(){ setStatus('Sin conexión con el chat por ahora; seguimos intentando…'); });
}

function showGateOrComposer(){
  if(!myName){
    /* Pantalla de datos primero (igual que NEXO): la conversación
       no se ve hasta que el visitante envía sus datos. */
    msgsEl.style.display = 'none';
    gateEl.style.display = 'block'; compEl.style.display = 'none';
    if(!conv && !rendered) msgsEl.innerHTML = '<div class="dc-hint">Hola 👋 Este es el chat de ayuda de Dominus.<br>Déjanos tu nombre y escríbenos: te respondemos aquí mismo.</div>';
  } else {
    msgsEl.style.display = '';
    gateEl.style.display = 'none'; compEl.style.display = 'flex';
    if(conv) poll(rendered === 0);
    else if(!rendered) msgsEl.innerHTML = '<div class="dc-hint">Hola, ' + esc(myName) + ' 👋<br>¿En qué podemos ayudarte hoy?</div>';
  }
}

function openChat(opts){
  opts = opts || {};
  isOpen = true;
  panel.classList.add('open');
  showGateOrComposer();
  if(opts.prefill && myName){ inputEl.value = opts.prefill; }
  if(opts.prefill && !myName){ panel.setAttribute('data-prefill', opts.prefill); }
  if(pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(function(){ if(isOpen && conv) poll(false); }, 4000);
  setTimeout(function(){
    if(myName) inputEl.focus(); else { var n = panel.querySelector('#dc-name'); if(n) n.focus(); }
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
  if(!myName){ showGateOrComposer(); return; }
  sending = true; sendBtn.disabled = true;
  setStatus('Enviando…');
  var body = { name: myName, text: text };
  if(myContact) body.contact = myContact;
  if(conv) body.conv = conv;
  fetch(CHAT_BASE + '/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }).then(function(r){ if(!r.ok) throw new Error('send ' + r.status); return r.json(); })
    .then(function(j){
      if(!j || !j.ok || !j.conv) throw new Error('send');
      if(j.conv !== conv){ conv = j.conv; lsSet('dominus_chat_conv', conv); }
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

window.DominusChat = { open: openChat, close: closeChat, toggle: toggleChat, adminUrl: CHAT_ADMIN_URL };
window.DominusChatOpen = function(e){ if(e){ e.preventDefault(); e.stopPropagation(); } openChat(); return false; };

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
