/* LifeOS v11.3 — raw-v11-nav.js (E3-D1)
   ═══════════════════════════════════════════════════════════════════
   CAPA DE NAVEGACIÓN APENDIZADA — el motor (raw-escena.js) NO se toca.
   Consume los bindings globales del motor: SEC, N, nivel, idx,
   enTransicion, irNivel, girarA, tween, camera, anclas, gajoMeshes.

   1. SUB-ANILLOS (nivel 0): corona exterior del dial al clicar un
      sector. Datos id/label/accent/draw VERBATIM de _DIAL_ITEMS
      (raw-core.js:228) — jamás glyphs inventados. Los nodos se anclan
      en pantalla proyectando el ancla real del gajo cada frame: la
      corona VIAJA con el dial cuando girarA rota el mundo (continuo,
      sin saltos). Nacen desde el borde del dial hacia afuera como luz
      que gana potencia; mueren regresando al borde.
   2. "VER SECCIÓN": cadena animada 0→1 (descenso completo del motor)
      → girarA(sector) (el carrusel gira) → irNivel(2) (la card se
      expande). Cada paso espera al anterior. Cero teleports.
   3. PRESETS de captura: la closure preset() original corre VERBATIM
      (escribe window._dialPreset, igual que v9) y queda lista para el
      form RAW de E4. Mientras el form llega, el sub confirma con
      pulso + hint — sin botones muertos silenciosos.
   4. MINI-DIAL (niveles 1 y 2): réplica pequeña del dial bajo el
      centro, sector activo resaltado. Clic → emerger a HOME pasando
      por TODAS las animaciones de nivel (2→1→0 encadenado).
   5. _v11Home(): mismo viaje encadenado, cableado al tab HOME del
      hero. El resto de tabs sigue el puente v9 hasta E3-D2.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── guardas: si el motor no está, este módulo duerme ── */
if(typeof THREE==='undefined' || typeof window.irNivel!=='function' ||
   !window.gajoMeshes || !window.anclas || !window.SEC){
  console.warn('[v11-nav] motor no disponible — módulo inactivo');
  return;
}

