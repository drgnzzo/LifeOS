/* LifeOS — raw-temas.js (E6-F · MOTOR DE TEMAS v2 — visión del usuario)
   ═══════════════════════════════════════════════════════════════════
   · COSMICO — el actual, intacto (cosmos + juice ON).
   · OFICINA — profesional: fondo azul petróleo SÓLIDO con degradado,
     paneles y cards (nivel 1 incluido) con fondos reales, glows
     domados, acentos desaturados. Cero techno. Cosmos y juice OFF.
   · ECHO — radiografía LITERAL: una capa de escala de grises sobre
     TODO lo que ya existe (dial, cosmos, cards — sin inventos).
     Los neones pasan a blancos por pura luminancia.
   Botón ◐ (sobre el de audio) cicla; persistido en localStorage.
   rebeldes() = mapa de pulido (colores inline que resisten al tema).
   ═══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var TEMAS = ['cosmico','echo'];   /* E6-N: Oficina retirado por orden del usuario */
var ETIQ  = {cosmico:'🌌 Cósmico', oficina:'🏢 Oficina', echo:'🩻 Echo (radiografía)'};

var CSS = [
/* ══ OFICINA · azul petróleo profesional ══ */
'html.tema-oficina{',
'  --hud-bg-base:#0C2B36; --hud-bg-deep:#081E26;',
'  --hud-panel-bg:#10333F; --hud-panel-bg-hov:#143C4A;',
'  --hud-panel-bg-act:#175163; --hud-form-bg:#0E2F3A;',
'  --hud-border:rgba(146,196,214,.22); --hud-border-hov:rgba(146,196,214,.4);',
'  --hud-border-strong:rgba(146,196,214,.6);',
'  --hud-glow:rgba(62,143,168,.15); --hud-glow-strong:rgba(62,143,168,.25);',
'  --hud-glow-soft:rgba(62,143,168,.06);',
'  --hud-text:#EAF3F6; --hud-text-mid:rgba(222,236,240,.78);',
'  --hud-text-dim:rgba(200,222,230,.5); --hud-text-faint:rgba(200,222,230,.28);',
'  --hud-ok:#5FBF8F; --hud-warn:#D9A05B; --hud-err:#D96C6C;',
'  --hud-ok-glow:rgba(95,191,143,.28); --hud-warn-glow:rgba(217,160,91,.28);',
'  --hud-err-glow:rgba(217,108,108,.28);',
'}',
'html.tema-oficina body{',
'  background:linear-gradient(168deg,#0E3140 0%,#0B2833 44%,#071C24 100%) fixed !important}',
/* cards del anillo y boards: fondo SÓLIDO real */
'html.tema-oficina .hud-pnl,html.tema-oficina .board-face,',
'html.tema-oficina .e5-sec,html.tema-oficina #ct-izq,html.tema-oficina #ct-detalle{',
'  background:var(--hud-panel-bg) !important;',
'  box-shadow:0 8px 28px rgba(0,0,0,.35) !important}',
/* techno fuera: glows y sombras de texto al mínimo */
'html.tema-oficina *{text-shadow:none !important}',
'html.tema-oficina *{--e5c:#4FA3BF !important}',

/* ══ ECHO · escala de grises literal sobre todo ══ */
'html.tema-echo{filter:grayscale(1) contrast(1.06) brightness(1.02)}',

/* ══ selector ◐ ══ */
'#e6-tema-btn{position:fixed;left:14px;bottom:64px;z-index:9400;',
'  width:38px;height:38px;border-radius:50%;cursor:pointer;',
'  background:var(--hud-panel-bg);border:1px solid var(--hud-border);',
'  color:var(--hud-text);font-size:15px;font-family:var(--font-mono);',
'  display:flex;align-items:center;justify-content:center;',
'  transition:all .2s ease;user-select:none}',
'#e6-tema-btn:hover{border-color:var(--hud-border-strong);transform:scale(1.08)}',

/* ══ acabados de producción (E6-E, conservados) ══ */
'html,body,.hud-pnl,.board-face,.hud-tab,.e5-sec,#ct-root,.e5-modal{',
'  transition:background-color .45s ease,color .45s ease,border-color .45s ease}',
'::selection{background:var(--hud-glow-strong);color:var(--hud-text)}',
'*{scrollbar-width:thin;scrollbar-color:var(--hud-border-strong) transparent}',
'*::-webkit-scrollbar{width:8px;height:8px}',
'*::-webkit-scrollbar-track{background:transparent}',
'*::-webkit-scrollbar-thumb{background:var(--hud-border);border-radius:99px}',
'*::-webkit-scrollbar-thumb:hover{background:var(--hud-border-strong)}',
'button:focus-visible,input:focus-visible,select:focus-visible{',
'  outline:2px solid var(--hud-border-strong);outline-offset:2px}'
].join('\n');

