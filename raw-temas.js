/* LifeOS — raw-temas.js (E6 · MOTOR DE TEMAS · v9)
   ═══════════════════════════════════════════════════════════════════
   Tres temas sobre los tokens reales de raw-tokens.css (--hud-* /
   --acc-*), sin tocar un solo archivo existente:
   · COSMICO   — el actual (tokens intactos, cosmos y juice ON).
   · ECHO      — Echo Visor (Metroid Prime 2): monocromo radiográfico,
                 blancos/grises sobre negro, un solo acento pálido,
                 cosmos y juice APAGADOS.
   · EJECUTIVO — lenguaje Apple/iCloud: fondos claros, texto grafito,
                 azul sistema, tipografía del sistema, cero carga
                 espacial. El default presentable.
   Selector: botón 🎨 flotante (abajo-izquierda) cicla temas; elección
   persistida en localStorage y aplicada al cargar.
   FASE 1 del theming: superficies, textos, bordes, glows y capas.
   FASE 2 (auditoría E6): acentos del dial dibujados por JS y colores
   hardcodeados fuera de tokens.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var TEMAS = ['cosmico','echo','ejecutivo'];
var ETIQ  = {cosmico:'🌌 Cósmico', echo:'🩻 Echo Visor', ejecutivo:'💼 Ejecutivo'};

var CSS = [
/* ── ECHO VISOR: radiografía monocroma ── */
'html.tema-echo{',
'  --hud-bg-base:#050505; --hud-bg-deep:#000;',
'  --hud-panel-bg:rgba(14,14,14,.92); --hud-panel-bg-hov:rgba(20,20,20,.95);',
'  --hud-panel-bg-act:rgba(26,26,26,.97); --hud-form-bg:rgba(10,10,10,.97);',
'  --hud-border:rgba(255,255,255,.16); --hud-border-hov:rgba(255,255,255,.32);',
'  --hud-border-strong:rgba(255,255,255,.5);',
'  --hud-glow:rgba(230,240,240,.12); --hud-glow-strong:rgba(230,240,240,.22);',
'  --hud-glow-soft:rgba(230,240,240,.05);',
'  --hud-text:#EDEFF0; --hud-text-mid:rgba(230,235,235,.72);',
'  --hud-text-dim:rgba(220,225,225,.42); --hud-text-faint:rgba(220,225,225,.22);',
'  --hud-ok:#D7E5E4; --hud-warn:#BFC9C8; --hud-err:#FFFFFF;',
'  --hud-ok-glow:rgba(215,229,228,.35); --hud-warn-glow:rgba(191,201,200,.35);',
'  --hud-err-glow:rgba(255,255,255,.4);',
'}',
'html.tema-echo body{background:#000 !important}',
'html.tema-echo img,html.tema-echo .ct-avatar{filter:grayscale(1)}',

/* ── EJECUTIVO: lenguaje Apple ── */
'html.tema-ejecutivo{',
'  --hud-bg-base:#F5F5F7; --hud-bg-deep:#FFFFFF;',
'  --hud-panel-bg:rgba(255,255,255,.92); --hud-panel-bg-hov:rgba(255,255,255,.97);',
'  --hud-panel-bg-act:#FFFFFF; --hud-form-bg:rgba(255,255,255,.98);',
'  --hud-border:rgba(0,0,0,.10); --hud-border-hov:rgba(0,0,0,.18);',
'  --hud-border-strong:rgba(0,0,0,.28);',
'  --hud-glow:rgba(0,113,227,.10); --hud-glow-strong:rgba(0,113,227,.18);',
'  --hud-glow-soft:rgba(0,113,227,.04);',
'  --hud-text:#1D1D1F; --hud-text-mid:rgba(29,29,31,.72);',
'  --hud-text-dim:rgba(29,29,31,.48); --hud-text-faint:rgba(29,29,31,.28);',
'  --hud-ok:#34C759; --hud-warn:#FF9F0A; --hud-err:#FF3B30;',
'  --hud-ok-glow:rgba(52,199,89,.25); --hud-warn-glow:rgba(255,159,10,.25);',
'  --hud-err-glow:rgba(255,59,48,.25);',
'  --font-ui:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;',
'}',
'html.tema-ejecutivo body{background:#F5F5F7 !important}',
'html.tema-ejecutivo .hud-tab{color:rgba(29,29,31,.6)}',

/* ── selector flotante ── */
'#e6-tema-btn{position:fixed;left:14px;bottom:64px;z-index:9400;',   /* E6-B: sobre el botón de audio — estaban superpuestos */
'  width:38px;height:38px;border-radius:50%;cursor:pointer;',
'  background:var(--hud-panel-bg);border:1px solid var(--hud-border);',
'  color:var(--hud-text);font-size:17px;display:flex;align-items:center;',
'  justify-content:center;transition:all .2s ease;user-select:none}',
'#e6-tema-btn:hover{border-color:var(--hud-border-strong);transform:scale(1.08)}',
/* E6-C: los acentos de módulos e5 (--e5c inline) obedecen al tema */
'html.tema-echo *{--e5c:#D8DEE0 !important}',
'html.tema-ejecutivo *{--e5c:#0071E3 !important}'
].join('\n');

var st = document.createElement('style');
st.id = 'e6-temas';
st.textContent = CSS;
document.head.appendChild(st);