/* ═══ ICONOS HELPER — VERBATIM raw-core.js:214-226 ═══ */
function _icoLibro(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.rect(x-7*k,y-9*k,14*k,18*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();ctx.beginPath();ctx.moveTo(x-7*k,y-2*k);ctx.lineTo(x-1*k,y-9*k);ctx.lineTo(x-1*k,y+5*k);ctx.closePath();ctx.strokeStyle=c;ctx.stroke();}
function _icoMovie(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.rect(x-9*k,y-6*k,18*k,12*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();[-6,-2,2,6].forEach(function(dx){ctx.beginPath();ctx.moveTo(x+dx*k,y-6*k);ctx.lineTo(x+dx*k,y+6*k);ctx.strokeStyle=c;ctx.lineWidth=1.2;ctx.stroke();});}
function _icoPendiente(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x,y,8*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(x-2.5*k,y-1*k,1.8*k,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();ctx.beginPath();ctx.arc(x+2.5*k,y+1*k,1.8*k,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();}
function _icoAhorro(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x,y,7*k,Math.PI*.15,Math.PI*2.85);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(x+7*k,y-2*k);ctx.lineTo(x+11*k,y-4*k);ctx.lineTo(x+11*k,y+2*k);ctx.fillStyle=c;ctx.fill();}
function _icoEfectivo(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.rect(x-9*k,y-5*k,18*k,10*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(x-4*k,y);ctx.lineTo(x+4*k,y);ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.lineCap='round';ctx.stroke();}
function _icoInversion(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x-8*k,y+6*k);ctx.lineTo(x-3*k,y);ctx.lineTo(x+2*k,y+4*k);ctx.lineTo(x+8*k,y-6*k);ctx.strokeStyle=c;ctx.lineWidth=2.2;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}
/* VERBATIM raw-core.js:226 */
function _icoTexto(label){ return function(ctx,x,y,s,c){ var k=s/22; ctx.font='bold '+Math.round(s*0.38)+'px -apple-system,sans-serif'; ctx.fillStyle=c; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,x,y); }; }

/* ═══ SUBS POR SECTOR — id/label/accent/draw/preset VERBATIM de
   _DIAL_ITEMS (raw-core.js:228). Los preset() escriben
   window._dialPreset igual que en v9 (los consumirá el form RAW en
   E4). Los labels que empiezan con "Ver" navegan al sector. ═══ */
window._dialPreset = window._dialPreset || {};
var SUBS = {
  activity: [
    {id:'activity', label:'Ver sección', accent:'#22d3c8', draw:_icoTexto('👁'),
     preset:function(){ window._dialPreset={irA:'irAActivity'}; }},
    {id:'libro',   label:'Libros',     accent:'#ec4899', draw:_icoLibro,
     preset:function(){ window._dialPreset={tab:'libro'}; }},
    {id:'movie',   label:'Movies',     accent:'#f59e0b', draw:_icoMovie,
     preset:function(){ window._dialPreset={tab:'movie'}; }},
    {id:'norut',   label:'Pendientes', accent:'#8b5cf6', draw:_icoPendiente,
     preset:function(){ window._dialPreset={tab:'norut'}; }}
  ],
  apartado: [
    {id:'apartado', label:'Ver sección', accent:'#c4b5fd', draw:_icoTexto('👁'),
     preset:function(){ window._dialPreset={cf:'hud-patrimonio'}; }},
    {id:'apartado', label:'Nuevo', accent:'#4ade80', draw:_icoTexto('➕'),
     preset:function(){ window._dialPreset={tab:'apartado'}; }}
  ],
  /* bancos usa subsGen (dinámico sobre _fijosData) — VERBATIM abajo */
  entrenamiento: [
    {id:'entrenamiento', label:'Ver sección', accent:'#fb923c', draw:_icoTexto('👁'),
     preset:function(){ window._dialPreset={irA:'irABitacora'}; }},
    {id:'entrenamiento', label:'Fuerza',      accent:'#fb923c', draw:_icoTexto('💪'),
     preset:function(){ window._dialPreset={tab:'entrenamiento',tipo:'Fuerza'}; }},
    {id:'entrenamiento', label:'Cardio',       accent:'#f87171', draw:_icoTexto('🏃'),
     preset:function(){ window._dialPreset={tab:'entrenamiento',tipo:'Cardio'}; }},
    {id:'entrenamiento', label:'HIIT',         accent:'#fbbf24', draw:_icoTexto('⚡'),
     preset:function(){ window._dialPreset={tab:'entrenamiento',tipo:'HIIT'}; }},
    {id:'entrenamiento', label:'Flex',         accent:'#86efac', draw:_icoTexto('🧘'),
     preset:function(){ window._dialPreset={tab:'entrenamiento',tipo:'Flexibilidad'}; }},
    {id:'entrenamiento', label:'Deporte',      accent:'#93c5fd', draw:_icoTexto('⚽'),
     preset:function(){ window._dialPreset={tab:'entrenamiento',tipo:'Deporte'}; }}
  ],
  nutricion: [
    {id:'nutricion', label:'Ver sección', accent:'#86efac', draw:_icoTexto('👁'),
     preset:function(){ window._dialPreset={irA:'irANutricion'}; }},
    {id:'nutricion', label:'Desayuno', accent:'#fbbf24', draw:_icoTexto('☀️'),
     preset:function(){ window._dialPreset={tab:'nutricion',momento:'Desayuno'}; }},
    {id:'nutricion', label:'Comida',   accent:'#86efac', draw:_icoTexto('🍽'),
     preset:function(){ window._dialPreset={tab:'nutricion',momento:'Comida'}; }},
    {id:'nutricion', label:'Cena',     accent:'#c4b5fd', draw:_icoTexto('🌙'),
     preset:function(){ window._dialPreset={tab:'nutricion',momento:'Cena'}; }},
    {id:'nutricion', label:'Snack',    accent:'#f0abfc', draw:_icoTexto('🍎'),
     preset:function(){ window._dialPreset={tab:'nutricion',momento:'Snack'}; }}
  ],
  patrimonio: [
    {id:'patrimonio', label:'Ver sección', accent:'#c4b5fd', draw:_icoTexto('👁'),
     preset:function(){ window._dialPreset={cf:'hud-patrimonio'}; }},
    {id:'patrimonio', label:'Banco',     accent:'#4ade80',  draw:_icoAhorro,
     preset:function(){ window._dialPreset={tab:'patrimonio',tipo:'ahorro'}; }},
    {id:'patrimonio', label:'Efectivo',  accent:'#fbbf24',  draw:_icoEfectivo,
     preset:function(){ window._dialPreset={tab:'patrimonio',tipo:'efectivo'}; }},
    {id:'patrimonio', label:'Inversión', accent:'#c4b5fd',  draw:_icoInversion,
     preset:function(){ window._dialPreset={tab:'patrimonio',tipo:'inversion'}; }}
  ],
  pensamiento: [
    {id:'pensamiento', label:'Ver sección', accent:'#f0abfc', draw:_icoTexto('👁'),
     preset:function(){ window._dialPreset={irA:'irABitacora'}; }},
    {id:'pensamiento', label:'Emoción',   accent:'#ec4899', draw:_icoTexto('💗'),
     preset:function(){ window._dialPreset={tab:'pensamiento',categoria:'Emoción'}; }},
    {id:'pensamiento', label:'Idea',       accent:'#fbbf24', draw:_icoTexto('💡'),
     preset:function(){ window._dialPreset={tab:'pensamiento',categoria:'Idea'}; }},
    {id:'pensamiento', label:'Reflexión',  accent:'#8b5cf6', draw:_icoTexto('🔮'),
     preset:function(){ window._dialPreset={tab:'pensamiento',categoria:'Reflexión'}; }},
    {id:'pensamiento', label:'Decisión',   accent:'#f59e0b', draw:_icoTexto('⚖'),
     preset:function(){ window._dialPreset={tab:'pensamiento',categoria:'Decisión'}; }},
    {id:'pensamiento', label:'Sueño',      accent:'#67e8f9', draw:_icoTexto('💭'),
     preset:function(){ window._dialPreset={tab:'pensamiento',categoria:'Sueño'}; }}
  ],
  persona: [
    {id:'persona', label:'+ Energía', accent:'#4ade80', draw:_icoTexto('+'),
     preset:function(){ window._dialPreset={tab:'persona',energia:1}; }},
    {id:'persona', label:'Neutral',   accent:'#94a3b8', draw:_icoTexto('○'),
     preset:function(){ window._dialPreset={tab:'persona',energia:0}; }},
    {id:'persona', label:'− Energía', accent:'#f87171', draw:_icoTexto('−'),
     preset:function(){ window._dialPreset={tab:'persona',energia:-1}; }}
  ],
  timer: [
    {id:'timer', label:'Ver timers', accent:'#67e8f9', draw:_icoTexto('⏱'),
     preset:function(){ window._dialPreset={tab:'timer', accion:'ver'}; }},
    {id:'timer', label:'Nuevo',      accent:'#4ade80', draw:_icoTexto('+'),
     preset:function(){ window._dialPreset={tab:'timer', accion:'nuevo'}; }}
  ],
  /* editar: accionEspecial en v9 (abre el form directo) → E4 */
  salud: [
    {id:'salud', label:'Ver sección', accent:'#fca5a5', draw:_icoTexto('👁'),
     preset:function(){ window._dialPreset={irA:'irABitacora'}; }},
    {id:'salud', label:'Cita',        accent:'#67e8f9', draw:_icoTexto('📅'),
     preset:function(){ window._dialPreset={tab:'salud',tipo:'Cita'}; }},
    {id:'salud', label:'Síntoma',     accent:'#f87171', draw:_icoTexto('🤒'),
     preset:function(){ window._dialPreset={tab:'salud',tipo:'Síntoma'}; }},
    {id:'salud', label:'Medicamento', accent:'#a78bfa', draw:_icoTexto('💊'),
     preset:function(){ window._dialPreset={tab:'salud',tipo:'Medicamento'}; }},
    {id:'salud', label:'Resultado',   accent:'#fbbf24', draw:_icoTexto('📋'),
     preset:function(){ window._dialPreset={tab:'salud',tipo:'Resultado'}; }},
    {id:'salud', label:'Vacuna',      accent:'#86efac', draw:_icoTexto('💉'),
     preset:function(){ window._dialPreset={tab:'salud',tipo:'Vacuna'}; }}
  ]
};
/* subsGen de BANCOS — VERBATIM raw-core.js (lee window._fijosData) */
function _subsBancos(){
  var ver={id:'bancos', label:'Ver sección', accent:'#f59e0b', draw:_icoTexto('👁'),
    preset:function(){ window._dialPreset={cf:'hud-patrimonio'}; }};
  var bancos=(window._fijosData||[]).filter(function(f){return f.nombre&&f.nombre!=='P';}).slice(0,5);
  var gen=bancos.map(function(f){
    return {id:'bancos', label:f.nombre, accent:'#f59e0b', draw:_icoTexto(f.nombre.slice(0,4)),
      preset:function(){ window._dialPreset={tab:'bancos', banco:f.nombre}; }};
  });
  return [ver].concat(gen);
}

/* ═══ util: icono canvas → dataURL (misma técnica que _icoV9) ═══ */
function _icoData(draw,color,px){
  var cv=document.createElement('canvas');cv.width=cv.height=px;
  draw(cv.getContext('2d'),px/2,px/2,px*0.62,color);
  return cv.toDataURL();
}
function _ease(t){var u=1-t;return 1-u*u*u}   /* arranque veloz, frenado largo */

/* ═══ HINT (feedback de presets) ═══ */
var _hintEl=document.createElement('div');_hintEl.id='v11-hint';
document.body.appendChild(_hintEl);
var _hintT=0;
window._v11Hint=function(t){_hint(t)};
function _hint(txt){
  _hintEl.textContent=txt;_hintEl.classList.add('on');
  clearTimeout(_hintT);_hintT=setTimeout(function(){_hintEl.classList.remove('on')},1900);
}

/* ═══ CADENAS DE NIVEL (token contra carreras) ═══ */
var _cadena=0;
function _esperarLibre(tok,fn){
  (function w(){ if(tok!==_cadena)return;
    if(!window.enTransicion)fn(); else requestAnimationFrame(w); })();
}
/* Ver sección: 0 → 1 (descenso completo) → girar carrusel → 2 */
function _verSeccion(i){
  _cadena++; var tok=_cadena;
  if(window.nivel!==0||window.enTransicion)return;
  window.irNivel(1);
  _esperarLibre(tok,function(){
    if(window.nivel!==1)return;
    if(window.idx!==i){
      window.girarA(i);
      window.tween(840,function(){},function(){
        if(tok!==_cadena)return;
        if(window.nivel===1&&!window.enTransicion)window.irNivel(2);
      });
    } else { window.irNivel(2); }
  });
}
/* Home: emerger pasando por cada nivel, con sus animaciones */
/* ═══ E3-D18 — WARP PROPORCIONAL + SCRUB POR SCROLL ═══
   (a) El warp deja de ser un destello de 1.6s que muere a medio viaje:
       su energía sigue el PROGRESO real de la transición (curva campana
       — máxima intensidad en el cruce, cero en los extremos).
   (b) El scroll SCRUBBEA la inmersión: el planeta se acerca en proporción
       a cuánto giraste la rueda; te detienes a medio camino y ahí queda,
       con el vórtice a media potencia; sigues y entras; giras al revés y
       sales. Al soltar (140ms sin rueda) actúa el IMÁN: cae al nivel más
       cercano completando la timeline del motor desde donde estés.
       Las timelines son las del motor, copiadas literal (pRaw idéntico):
       0→1 gajos .0-.3125 · alt .10-.55 · look .36-.60 · anillo .58
       1→0 look .46-.80 · alt .46-.78 → lanzamiento .72-1 · switch .47 */
var _cam = window.cam, _eF = window.easeFirma, _fase = window.fase;
var _scrub = { on:false, p:0, dir:1, base:0, tLast:0 };
function _warpP(p){                       /* campana: 0 → 1 → 0 */
  return Math.sin(Math.PI*Math.max(0,Math.min(1,p)));
}
function _pintarScrub(p){
  var h=document.documentElement;
  if(_scrub.dir>0){                       /* 0 → 1 (sumergir) */
    window.gajos.spread = 1-_eF(_fase(p,0,.3125));
    _cam.alt = _scrub.base + (172-_scrub.base)*_eF(_fase(p,.10,.55));
    _cam.look = _eF(_fase(p,.36,.60));
    var enA = p>=.58;
    if(enA !== h.classList.contains('en-anillo')){
      h.classList.toggle('en-anillo',enA); window.colocar();
    }
  } else {                                /* 1 → 0 (emerger) */
    _cam.look = 1-_eF(_fase(p,.46,.80));
    _cam.alt = 172+88*_eF(_fase(p,.46,.78));
    var fL=_eF(_fase(p,.72,1)); if(fL>0) _cam.alt = 260+(1500-260)*fL;
    var fuera = p>=.47;
    if(fuera === h.classList.contains('en-anillo')){
      h.classList.toggle('en-anillo',!fuera);
      h.classList.toggle('holo-out',!fuera);
      window.colocar();
    }
  }
  if(window._warpNivel) window._warpNivel(_scrub.dir, _warpP(p)*0.92);
}
function _abrirScrub(dir){
  _scrub.on=true; _scrub.p=0; _scrub.dir=dir; _scrub.base=_cam.alt;
  window.enTransicion=true;
  var h=document.documentElement;
  if(dir>0){ h.classList.add('oculta-hud'); window.colocar(); }
  else h.classList.add('holo-out');
}
function _cerrarScrub(){
  /* IMÁN: completa la timeline del motor desde donde estás */
  var p=_scrub.p, dir=_scrub.dir, ir=(p>=.5);
  _scrub.on=false;
  window.enTransicion=false;
  if(window._warpNivel) window._warpNivel(dir,0);
  var h=document.documentElement;
  if(dir>0){
    if(ir){ window.nivel=0; h.classList.remove('en-anillo','oculta-hud');
            _cam.alt=_scrub.base; window.colocar(); window.irNivel(1); }
    else  { h.classList.remove('en-anillo','oculta-hud');
            _cam.alt=_scrub.base; window.gajos.spread=1; window.colocar();
            window.estado(); }
  } else {
    if(ir){ window.nivel=1; h.classList.remove('holo-out'); h.classList.add('en-anillo');
            _cam.alt=172; _cam.look=1; window.colocar(); window.irNivel(0); }
    else  { h.classList.remove('holo-out'); h.classList.add('en-anillo');
            _cam.alt=172; _cam.look=1; window.colocar(); window.estado(); }
  }
}
/* rueda: fase de captura — sustituye al salto discreto del motor */
addEventListener('wheel',function(e){
  if(_formAbierto()) return;
  if(window.nivel===2){
    if(e.target.closest && e.target.closest('#seccion .panel')) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if(!window.enTransicion && e.deltaY<0) window.irNivel(1);
    return;
  }
  if(window.enTransicion && !_scrub.on) return;
  var d=e.deltaY;
  if(!_scrub.on){
    if(window.nivel===0 && d<=0) return;      /* arriba en órbita: nada */
    if(window.nivel===1 && d>0){ e.stopImmediatePropagation(); e.preventDefault();
      window.irNivel(2); return; }            /* 1→2: salto (panel) */
    e.stopImmediatePropagation(); e.preventDefault();
    _abrirScrub(window.nivel===0 ? 1 : -1);
  } else { e.stopImmediatePropagation(); e.preventDefault(); }
  /* avance proporcional al giro (normalizado; trackpad y rueda) */
  var paso = Math.max(-.34,Math.min(.34, d/1400));
  if(_scrub.dir<0) paso = -paso;
  _scrub.p = Math.max(0, Math.min(1, _scrub.p + paso));
  _scrub.tLast = performance.now();
  _pintarScrub(_scrub.p);
  if(_scrub.p>=1 || _scrub.p<=0) _cerrarScrub();
},{capture:true,passive:false});
/* imán al soltar (140ms sin rueda) */
function _pasoScrub(now){
  if(!_scrub.on) return;
  if(now-_scrub.tLast>140){
    var meta=(_scrub.p>=.5)?1:0;
    _scrub.p += (meta-_scrub.p)*0.16;         /* asentar suave */
    _pintarScrub(_scrub.p);
    if(Math.abs(meta-_scrub.p)<0.012){ _scrub.p=meta; _cerrarScrub(); }
  }
}
/* teclas/cadenas/mini-dial: warp proporcional durante toda la timeline */
(function(){
  var _inBase = window.irNivel;
  window.irNivel = function(n){
    if(_scrub.on) return;
    if(!window.enTransicion && n!==window.nivel && n>=0 && n<=2){
      var dir = n>window.nivel ? 1 : -1, t0=performance.now();
      if(window._warpNivel){
        (function seguir(t){
          var p=Math.min(1,(t-t0)/2400);
          window._warpNivel(dir,_warpP(p)*0.92);
          if(p<1) requestAnimationFrame(seguir);
          else window._warpNivel(dir,0);
        })(t0);
      }
    }
    _inBase(n);
  };
})();
window._v11Home=function(){
  _cadena++; var tok=_cadena;
  _esperarLibre(tok,function(){
    if(window.nivel===2){
      window.irNivel(1);
      _esperarLibre(tok,function(){ if(window.nivel===1)window.irNivel(0); });
    } else if(window.nivel===1){ window.irNivel(0); }
  });
};

/* ═══ SUB-ANILLO ═══ */
var ringWrap=document.createElement('div');ringWrap.id='v11-subring';
document.body.appendChild(ringWrap);
var ring={abierto:false,sector:-1,nodos:[],cerrando:false};
var _PV=new THREE.Vector3();
function _projWorld(v){ _PV.copy(v).project(window.camera);
  return {x:(_PV.x*.5+.5)*innerWidth, y:(-_PV.y*.5+.5)*innerHeight, z:_PV.z}; }
var _W0=new THREE.Vector3(), _WA=new THREE.Vector3();

function _abrirRing(i){
  if(ring.abierto&&ring.sector===i)return;
  _cerrarRing(true);                       /* switch: cierre instantáneo */
  var sec=window.SEC[i];
  var subs = sec.id==='bancos'
    ? (function(){ window._fijosData=(window._capa1Data&&window._capa1Data.fijos)||window._fijosData||[];
        return _subsBancos(); })()
    : SUBS[sec.id];
  if(!subs||!subs.length){ _hint('SECTOR SIN SUBS · CAPTURA DIRECTA EN E4'); return; }
  ring.sector=i; ring.abierto=true; ring.cerrando=false; ring.nodos=[];
  var t0=performance.now();
  subs.forEach(function(sb,j){
    var n=document.createElement('div');n.className='v11-sub';
    n.innerHTML='<div class="v11-sub-in" style="--c:'+sb.accent+'">'+
      '<img src="'+_icoData(sb.draw,sb.accent,64)+'" width="30" height="30">'+
      '<div class="t">'+sb.label+'</div></div>';
    n._sub=sb; n._j=j; n._t0=t0+j*55; n._p=0;
    n.addEventListener('click',function(ev){
      ev.stopPropagation();
      if(sb.preset)sb.preset();                       /* verbatim v9 */
      if(/^Ver /.test(sb.label)){ _cerrarRing(); _verSeccion(i); }
      else if(typeof abrirFormulario==='function'){
        /* E3-D3: el preset ya vive en _dialPreset — el form lo consume
           (mismo flujo v9: abrirFormulario aplica y limpia el preset) */
        _cerrarRing(true);
        abrirFormulario('nueva');
      } else {
        n.classList.remove('pulso');void n.offsetWidth;n.classList.add('pulso');
        _hint('PRESET LISTO · '+sb.label.toUpperCase());
      }
    });
    ringWrap.appendChild(n);ring.nodos.push(n);
  });
}
function _cerrarRing(instantaneo){
  if(!ring.abierto)return;
  if(instantaneo){
    ring.nodos.forEach(function(n){n.remove()});
    ring.nodos=[];ring.abierto=false;ring.sector=-1;ring.cerrando=false;
    return;
  }
  ring.cerrando=true;
  var t0=performance.now();
  ring.nodos.forEach(function(n,j){ n._t0=t0+j*30; n._pIni=n._p; });
}

/* colocación por frame: la corona sigue al ancla real del sector */
function _pasoRing(now){
  if(!ring.abierto)return;
  if(window.nivel!==0||window.enTransicion){ _cerrarRing(true); return; }
  var s=ring.sector, M=ring.nodos.length;
  window.anclas[s].pt.getWorldPosition(_WA);
  _W0.set(0,10,0);
  var C=_projWorld(_W0), A=_projWorld(_WA);
  var dx=A.x-C.x, dy=A.y-C.y, rA=Math.hypot(dx,dy);
  if(rA<2)return;
  var phi=Math.atan2(dy,dx);
  /* GEOMETRÍA v9 EXACTA (_DC: R_OUT 310 · R_SI 328 · R_SO 420 ·
     spread π*0.50, items en centros de slice — raw-overlay:7376-7380) */
  var rOutS=rA*(372/272);
  var rSub=rOutS*((328+420)/2/310);          /* ×1.2065 */
  var spread=Math.PI*0.50, subSlice=spread/M, startA=phi-spread/2;
  var vivo=false;
  for(var j=0;j<M;j++){
    var n=ring.nodos[j];
    if(ring.cerrando){
      var q=Math.min(1,Math.max(0,(now-n._t0)/220));
      n._p=(n._pIni!==undefined?n._pIni:1)*(1-q);
      if(n._p>0.005)vivo=true;
    } else {
      var q2=Math.min(1,Math.max(0,(now-n._t0)/380));
      n._p=_ease(q2);
      vivo=true;
    }
    var e=n._p;
    var r=rOutS+(rSub-rOutS)*e;
    var a=startA+(j+0.5)*subSlice;
    n.style.transform='translate('+(C.x+Math.cos(a)*r)+'px,'+(C.y+Math.sin(a)*r)+'px)';
    n.style.opacity=e.toFixed(3);
    n.style.pointerEvents=(e>0.6&&!ring.cerrando)?'auto':'none';
  }
  if(ring.cerrando&&!vivo)_cerrarRing(true);
}

/* ═══ MINI-DIAL (niveles 1-2) ═══ */
var mini=document.createElement('canvas');mini.id='v11-minidial';
mini.width=184;mini.height=184;                 /* 2× para retina */
document.body.appendChild(mini);
mini.title='Emerger a HOME';
mini.addEventListener('click',function(){ window._v11Home(); });
var _miniIdx=-1,_miniOn=null;
function _pintarMini(){
  var c=mini.getContext('2d'),Nn=window.N,cx=92,cy=92;
  c.clearRect(0,0,184,184);
  var seg=Math.PI*2/Nn;
  for(var i=0;i<Nn;i++){
    var a0=-Math.PI/2+i*seg-seg/2+0.03, a1=a0+seg-0.06;
    var act=(i===window.idx);
    c.beginPath();c.arc(cx,cy,74,a0,a1);c.arc(cx,cy,30,a1,a0,true);c.closePath();
    c.fillStyle=window.SEC[i].c;
    c.globalAlpha=act?0.92:0.22;
    c.shadowColor=act?window.SEC[i].c:'transparent';
    c.shadowBlur=act?16:0;
    c.fill();
    c.shadowBlur=0;
  }
  c.globalAlpha=1;
  c.beginPath();c.arc(cx,cy,20,0,Math.PI*2);
  c.fillStyle='rgba(18,12,36,.95)';c.fill();
  c.lineWidth=1.5;c.strokeStyle='rgba(167,139,250,.55)';c.stroke();
  c.beginPath();c.arc(cx,cy,4,0,Math.PI*2);c.fillStyle='#A78BFA';
  c.shadowColor='#A78BFA';c.shadowBlur=10;c.fill();c.shadowBlur=0;
}
function _pasoMini(){
  var mostrar=(window.nivel>=1&&!window.enTransicion);
  if(mostrar!==_miniOn){ _miniOn=mostrar; mini.classList.toggle('on',mostrar); }
  if(mostrar&&window.idx!==_miniIdx){ _miniIdx=window.idx; _pintarMini(); }
}


/* ═══════════════════════════════════════════════════════════════════
   E3-D5 — TRATAMIENTO v9 DEL DIAL (valores VERBATIM de _dialDrawSector,
   raw-overlay.js:7389-7448): tinte del acento .18 activo / .08 reposo,
   borde exterior con glow (blur 12 reposo / 28+pasada 50 activo),
   rim interior rgba(acento,.15). Reproducido en 3D como:
   · piso de emisivo por sector (envoltura de poblarCards)
   · arcos de borde con halo (RingGeometry aditiva) que viajan con el
     mundo y se ABSORBEN con los gajos (opacidad × gajos.spread)
   · anillo exterior segmentado cian/violeta con deriva (v9)
   · hover: el sector gana potencia (como luz), cursor pointer
   ═══════════════════════════════════════════════════════════════════ */
var _R2=372, _PLANO_Y=8, _GAP=0.045;
var _angSec=[];                       /* ángulo mundo-local por sector */
(function(){
  var W=new THREE.Vector3();
  for(var i=0;i<window.N;i++){        /* giroMundo=0 en init: world==local */
    window.anclas[i].pt.getWorldPosition(W);
    _angSec.push(Math.atan2(W.z,W.x));
  }
})();
function _arcoRing(rIn,rOut,a0,len,color,op){
  var g=new THREE.RingGeometry(rIn,rOut,40,1,-(a0+len),len);
  var m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:color,fog:false,
    transparent:true,opacity:op,blending:THREE.AdditiveBlending,
    depthWrite:false,side:THREE.DoubleSide}));
  m.rotation.x=-Math.PI/2; m.position.y=_PLANO_Y; m.renderOrder=3;
  return m;
}
var _rimG=new THREE.Group(); window.mundo.add(_rimG);
var _rims=[];                          /* {core,halo,inner} por sector */
(function(){
  var half=Math.PI/window.N-_GAP;
  for(var i=0;i<window.N;i++){
    var c=new THREE.Color(window.SEC[i].c), a0=_angSec[i]-half, ln=half*2;
    var core =_arcoRing(_R2-2.6,_R2+2.6,a0,ln,c,.85);   /* arco protagonista v9 */
    var halo =_arcoRing(_R2-10, _R2+12, a0,ln,c,.22);   /* glow blur12 */
    var inner=_arcoRing(172-1,  172+1.4,a0,ln,c,.18);   /* rim interior */
    _rimG.add(core,halo,inner);
    _rims.push({core:core,halo:halo,inner:inner});
  }
})();
/* E3-D8: el anillo decorativo 3D se retira — el cosmos v9 exacto
   (raw-v11-cosmos.js) dibuja SUS anillos de Dyson alrededor del dial */