var st = document.createElement('style');
st.id = 'e6-temas';
st.textContent = CSS;
document.head.appendChild(st);

/* ── acentos: solo OFICINA remapea (HSL desaturado); echo lo hace la
   capa de grises; cósmico = originales ── */
function _hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');
  return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)];}
function _rgb2hex(r,g,b){return '#'+[r,g,b].map(function(x){
  return ('0'+Math.max(0,Math.min(255,Math.round(x))).toString(16)).slice(-2);}).join('');}
function _mapear(hex){
  if(!hex || hex[0] !== '#') return hex;
  var c=_hex2rgb(hex), r=c[0],g=c[1],b=c[2];
  var mx=Math.max(r,g,b)/255, mn=Math.min(r,g,b)/255, l=(mx+mn)/2, d=mx-mn;
  var h2=0, s=d===0?0:d/(1-Math.abs(2*l-1));
  if(d!==0){
    if(mx===r/255) h2=((g-b)/255/d)%6;
    else if(mx===g/255) h2=(b-r)/255/d+2;
    else h2=(r-g)/255/d+4;
    h2*=60; if(h2<0)h2+=360;
  }
  s=Math.min(s,0.42); l=0.52+Math.min(Math.max(l-0.5,0),0.12);
  var C=(1-Math.abs(2*l-1))*s, X=C*(1-Math.abs((h2/60)%2-1)), m=l-C/2, R,G,B;
  if(h2<60){R=C;G=X;B=0;}else if(h2<120){R=X;G=C;B=0;}else if(h2<180){R=0;G=C;B=X;}
  else if(h2<240){R=0;G=X;B=C;}else if(h2<300){R=X;G=0;B=C;}else{R=C;G=0;B=X;}
  return _rgb2hex((R+m)*255,(G+m)*255,(B+m)*255);
}
function acentos(tema){
  var its = window._DIAL_ITEMS;
  if(its && its.forEach){
    its.forEach(function(it){
      if(!it) return;
      if(!it.__acc0) it.__acc0 = it.accent;
      it.accent = (tema==='oficina') ? _mapear(it.__acc0) : it.__acc0;
      (it.subs||[]).forEach(function(sb){
        if(!sb.__acc0) sb.__acc0 = sb.accent;
        sb.accent = (tema==='oficina') ? _mapear(sb.__acc0) : sb.__acc0;
      });
    });
  }
  document.querySelectorAll('[data-acc]').forEach(function(el){
    if(!el.dataset.acc0) el.dataset.acc0 = el.dataset.acc;
    el.dataset.acc = (tema==='oficina') ? _mapear(el.dataset.acc0) : el.dataset.acc0;
  });
}

function capas(tema){
  /* cosmos+juice: OFF solo en OFICINA; en ECHO se quedan (grises) */
  var esconder = (tema === 'oficina');
  Array.prototype.slice.call(document.body.children).forEach(function(el){
    if(el.tagName === 'CANVAS') el.style.display = esconder ? 'none' : '';
  });
  var j = document.getElementById('juice');
  if(j) j.style.display = esconder ? 'none' : '';
}

function aplicar(tema, avisar){
  if(TEMAS.indexOf(tema) < 0) tema = 'cosmico';
  var h = document.documentElement;
  ['cosmico','oficina','echo','ejecutivo'].forEach(function(t){ h.classList.remove('tema-'+t); });
  h.classList.add('tema-' + tema);
  try{ localStorage.setItem('lifeos-tema', tema); }catch(e){}
  capas(tema); acentos(tema);
  setTimeout(function(){ capas(tema); acentos(tema); }, 1500);
  setTimeout(function(){ capas(tema); }, 4000);
  if(avisar && typeof showToast === 'function') showToast('Tema: ' + ETIQ[tema]);
}

