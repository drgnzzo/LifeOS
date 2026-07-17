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
'#e6-tema-btn:hover{border-color:var(--hud-border-strong);transform:scale(1.08)}'
].join('\n');

var st = document.createElement('style');
st.id = 'e6-temas';
st.textContent = CSS;
document.head.appendChild(st);

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