if(window._v11Cosmos) window._v11Cosmos.visible=false;   /* E3-A fuera: exacto > interpretado */
if(window._v11Rayas&&window.scene) window.scene.remove(window._v11Rayas);
/* E3-D12: el warp canónico es el del cosmos v9 (vórtice joseph,
   exp(-r×7)) — se dispara espejando las clases niv-* que su director
   observa. raw-app.css solo las usa sobre .app (inexistente aquí). */
/* piso v9 de emisivo: envoltura de poblarCards (misma propiedad que la
   capa de datos ya escribe; el motor jamás la toca) */
function _pisoV9(){
  for(var i=0;i<window.N;i++){
    var mesh=window.gajoMeshes[i];
    var I=mesh.material.emissiveIntensity;          /* .12–.38 (capa datos) */
    mesh._v11I = .16 + Math.max(0,(I-.12))*0.6;     /* v9 reposo .08: casi
                                                       oscuro → .16–.31 */
    mesh.material.emissiveIntensity = mesh._v11I;
    if(mesh.children[0]&&mesh.children[0].material){
      var o=mesh.children[0].material.opacity;
      mesh.children[0].material.opacity = Math.min(1,.62+Math.max(0,(o-.55))*.6);
    }
  }
}
var _pcBase=window.poblarCards;
window.poblarCards=function(d){ _pcBase(d); _pisoV9(); };
_pisoV9();
/* hover: raycast en mousemove (nivel 0) — el sector gana potencia */
var _hov=-1,_rayH=new THREE.Raycaster(),_ptrH=new THREE.Vector2();
function _setHover(i){
  if(i===_hov)return;
  if(_hov>=0){
    var m0=window.gajoMeshes[_hov];
    m0.material.emissiveIntensity=m0._v11I||.30;
    _rims[_hov].core.material.opacity=.55;
    _rims[_hov].halo.material.opacity=.14;
  }
  _hov=i;
  if(i>=0){
    var m=window.gajoMeshes[i];
    m.material.emissiveIntensity=Math.max(.42,(m._v11I||.16)+.18);   /* hover v9 .18 */
    _rims[i].core.material.opacity=1;      /* activo: w3.5 blur28+50 ~ */
    _rims[i].halo.material.opacity=.45;
  }
  document.body.style.cursor=(i>=0)?'pointer':'';
}
addEventListener('mousemove',function(e){
  if(window.nivel!==0||window.enTransicion){ if(_hov>=0)_setHover(-1); return; }
  _ptrH.x=(e.clientX/innerWidth)*2-1;_ptrH.y=-(e.clientY/innerHeight)*2+1;
  _rayH.setFromCamera(_ptrH,window.camera);
  var h=_rayH.intersectObjects(_gajos3D,false);
  _setHover(h.length?h[0].object.userData.i:-1);
},{passive:true});


/* ═══ E3-D8 — CENTRO RAW (v9 _dialDrawCentro, raw-overlay:7449-...):
   gradiente rgba(28,28,50)→(14,14,28)→(8,8,16), anillo violeta;
   hover: gradiente vivo + doble anillo pulsante rgba(165,150,255).
   Vive atado al dial: opacidad = (1−lift)·spread — en el descenso se
   absorbe con los gajos, exactamente como pediste. ═══ */
var _hub=document.createElement('div');_hub.id='v11-hub';
_hub.innerHTML='<div class="h-in"><div class="h-ico">⇄</div><div class="h-t">RAW</div></div>';
document.body.appendChild(_hub);
var _hubHov=false;
function _pasoHub(){
  window.anclas[0].pt.getWorldPosition(_WA);
  _W0.set(0,10,0);
  var C=_projWorld(_W0), A=_projWorld(_WA);
  var rA=Math.hypot(A.x-C.x,A.y-C.y);
  var rIn=rA*(108/272);   /* E3-D17: proporción v9 (R_IN 90/R_OUT 310)
                              — el hub deja VER el planeta alrededor */
  var g=window.gajos;
  var vis=(window.nivel===0||window.enTransicion)?1:0;
  var o=((1-g.lift)*g.spread*vis);
  _hub.style.transform='translate('+(C.x-rIn)+'px,'+(C.y-rIn)+'px)';
  _hub.style.width=_hub.style.height=(rIn*2)+'px';
  _hub.style.opacity=(o*_rev).toFixed(3);
  _hub.style.pointerEvents=(o>0.6)?'auto':'none';
}
addEventListener('mousemove',function(e){
  if(window.nivel!==0){ if(_hubHov){_hubHov=false;_hub.classList.remove('hov');} return; }
  _W0.set(0,10,0); var C=_projWorld(_W0);
  window.anclas[0].pt.getWorldPosition(_WA); var A=_projWorld(_WA);
  var rIn=Math.hypot(A.x-C.x,A.y-C.y)*(108/272);
  var dentro=Math.hypot(e.clientX-C.x,e.clientY-C.y)<rIn;
  if(dentro!==_hubHov){_hubHov=dentro;_hub.classList.toggle('hov',dentro);}
},{passive:true});
_hub.addEventListener('click',function(e){
  e.stopPropagation();
  if(typeof abrirFormulario==='function'){_cerrarRing(true);abrirFormulario('nueva');}
});

/* ═══ E3-D8 — LABELS RADIALES (proto aprobado): el texto sale de la
   pestaña, orientado a su sector; se voltea 180° en la mitad baja
   para seguir legible. Tipografía fuerte (CSS). ═══ */
function _pasoLabelsRadiales(){
  if(window.nivel!==0&&!window.enTransicion)return;
  _W0.set(0,10,0); var C=_projWorld(_W0);
  for(var i=0;i<window.N;i++){
    window.anclas[i].pt.getWorldPosition(_WA);
    var A=_projWorld(_WA);
    var ang=Math.atan2(A.y-C.y,A.x-C.x)*180/Math.PI+90;
    if(ang>90&&ang<270)ang+=180;
    var inner=window.anclas[i].lbl.firstElementChild;
    if(inner&&inner._rot!==Math.round(ang)){
      inner._rot=Math.round(ang);
      inner.style.transform='translate(-50%,-50%) rotate('+ang.toFixed(1)+'deg)';
    }
  }
}


/* ═══ E3-D16 — REVELADO POR CAPAS (proceso v9): al terminar el loading
   (html.hud-listo) NADA aparece de golpe:
     t0    · el cosmos ya respira (el loading retiró render-block)
     +0.4s · hero  → +0.7s banda USER/SIM → +0.9s banda inferior (CSS)
     +1.2s · EL DIAL entra en fade LENTO (1.9s): factor _rev aplicado
             por JS paso-a-paso al canvas GL (ley física: jamás
             transition CSS sobre WebGL), a labels (envoltura de
             proyectarAnclas), hub y arcos. ═══ */
var _rev = 0, _revT0 = 0, _revListo = false;
var _pAnclasBase = window.proyectarAnclas;
window.proyectarAnclas = function(){
  _pAnclasBase();
  if(_rev>=1) return;
  for(var i=0;i<window.anclas.length;i++){
    var l=window.anclas[i].lbl;
    l.style.opacity = (parseFloat(l.style.opacity)||0)*_rev;
  }
};
function _pasoReveal(now){
  if(_rev>=1) return;
  if(!_revListo){
    if(document.documentElement.classList.contains('hud-listo')){
      _revListo = true; _revT0 = now + 1200;          /* dial: el último */
    } else return;
  }
  if(now < _revT0){ _rev = 0; }
  else _rev = _ease(Math.min(1,(now-_revT0)/1900));
  var gl=document.getElementById('gl');
  if(gl) gl.style.opacity = _rev.toFixed(3);           /* JS por frame, sin transition */
}

/* ═══ ENTRADAS ═══ */
var _ray=new THREE.Raycaster(),_ptr=new THREE.Vector2();
addEventListener('click',function(e){
  if(e.target.closest&&(e.target.closest('.v11-sub')||e.target.closest('#v11-minidial')))return;
  if(e.target.closest&&(e.target.closest('.hero')||e.target.closest('#v11-top')||
     e.target.closest('#v11-bot')||e.target.closest('#seccion')))return;
  if(window.nivel!==0||window.enTransicion)return;
  /* E3-D5: en nivel 0 el clic es NUESTRO — el dial no gira (v9).
     stopImmediatePropagation corta el listener del motor (girarA). */
  e.stopImmediatePropagation();
  _ptr.x=(e.clientX/innerWidth)*2-1;_ptr.y=-(e.clientY/innerHeight)*2+1;
  _ray.setFromCamera(_ptr,window.camera);
  var hit=_ray.intersectObjects(_gajos3D,false);
  if(hit.length){
    var i=hit[0].object.userData.i;
    if(window.SEC[i].id==='editar' && typeof abrirFormulario==='function'){
      /* v9: editar = accionEspecial → form directo en modo editar */
      _cerrarRing(true); abrirFormulario('editar'); return;
    }
    if(ring.abierto&&ring.sector===i)_cerrarRing();
    else _abrirRing(i);                  /* girarA del motor corre en paralelo:
                                            la corona viaja con el sector */
  } else {
    /* ¿clic en el CENTRO (hub RAW)? → el form maestro (v9: centro del dial) */
    if(typeof abrirFormulario==='function'){
      window.anclas[0].pt.getWorldPosition(_WA);
      _W0.set(0,10,0);
      var C0=_projWorld(_W0), A0=_projWorld(_WA);
      var rA0=Math.hypot(A0.x-C0.x,A0.y-C0.y);
      var dC=Math.hypot(e.clientX-C0.x,e.clientY-C0.y);
      if(rA0>2 && dC < rA0*(108/272)){    /* dentro del hub v9 */
        _cerrarRing(true); abrirFormulario('nueva'); return;
      }
    }
    if(ring.abierto){ _cerrarRing(); }
  }
},true);   /* E3-D5: captura — antes que el clic del motor */
addEventListener('keydown',function(e){
  if(e.key==='Escape'&&ring.abierto)_cerrarRing();
},{passive:true});
/* E3-D3 — mientras el FORM está abierto, el motor no debe navegar:
   fase de captura (corre ANTES que los listeners del motor). Escape
   cierra el form; el resto de teclas fluye a los inputs intacto. */
function _formAbierto(){
  var dd=document.getElementById('entrada-dropdown');
  return !!(dd && dd.classList.contains('show'));
}
addEventListener('keydown',function(e){
  if(!_formAbierto())return;
  if(e.key==='Escape'){ if(typeof cerrarEntrada==='function')cerrarEntrada(); }
  e.stopImmediatePropagation();
},true);
/* (rueda: gestionada por el scrub de E3-D18) */