/* ── E6-C · ACENTOS TEMÁTICOS ──
   El dial dibuja desde _DIAL_ITEMS[i].accent (JS): se remapea el DATO
   guardando el original en __acc0, y el canvas lo relee por frame.
   echo: escala de grises por luminancia (radiografía — los gajos se
   distinguen por brillo). ejecutivo: mismo matiz, saturación domada
   (HSL) — cohesión Apple. cosmico: originales restaurados. */
function _hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');
  return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)];}
function _rgb2hex(r,g,b){return '#'+[r,g,b].map(function(x){
  return ('0'+Math.max(0,Math.min(255,Math.round(x))).toString(16)).slice(-2);}).join('');}
function _mapear(tema, hex){
  if(!hex || hex[0]!=='#') return hex;
  var c=_hex2rgb(hex), r=c[0],g=c[1],b=c[2];
  if(tema==='echo'){
    var y=0.2126*r+0.7152*g+0.0722*b;
    var v=Math.round(140+ (y/255)*115);           /* 140-255: siempre legible en negro */
    return _rgb2hex(v,v,Math.round(v*0.99));
  }
  if(tema==='ejecutivo'){
    /* HSL: saturación al 45%, luz centrada 46-60% */
    var mx=Math.max(r,g,b)/255, mn=Math.min(r,g,b)/255, l=(mx+mn)/2, d=mx-mn;
    var h2=0, s=d===0?0:d/(1-Math.abs(2*l-1));
    if(d!==0){
      if(mx===r/255) h2=((g-b)/255/d)%6;
      else if(mx===g/255) h2=(b-r)/255/d+2;
      else h2=(r-g)/255/d+4;
      h2*=60; if(h2<0)h2+=360;
    }
    s=Math.min(s,0.5); l=0.46+Math.min(Math.max(l-0.5,0),0.14);
    var C=(1-Math.abs(2*l-1))*s, X=C*(1-Math.abs((h2/60)%2-1)), m=l-C/2, R,G,B;
    if(h2<60){R=C;G=X;B=0;}else if(h2<120){R=X;G=C;B=0;}else if(h2<180){R=0;G=C;B=X;}
    else if(h2<240){R=0;G=X;B=C;}else if(h2<300){R=X;G=0;B=C;}else{R=C;G=0;B=X;}
    return _rgb2hex((R+m)*255,(G+m)*255,(B+m)*255);
  }
  return hex;
}
function acentos(tema){
  var its = window._DIAL_ITEMS;
  if(its && its.forEach){
    its.forEach(function(it){
      if(!it) return;
      if(!it.__acc0) it.__acc0 = it.accent;
      it.accent = (tema==='cosmico') ? it.__acc0 : _mapear(tema, it.__acc0);
      (it.subs||[]).forEach(function(sb){
        if(!sb.__acc0) sb.__acc0 = sb.accent;
        sb.accent = (tema==='cosmico') ? sb.__acc0 : _mapear(tema, sb.__acc0);
      });
    });
  }
  /* tabs de la barra: data-acc */
  document.querySelectorAll('[data-acc]').forEach(function(el){
    if(!el.dataset.acc0) el.dataset.acc0 = el.dataset.acc;
    el.dataset.acc = (tema==='cosmico') ? el.dataset.acc0 : _mapear(tema, el.dataset.acc0);
  });
}
function capas(tema){
  /* cosmos (canvas hijo directo de body, sin id fiable) + juice */
  var esconder = (tema !== 'cosmico');
  Array.prototype.slice.call(document.body.children).forEach(function(el){
    if(el.tagName === 'CANVAS') el.style.display = esconder ? 'none' : '';
  });
  var j = document.getElementById('juice');
  if(j) j.style.display = esconder ? 'none' : '';
}

function aplicar(tema, avisar){
  if(TEMAS.indexOf(tema) < 0) tema = 'cosmico';
  var h = document.documentElement;
  TEMAS.forEach(function(t){ h.classList.remove('tema-' + t); });
  h.classList.add('tema-' + tema);
  try{ localStorage.setItem('lifeos-tema', tema); }catch(e){}
  capas(tema);
  acentos(tema);
  setTimeout(function(){ acentos(tema); }, 1500);  /* por si core llegó después */
  /* el cosmos se auto-muda a body después: re-aplicar capas al rato */
  setTimeout(function(){ capas(tema); }, 1200);
  setTimeout(function(){ capas(tema); }, 4000);
  if(avisar && typeof showToast === 'function') showToast('Tema: ' + ETIQ[tema]);
}

function boton(){
  if(document.getElementById('e6-tema-btn')) return;
  var b = document.createElement('div');
  b.id = 'e6-tema-btn';
  b.title = 'Cambiar tema';
  b.textContent = '◐';   /* E6-B: icono sobrio en tokens, no emoji */
  b.style.fontFamily = 'var(--font-mono)';
  b.onclick = function(){
    var actual = TEMAS.filter(function(t){
      return document.documentElement.classList.contains('tema-' + t);
    })[0] || 'cosmico';
    var sig = TEMAS[(TEMAS.indexOf(actual) + 1) % TEMAS.length];
    aplicar(sig, true);
  };
  document.body.appendChild(b);
}

var guardado = 'cosmico';
try{ guardado = localStorage.getItem('lifeos-tema') || 'cosmico'; }catch(e){}
aplicar(guardado, false);
if(document.readyState !== 'loading') boton();
else document.addEventListener('DOMContentLoaded', boton);

console.log('[temas] E6 activo · ' + ETIQ[guardado] + ' · 🎨 para ciclar');
})();