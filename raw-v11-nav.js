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
      else {
        n.classList.remove('pulso');void n.offsetWidth;n.classList.add('pulso');
        _hint('PRESET LISTO · '+sb.label.toUpperCase()+' · FORM RAW LLEGA EN E4');
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

/* ═══ ENTRADAS ═══ */
var _ray=new THREE.Raycaster(),_ptr=new THREE.Vector2();
addEventListener('click',function(e){
  if(e.target.closest&&(e.target.closest('.v11-sub')||e.target.closest('#v11-minidial')))return;
  if(e.target.closest&&(e.target.closest('.hero')||e.target.closest('#v11-top')||
     e.target.closest('#v11-bot')||e.target.closest('#seccion')))return;
  if(window.nivel!==0||window.enTransicion)return;
  _ptr.x=(e.clientX/innerWidth)*2-1;_ptr.y=-(e.clientY/innerHeight)*2+1;
  _ray.setFromCamera(_ptr,window.camera);
  var hit=_ray.intersectObjects(window.gajoMeshes,false);
  if(hit.length){
    var i=hit[0].object.userData.i;
    if(ring.abierto&&ring.sector===i)_cerrarRing();
    else _abrirRing(i);                  /* girarA del motor corre en paralelo:
                                            la corona viaja con el sector */
  } else if(ring.abierto){ _cerrarRing(); }
});
addEventListener('keydown',function(e){
  if(e.key==='Escape'&&ring.abierto)_cerrarRing();
},{passive:true});

/* ═══ LOOP PROPIO (ligero; el del motor no se toca) ═══ */
(function loopNav(now){
  _pasoRing(now);
  _pasoMini();
  requestAnimationFrame(loopNav);
})(performance.now());

console.log('[v11-nav] E3-D1 activo · sub-anillos + cadenas de nivel + mini-dial');
})();