/* ═══════════════════════════════════════════════════════════════════
   E3-D2 — PANELES v9 EN NIVEL 2
   _expHeader + bloques hud-patrimonio / hud-bitacora / hud-activity
   RESCATADOS VERBATIM de raw-overlay.js:5697-6493 (extracción sed,
   cero retipeo). Consumen window._patrimonioData/_apartadosData/
   _pensamientosData/_relacionesData/_saludData/_nutData/_entData/
   _actData/_logrosData — distribuidos abajo desde el getAll de escena.
   ═══════════════════════════════════════════════════════════════════ */
  function _expHeader(titulo, subtitulo, iconClass, color){
    var sub = subtitulo
      ? '<div style="font-size:var(--fs-2xs);font-weight:600;letter-spacing:.10em;text-transform:uppercase;color:var(--hud-text-dim);margin-top:2px">'+subtitulo+'</div>'
      : '';
    // v8.41 — REVEAL POR LÍNEAS (Hubtown): el título entra deslizándose
    // desde abajo dentro de un wrapper con overflow oculto, con la curva
    // firma. El keyframe se inyecta una vez.
    return ''+
      '<div style="display:flex;align-items:center;gap:var(--sp-3);padding:0 2px">'+
        '<div style="width:34px;height:34px;border-radius:var(--rad-card);flex-shrink:0;'+
          'background:color-mix(in srgb,'+color+' 12%,transparent);'+
          'border:1px solid color-mix(in srgb,'+color+' 40%,transparent);'+
          'display:flex;align-items:center;justify-content:center;'+
          'box-shadow:0 0 12px color-mix(in srgb,'+color+' 22%,transparent)">'+
          '<i class="'+iconClass+'" style="color:'+color+';font-size:15px"></i>'+
        '</div>'+
        '<div style="min-width:0">'+
          '<div style="overflow:hidden">'+
            '<div style="font-size:var(--fs-base);font-weight:var(--fw-bold);letter-spacing:var(--ls-title);'+
              'color:'+color+';text-shadow:0 0 8px color-mix(in srgb,'+color+' 35%,transparent);'+
              'animation:expTituloReveal .65s var(--ease-hub) both">'+titulo+'</div>'+
          '</div>'+
          sub+
        '</div>'+
      '</div>';
  }
  window._expHeader = _expHeader;
  // Keyframe del reveal (una sola vez)
  (function(){
    if(document.getElementById('exp-reveal-kf')) return;
    var st = document.createElement('style');
    st.id = 'exp-reveal-kf';
    st.textContent = '@keyframes expTituloReveal{from{transform:translateY(115%)}to{transform:translateY(0)}}';
    document.head.appendChild(st);
  })();

  var _EXPAND_CONFIG = {
    'hud-patrimonio': {
      html: function(){
        return ''+
        '<div style="display:flex;flex-direction:column;gap:14px;padding:0;height:100%">'+
          // ── HEADER unificado (v8.9) ──
          _expHeader('CENTRO PATRIMONIAL', '', 'fas fa-landmark', '#22C55E')+
          // ── 5 cards top con sparkline + delta ──
          '<div id="pat-cards-row" style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr 1.1fr;gap:10px;flex-shrink:0"></div>'+
          // ── Banda Bruto = Disponible + Apartados ──
          '<div id="pat-banda" style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:12px;align-items:center;padding:14px 16px;border:1px solid rgba(34,197,94,0.18);border-radius:var(--rad-lg);background:rgba(34,197,94,0.03);flex-shrink:0"></div>'+
          // ── Saldos y Cuentas + Distribución de Fondos ──
          '<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:10px;flex-shrink:0">'+
            '<div id="pat-saldos" style="padding:12px;border:1px solid rgba(34,197,94,0.18);border-radius:var(--rad-lg);background:rgba(34,197,94,0.03)"></div>'+
            '<div id="pat-distribucion" style="padding:12px;border:1px solid rgba(34,197,94,0.18);border-radius:var(--rad-lg);background:rgba(34,197,94,0.03);display:flex;flex-direction:column"></div>'+
          '</div>'+
          // ── Apartados (crece para llenar el alto restante; scroll si es largo) ──
          '<div id="pat-apartados" style="padding:12px;border:1px solid rgba(34,197,94,0.18);border-radius:var(--rad-lg);background:rgba(34,197,94,0.03);flex:1;min-height:0;overflow-y:auto"></div>'+
        '</div>';
      },
      hydrate: function(){
        var data = window._patrimonioData || {};
        if(!data.ok && typeof api !== 'undefined' && api.getPatrimonio){
          api.getPatrimonio().then(function(d){
            window._patrimonioData = d;
            var cfg = window._EXPAND_CONFIG && window._EXPAND_CONFIG['hud-patrimonio'];
            if(cfg && document.getElementById('pat-cards-row')) cfg.hydrate();
          }).catch(function(){});
        }
        var banco = data.banco || {saldo:0, items:[]};
        var fisico = data.fisico || {saldo:0, items:[]};
        var inv = data.inversion || {saldo:0, items:[]};
        var fondo = data.fondo || {};
        var total = data.total || 0;
        // Apartados
        var apartados = window._apartadosData || [];
        var totalAp = apartados.filter(function(a){ return !(a.estado&&a.estado.toLowerCase()==='usado'); })
                               .reduce(function(s,a){ return s + (a.monto||0); }, 0);
        var totalDisp = total - totalAp;

        var fmt = function(v){ return '$ '+Math.abs(v||0).toLocaleString('es-MX',{minimumFractionDigits:0}); };
        var fmt2 = function(v){ return '$ '+Math.abs(v||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}); };
        function _spark(color, seed){
          var pts = []; for(var i=0;i<10;i++){ pts.push((i*8)+','+(22-((Math.sin(i*0.7+seed)+1)/2*16)).toFixed(1)); }
          return '<svg viewBox="0 0 80 24" preserveAspectRatio="none" style="width:100%;height:34px;margin-top:4px"><polyline points="'+pts.join(' ')+'" fill="none" stroke="'+color+'" stroke-width="1.4" stroke-linecap="round" style="filter:drop-shadow(0 0 3px '+color+'80)"/></svg>';
        }
        function _card(label, value, color, delta, deltaSign){
          return '<div style="padding:11px 13px;border:1px solid '+color+'40;border-radius:10px;background:'+color+'08;position:relative;overflow:hidden">'+
            '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:'+color+';box-shadow:0 0 8px '+color+';opacity:.7"></div>'+
            '<div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:'+color+';margin-bottom:6px;opacity:.85">'+label+'</div>'+
            '<div style="font-size:17px;font-weight:800;color:'+color+';font-family:JetBrains Mono,monospace;line-height:1;text-shadow:0 0 10px '+color+'40;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+value+'</div>'+
            _spark(color, color.charCodeAt(1))+
            (delta!==undefined ? '<div style="font-size:9px;color:'+(deltaSign>=0?'#4ADE80':'#EF4444')+';margin-top:2px;font-weight:700">'+(deltaSign>=0?'+':'')+delta+'% vs ayer</div>' : '')+
          '</div>';
        }
        // 5 cards
        var fondoPct = fondo.avance||0;
        var fondoMeta = fondo.meta||0;
        document.getElementById('pat-cards-row').innerHTML =
          _card('Disponible Hoy', fmt2(totalDisp), '#22C55E', 3.2, 1)+
          _card('Banco',           fmt2(banco.saldo),  '#4ADE80', 1.8, 1)+
          _card('Efectivo',        fmt2(fisico.saldo), '#FBBF24', 0.0, 0)+
          _card('Apartados',       fmt2(totalAp),      '#F59E0B', -0.4, -1)+
          '<div style="padding:11px 13px;border:1px solid rgba(34,197,94,0.40);border-radius:10px;background:rgba(34,197,94,0.06);position:relative;overflow:hidden">'+
            '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:#22C55E;box-shadow:0 0 8px #22C55E;opacity:.7"></div>'+
            '<div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#22C55E;margin-bottom:6px;opacity:.85">Fondo de Emergencia</div>'+
            '<div style="font-size:17px;font-weight:800;color:#22C55E;font-family:JetBrains Mono,monospace;line-height:1">'+fondoPct+'%</div>'+
            '<div style="height:4px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;margin-top:8px"><div style="width:'+Math.min(100,fondoPct)+'%;height:100%;background:linear-gradient(90deg,#22C55E,#4ADE80);box-shadow:0 0 6px #22C55E;border-radius:999px"></div></div>'+
            (fondoMeta>0 ? '<div style="font-size:9px;color:rgba(220,224,235,0.55);margin-top:3px">Meta <span style="color:#fff;font-family:JetBrains Mono,monospace;font-weight:700">'+fmt(fondoMeta)+'</span></div>' : '')+
          '</div>';

        // Banda
        var pctApart = total>0 ? Math.round((totalAp/total)*100) : 0;
        document.getElementById('pat-banda').innerHTML =
          '<div style="display:flex;align-items:center;gap:10px">'+
            '<div style="width:30px;height:30px;border-radius:7px;background:rgba(34,197,94,0.14);border:1px solid rgba(34,197,94,0.40);display:flex;align-items:center;justify-content:center"><i class="fas fa-coins" style="color:#22C55E;font-size:13px"></i></div>'+
            '<div><div style="font-size:9px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55)">Patrimonio Bruto</div>'+
              '<div style="font-size:18px;font-weight:800;color:#fff;font-family:JetBrains Mono,monospace;white-space:nowrap">'+fmt2(total)+'</div>'+
              '<div style="font-size:9px;color:rgba(220,224,235,0.45)">Activos totales</div></div>'+
          '</div>'+
          '<div style="color:rgba(220,224,235,0.30);font-size:18px;font-weight:300">−</div>'+
          '<div style="display:flex;align-items:center;gap:10px">'+
            '<div style="width:30px;height:30px;border-radius:7px;background:rgba(74,222,128,0.14);border:1px solid rgba(74,222,128,0.40);display:flex;align-items:center;justify-content:center"><i class="fas fa-wallet" style="color:#4ADE80;font-size:13px"></i></div>'+
            '<div><div style="font-size:9px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55)">Disponible Total</div>'+
              '<div style="font-size:18px;font-weight:800;color:#4ADE80;font-family:JetBrains Mono,monospace;white-space:nowrap">'+fmt2(totalDisp)+'</div>'+
              '<div style="font-size:9px;color:rgba(220,224,235,0.45)">Liquidez inmediata</div></div>'+
          '</div>'+
          '<div style="color:rgba(220,224,235,0.30);font-size:18px;font-weight:300">=</div>'+
          '<div style="display:flex;align-items:center;gap:10px;justify-content:flex-end">'+
            '<div style="text-align:right"><div style="font-size:9px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55)">Apartados / Objetivos</div>'+
              '<div style="font-size:18px;font-weight:800;color:#F59E0B;font-family:JetBrains Mono,monospace;white-space:nowrap">'+fmt2(totalAp)+' <span style="color:rgba(220,224,235,0.45);font-size:13px;font-weight:600">· '+pctApart+'%</span></div>'+
              '<div style="font-size:9px;color:rgba(220,224,235,0.45)">Asignado a metas · '+pctApart+'% del patrimonio bruto</div></div>'+
            '<div style="width:30px;height:30px;border-radius:7px;background:rgba(245,158,11,0.14);border:1px solid rgba(245,158,11,0.40);display:flex;align-items:center;justify-content:center"><i class="fas fa-lock" style="color:#F59E0B;font-size:13px"></i></div>'+
          '</div>';

        // ── Saldos y Cuentas: TODOS los fijos reales, con apartados por banco ──
        // v5.149: usa la misma lógica que renderPatrimonio de HOME.
        // Cada banco muestra: saldo bruto, apartados de ese banco, disponible neto.
        (function(){
          var fijosReales = window._fijosData || [];
          var fijosVisibles = fijosReales.filter(function(fi){ return fi.nombre !== 'P'; });
          var pFila = fijosReales.find(function(fi){ return fi.nombre === 'P'; });

          // Apartados por banco (igual que HOME)
          var apartadosArr = window._apartadosData || [];
          var apPorBanco = {};
          var totalApActivos = 0;
          apartadosArr.forEach(function(ap){
            if(ap.estado && ap.estado.toLowerCase()==='usado') return;
            var b = (ap.banco||'').trim().toUpperCase();
            apPorBanco[b] = (apPorBanco[b]||0) + (ap.monto||0);
            totalApActivos += (ap.monto||0);
          });

          var rows = fijosVisibles.map(function(fi){
            var bancKey = (fi.nombre||'').trim().toUpperCase();
            var apBanco = apPorBanco[bancKey] || 0;
            var dispBanco = (fi.monto||0) - apBanco;
            var col = (fi.monto||0) >= 0 ? '#4ADE80' : '#EF4444';
            return '<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">'+
              '<td style="padding:8px 6px">'+
                '<div style="display:flex;align-items:center;gap:8px">'+
                  '<div style="width:26px;height:26px;border-radius:6px;background:'+col+'1a;border:1px solid '+col+'55;display:flex;align-items:center;justify-content:center"><i class="fas fa-building-columns" style="color:'+col+';font-size:10px"></i></div>'+
                  '<div><div style="font-size:11px;font-weight:800;color:#fff">'+fi.nombre+'</div></div>'+
                '</div>'+
              '</td>'+
              '<td style="padding:8px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700;color:'+col+';white-space:nowrap">'+fmt2(fi.monto)+'</td>'+
              '<td style="padding:8px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700;color:'+(apBanco>0?'#F59E0B':'rgba(220,224,235,0.35)')+';white-space:nowrap">'+(apBanco>0?'-':'')+fmt(apBanco)+'</td>'+
              '<td style="padding:8px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:12px;font-weight:800;color:#4ADE80;white-space:nowrap">'+fmt2(dispBanco)+'</td>'+
            '</tr>';
          }).join('');

          // Fila P* (excluida del total, pero visible como indicador)
          if(pFila){
            rows += '<tr style="border-top:1px dashed rgba(239,68,68,0.30)">'+
              '<td style="padding:8px 6px">'+
                '<div style="display:flex;align-items:center;gap:8px">'+
                  '<div style="width:26px;height:26px;border-radius:6px;background:rgba(239,68,68,0.10);border:1px solid rgba(239,68,68,0.40);display:flex;align-items:center;justify-content:center"><i class="fas fa-circle-exclamation" style="color:#EF4444;font-size:10px"></i></div>'+
                  '<div><div style="font-size:11px;font-weight:800;color:#fff">P <span style="color:#EF4444">*</span></div><div style="font-size:9px;color:rgba(220,224,235,0.45)">Indicador, excluido del total</div></div>'+
                '</div>'+
              '</td>'+
              '<td style="padding:8px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700;color:#EF4444;white-space:nowrap">'+fmt2(pFila.monto)+'</td>'+
              '<td style="padding:8px 6px;text-align:right;color:rgba(220,224,235,0.30)">—</td>'+
              '<td style="padding:8px 6px;text-align:right;color:rgba(220,224,235,0.30)">—</td>'+
            '</tr>';
          }

          // Total
          var sumDisp = fijosVisibles.reduce(function(s,fi){
            var bancKey = (fi.nombre||'').trim().toUpperCase();
            var apBanco = apPorBanco[bancKey] || 0;
            return s + ((fi.monto||0) - apBanco);
          }, 0);
          var sumBruto = fijosVisibles.reduce(function(s,fi){ return s + (fi.monto||0); }, 0);

          document.getElementById('pat-saldos').innerHTML =
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
              '<div style="font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#22C55E">Saldos por banco</div>'+
              '<div style="font-size:11px;color:rgba(220,224,235,0.55)">'+fijosVisibles.length+' cuentas'+(pFila?' + P*':'')+'</div>'+
            '</div>'+
            '<table style="width:100%;border-collapse:collapse">'+
              '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.08)">'+
                '<th style="padding:6px 6px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:left">Cuenta</th>'+
                '<th style="padding:6px 6px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Saldo bruto</th>'+
                '<th style="padding:6px 6px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Apartados</th>'+
                '<th style="padding:6px 6px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Disponible</th>'+
              '</tr></thead>'+
              '<tbody>'+(rows || '<tr><td colspan="4" style="padding:18px;text-align:center;color:rgba(220,224,235,0.40);font-size:11px">Sin cuentas</td></tr>')+'</tbody>'+
              '<tfoot><tr style="border-top:2px solid rgba(34,197,94,0.30)">'+
                '<td style="padding:10px 6px;font-size:11px;font-weight:800;color:#fff">TOTAL</td>'+
                '<td style="padding:10px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:13px;font-weight:800;color:#fff">'+fmt2(sumBruto)+'</td>'+
                '<td style="padding:10px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:13px;font-weight:800;color:#F59E0B">-'+fmt(totalApActivos)+'</td>'+
                '<td style="padding:10px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:14px;font-weight:800;color:#4ADE80">'+fmt2(sumDisp)+'</td>'+
              '</tr></tfoot>'+
            '</table>';
        })();

        // ── Distribución de Fondos REAL (v5.149) ──
        // Misma lógica de HOME: cada banco con su disponible + apartados.
        // P* mostrado como indicador SEPARADO (no se mezcla con distribución).
        (function(){
          var fijosReales = window._fijosData || [];
          var fijosVisibles = fijosReales.filter(function(fi){ return fi.nombre !== 'P'; });
          var pFila = fijosReales.find(function(fi){ return fi.nombre === 'P'; });

          var apartadosArr = window._apartadosData || [];
          var apPorBanco = {};
          var totalApActivos = 0;
          apartadosArr.forEach(function(ap){
            if(ap.estado && ap.estado.toLowerCase()==='usado') return;
            var b = (ap.banco||'').trim().toUpperCase();
            apPorBanco[b] = (apPorBanco[b]||0) + (ap.monto||0);
            totalApActivos += (ap.monto||0);
          });

          var sumBruto = fijosVisibles.reduce(function(s,fi){ return s + Math.max(0, fi.monto||0); }, 0);

          if(sumBruto <= 0){
            document.getElementById('pat-distribucion').innerHTML = '<div style="color:rgba(220,224,235,0.40);text-align:center;padding:24px">Sin datos</div>';
            return;
          }

          // Paletas por banco
          var paleta = ['#4ADE80','#22D3EE','#A78BFA','#FBBF24','#F472B6','#86EFAC','#67E8F9'];

          // Barra apilada: cada banco (parte disponible) + apartados de ese banco
          var barraHTML = '<div style="display:flex;height:14px;border-radius:7px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);margin-bottom:10px">';
          fijosVisibles.forEach(function(fi, i){
            var color = paleta[i % paleta.length];
            var bancKey = (fi.nombre||'').trim().toUpperCase();
            var apBanco = apPorBanco[bancKey] || 0;
            var dispBanco = Math.max(0, (fi.monto||0) - apBanco);
            var pctDisp = (dispBanco/sumBruto)*100;
            var pctAp = (apBanco/sumBruto)*100;
            if(pctDisp > 0){
              barraHTML += '<div title="'+fi.nombre+' disponible" style="width:'+pctDisp.toFixed(2)+'%;background:'+color+';box-shadow:0 0 4px '+color+'80 inset"></div>';
            }
            if(pctAp > 0){
              barraHTML += '<div title="'+fi.nombre+' apartados" style="width:'+pctAp.toFixed(2)+'%;background:'+color+'66;border-left:1px dashed rgba(255,255,255,0.20)"></div>';
            }
          });
          barraHTML += '</div>';

          // Lista por banco
          var listaHTML = fijosVisibles.map(function(fi, i){
            var color = paleta[i % paleta.length];
            var bancKey = (fi.nombre||'').trim().toUpperCase();
            var apBanco = apPorBanco[bancKey] || 0;
            var dispBanco = (fi.monto||0) - apBanco;
            var pct = sumBruto > 0 ? Math.round(((fi.monto||0)/sumBruto)*100) : 0;
            return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04)">'+
              '<span style="display:flex;align-items:center;gap:6px;color:rgba(220,224,235,0.85);font-weight:700"><span style="width:9px;height:9px;border-radius:2px;background:'+color+';box-shadow:0 0 4px '+color+'"></span>'+fi.nombre+'</span>'+
              '<span style="display:flex;align-items:center;gap:10px">'+
                '<span style="color:rgba(220,224,235,0.55);font-family:JetBrains Mono,monospace">'+pct+'%</span>'+
                '<span style="color:'+color+';font-weight:800;font-family:JetBrains Mono,monospace;white-space:nowrap;min-width:90px;text-align:right">'+fmt2(fi.monto)+'</span>'+
              '</span>'+
            '</div>';
          }).join('');

          // P* como indicador SEPARADO (no se mezcla en distribución)
          var pHTML = '';
          if(pFila){
            pHTML = '<div style="margin-top:10px;padding:10px 12px;border:1px dashed rgba(239,68,68,0.40);border-radius:8px;background:rgba(239,68,68,0.04)">'+
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">'+
                '<div style="display:flex;align-items:center;gap:8px">'+
                  '<i class="fas fa-circle-exclamation" style="color:#EF4444;font-size:11px"></i>'+
                  '<div>'+
                    '<div style="font-size:11px;font-weight:800;color:#fff">P <span style="color:#EF4444">*</span></div>'+
                    '<div style="font-size:9px;color:rgba(220,224,235,0.45)">Indicador, NO afecta el total</div>'+
                  '</div>'+
                '</div>'+
                '<span style="font-size:13px;font-weight:800;color:#EF4444;font-family:JetBrains Mono,monospace">'+fmt2(pFila.monto)+'</span>'+
              '</div>'+
            '</div>';
          }

          document.getElementById('pat-distribucion').innerHTML =
            '<div style="font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#22C55E;margin-bottom:10px">Distribución por cuenta</div>'+
            barraHTML +
            '<div style="display:flex;flex-direction:column">'+listaHTML+'</div>'+
            pHTML;
        })();

        // Apartados y Objetivos: TODOS los apartados activos (v5.147)
        (function(){
          var activos = apartados.filter(function(a){ return !(a.estado&&a.estado.toLowerCase()==='usado'); });
          var hoy = new Date(); hoy.setHours(0,0,0,0);
          var cards = activos.map(function(ap){
            var pct = ap.meta && ap.monto ? Math.min(100, Math.round((ap.monto/(ap.metaMonto||ap.monto))*100)) : 66;
            var metaStr = 'Sin meta';
            if(ap.meta){
              var diff = Math.floor((new Date(ap.meta)-hoy)/86400000);
              metaStr = diff < 0 ? 'Vencido' : diff===0 ? 'Hoy' : 'en '+diff+' días';
            }
            var vencidoBadge = (ap.meta && new Date(ap.meta) < hoy) ? '<span style="font-size:8px;font-weight:800;padding:1px 6px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.40);border-radius:4px;color:#EF4444;letter-spacing:.06em;text-transform:uppercase">Vencido</span>' : '';
            return '<div style="padding:11px;border:1px solid rgba(34,197,94,0.30);border-radius:9px;background:rgba(34,197,94,0.04)">'+
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
                '<div style="width:26px;height:26px;border-radius:6px;background:rgba(245,158,11,0.14);border:1px solid rgba(245,158,11,0.40);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas fa-coins" style="color:#F59E0B;font-size:11px"></i></div>'+
                '<div style="flex:1;min-width:0">'+
                  '<div style="font-size:11px;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(ap.nombre||'')+'</div>'+
                  '<div style="font-size:9px;color:rgba(220,224,235,0.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(ap.banco||'')+(ap.categoria?' · '+ap.categoria:'')+' · '+metaStr+'</div>'+
                '</div>'+
              '</div>'+
              '<div style="font-size:16px;font-weight:800;color:#fff;font-family:JetBrains Mono,monospace;white-space:nowrap;margin-bottom:6px">'+fmt2(ap.monto)+'</div>'+
              '<div style="height:5px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;margin-bottom:6px"><div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#F59E0B,#FBBF24);box-shadow:0 0 6px #F59E0B;border-radius:999px"></div></div>'+
              '<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:9px;color:rgba(220,224,235,0.55)">Meta '+fmt(ap.metaMonto||ap.monto)+'</span><span style="font-size:10px;font-weight:800;color:#FBBF24;font-family:JetBrains Mono,monospace">'+pct+'%</span></div>'+
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">'+vencidoBadge+'<button onclick="if(typeof _marcarApartadoUsado===\'function\')_marcarApartadoUsado('+ap.fila+')" style="padding:3px 10px;background:rgba(74,222,128,0.10);border:1px solid rgba(74,222,128,0.40);border-radius:6px;font-size:9px;font-weight:800;color:#4ADE80;cursor:pointer;letter-spacing:.04em">Usar ✓</button></div>'+
            '</div>';
          }).join('');
          var nuevo = ''; // v5.151: quitado botón decorativo "Nuevo apartado" — sin función
          // v5.147: grid auto-fill — cantas tarjetas quepan por fila según ancho
          document.getElementById('pat-apartados').innerHTML =
            '<div style="font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#22C55E;margin-bottom:10px">Apartados y Objetivos <span style="color:rgba(220,224,235,0.40);font-weight:700">('+activos.length+')</span></div>'+
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">'+(cards || '')+nuevo+'</div>';
        })();

        // v5.148: sección "Flujo y Liquidez" eliminada — usaba datos
        // sintéticos (sparkline Math.sin, deltas +12.3%/-5.1%/+22.1%
        // hardcoded). Para análisis de flujo real, ver card Financiero.
      },
    },
    // ── BITÁCORA — clonado del DOM de Home (sec-maslow-inline / col bitacora) ──
    'hud-bitacora': {
      html: function(){
        return ''+
          '<div style="display:flex;flex-direction:column;gap:14px;height:100%">'+
            _expHeader('BITÁCORA', 'Pensamientos, relaciones y salud', 'fas fa-book-open', '#C084FC')+
            '<div id="hud-bit-clone" style="display:flex;flex-direction:column;gap:14px;flex:1;min-height:0"></div>'+
          '</div>';
      },
      hydrate: function(){
        var dest = document.getElementById('hud-bit-clone');
        if(!dest) return;
        dest.innerHTML = '';
        // Clonar resúmenes de pensamientos, relaciones, salud, nutrición, entrena
        var d = window._pensamientosData;
        // v8.10 — El grid LLENA el alto disponible. Antes tenía altura natural
        // (solo lo que ocupaban las tarjetas) → quedaba un gran hueco vacío
        // abajo. Ahora grid-auto-rows:1fr reparte el alto entre las filas y
        // cada tarjeta crece; su lista interna hace scroll si es larga.
        var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);grid-auto-rows:1fr;gap:14px;flex:1;min-height:0">';
        function tarjeta(titulo, color, icon, items, vacio){
          // v5.212: formateo de fecha seguro. Antes se hacía
          // new Date(it.fecha).toLocaleDateString(...) directo — si
          // it.fecha no era parseable, salía literalmente "Invalid Date".
          // Ahora se valida con isNaN y, si falla, se intenta el formato
          // 'yyyy-MM-dd' manualmente; si tampoco, cadena vacía.
          function _fechaSegura(f){
            if(!f) return '';
            var dt = (f instanceof Date) ? f : new Date(f);
            if(!isNaN(dt.getTime())){
              return dt.toLocaleDateString('es-MX',{day:'2-digit',month:'short'});
            }
            // Fallback: parsear 'yyyy-MM-dd' a mano.
            var m = String(f).match(/^(\d{4})-(\d{2})-(\d{2})/);
            if(m){
              var meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
              return m[3] + ' ' + (meses[parseInt(m[2],10)-1] || '');
            }
            return '';
          }
          var rows = '';
          if(items && items.length){
            rows = items.slice(0,8).map(function(it){
              var fecha = _fechaSegura(it.fecha);
              var txt = it.contenido || it.descripcion || it.actividad || it.persona || '';
              return '<div style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;justify-content:space-between;gap:8px"><span style="font-size:11px;color:rgba(220,224,235,0.85);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">'+txt+'</span><span style="font-size:9px;color:rgba(220,224,235,0.40);flex-shrink:0">'+fecha+'</span></div>';
            }).join('');
          } else {
            rows = '<div style="padding:18px;text-align:center;color:rgba(220,224,235,0.35);font-size:10px">'+vacio+'</div>';
          }
          return '<div style="border:1px solid '+color+'33;border-radius:var(--rad-lg);background:'+color+'08;overflow:hidden;display:flex;flex-direction:column;min-height:0"><div style="padding:9px 12px;border-bottom:1px solid '+color+'22;display:flex;align-items:center;gap:8px;flex-shrink:0"><i class="fas '+icon+'" style="color:'+color+';font-size:12px"></i><span style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:'+color+'">'+titulo+'</span></div><div style="overflow-y:auto;flex:1;min-height:0">'+rows+'</div></div>';
        }
        html += tarjeta('Pensamientos', '#C084FC', 'fa-brain', (window._pensamientosData||{}).items, 'Sin pensamientos');
        html += tarjeta('Relaciones', '#93C5FD', 'fa-users', (window._relacionesData||{}).items, 'Sin relaciones');
        html += tarjeta('Salud', '#F87171', 'fa-heart-pulse', (window._saludData||{}).items, 'Sin registros');
        html += tarjeta('Nutrición', '#86EFAC', 'fa-leaf', (window._nutData||{}).items, 'Sin registros');
        html += tarjeta('Entrenamiento', '#FB923C', 'fa-dumbbell', (window._entData||{}).items, 'Sin sesiones');
        html += '</div>';
        dest.innerHTML = html;
      },
    },

    // ── ACTIVITY + LOGROS expandido ──
    'hud-activity': {
      html: function(){
        return ''+
          '<div style="display:flex;flex-direction:column;gap:14px;height:100%">'+
            _expHeader('ACTIVITY', 'Hábitos y logros de hoy', 'fas fa-bolt', '#FB923C')+
            '<div id="hud-act-expanded-body" style="display:flex;flex-direction:column;gap:14px;flex:1;min-height:0"></div>'+
          '</div>';
      },
      hydrate: function(){
        var dest = document.getElementById('hud-act-expanded-body');
        if(!dest) return;
        var act = window._actData || {};
        var logros = window._logrosData || {items:[]};
        var diaKey = ['L','M','W','J','V','S','D'][(new Date().getDay()+6)%7];
        // Hábitos personales con check hoy
        var habitsP = (act.habitosPersonal||[]);
        var doneP = habitsP.filter(function(h){ return h.checks && h.checks[diaKey]; }).length;
        var habitsE = (act.habitosElectronics||[]);
        var doneE = habitsE.filter(function(h){ return h.checks && h.checks[diaKey]; }).length;
        var lgDone = (logros.items||[]).filter(function(l){ return l.completado==='Sí'||l.completado===true; }).length;
        var lgTotal = (logros.items||[]).length;
        function bar(pct, color){ return '<div style="height:6px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;margin-top:6px"><div style="width:'+Math.min(100,pct)+'%;height:100%;background:'+color+';box-shadow:0 0 8px '+color+'80;border-radius:999px"></div></div>'; }
        var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;align-content:start">';
        // Hábitos personales
        html += '<div style="padding:14px;border:1px solid rgba(251,146,60,0.30);border-radius:12px;background:rgba(251,146,60,0.04)"><div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#FB923C;margin-bottom:8px">Hábitos personales hoy</div><div style="font-size:24px;font-weight:800;color:#FB923C;font-family:JetBrains Mono,monospace">'+doneP+' / '+habitsP.length+'</div>'+bar(habitsP.length?(doneP/habitsP.length*100):0,'#FB923C')+'</div>';
        // Electronics
        html += '<div style="padding:14px;border:1px solid rgba(34,211,238,0.30);border-radius:12px;background:rgba(34,211,238,0.04)"><div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#22D3EE;margin-bottom:8px">Hábitos Electronics hoy</div><div style="font-size:24px;font-weight:800;color:#22D3EE;font-family:JetBrains Mono,monospace">'+doneE+' / '+habitsE.length+'</div>'+bar(habitsE.length?(doneE/habitsE.length*100):0,'#22D3EE')+'</div>';
        // Logros
        html += '<div style="padding:14px;border:1px solid rgba(250,204,21,0.30);border-radius:12px;background:rgba(250,204,21,0.04);grid-column:1 / -1"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#FACC15">Logros</div><div style="font-size:18px;font-weight:800;color:#FACC15;font-family:JetBrains Mono,monospace">'+lgDone+' / '+lgTotal+'</div></div>'+bar(lgTotal?(lgDone/lgTotal*100):0,'#FACC15')+'</div>';
        // Lista logros recientes
        var recientes = (logros.items||[]).slice(0,10);
        if(recientes.length){
          html += '<div style="grid-column:1 / -1;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:10px"><div style="font-size:9px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);margin-bottom:8px">Logros recientes</div>';
          recientes.forEach(function(l){
            var done = l.completado==='Sí'||l.completado===true;
            html += '<div style="padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;align-items:center;gap:10px"><i class="fas '+(done?'fa-check-circle':'fa-circle')+'" style="color:'+(done?'#4ADE80':'rgba(220,224,235,0.30)')+';font-size:11px"></i><span style="font-size:11px;color:'+(done?'rgba(220,224,235,0.85)':'rgba(220,224,235,0.55)')+'">'+(l.titulo||l.nombre||'—')+'</span></div>';
          });
          html += '</div>';
        }
        html += '</div>';
        dest.innerHTML = html;
      },
    },

    'hud-financiero': {
      html: function(){
        return ''+
        '<div style="display:flex;flex-direction:column;gap:14px;padding:0;min-height:100%">'+
          // Header unificado (v8.9)
          _expHeader('FINANCIERO', 'Resumen del mes', 'fas fa-chart-line', '#22D3EE')+
          // 5 cards top
          '<div id="fin-cards-row" style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px"></div>'+
          // Mid: Visión General + Gasto promedio (proyección eliminada — datos sintéticos)
          '<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:10px">'+
            '<div id="fin-vision" style="padding:12px;border:1px solid rgba(34,211,238,0.20);border-radius:var(--rad-lg);background:rgba(34,211,238,0.03)"></div>'+
            '<div id="fin-gasto" style="padding:12px;border:1px solid rgba(34,211,238,0.20);border-radius:var(--rad-lg);background:rgba(34,211,238,0.03)"></div>'+
          '</div>'+
          // Bottom: Análisis mensual + Tendencia
          '<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:10px">'+
            '<div id="fin-analisis" style="padding:12px;border:1px solid rgba(34,211,238,0.18);border-radius:var(--rad-lg)"></div>'+
            '<div id="fin-tendencia" style="padding:12px;border:1px solid rgba(34,211,238,0.18);border-radius:var(--rad-lg);display:flex;flex-direction:column"></div>'+
          '</div>'+
          // v5.149: Proyección REAL (de mes.proyeccion del backend, no sintética)
          '<div id="fin-proyeccion-real" style="padding:12px;border:1px solid rgba(34,211,238,0.18);border-radius:var(--rad-lg)"></div>'+
          // v5.149: Identidad (scoreInversionista/scoreConsumidor) — viene de _revData del backend
          '<div id="fin-identidad" style="padding:12px;border:1px solid rgba(196,181,253,0.18);border-radius:var(--rad-lg);background:rgba(196,181,253,0.03)"></div>'+
          // v5.149: Insights del backend
          '<div id="fin-insights" style="padding:12px;border:1px solid rgba(255,255,255,0.06);border-radius:var(--rad-lg)"></div>'+
        '</div>';
      },
      hydrate: function(){
        var fin = window._finData || {};
        var mes = fin.mes || {};
        var m = fin.metricas || {};
        var flujo = window._flujoMensualData || {};
        var meses = flujo.meses || [];
        var grupos = flujo.grupos || {};
        var datosM = window.datosMes || {};
        var fmt = function(n){ return '$ '+Math.round(Math.abs(n||0)).toLocaleString('es-MX'); };
        var fmtSign = function(n){ var s = n>=0?'+ ':'− '; return s+fmt(n); };

        // ── 5 cards top (sin sparklines sintéticas) ──
        function _card(label, value, color, sub){
          return '<div style="padding:11px 13px;border:1px solid '+color+'40;border-radius:10px;background:'+color+'08;position:relative;overflow:hidden">'+
            '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:'+color+';box-shadow:0 0 8px '+color+';opacity:.7"></div>'+
            '<div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:'+color+';margin-bottom:6px;opacity:.85">'+label+'</div>'+
            '<div style="font-size:18px;font-weight:800;color:'+color+';font-family:JetBrains Mono,monospace;line-height:1;text-shadow:0 0 10px '+color+'40;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+value+'</div>'+
            (sub ? '<div style="font-size:9px;color:rgba(220,224,235,0.45);margin-top:4px">'+sub+'</div>' : '')+
          '</div>';
        }
        var ahorro = m.porcentajeAhorro || 0;
        var runway = m.runwayDias===null||m.runwayDias===undefined?'∞':m.runwayDias+' días';
        document.getElementById('fin-cards-row').innerHTML =
          _card('Ingresos',  fmt(mes.ingresos),  '#22C55E', null)+
          _card('Egresos',   fmt(mes.egresos),   '#EF4444', null)+
          _card('Excedente', fmtSign(mes.excedente), '#22D3EE', null)+
          _card('Ahorro %',  ahorro.toFixed(1)+'%', '#FACC15', 'Objetivo: 50%')+
          _card('Runway',    runway, '#A78BFA', 'Operatividad estimada');

        // ── Visión general (donut + lista) ──
        (function(){
          var ing = mes.ingresos||0, egr = mes.egresos||0, ahorroN = (ing+egr); // egresos negativo
          var total = ing > 0 ? ing : 1;
          var pct = Math.max(0, Math.min(100, Math.round((ahorroN/total)*100)));
          var R = 36, C = 2*Math.PI*R;
          var dash = (pct/100)*C;
          var donut = '<svg viewBox="0 0 100 100" style="width:120px;height:120px"><circle cx="50" cy="50" r="'+R+'" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="10"/><circle cx="50" cy="50" r="'+R+'" fill="none" stroke="#22D3EE" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+dash+' '+C+'" transform="rotate(-90 50 50)" style="filter:drop-shadow(0 0 4px #22D3EE80)"/><text x="50" y="48" text-anchor="middle" fill="#22D3EE" font-size="16" font-weight="800" font-family="JetBrains Mono,monospace">'+pct+'%</text><text x="50" y="62" text-anchor="middle" fill="rgba(220,224,235,0.45)" font-size="6" font-weight="700">TASA DE AHORRO</text></svg>';
          var html = '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#22D3EE;margin-bottom:10px">Visión General</div>'+
            '<div style="display:flex;align-items:center;gap:14px">'+
              '<div style="flex-shrink:0">'+donut+'</div>'+
              '<div style="flex:1;display:flex;flex-direction:column;gap:8px">'+
                '<div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(220,224,235,0.75)"><span style="width:6px;height:6px;border-radius:50%;background:#22C55E"></span>Ingresos</span><span style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700;color:#22C55E;white-space:nowrap">'+fmt(ing)+'</span></div>'+
                '<div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(220,224,235,0.75)"><span style="width:6px;height:6px;border-radius:50%;background:#EF4444"></span>Egresos</span><span style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700;color:#EF4444;white-space:nowrap">'+fmt(egr)+'</span></div>'+
                '<div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(220,224,235,0.75)"><span style="width:6px;height:6px;border-radius:50%;background:#22D3EE"></span>Ahorro</span><span style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700;color:#22D3EE;white-space:nowrap">'+fmt(ahorroN)+'</span></div>'+
              '</div>'+
            '</div>';
          document.getElementById('fin-vision').innerHTML = html;
        })();

        // ── Gasto promedio diario (bar chart 7 días) ──
        (function(){
          var dias = ['L','M','M','J','V','S','D'];
          // Calcular gasto por día de semana de datosMes (registros con fecha)
          var sumDia = [0,0,0,0,0,0,0], cntDia = [0,0,0,0,0,0,0];
          (datosM.todos||[]).forEach(function(r){
            if(!r.fecha) return;
            var d = new Date(r.fecha);
            var dow = (d.getDay()+6)%7; // L=0
            var monto = Math.abs(parseFloat(r.monto)||0);
            if(monto>0 && r.tipo!=='Ingreso'){ sumDia[dow] += monto; cntDia[dow]++; }
          });
          var prom = sumDia.map(function(s,i){ return cntDia[i]>0 ? s/cntDia[i] : 0; });
          var maxV = Math.max.apply(null, prom) || 1;
          var bars = prom.map(function(v,i){
            var h = Math.max(4, Math.round(v/maxV*60));
            var c = i===5||i===6 ? '#FACC15' : '#22C55E';
            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="width:100%;max-width:18px;height:'+h+'px;background:linear-gradient(180deg,'+c+'cc,'+c+'66);border-radius:3px 3px 0 0;box-shadow:0 0 6px '+c+'40"></div><div style="font-size:9px;font-weight:700;color:rgba(220,224,235,0.55)">'+dias[i]+'</div></div>';
          }).join('');
          var avg = m.gastoPorDiaPromedio || 0;
          document.getElementById('fin-gasto').innerHTML =
            '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#22D3EE;margin-bottom:6px">Gasto Promedio Diario</div>'+
            '<div style="font-size:20px;font-weight:800;color:#22D3EE;font-family:JetBrains Mono,monospace;margin-bottom:10px;white-space:nowrap">'+fmt(avg)+'</div>'+
            '<div style="display:flex;align-items:flex-end;gap:6px;height:64px">'+bars+'</div>';
        })();

        // v5.148: secciones "Proyección financiera" y "Protección fin de mes"
        // eliminadas porque usaban datos sintéticos (exc*1.25, exc*0.65,
        // deltas hardcoded). Para análisis predictivo real se necesita
        // modelo en el backend.

        // ── Análisis mensual (tabla) ──
        (function(){
          if(!meses.length){ document.getElementById('fin-analisis').innerHTML = '<div style="color:rgba(220,224,235,0.40);text-align:center;padding:24px">Sin datos mensuales</div>'; return; }
          var rows = meses.map(function(m){
            var g = grupos[m] || {};
            var ing = g.ingresos||0, egr = g.egresos||0, exc = g.excedente!==undefined?g.excedente:(ing+egr);
            var pctA = ing>0 ? Math.round((exc/ing)*100) : 0;
            return '<tr><td style="padding:6px 8px;font-size:11px">'+m+'</td>'+
              '<td style="padding:6px 8px;font-size:11px;text-align:right;color:#22C55E;font-family:JetBrains Mono,monospace;white-space:nowrap">'+fmt(ing)+'</td>'+
              '<td style="padding:6px 8px;font-size:11px;text-align:right;color:#EF4444;font-family:JetBrains Mono,monospace;white-space:nowrap">'+(egr<0?'-':'')+fmt(egr)+'</td>'+
              '<td style="padding:6px 8px;font-size:11px;text-align:right;color:'+(exc>=0?'#22D3EE':'#EF4444')+';font-family:JetBrains Mono,monospace;font-weight:700;white-space:nowrap">'+fmtSign(exc)+'</td>'+
              '<td style="padding:6px 8px;font-size:11px;text-align:right;color:rgba(220,224,235,0.65);font-family:JetBrains Mono,monospace">'+pctA+'%</td></tr>';
          }).join('');
          document.getElementById('fin-analisis').innerHTML =
            '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#22D3EE;margin-bottom:10px">Análisis Mensual</div>'+
            '<table style="width:100%;border-collapse:collapse">'+
              '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.08)"><th style="padding:6px 8px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:left">Mes</th><th style="padding:6px 8px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Ingresos</th><th style="padding:6px 8px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Egresos</th><th style="padding:6px 8px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Excedente</th><th style="padding:6px 8px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Ahorro %</th></tr></thead>'+
              '<tbody>'+rows+'</tbody>'+
            '</table>';
        })();

        // ── Tendencia de excedente (sparkline grande) ──
        (function(){
          if(!meses.length){ document.getElementById('fin-tendencia').innerHTML = '<div style="color:rgba(220,224,235,0.40);text-align:center;padding:24px">Sin datos</div>'; return; }
          var vals = meses.map(function(m){ var g=grupos[m]||{}; return g.excedente!==undefined?g.excedente:((g.ingresos||0)+(g.egresos||0)); });
          var maxV = Math.max.apply(null, vals.map(Math.abs)) || 1;
          var W = 100, H = 60, pts = vals.map(function(v,i){
            var x = (i/(vals.length-1||1))*W;
            var y = H/2 - (v/maxV)*(H/2-4);
            return x+','+y;
          }).join(' ');
          document.getElementById('fin-tendencia').innerHTML =
            '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#22D3EE;margin-bottom:8px">Tendencia de Excedente</div>'+
            '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" style="width:100%;flex:1;min-height:120px">'+
              '<line x1="0" y1="'+(H/2)+'" x2="'+W+'" y2="'+(H/2)+'" stroke="rgba(255,255,255,0.08)" stroke-width="0.3"/>'+
              '<polyline points="'+pts+'" fill="none" stroke="#22D3EE" stroke-width="1.2" stroke-linecap="round" style="filter:drop-shadow(0 0 3px #22D3EE80)"/>'+
            '</svg>'+
            '<div style="display:flex;justify-content:space-between;font-size:8px;color:rgba(220,224,235,0.45);margin-top:6px">'+
              meses.map(function(m){ return '<span>'+m.slice(0,3).toUpperCase()+'</span>'; }).join('')+
            '</div>';
        })();

        // v5.148: sección "Desglose táctico" eliminada — su container
        // fin-desglose ya no existe en el DOM (limpieza de cards expandidas).

        // v5.149: Proyección REAL del backend (mes.proyeccion)
        (function(){
          var proy = mes.proyeccion || {};
          var diasRest = proy.diasRestantes || 0;
          var excProy = proy.excedente;
          var el = document.getElementById('fin-proyeccion-real');
          if(!el) return;
          if(diasRest <= 0 || excProy === undefined || excProy === null){
            el.innerHTML = '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);margin-bottom:6px">Proyección Fin de Mes</div>'+
              '<div style="color:rgba(220,224,235,0.40);text-align:center;padding:16px;font-size:11px">Sin proyección disponible</div>';
            return;
          }
          var pos = excProy >= 0;
          el.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:space-between">'+
              '<div>'+
                '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);margin-bottom:4px">Proyección fin de mes · '+diasRest+' días restantes</div>'+
                '<div style="font-size:11px;color:rgba(220,224,235,0.55)">Al ritmo actual de '+fmt(m.gastoPorDiaPromedio||0)+'/día</div>'+
              '</div>'+
              '<div style="text-align:right">'+
                '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:rgba(220,224,235,0.55);margin-bottom:4px">Excedente proyectado</div>'+
                '<div style="font-size:24px;font-weight:800;color:'+(pos?'#4ADE80':'#EF4444')+';font-family:JetBrains Mono,monospace;white-space:nowrap">'+(pos?'+':'')+fmt(excProy)+'</div>'+
              '</div>'+
            '</div>';
        })();

        // v5.149: Identidad (scoreInversionista / scoreConsumidor) — desde _revData
        (function(){
          var rev = window._revData || {};
          var id = rev.identidad || {};
          var scoreInv = id.scoreInversionista || 0;
          var scoreCons = id.scoreConsumidor || 0;
          var tiene = rev.ok && scoreInv > 0;
          var el = document.getElementById('fin-identidad');
          if(!el) return;
          if(!tiene){
            el.innerHTML = '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(196,181,253,0.85);margin-bottom:6px">Identidad financiera</div>'+
              '<div style="color:rgba(220,224,235,0.40);text-align:center;padding:16px;font-size:11px">Esperando análisis del período…</div>';
            return;
          }
          el.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'+
              '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#C4B5FD">Identidad'+(rev.periodo?' · '+rev.periodo.inicio+' – '+rev.periodo.fin:'')+'</div>'+
              '<div style="font-size:9px;color:#C4B5FD;font-weight:700;text-transform:uppercase;letter-spacing:.06em">'+(rev.tipo||'').toUpperCase()+'</div>'+
            '</div>'+
            '<div style="height:10px;border-radius:5px;overflow:hidden;display:flex;background:rgba(255,255,255,0.04)">'+
              '<div style="height:100%;width:'+scoreInv+'%;background:linear-gradient(90deg,#22C55E,#4ADE80);transition:width .6s ease;box-shadow:0 0 8px rgba(74,222,128,0.4)"></div>'+
              '<div style="height:100%;flex:1;background:linear-gradient(90deg,#EF4444,#DC2626)"></div>'+
            '</div>'+
            '<div style="display:flex;justify-content:space-between;margin-top:6px">'+
              '<div style="display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:50%;background:#4ADE80"></span><span style="font-size:11px;font-weight:800;color:#4ADE80">'+scoreInv+'% Inversionista</span></div>'+
              '<div style="display:flex;align-items:center;gap:5px"><span style="font-size:11px;font-weight:800;color:#EF4444">'+scoreCons+'% Consumidor</span><span style="width:8px;height:8px;border-radius:50%;background:#EF4444"></span></div>'+
            '</div>';
        })();

        // v5.149: Insights del backend (_revData.insights)
        (function(){
          var rev = window._revData || {};
          var ins = (rev.insights || []).filter(function(i){
            return i && i.msg && !i.msg.includes('Buen ritmo de ahorro');
          });
          var el = document.getElementById('fin-insights');
          if(!el) return;
          if(!ins.length){
            el.style.display = 'none';
            return;
          }
          el.style.display = '';
          el.innerHTML =
            '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);margin-bottom:8px">💡 Insights</div>'+
            '<div style="display:flex;flex-direction:column;gap:6px">'+
              ins.map(function(i){
                var bg = i.tipo==='alerta'?'rgba(239,68,68,0.06)':i.tipo==='positivo'?'rgba(74,222,128,0.06)':'rgba(255,255,255,0.03)';
                var bd = i.tipo==='alerta'?'rgba(239,68,68,0.20)':i.tipo==='positivo'?'rgba(74,222,128,0.20)':'rgba(255,255,255,0.08)';
                var dotC = i.tipo==='alerta'?'#EF4444':i.tipo==='positivo'?'#4ADE80':i.tipo==='identidad'?'#C4B5FD':'rgba(220,224,235,0.55)';
                var txtC = i.tipo==='alerta'?'#FCA5A5':i.tipo==='positivo'?'#86EFAC':i.tipo==='identidad'?'#C4B5FD':'rgba(220,224,235,0.85)';
                return '<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:6px;background:'+bg+';border:1px solid '+bd+'">'+
                  '<div style="width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:6px;background:'+dotC+';box-shadow:0 0 4px '+dotC+'"></div>'+
                  '<span style="font-size:12px;line-height:1.5;color:'+txtC+'">'+i.msg+'</span>'+
                '</div>';
              }).join('')+
            '</div>';
        })();

        // Asegurar que tenemos flujo mensual, si no, fetch
        if(!meses.length && typeof api !== 'undefined' && api.getFlujoPorMes){
          api.getFlujoPorMes().then(function(d){
            window._flujoMensualData = d;
            // Re-hidratar
            var cfg = window._EXPAND_CONFIG && window._EXPAND_CONFIG['hud-financiero'];
            if(cfg && document.getElementById('fin-analisis')) cfg.hydrate();
          }).catch(function(){});
        }
        // v5.151: si _revData no está cargado, pedirlo y re-hidratar Identidad/Insights
        if((!window._revData || !window._revData.ok) && typeof api !== 'undefined' && api.getRevision){
          var _h = new Date();
          api.getRevision('mensual', _h.getFullYear(), _h.getMonth()+1, null).then(function(d){
            window._revData = d;
            var cfg = window._EXPAND_CONFIG && window._EXPAND_CONFIG['hud-financiero'];
            if(cfg && document.getElementById('fin-identidad')) cfg.hydrate();
          }).catch(function(){});
        }
      },
    },
    'hud-fijos': {
      // v5.193: vista expandida rediseñada. renderFijosExpandido pinta
      // tabla + analisis + contenedores de grafica en un solo contenedor.
      html: function(){
        return '<div id="hud-fijos-tabla" style="width:100%;min-width:0"></div>';
      },
      hydrate: function(){
        function _pintar(d){
          // v5.206: api.getGastos() puede devolver {ok, gastos:{grupos}}
          // — desenvolver. Si ya viene {grupos} directo, usar tal cual.
          var gd = (d && d.gastos) ? d.gastos : d;
          window._fijosAnualidadData = gd;
          if(typeof renderFijosExpandido === 'function'){
            renderFijosExpandido(gd, 'hud-fijos-tabla');
            // Las graficas necesitan Chart.js; cargarlo si falta.
            function _graf(){ if(typeof renderFijosGraficas==='function') renderFijosGraficas(); }
            if(window.Chart){ setTimeout(_graf, 60); }
            else {
              var s=document.createElement('script');
              s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
              s.onload=function(){ setTimeout(_graf, 80); };
              document.head.appendChild(s);
            }
          }
        }
        if(window._fijosAnualidadData){
          _pintar(window._fijosAnualidadData);
        } else if(typeof api !== 'undefined' && api.getGastos){
          var elf = document.getElementById('hud-fijos-tabla');
          if(elf) elf.innerHTML = '<div style="padding:40px;text-align:center;color:rgba(220,224,235,0.40);font-size:12px">Cargando…</div>';
          api.getGastos().then(_pintar).catch(function(){
            var elf2 = document.getElementById('hud-fijos-tabla');
            if(elf2) elf2.innerHTML = '<div style="padding:40px;text-align:center;color:rgba(220,224,235,0.40);font-size:12px">No se pudieron cargar los datos</div>';
          });
        } else {
          var el = document.getElementById('hud-fijos-tabla');
          if(el) el.innerHTML = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40)">Sin datos</div>';
        }
      },
    },
    // ── VARIABLES ──
    'hud-variables': {
      // v5.200: vista expandida rediseñada. renderVariablesExpandido pinta
      // tabla + stats + chips + contenedor de grafica en un contenedor.
      html: function(){
        return '<div id="hud-var-tabla" style="width:100%;min-width:0"></div>';
      },
      hydrate: function(){
        function _pintar(d){
          // v5.206: api.getDatosMes() devuelve {ok, datosMes:{meses,grupos}}
          // — desenvolver. Si ya viene {meses,grupos} directo, usar tal cual.
          var dm = (d && d.datosMes) ? d.datosMes : d;
          if(!dm || !dm.meses || !dm.meses.length){
            var el0 = document.getElementById('hud-var-tabla');
            if(el0) el0.innerHTML = '<div style="padding:40px;text-align:center;color:rgba(220,224,235,0.40);font-size:12px">Sin datos de movimientos variables</div>';
            return;
          }
          window.datosMes = dm;
          if(typeof renderVariablesExpandido === 'function'){
            renderVariablesExpandido(dm, 'hud-var-tabla');
            function _graf(){ if(typeof renderVariablesGrafica==='function') renderVariablesGrafica(); }
            if(window.Chart){ setTimeout(_graf, 60); }
            else {
              var s=document.createElement('script');
              s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
              s.onload=function(){ setTimeout(_graf, 80); };
              document.head.appendChild(s);
            }
          }
        }
        // v5.206: usar la global datosMes SOLO si ya tiene meses cargados
        // (al inicio es {meses:[],grupos:{}} — vacía). Si no, pedir al API.
        // v5.208: leer window.datosMes (lo expone onDatosMes). Si ya
        // tiene meses, pintar directo.
        var _dm = (typeof window.datosMes !== 'undefined') ? window.datosMes
                : (typeof datosMes !== 'undefined' ? datosMes : null);
        if(_dm && _dm.meses && _dm.meses.length){
          _pintar(_dm);
        } else if(typeof api !== 'undefined' && api.getAll){
          // v5.208: fallback vía getAll (getDatosMes no se invoca en el
          // flujo normal; getAll sí, y trae d.datosMes).
          var el1 = document.getElementById('hud-var-tabla');
          if(el1) el1.innerHTML = '<div style="padding:40px;text-align:center;color:rgba(220,224,235,0.40);font-size:12px">Cargando…</div>';
          api.getAll().then(function(d){
            _pintar((d && d.datosMes) ? d.datosMes : d);
          }).catch(function(){
            var el2 = document.getElementById('hud-var-tabla');
            if(el2) el2.innerHTML = '<div style="padding:40px;text-align:center;color:rgba(220,224,235,0.40);font-size:12px">No se pudieron cargar los datos</div>';
          });
        } else {
          var el = document.getElementById('hud-var-tabla');
          if(el) el.innerHTML = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40)">Sin datos</div>';
        }
      },
    },
    // ── NECESIDADES expandido — usa renderNecesidadesInline si los IDs existen ──
    'hud-necesidades': {
      html: function(){
        return ''+
          '<div style="display:flex;flex-direction:column;gap:14px;min-height:0">'+
            // Header unificado (v8.9) + filtros a la derecha
            '<div style="display:flex;align-items:center;justify-content:space-between">'+
              _expHeader('NECESIDADES', '', 'fas fa-wave-square', '#A855F7')+
              '<div style="display:flex;align-items:center;gap:8px">'+
                '<div id="nec-overlay-anio-chip" style="padding:5px 10px;border:1px solid rgba(168,85,247,0.30);border-radius:var(--rad-card);background:rgba(168,85,247,0.06);font-size:10px;font-weight:700;color:rgba(220,224,235,0.85);font-family:var(--font-mono)">'+(new Date().getFullYear())+'</div>'+
                '<div id="nec-overlay-mes-chip" style="padding:5px 10px;border:1px solid rgba(168,85,247,0.30);border-radius:var(--rad-card);background:rgba(168,85,247,0.06);font-size:10px;font-weight:700;color:rgba(220,224,235,0.85)">Hasta hoy</div>'+
              '</div>'+
            '</div>'+
            // Radar + Pirámide lado a lado
            '<div style="display:flex;gap:14px;min-height:240px;flex-shrink:0">'+
              '<div id="nec-inline-radar-wrap-overlay" style="flex:1;min-width:0;padding:12px;border:1px solid rgba(168,85,247,0.18);border-radius:var(--rad-lg);background:rgba(168,85,247,0.03);display:flex;flex-direction:column;justify-content:center"></div>'+
              '<div id="nec-inline-piramide-overlay" style="flex:1;min-width:0;padding:12px;border:1px solid rgba(168,85,247,0.18);border-radius:var(--rad-lg);background:rgba(168,85,247,0.03);display:flex;flex-direction:column;justify-content:center"></div>'+
            '</div>'+
            // v5.144: contenedor inferior SIN scroll interno — el modo
            // expansión ya hace que el panel crezca para mostrar todo el
            // contenido. Antes tenía overflow:auto + flex:1 + min-height:0
            // que forzaba scroll vertical aunque el contenido cabiera.
            '<div id="nec-inline-container-overlay" style="flex:0 0 auto;overflow:visible;padding:4px"></div>'+
          '</div>';
      },
      hydrate: function(){
        var radarDest    = document.getElementById('nec-inline-radar-wrap-overlay');
        var piramideDest = document.getElementById('nec-inline-piramide-overlay');
        var detDest      = document.getElementById('nec-inline-container-overlay');
        if(!radarDest || !piramideDest || !detDest) return;

        function _aplicar(data){
          if(!data || !data.niveles || !data.niveles.length){
            radarDest.innerHTML    = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40);font-size:11px">Sin registros con necesidad asignada</div>';
            piramideDest.innerHTML = '';
            detDest.innerHTML      = '';
            return;
          }
          // _hudRenderNecesidadesEn ahora recibe DOS destinos (radar + listaContainer).
          // Splitamos lista en pirámide+lista usando la implementación interna:
          // pasamos piramideDest+detDest combinados via wrapper.
          _hudRenderNecesidadesEn(data.niveles, radarDest, piramideDest);
          // _hudRenderNecesidadesEn puso pyrHTML + listaHTML en piramideDest.
          // Mover la lista (último <div style="margin-top:14px;...">) a detDest:
          var listaNode = piramideDest.querySelector(':scope > div[style*="margin-top:14px"]');
          var totalNode = piramideDest.querySelector(':scope > div[style*="margin-top:12px"]');
          detDest.innerHTML = '';
          if(listaNode){ detDest.appendChild(listaNode); }
          if(totalNode){ detDest.appendChild(totalNode); }
        }

        var data = window._necInlineData || (window._hudDatos && window._hudDatos.necesidades);
        if(data && data.niveles && data.niveles.length){
          _aplicar(data);
        } else {
          radarDest.innerHTML    = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40);font-size:11px"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</div>';
          piramideDest.innerHTML = '';
          detDest.innerHTML      = '';
          if(typeof api !== 'undefined' && api.getNecesidades){
            var hoy = new Date();
            api.getNecesidades(hoy.getFullYear(), String(hoy.getMonth()+1), null).then(function(d){
              window._necInlineData = d;
              if(d && d.ok){ _aplicar(d); }
              else { radarDest.innerHTML = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40);font-size:11px">No se pudieron cargar las necesidades</div>'; }
            }).catch(function(){
              radarDest.innerHTML = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40);font-size:11px">Error al cargar</div>';
            });
          }
        }
      },
    },
  };
  window._V11_EXPAND = _EXPAND_CONFIG;