function boton(){
  if(document.getElementById('e6-tema-btn')) return;
  var b = document.createElement('div');
  b.id = 'e6-tema-btn'; b.title = 'Cambiar tema'; b.textContent = '◐';
  b.onclick = function(){
    var actual = TEMAS.filter(function(t){
      return document.documentElement.classList.contains('tema-'+t); })[0] || 'cosmico';
    aplicar(TEMAS[(TEMAS.indexOf(actual)+1) % TEMAS.length], true);
  };
  document.body.appendChild(b);
}

/* ═══ E6-K · botones() — AUDITOR DE CONTROLES ═══
   Párate en una pestaña y córrelo EN DEVTOOLS: lista cada botón/link/
   check VISIBLE y su cableado. muerto=true → candidato a reparación
   (sin onclick, sin href útil y sin listeners — getEventListeners solo
   existe en la consola de DevTools; fuera de ahí marca '¿?'). */
window.botones = function(){
  var out = [];
  document.querySelectorAll('button, a, [onclick], input[type=checkbox], input[type=radio], .e5-btn, .e5-tab')
    .forEach(function(el){
      var r = el.getBoundingClientRect();
      if(r.width < 2 || r.height < 2) return;
      var texto = (el.textContent||el.value||'').trim().slice(0,28) ||
                  el.getAttribute('title') || el.id || el.tagName;
      var onclick = !!el.getAttribute('onclick');
      var href = el.tagName==='A' ? (el.getAttribute('href')||'') : '';
      var hrefUtil = href && href !== '#';
      var listeners = '¿?';
      try{
        if(typeof getEventListeners === 'function'){
          var L = getEventListeners(el);
          listeners = Object.keys(L).length ? Object.keys(L).join(',') : '—';
        }
      }catch(e){}
      var esCheck = el.tagName==='INPUT';
      var muerto = !onclick && !hrefUtil && !esCheck &&
                   (listeners==='—');
      out.push({ ctrl: texto, tag: el.tagName.toLowerCase(),
        onclick: onclick?'✓':'', href: hrefUtil?'✓':'',
        listeners: listeners, MUERTO: muerto?'⚠ SÍ':'' });
    });
  console.log('🔘 CONTROLES VISIBLES: '+out.length+
    ' · muertos: '+out.filter(function(x){return x.MUERTO;}).length);
  console.table(out);
  return 'Pásame las filas con ⚠ y caen por nombre.';
};

/* rebeldes(): mapa de pulido (colores inline que resisten al tema) */
window.rebeldes = function(){
  var mapa = {};
  var RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)/g;
  document.querySelectorAll('body *').forEach(function(el){
    var st2 = el.getAttribute('style'); if(!st2) return;
    var r = el.getBoundingClientRect(); if(r.width<2||r.height<2) return;
    (st2.match(RE)||[]).forEach(function(color){
      if(/var\(/.test(color)) return;
      var k = color.toLowerCase();
      if(!mapa[k]) mapa[k]={color:k,usos:0,ejemplos:[]};
      mapa[k].usos++;
      if(mapa[k].ejemplos.length<3){
        var id = el.id?'#'+el.id : el.className?'.'+String(el.className).split(' ')[0] : el.tagName.toLowerCase();
        if(mapa[k].ejemplos.indexOf(id)<0) mapa[k].ejemplos.push(id);
      }
    });
  });
  var lista=Object.keys(mapa).map(function(k){return mapa[k];})
    .sort(function(a,b){return b.usos-a.usos;});
  console.table(lista.map(function(x){return {color:x.color,usos:x.usos,donde:x.ejemplos.join(' · ')};}));
  return lista.length+' rebeldes — pásame la tabla y caen por lote.';
};

