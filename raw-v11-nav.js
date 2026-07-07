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
  var rRim=rA*(372/272), rSub=rA*(486/272);     /* R1=172·R2=372·ancla=272 */
  var dPhi=(M>=6?0.185:M>=4?0.225:0.30);
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
    var r=rRim+(rSub-rRim)*e;
    var a=phi+(j-(M-1)/2)*dPhi;
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
    var core =_arcoRing(_R2-1.6,_R2+1.6,a0,ln,c,.55);   /* borde: rgba(acc,.35)~ */
    var halo =_arcoRing(_R2-7,  _R2+9,  a0,ln,c,.14);   /* glow blur12 ~ */
    var inner=_arcoRing(172-1,  172+1.2,a0,ln,c,.15);   /* rim interior .15 */
    _rimG.add(core,halo,inner);
    _rims.push({core:core,halo:halo,inner:inner});
  }
})();
/* anillo exterior segmentado (decorativo v9): arcos cian/violeta */
var _segG=new THREE.Group(); window.mundo.add(_segG);
[[0x67E8F9, 398, 402, 0.0, 2.1, .45],
 [0xA78BFA, 398, 402, 2.6, 1.5, .40],
 [0x67E8F9, 412, 414, 4.4, 1.2, .30],
 [0xA78BFA, 412, 414, 0.6, 0.9, .30]].forEach(function(a){
  _segG.add(_arcoRing(a[1],a[2],a[3],a[4],new THREE.Color(a[0]),a[5]));
});
/* piso v9 de emisivo: envoltura de poblarCards (misma propiedad que la
   capa de datos ya escribe; el motor jamás la toca) */
function _pisoV9(){
  for(var i=0;i<window.N;i++){
    var mesh=window.gajoMeshes[i];
    var I=mesh.material.emissiveIntensity;          /* .12–.38 (capa datos) */
    mesh._v11I = .30 + Math.max(0,(I-.12))*1.2;     /* → .30–.61 (tinte v9) */
    mesh.material.emissiveIntensity = mesh._v11I;
    if(mesh.children[0]&&mesh.children[0].material){
      var o=mesh.children[0].material.opacity;
      mesh.children[0].material.opacity = Math.min(1,.78+Math.max(0,(o-.55))*.5);
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
    m.material.emissiveIntensity=Math.max(.68,(m._v11I||.3)+.25);
    _rims[i].core.material.opacity=1;      /* activo: w3.5 blur28+50 ~ */
    _rims[i].halo.material.opacity=.45;
  }
  document.body.style.cursor=(i>=0)?'pointer':'';
}
addEventListener('mousemove',function(e){
  if(window.nivel!==0||window.enTransicion){ if(_hov>=0)_setHover(-1); return; }
  _ptrH.x=(e.clientX/innerWidth)*2-1;_ptrH.y=-(e.clientY/innerHeight)*2+1;
  _rayH.setFromCamera(_ptrH,window.camera);
  var h=_rayH.intersectObjects(window.gajoMeshes,false);
  _setHover(h.length?h[0].object.userData.i:-1);
},{passive:true});

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
  var hit=_ray.intersectObjects(window.gajoMeshes,false);
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
      if(rA0>2 && dC < rA0*(172/272)){    /* dentro de R1 proyectado */
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
addEventListener('wheel',function(e){
  if(_formAbierto()) e.stopImmediatePropagation();
},{capture:true,passive:true});


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
  activity:'hud-activity'
};
/* CERO DUPLICADOS: un panel agrupador vive en UNA sola card. */
var _renderBase = window._v11RenderSeccion;
window._v11RenderSeccion = function(i){
  var id = window.SEC[i].id, key = _MAPA_PANEL[id];
  var cu = document.getElementById('sec-cuerpo');
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
var _colocarBase = window.colocar;
window.colocar = function(){
  _colocarBase();
  if(!document.documentElement.classList.contains('en-anillo')) return;
  var ns = window.nodos;
  for(var i=0;i<ns.length;i++){
    var ar = Math.abs(ns[i]._rel);
    ns[i].classList.toggle('lejana', ar>=4);
    ns[i].style.opacity = ar<=3 ? 1 : ar===4 ? .45 : 0;
  }
};

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
  /* arcos del dial: viven y mueren CON los gajos (spread) y el nivel */
  var vis = (window.nivel===0||window.enTransicion) ? window.gajos.spread : 0;
  for(var ri=0;ri<_rims.length;ri++){
    var rr=_rims[ri], on=(ri===_hov);
    rr.core.material.opacity =(on?1:.55)*vis;
    rr.halo.material.opacity =(on?.45:.14)*vis;
    rr.inner.material.opacity=.15*vis;
  }
  _segG.children.forEach(function(m,mi){ m.material.opacity=(mi<2?.45:.30)*vis; });
  _segG.rotation.y += 0.0009;                    /* anillo con deriva (v9) */
  if(window._v11Cosmos) window._v11Cosmos.rotation.y += 0.00014;  /* cosmos vivo */
  var hl = window._v11Halo;
  if(hl){
    var ka = Math.max(0, Math.min(1, (window.cam.alt-500)/620));
    hl.material.opacity = .9*ka;
  }
  requestAnimationFrame(loopNav);
})(performance.now());

console.log('[v11-nav] E3-D5 activo · dial v9 (tinte+glow+anillo+hover, clic sin giro) · sub-anillos→FORM + centro RAW + editar + paneles nivel 2');
})();