/* ── mapa sector → panel v9 (evidencia: presets "Ver sección" v9) ── */
/* E3-D4: los números COMPUTAN al entrar (RawAnim.countUp, patrón v9) */
function _countUpSeccion(cu){
  if(!cu || !window.RawAnim || !window.RawAnim.countUp) return;
  var nums = cu.querySelectorAll('.num, .v11-kpi .v');
  for(var i=0;i<Math.min(nums.length,24);i++) window.RawAnim.countUp(nums[i]);
}
var _MAPA_PANEL = {
  patrimonio:'hud-patrimonio',      /* Centro Patrimonial COMPLETO: aquí
                                       viven bancos y apartados — las cards
                                       bancos/apartado muestran SU dato
                                       propio (E3-B), sin duplicar esto */
  pensamiento:'hud-bitacora',       /* Bitácora agrupa salud/relaciones/
                                       nutrición/entrena en mini-tableros;
                                       esas cards conservan su vista propia */
  financiero:'hud-financiero',  /* E3-D7: panel v9 verbatim (6036-6290) */
  fijos:'hud-fijos', variables:'hud-variables',
  necesidades:'hud-necesidades'   /* E3-D15: radar+pirámide v9 */
};
/* E3-D11: activity abandona el resumen — su nivel 2 es el Activity
   Check COMPLETO (board v9), todo junto como pediste. */