var guardado = 'cosmico';
try{ guardado = localStorage.getItem('lifeos-tema') || 'cosmico'; }catch(e){}
if(guardado === 'ejecutivo' || guardado === 'oficina') guardado = 'cosmico';   /* temas retirados → cósmico */
aplicar(guardado, false);
if(document.readyState !== 'loading') boton();
else document.addEventListener('DOMContentLoaded', boton);

/* ═══════════════════════════════════════════════════════════════════
   E6-Q · diagLifeOS() — AUDITORÍA TOTAL EN UN COMANDO.
   Corre TODO sobre la pestaña actual: layouts colapsados (el bug de
   Variables), desbordes, márgenes dispares, controles muertos y
   colores rebeldes al tema. Encadena q007()/auditar() si existen.
   ═══════════════════════════════════════════════════════════════════ */
window.diagLifeOS = function(){
  var R = {};
  console.log('%c== DIAG LIFEOS · AUDITORIA TOTAL ==','color:#A78BFA;font-weight:bold');

  /* 1 · LAYOUTS COLAPSADOS (columnas encimadas) */
  var colapsados = [];
  document.querySelectorAll('body *').forEach(function(el){
    var cs = getComputedStyle(el);
    var esFlexFila = (cs.display==='flex' && cs.flexDirection.indexOf('row')===0);
    var esGridCols = (cs.display==='grid' && cs.gridTemplateColumns.split(' ').length>1);
    if(!esFlexFila && !esGridCols) return;
    var r = el.getBoundingClientRect();
    if(r.width<60 || r.height<20) return;
    var hijos = Array.prototype.filter.call(el.children, function(c){
      var rc = c.getBoundingClientRect(); return rc.width>4 && rc.height>4; });
    if(hijos.length<2) return;
    var xs = hijos.map(function(c){ return Math.round(c.getBoundingClientRect().left); });
    var unicos = xs.filter(function(x,i){ return xs.indexOf(x)===i; });
    if(unicos.length===1){
      colapsados.push({ zona: el.id || ('.'+String(el.className||'').split(' ')[0]),
        hijos: hijos.length, display: cs.display, ancho: Math.round(r.width) });
    }
  });
  R.colapsados = colapsados.length;
  if(colapsados.length){
    console.log('%c[!] LAYOUTS COLAPSADOS ('+colapsados.length+') — columnas encimadas:','color:#F87171;font-weight:bold');
    console.table(colapsados.slice(0,12));
  } else console.log('%c[ok] Layouts sin colapsos','color:#4ADE80');

  /* 2 · DESBORDES */
  var desbordes = [];
  document.querySelectorAll('.board-face *, .hud-pnl *').forEach(function(el){
    var p = el.parentElement; if(!p) return;
    var r = el.getBoundingClientRect(), rp = p.getBoundingClientRect();
    if(r.width<10 || rp.width<10) return;
    if(r.right > rp.right + 6 && getComputedStyle(p).overflowX === 'visible'){
      desbordes.push({ elem: el.id || ('.'+String(el.className||'').split(' ')[0]) || el.tagName,
        sobra_px: Math.round(r.right - rp.right) });
    }
  });
  R.desbordes = desbordes.length;
  if(desbordes.length){
    console.log('%c[!] DESBORDES ('+desbordes.length+'):','color:#FBBF24;font-weight:bold');
    console.table(desbordes.slice(0,10));
  } else console.log('%c[ok] Sin desbordes','color:#4ADE80');

  /* 3 · MÁRGENES DISPARES en el board visible */
  var boards = Array.prototype.filter.call(document.querySelectorAll('.board-face'), function(b){
    var r = b.getBoundingClientRect(); return r.width > 100 && r.height > 100; });
  if(boards.length){
    var b0 = boards[0];
    var xs2 = Array.prototype.filter.call(b0.children, function(c){
      var r = c.getBoundingClientRect(); return r.width>80 && r.height>10; })
      .map(function(c){ return Math.round(c.getBoundingClientRect().left); });
    var u2 = xs2.filter(function(x,i){ return xs2.indexOf(x)===i; });
    R.margenes = u2.length;
    if(u2.length>1) console.log('%c[!] MARGENES DISPARES: '+u2.length+' arranques -> '+u2.join(', '),'color:#FBBF24');
    else console.log('%c[ok] Margenes uniformes','color:#4ADE80');
  }

  /* 4 · CONTROLES SIN CABLEADO */
  var muertos = [];
  document.querySelectorAll('button, a[href], [onclick], .e5-btn, .e5-tab').forEach(function(el){
    var r = el.getBoundingClientRect(); if(r.width<2 || r.height<2) return;
    var tiene = !!el.getAttribute('onclick') ||
      (el.tagName==='A' && el.getAttribute('href') && el.getAttribute('href')!=='#');
    var lis = '?';
    try{ if(typeof getEventListeners === 'function'){
      var L = getEventListeners(el);
      lis = Object.keys(L).length ? 'si' : 'no';
      if(Object.keys(L).length) tiene = true;
    } }catch(e){}
    if(!tiene && lis === 'no')
      muertos.push({ ctrl: (el.textContent||'').trim().slice(0,26) || el.id || el.tagName });
  });
  R.muertos = muertos.length;
  if(muertos.length){
    console.log('%c[!] CONTROLES SIN CABLEADO ('+muertos.length+'):','color:#F87171;font-weight:bold');
    console.table(muertos.slice(0,12));
  } else console.log('%c[ok] Controles cableados (corre en DevTools para deteccion fina)','color:#4ADE80');

  /* 5 · REBELDES AL TEMA */
  var tema = TEMAS.filter(function(x){
    return document.documentElement.classList.contains('tema-'+x); })[0] || 'cosmico';
  var mapa = {}, RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)/g;
  document.querySelectorAll('body *').forEach(function(el){
    var st2 = el.getAttribute('style'); if(!st2) return;
    var r = el.getBoundingClientRect(); if(r.width<2 || r.height<2) return;
    (st2.match(RE)||[]).forEach(function(c){
      if(c.indexOf('var(')>=0) return;
      var k = c.toLowerCase(); mapa[k] = (mapa[k]||0)+1;
    });
  });
  var reb = Object.keys(mapa).map(function(k){ return {color:k, usos:mapa[k]}; })
    .sort(function(a,b){ return b.usos-a.usos; });
  R.rebeldes = reb.length;
  console.log('%c[tema:'+tema+'] REBELDES: '+reb.length+' colores hardcodeados',
    reb.length>12 ? 'color:#FBBF24' : 'color:#4ADE80');
  if(reb.length) console.table(reb.slice(0,15));

  /* 5b · CAZADOR DE BLUR: quién aplica filter/backdrop-filter activo */
  var blurs = [];
  document.querySelectorAll('body *').forEach(function(el){
    var cs = getComputedStyle(el);
    var f = cs.filter || 'none', bf = cs.backdropFilter || cs.webkitBackdropFilter || 'none';
    if((f.indexOf('blur')<0) && (bf.indexOf('blur')<0)) return;
    var r = el.getBoundingClientRect();
    if(r.width<40 || r.height<40) return;
    blurs.push({ elem: el.id || ('.'+String(el.className||'').split(' ')[0]) || el.tagName,
      filter: f.slice(0,26), backdrop: bf.slice(0,26),
      tam: Math.round(r.width)+'x'+Math.round(r.height),
      opacidad: cs.opacity, zIndex: cs.zIndex });
  });
  R.blurs = blurs.length;
  if(blurs.length){
    console.log('%c[!] BLURS ACTIVOS ('+blurs.length+') — quien nubla la pantalla:','color:#F87171;font-weight:bold');
    console.table(blurs.slice(0,12));
  } else console.log('%c[ok] Sin blurs activos','color:#4ADE80');

  /* 6 · encadenar diagnosticos del proyecto */
  try{ if(typeof q007==='function'){ console.log('%c-- 007 --','color:#67E8F9'); q007(); } }catch(e){}
  try{ if(typeof auditar==='function'){ console.log('%c-- auditor --','color:#67E8F9'); auditar(); } }catch(e){}

  console.log('%c== RESUMEN: '+JSON.stringify(R)+' ==','color:#A78BFA;font-weight:bold');
  return R;
};

console.log('[temas] E6-F v2 · ' + ETIQ[guardado] + ' · ◐ cicla · diagLifeOS() = auditoría total');
})();
