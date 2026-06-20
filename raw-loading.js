/* RAW Entry — Loading Web v.7.103 (anillo cyber + espectro)
   ╔══════════════════════════════════════════════════════════════════╗
   ║ FASE v7.103 — LOADING CIBERNETICO CENTRAL                         ║
   ╚══════════════════════════════════════════════════════════════════╝
   En el centro (donde luego ira el dial) aparece un anillo cyber con:
     · Nombre de la funcion que esta computando (en mayusculas)
     · Porcentaje grande (sincronizado con la promesa real de api.getAll)
     · Tres puntos animados ".." mientras espera
     · Anillo de progreso con color del espectro (infrarrojo→ultravioleta)
   Las funciones se distribuyen en el espectro segun cuantas haya:
     2 funciones → [rojo, violeta]
     7 funciones → [rojo, naranja, amarillo, verde, cian, azul, violeta]
     N funciones → N pasos del HSL 0° → 280°
   Cada funcion se muestra unos segundos con efecto glitch de cambio.
   Cuando api.getAll() resuelve, el porcentaje salta a 100, el anillo
   destella y se desvanece. Despues entran las cards (clase hud-listo).
*/
(function(){
  'use strict';
  if(window.innerWidth < 900) return;   // solo escritorio

  // ── Funciones a mostrar (orden de aparicion visual) ──
  // Nombres simples y obvios, no nombres tecnicos de codigo.
  var FUNCIONES = [
    'Patrimonio',
    'Necesidades',
    'Bitacora',
    'Fijos',
    'Financiero',
    'Variables',
    'Activity'
  ];

  // ── Espectro infrarrojo → ultravioleta ──
  // Repartimos HSL de 0° (rojo) a 280° (violeta) entre las N funciones.
  function colorAt(idx, total){
    if(total <= 1) return 'hsl(280, 80%, 60%)';
    var h = Math.round(280 * (idx / (total - 1)));
    return 'hsl(' + h + ', 85%, 60%)';
  }

  // ── Estado ──
  var _root, _ring, _ringProgress, _nombre, _pct, _puntos;
  var _idx = 0;
  var _progreso = 0;
  var _terminado = false;
  var _intervaloRotacion = null;
  var _intervaloProgreso = null;
  var _idleTimer = null;

  // ── Construir UI ──
  function construir(){
    _root = document.createElement('div');
    _root.id = 'loading-cyber';
    _root.style.cssText = [
      'position:fixed','left:50%','top:50%','transform:translate(-50%,-50%)',
      'width:280px','height:280px','z-index:100000','pointer-events:none',
      'display:flex','align-items:center','justify-content:center',
      'transition:opacity .6s ease, transform .6s ease'
    ].join(';');

    // Anillo SVG
    var SIZE = 240, R = 105, C = 2 * Math.PI * R;
    _root.innerHTML =
      '<svg width="'+SIZE+'" height="'+SIZE+'" viewBox="0 0 '+SIZE+' '+SIZE+'" '+
        'style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)">'+
        // Anillo exterior tenue (decorativo)
        '<circle cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+(R+18)+'" '+
          'fill="none" stroke="rgba(167,139,250,0.18)" stroke-width="1"/>'+
        // Pista de fondo
        '<circle cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+R+'" '+
          'fill="none" stroke="rgba(120,120,180,0.18)" stroke-width="3"/>'+
        // Anillo de progreso (se anima)
        '<circle id="lc-ring" cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+R+'" '+
          'fill="none" stroke="'+colorAt(0, FUNCIONES.length)+'" stroke-width="4" '+
          'stroke-linecap="round" '+
          'stroke-dasharray="'+C.toFixed(2)+'" '+
          'stroke-dashoffset="'+C.toFixed(2)+'" '+
          'transform="rotate(-90 '+(SIZE/2)+' '+(SIZE/2)+')" '+
          'style="transition:stroke-dashoffset .5s cubic-bezier(.3,.8,.4,1), stroke .5s ease; '+
            'filter:drop-shadow(0 0 8px currentColor)"/>'+
        // Marcas tipo radar (decorativo)
        '<g stroke="rgba(180,180,220,0.25)" stroke-width="1">'+
          dibujarMarcas(SIZE/2, SIZE/2, R-12, R-6, 24)+
        '</g>'+
      '</svg>'+
      // Texto centrado
      '<div style="position:relative;display:flex;flex-direction:column;'+
        'align-items:center;justify-content:center;gap:6px;'+
        'font-family:Manrope,-apple-system,sans-serif;text-align:center">'+
        '<div id="lc-nombre" style="font-size:13px;font-weight:600;'+
          'letter-spacing:0.25em;color:'+colorAt(0, FUNCIONES.length)+';'+
          'text-transform:uppercase;text-shadow:0 0 12px currentColor;'+
          'transition:color .5s ease, opacity .25s ease, transform .25s ease">'+
          FUNCIONES[0].toUpperCase()+
        '</div>'+
        '<div id="lc-pct" style="font-size:42px;font-weight:300;'+
          'font-family:JetBrains Mono,ui-monospace,monospace;'+
          'color:#d8d8f0;letter-spacing:0.04em;text-shadow:0 0 14px rgba(167,139,250,0.4);'+
          'font-variant-numeric:tabular-nums">0%</div>'+
        '<div id="lc-puntos" style="font-size:18px;letter-spacing:0.4em;'+
          'color:rgba(167,139,250,0.7);font-family:JetBrains Mono,monospace;'+
          'height:20px">...</div>'+
      '</div>';

    document.body.appendChild(_root);
    _ring = _root.querySelector('#lc-ring');
    _nombre = _root.querySelector('#lc-nombre');
    _pct = _root.querySelector('#lc-pct');
    _puntos = _root.querySelector('#lc-puntos');

    // Animar los puntos (visual de actividad)
    var pasoP = 0;
    _idleTimer = setInterval(function(){
      if(!_puntos) return;
      pasoP = (pasoP + 1) % 4;
      _puntos.textContent = '.'.repeat(pasoP) + '\u00a0'.repeat(3 - pasoP);
    }, 350);
  }

  function dibujarMarcas(cx, cy, r1, r2, n){
    var out = '';
    for(var i = 0; i < n; i++){
      var ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      var x1 = cx + r1 * Math.cos(ang);
      var y1 = cy + r1 * Math.sin(ang);
      var x2 = cx + r2 * Math.cos(ang);
      var y2 = cy + r2 * Math.sin(ang);
      out += '<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" '+
              'x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'"/>';
    }
    return out;
  }

  // ── Rotacion de nombres con efecto glitch cyber ──
  function rotarNombre(){
    if(_terminado || !_nombre) return;
    _idx = (_idx + 1) % FUNCIONES.length;
    var col = colorAt(_idx, FUNCIONES.length);
    // Glitch: fade out + leve desplazamiento + fade in con nuevo color
    _nombre.style.opacity = '0';
    _nombre.style.transform = 'translateX(-4px)';
    setTimeout(function(){
      if(!_nombre) return;
      _nombre.textContent = FUNCIONES[_idx].toUpperCase();
      _nombre.style.color = col;
      _nombre.style.transform = 'translateX(4px)';
      _nombre.style.opacity = '1';
      setTimeout(function(){
        if(_nombre) _nombre.style.transform = 'translateX(0)';
      }, 60);
      // El anillo TAMBIEN cambia de color al ritmo del nombre
      if(_ring) _ring.style.stroke = col;
    }, 250);
  }

  // ── Progreso "honesto-de-mentira" sincronizable ──
  // Si la promesa real resuelve, salta a 100. Mientras tanto, asintota a 92.
  function pasoProgreso(){
    if(_terminado) return;
    var t = _progreso / 100;
    var v;
    if(t < 0.30)      v = 1.4;
    else if(t < 0.65) v = 0.75;
    else if(t < 0.85) v = 0.30;
    else              v = 0.07;
    _progreso = Math.min(92, _progreso + v);
    pintarProgreso(_progreso);
  }
  function pintarProgreso(p){
    if(!_ring || !_pct) return;
    var R = 105, C = 2 * Math.PI * R;
    var offset = C * (1 - p / 100);
    _ring.setAttribute('stroke-dashoffset', offset.toFixed(2));
    _pct.textContent = Math.round(p) + '%';
  }

  // ── Terminar ──
  function terminar(){
    if(_terminado) return;
    _terminado = true;
    if(_intervaloProgreso) clearInterval(_intervaloProgreso);
    if(_intervaloRotacion) clearInterval(_intervaloRotacion);
    if(_idleTimer) clearInterval(_idleTimer);
    pintarProgreso(100);
    // Destello final y desvanecer
    if(_ring){
      _ring.style.filter = 'drop-shadow(0 0 18px currentColor) drop-shadow(0 0 32px currentColor)';
    }
    setTimeout(function(){
      document.documentElement.classList.add('hud-listo');
      if(_root){
        _root.style.opacity = '0';
        _root.style.transform = 'translate(-50%,-50%) scale(0.92)';
      }
    }, 220);
    setTimeout(function(){
      if(_root && _root.parentNode) _root.parentNode.removeChild(_root);
    }, 1400);
  }

  // ── Engancharse a api.getAll() para terminar HONESTO ──
  function engancharApi(){
    if(!window.api || typeof window.api.getAll !== 'function'){
      return setTimeout(engancharApi, 60);
    }
    if(window.api.getAll._loadingEnvuelto) return;
    var orig = window.api.getAll;
    var envuelto = function(){
      var p = orig.apply(this, arguments);
      if(p && typeof p.then === 'function' && !envuelto._yaDisparado){
        envuelto._yaDisparado = true;
        p.then(function(){ terminar(); })
         .catch(function(){ terminar(); });
      }
      return p;
    };
    envuelto._loadingEnvuelto = true;
    window.api.getAll = envuelto;
  }

  // ── Arranque ──
  function init(){
    construir();
    _intervaloProgreso = setInterval(pasoProgreso, 90);
    // Rotacion cada 1.4s — alcanza a mostrar cada funcion en una carga normal (~7s)
    _intervaloRotacion = setInterval(rotarNombre, 1400);
    engancharApi();
    // Salvavidas: 14s sin api → terminar para no atascar al usuario
    setTimeout(function(){ if(!_terminado) terminar(); }, 14000);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