/* CERO DUPLICADOS: un panel agrupador vive en UNA sola card. */
/* E3-D6 — BOARDS v9 hospedados en nivel 2 (se MUEVEN, no se clonan:
   conservan estado y listeners — patrón del carrusel v6). Al salir
   vuelven al stash ANTES de que innerHTML los destruya. */
window.volverAlAnverso = function(){ window._v11Home(); };
function _devolverBoards(){
  var st=document.getElementById('v11-boards'); if(!st)return;
  ['board-timers','board-nutricion','board-logros','board-notas','board-sos','board-activity'].forEach(function(id){
    var b=document.getElementById(id);
    if(b && b.parentNode && b.parentNode.id==='sec-cuerpo'){
      b.classList.remove('v11-hosted'); st.appendChild(b);
    }
  });
}
var _BOARD_SEC = { timer:'board-timers', nutricion:'board-nutricion',
  logros:'board-logros', notas:'board-notas', sos:'board-sos',
  activity:'board-activity' };
var _renderBase = window._v11RenderSeccion;
window._v11RenderSeccion = function(i){
  var id = window.SEC[i].id, key = _MAPA_PANEL[id];
  var cu = document.getElementById('sec-cuerpo');
  _devolverBoards();
  if(_BOARD_SEC[id] && cu){
    var b=document.getElementById(_BOARD_SEC[id]);
    if(b){
      cu.innerHTML=''; b.classList.add('v11-hosted'); cu.appendChild(b);
      if(id==='timer' && typeof window._timersAlEntrar==='function') window._timersAlEntrar();
      if(id==='activity' && typeof window.renderActivity==='function'){
        window.renderActivity();                    /* lee _actData (v9:849) */
        api.getActivityCheck().then(function(d){ window._actData=d;
          if(window.nivel===2&&window.SEC[window.idx].id==='activity') window.renderActivity();
        }).catch(function(){});
      }
      if(id==='logros'){
        if(typeof renderLogros==='function'){
          if(window._logrosData) renderLogros(window._logrosData);
          api.getLogros().then(function(d){ window._logrosData=d;
            if(window.nivel===2&&window.SEC[window.idx].id==='logros') renderLogros(d);
          }).catch(function(){});
        }
      }
      if(id==='notas' && typeof window._notasMontar==='function') window._notasMontar();
      if(id==='sos'   && typeof window._montarSOS==='function')   window._montarSOS();
      if(id==='nutricion' && typeof window._renderNutLayoutCompleto==='function'){
        /* espejo de irANutricion (raw-core.js:866): render inmediato + datos */
        window._renderNutLayoutCompleto(window._nutData||null);
        api.getNutricion().then(function(d){
          window._nutData=d;
          if(window.nivel===2 && window.SEC[window.idx].id==='nutricion')
            window._renderNutLayoutCompleto(d);
        }).catch(function(){});
      }
      cu.scrollTop=0; return;
    }
  }
  if(!key || !cu || !window._capa1Data){ _renderBase(i); _countUpSeccion(cu); return; }
  var cfg = _EXPAND_CONFIG[key];
  try{
    cu.innerHTML = cfg.html();
    cfg.hydrate();
    cu.scrollTop = 0;
    _countUpSeccion(cu);
  }catch(e){
    console.error('[v11-nav] hydrate '+key+':', e);
    _renderBase(i);
  }
};

