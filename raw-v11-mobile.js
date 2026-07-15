/* LifeOS v11 — raw-v11-mobile.js (E4)
   ═══════════════════════════════════════════════════════════════════
   MÓVIL PARA LA ESCENA 3D. Regla-física documentada: raw-v11-loading
   retorna temprano bajo 900px SIN neutralizar render-block → body
   negro permanente en móvil. Aquí se maneja explícito.
   · <900px: retirar render-block/splash + hud-listo (dispara el
     revelado por capas) — el arranque móvil es directo.
   · Gestos: swipe vertical = sumergir/emerger (irNivel, con su warp);
     swipe horizontal en niveles 1-2 = girar el anillo (módulo M,
     incluye las cards extra); tap = el clic de siempre (gajos, corona,
     hub — los listeners de nav ya responden a tap).
   · En nivel 2, el gesto vertical DENTRO del panel es scroll nativo.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
var MOVIL = window.innerWidth < 900 || ('ontouchstart' in window && window.innerWidth < 1100);
if(!MOVIL) return;

/* 1) arranque: neutralizar el bloqueo que el loading no retira aquí */
function _despertar(){
  var rb = document.getElementById('render-block');
  if(rb && rb.parentNode) rb.parentNode.removeChild(rb);
  var sp = document.getElementById('splash-dial');
  if(sp){ sp.style.transition = 'opacity .6s ease'; sp.style.opacity = '0';
    setTimeout(function(){ sp.remove(); }, 700); }
  document.documentElement.classList.add('hud-listo');  /* revelado por capas */
}
if(document.readyState !== 'loading') _despertar();
else document.addEventListener('DOMContentLoaded', _despertar);

/* 2) gestos */
var t0 = null;
addEventListener('touchstart', function(e){
  if(e.touches.length !== 1){ t0 = null; return; }
  t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY,
         t: performance.now(), enPanel: !!(e.target.closest && e.target.closest('#seccion .panel')) };
}, {passive:true});

addEventListener('touchend', function(e){
  if(!t0) return;
  var dx = e.changedTouches[0].clientX - t0.x;
  var dy = e.changedTouches[0].clientY - t0.y;
  var dt = performance.now() - t0.t;
  var enPanel = t0.enPanel; t0 = null;
  if(dt > 650) return;                               /* gesto lento = no-nav */
  var ax = Math.abs(dx), ay = Math.abs(dy);
  if(ax < 46 && ay < 46) return;                     /* tap: lo maneja click */
  if(window.enTransicion) return;
  var M = window.SEC ? window.SEC.length : 0;
  if(ay > ax){                                       /* vertical */
    if(window.nivel === 2 && enPanel) return;        /* scroll del contenido */
    if(dy < 0 && window.nivel < 2) window.irNivel(window.nivel + 1);
    if(dy > 0 && window.nivel > 0) window.irNivel(window.nivel - 1);
  } else if(window.nivel >= 1 && M){                 /* horizontal: girar */
    if(dx < 0) window.girarA((window.idx + 1) % M);
    else       window.girarA((window.idx - 1 + M) % M);
  }
}, {passive:true});

/* 3) ergonomía */
var st = document.createElement('style');
st.textContent = [
  '@media (max-width:900px){',
  '  #v11-top{overflow-x:auto;-webkit-overflow-scrolling:touch}',
  '  #seccion .panel{width:calc(100vw - 16px) !important;',
  '    height:calc(100dvh - 150px) !important}',
  '  html.niv-2 #seccion .panel{height:calc(100dvh - 60px) !important}',
  '  #v11-minidial{bottom:56px;width:72px;height:72px;margin-left:-36px}',
  '  .v11-sub-in img{width:26px;height:26px}',
  '  .v11-sub-in .t{font-size:8.5px}',
  '  #v11-hint{bottom:96px;max-width:92vw;white-space:normal;text-align:center}',
  '}'
].join('\n');
document.head.appendChild(st);

console.log('[v11-mobile] E4 activo · despertar + gestos + ergonomía');
})();