/* ── distribución getAll → globals v9 (espejo del boot de overlay,
   con el ok:true que hydrate patrimonio espera para no re-pedir) ── */
var _lastCapa1 = null;
function _distribuirV9(d){
  if(d.patrimonio)    window._patrimonioData = Object.assign({ok:true}, d.patrimonio);
  if(d.apartados)     window._apartadosData  = d.apartados.items || [];
  if(d.nutricion)     window._nutData        = d.nutricion;
  if(d.entrenamiento) window._entData        = d.entrenamiento;
  if(d.fijos)         window._fijosData      = d.fijos;
  /* E3-D7: globals que el panel FINANCIERO v9 consume */
  if(d.financieroAvanzado) window._finData = d.financieroAvanzado;
  if(d.flujoPorMes)        window._flujoMensualData = d.flujoPorMes;
  window._hudDatos = {
    totalApartado:(d.apartados&&d.apartados.totalApartado)||0,
    necesidades:d.necesidades||{}, datosMes:d.datosMes||{},
    financiero:d.financieroAvanzado||{} };
  /* E3-D3: el form consume catálogos y sheetUrl del mismo getAll */
  if(d.catalogos && typeof onCats==='function'){ try{onCats(d.catalogos);}catch(e){} }
  if(d.sheetUrl && typeof window._setSheetUrl==='function') window._setSheetUrl(d.sheetUrl);
}

/* ── "Usar ✓" de apartados — comportamiento rescatado de
   raw-dashboard.js:603 (api directa; _hint en vez de showToast) ── */
window._marcarApartadoUsado = function(fila){
  if(!confirm('¿Marcar este apartado como Usado?')) return;
  api.actualizarApartado(fila,'Usado').then(function(r){
    if(r.ok){
      _hint('✓ APARTADO MARCADO COMO USADO');
      api.getApartados().then(function(a){
        window._apartadosData = (a && a.items) || [];
        if(window.nivel===2 && document.getElementById('pat-cards-row'))
          _EXPAND_CONFIG['hud-patrimonio'].hydrate();
      }).catch(function(){});
    } else _hint(r.mensaje||'ERROR AL ACTUALIZAR');
  }).catch(function(){ _hint('ERROR DE CONEXIÓN'); });
};

/* ═══ E3-D2 — ROCOLA PLENA: todas las cards visibles con contenido
   (|rel|<=3 plenas; 4 tenue de canto; 5 fuera). Envoltura POR FUERA
   de colocar() — el motor no se toca. ═══ */
/* ═══ E3-D7 — ANILLO EXTENDIDO A 18 (dial intacto en 11) ═══
   El dial nació de los 11 primeros SEC; empujar entradas DESPUÉS no lo
   toca. El anillo (nivel 1-2) sí las recibe: colocar/lados/_expandir
   pasan a operar sobre M, con la MISMA matemática del motor (copiada
   literal, solo N→M). Flechas y laterales se interceptan en captura
   para girar módulo M. Colores/nombres de los 4 financieros: canon del
   coverflow v9 (COLORES/NOMBRES, raw-coverflow.js:110-124). */
var _gajos3D = window.gajoMeshes.slice(0, window.N);   /* raycast: solo reales */
function _icoLinea(fn){return fn}
var EXTRA = [
  {id:'financiero', t:'FINANCIERO', s:'Flujo del mes', c:'#22D3EE',
   draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x-9*k,y+7*k);ctx.lineTo(x-9*k,y-7*k);ctx.moveTo(x-9*k,y+7*k);ctx.lineTo(x+9*k,y+7*k);ctx.moveTo(x-6*k,y+3*k);ctx.lineTo(x-1*k,y-2*k);ctx.lineTo(x+3*k,y+1*k);ctx.lineTo(x+8*k,y-6*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}},
  {id:'variables', t:'VARIABLES', s:'Gastos variables', c:'#A5B4FC',
   draw:function(ctx,x,y,s,c){var k=s/22;[[-7,2],[0,-3],[7,5]].forEach(function(p){ctx.beginPath();ctx.moveTo(x+p[0]*k,y+8*k);ctx.lineTo(x+p[0]*k,y+p[1]*k);ctx.strokeStyle=c;ctx.lineWidth=3;ctx.lineCap='round';ctx.stroke();});}},
  {id:'fijos', t:'FIJOS', s:'Pagos recurrentes', c:'#67E8F9',
   draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x,y,8*k,Math.PI*.25,Math.PI*1.75);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();ctx.beginPath();ctx.moveTo(x+8.5*k,y-6*k);ctx.lineTo(x+5*k,y-8*k);ctx.lineTo(x+9*k,y-10*k);ctx.closePath();ctx.fillStyle=c;ctx.fill();}},
  {id:'necesidades', t:'NECESIDADES', s:'Pirámide Maslow', c:'#A855F7',
   draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x,y-9*k);ctx.lineTo(x+10*k,y+8*k);ctx.lineTo(x-10*k,y+8*k);ctx.closePath();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();ctx.beginPath();ctx.moveTo(x-5*k,y+2.5*k);ctx.lineTo(x+5*k,y+2.5*k);ctx.strokeStyle=c;ctx.lineWidth=1.4;ctx.stroke();}},
  {id:'logros', t:'LOGROS', s:'XP y recompensas', c:'#FACC15',
   draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x-6*k,y-8*k);ctx.lineTo(x+6*k,y-8*k);ctx.lineTo(x+6*k,y-2*k);ctx.bezierCurveTo(x+6*k,y+3*k,x-6*k,y+3*k,x-6*k,y-2*k);ctx.closePath();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();ctx.beginPath();ctx.moveTo(x,y+3*k);ctx.lineTo(x,y+7*k);ctx.moveTo(x-4*k,y+9*k);ctx.lineTo(x+4*k,y+9*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();}},
  {id:'notas', t:'NOTAS', s:'Sticky notes', c:'#FEF3A0',
   draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x-8*k,y-8*k);ctx.lineTo(x+8*k,y-8*k);ctx.lineTo(x+8*k,y+3*k);ctx.lineTo(x+3*k,y+8*k);ctx.lineTo(x-8*k,y+8*k);ctx.closePath();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();ctx.beginPath();ctx.moveTo(x+3*k,y+8*k);ctx.lineTo(x+3*k,y+3*k);ctx.lineTo(x+8*k,y+3*k);ctx.strokeStyle=c;ctx.lineWidth=1.6;ctx.stroke();}},
  {id:'sos', t:'SOS', s:'Centro de emergencia', c:'#EF4444',
   draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x,y,9*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(x,y-5*k);ctx.lineTo(x,y+1.5*k);ctx.strokeStyle=c;ctx.lineWidth=2.4;ctx.lineCap='round';ctx.stroke();ctx.beginPath();ctx.arc(x,y+5*k,1.3*k,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();}}
];
EXTRA.forEach(function(sx){
  window.SEC.push(sx);
  /* dummy Object3D: poblarCards escribe emissive/opacity sin reventar;
     jamás entra a raycasts (usamos _gajos3D) ni a la escena */
  var d=new THREE.Object3D(); d.material={emissiveIntensity:0};
  var ch=new THREE.Object3D(); ch.material={opacity:0}; d.add(ch);
  window.gajoMeshes.push(d);
  /* nodo del anillo: MISMO markup del motor */
  var i=window.SEC.length-1;
  var n=document.createElement('div');
  n.className='nodo';
  n.style.setProperty('--c',sx.c);
  n.innerHTML='<div class="lift"><div class="barra"></div>'+
    '<div class="card"><div class="ico"><img src="'+window._icoV9(sx,96)+'" width="30" height="30"></div>'+
    '<div class="t">'+sx.t+'</div><div class="s">'+sx.s+'</div>'+
    '<div class="div"></div>'+
    '<div class="m"><span>REGISTROS</span><b>—</b></div>'+
    '<div class="m"><span>ÚLTIMO</span><b>—</b></div>'+
    '<div class="m"><span>SYNC</span><b>OK</b></div></div></div>';
  n.addEventListener('click',function(){
    if(window.enTransicion)return;
    if(window.nivel===1){if(i===window.idx)window.irNivel(2);else window.girarA(i)}
  });
  document.getElementById('mundoCSS').appendChild(n);
  window.nodos.push(n);
});
var M = window.SEC.length;                              /* 18 */
/* colocar: matemática del motor LITERAL, solo N→M + rocola plena */
window.colocar = function(){
  var enA=document.documentElement.classList.contains('en-anillo');
  for(var i=0;i<M;i++){
    var rel=((i-window.idx)%M+M)%M;
    if(rel>M/2)rel-=M;
    var prev=window.nodos[i]._rel;
    var envuelve=(prev!==undefined&&Math.abs(rel-prev)>M/2);
    window.nodos[i]._rel=rel;
    if(envuelve)window.nodos[i].style.transition='none';
    var angC=-rel*window.PASO;
    window.nodos[i].style.transform=
      'rotateY('+angC+'deg) translateZ(-'+window.RADIO+'px)';
    window.nodos[i].style.setProperty('--dly',(Math.abs(rel)*90)+'ms');
    var _ar=Math.abs(rel);
    window.nodos[i].classList.toggle('lejana',_ar>=4);
    window.nodos[i].style.opacity=enA?(_ar<=3?1:_ar===4?.45:0):'';
    if(envuelve){void window.nodos[i].offsetWidth;window.nodos[i].style.transition='';}
  }
};
window._expandir = function(i){
  for(var k=0;k<M;k++)window.nodos[k].classList.toggle('expandida',k===i);
};
window.lados = function(){
  var iz=window.SEC[(window.idx-1+M)%M],de=window.SEC[(window.idx+1)%M];
  var eIz=document.getElementById('sec-izq'),eDe=document.getElementById('sec-der');
  eIz.innerHTML='<span class="fl">◀</span> '+iz.t;
  eDe.innerHTML=de.t+' <span class="fl">▶</span>';
  eIz.style.setProperty('--lc',iz.c);
  eDe.style.setProperty('--lc',de.c);
};
/* flechas y laterales: módulo M (captura, antes del motor que usa N) */
addEventListener('keydown',function(e){
  if(window.nivel<1||window.enTransicion)return;
  if(e.key==='ArrowRight'){e.preventDefault();e.stopImmediatePropagation();window.girarA((window.idx+1)%M);}
  if(e.key==='ArrowLeft'){e.preventDefault();e.stopImmediatePropagation();window.girarA((window.idx-1+M)%M);}
},true);
document.addEventListener('click',function(e){
  if(window.nivel<1||window.enTransicion)return;
  var iz=e.target.closest&&e.target.closest('#sec-izq');
  var de=e.target.closest&&e.target.closest('#sec-der');
  if(iz){e.stopImmediatePropagation();window.girarA((window.idx-1+M)%M);}
  if(de){e.stopImmediatePropagation();window.girarA((window.idx+1)%M);}
},true);
/* purga de fantasmas al emerger (1→0): el motor purga sus 11;
   las extra se apagan igual, en el mismo instante del switch */
var _prevEnA=false;
function _purgaExtras(){
  var enA=document.documentElement.classList.contains('en-anillo');
  if(_prevEnA&&!enA){
    for(var q=window.N;q<M;q++){
      window.nodos[q].style.transition='none';
      window.nodos[q].style.opacity='0';
      void window.nodos[q].offsetWidth;
      window.nodos[q].style.transition='';
    }
    window.colocar();
  }
  _prevEnA=enA;
}
colocar();

/* ═══ LOOP PROPIO (ligero; el del motor no se toca) ═══ */
(function loopNav(now){
  _pasoRing(now);
  _pasoMini();
  /* datos: cuando escena resuelve getAll (_capa1Data), espejar a los
     globals v9 que consumen los paneles */
  if(window._capa1Data && window._capa1Data !== _lastCapa1){
    _lastCapa1 = window._capa1Data;
    _distribuirV9(_lastCapa1);
    if(window.nivel===2) window._v11RenderSeccion(window.idx);
  }
  /* halo del planeta: se apaga al descender (a alt 172 la cámara queda
     DENTRO del sprite de 560u y su gradiente violeta ahogaba el cosmos) */
  _pasoReveal(now);
  _pasoScrub(now);
  _purgaExtras();
  var _h=document.documentElement;
  _h.classList.toggle('niv-warp', !!window.enTransicion);
  if(!window.enTransicion){
    _h.classList.toggle('niv-0',window.nivel===0);
    _h.classList.toggle('niv-1',window.nivel===1);
    _h.classList.toggle('niv-2',window.nivel===2);
  }
  _pasoHub();
  _pasoLabelsRadiales();
  /* arcos del dial: viven y mueren CON los gajos (spread) y el nivel */
  var vis = ((window.nivel===0||window.enTransicion) ? window.gajos.spread : 0)*_rev;
  for(var ri=0;ri<_rims.length;ri++){
    var rr=_rims[ri], on=(ri===_hov);
    rr.core.material.opacity =(on?1:.85)*vis;
    rr.halo.material.opacity =(on?.50:.22)*vis;
    rr.inner.material.opacity=.18*vis;
  }
  var hl = window._v11Halo;
  if(hl){
    var ka = Math.max(0, Math.min(1, (window.cam.alt-500)/620));
    hl.material.opacity = .9*ka;
  }
  requestAnimationFrame(loopNav);
})(performance.now());

console.log('[v11-nav] E3-D18 activo · scrub de inmersión + warp proporcional · hub a proporción v9 (0.29) · revelado por capas v9 + rueda contextual niv2 · necesidades v9 + rueda=scroll en niv2 + fijos auto-fetch · _dispararWarp cableado (hyperdrive+vórtice v9) · warp v9 (vórtice joseph) + fijos/variables expandidos + Helvetica Neue · nivel 2 FULLSCREEN + Activity Check completo · cosmos destapado + tinte v9 real (.08) + arcos protagonistas · cosmos v9 EXACTO + hub RAW + sub-anillo geometría v9 + labels radiales · anillo 18 (financiero/variables/fijos/necesidades/logros/notas/sos) · boards timers+nutrición en nivel 2 · dial v9 (tinte+glow+anillo+hover, clic sin giro) · sub-anillos→FORM + centro RAW + editar + paneles nivel 2');
})();
