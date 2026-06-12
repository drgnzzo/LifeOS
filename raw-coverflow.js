/* RAW Entry — Cover Flow Nivel 1 v.7.094 (clones reales + giro)
   ╔══════════════════════════════════════════════════════════════════╗
   ║ COVER FLOW — vecinas como CLONES REALES de las cards + animación ║
   ╚══════════════════════════════════════════════════════════════════╝
   Evolución del v7.092 tras la referencia visual de Electronics:
   · Las vecinas del aro ya NO son cajas abstractas: son CLONES del DOM
     real de la card vecina (contenido vivo: header, datos, sparklines
     copiadas bitmap a bitmap), escalados, atenuados, asomándose por
     detrás de la card central (z 9040 < 9050 de .hud-expanded).
   · GIRO: al navegar, los clones se deslizan hacia el centro y los
     nuevos vecinos entran desde los bordes (sensación de aro girando).
   · FIX del flash: durante la navegación el estado del aro SE SOSTIENE
     (cf-on y data-cf-ring no se limpian en el micro-colapso), así las
     compactas jamás parpadean entre card y card.
   Reglas heredadas intactas: cero escrituras sobre cards reales (los
   clones son copias mías), cero MutationObserver, cero hook de
   _reposicionarHUD, cortacircuitos de 3 fallos.
*/
(function(){
  'use strict';

  // ── Limpieza de restos de intentos anteriores ──
  try {
    document.documentElement.classList.remove('coverflow-on','cf-on','cf-girando');
    document.querySelectorAll('[data-cf],[data-cf-ring],[data-cf-center]').forEach(function(el){
      el.removeAttribute('data-cf');
      el.removeAttribute('data-cf-ring');
      el.removeAttribute('data-cf-center');
    });
    ['coverflow-css','cf4-css','cf5-css'].forEach(function(id){
      var n = document.getElementById(id);
      if(n && n.parentNode) n.parentNode.removeChild(n);
    });
    document.querySelectorAll('.cf-arrows,.cf4-ghost,.cf4-arrow,.cf5-ghost,.cf5-arrow').forEach(function(n){
      if(n.parentNode) n.parentNode.removeChild(n);
    });
  } catch(e){}

  if(window.innerWidth < 900) return;   // solo escritorio

  /* ════════ CSS ════════ */
  var css = document.createElement('style');
  css.id = 'cf5-css';
  css.textContent =
    /* Cards del aro no-centrales: ocultas mientras cf-on */
    'html.cf-on .hud-pnl[data-cf-ring]{opacity:0 !important;'+
      'visibility:hidden !important;pointer-events:none !important;'+
      'transition:opacity .3s ease, visibility 0s linear .3s}'+
    /* Marco fantasma: ventana del clon */
    '.cf5-ghost{position:fixed;z-index:9040;overflow:hidden;cursor:pointer;'+
      'background:rgba(8,6,18,.55);border:1px solid var(--cf5-col,var(--hud-border));'+
      'box-shadow:0 0 28px rgba(0,0,0,.6),0 0 16px var(--cf5-glow,transparent);'+
      'opacity:0;pointer-events:none;'+
      'transition:opacity .4s ease,transform .42s cubic-bezier(.25,.8,.3,1),'+
        'left .42s cubic-bezier(.25,.8,.3,1),width .3s ease,height .3s ease}'+
    'html.cf-on .cf5-ghost{opacity:.62;pointer-events:auto}'+
    '.cf5-ghost:hover{opacity:.95 !important}'+
    /* Contenido clonado: atenuado tipo referencia */
    '.cf5-wrap{position:absolute;left:0;top:0;transform-origin:top left;'+
      'pointer-events:none;filter:saturate(.55) brightness(.8)}'+
    /* Chip de posición en el aro */
    '.cf5-pos{position:absolute;top:8px;left:0;right:0;text-align:center;'+
      'font-size:10px;letter-spacing:.14em;text-transform:uppercase;'+
      'color:var(--hud-text-dim);z-index:2;text-shadow:0 0 6px #000;'+
      'pointer-events:none}'+
    /* GIRO: los fantasmas se deslizan hacia el centro y se apagan */
    'html.cf-girando .cf5-ghost.lado-izq{transform:translateX(120px);opacity:.15}'+
    'html.cf-girando .cf5-ghost.lado-der{transform:translateX(-120px);opacity:.15}'+
    /* Flechas */
    '.cf5-arrow{position:fixed;top:50%;transform:translateY(-50%);z-index:9060;'+
      'width:42px;height:74px;display:flex;align-items:center;justify-content:center;'+
      'background:rgba(10,7,22,.7);border:1px solid var(--hud-border);'+
      'color:var(--hud-text-dim);font-size:20px;cursor:pointer;user-select:none;'+
      'opacity:0;pointer-events:none;transition:opacity .3s ease,border-color .2s,color .2s}'+
    'html.cf-on .cf5-arrow{opacity:1;pointer-events:auto}'+
    '.cf5-arrow:hover{border-color:var(--hud-border-hov);color:#fff;'+
      'box-shadow:0 0 16px var(--hud-glow)}'+
    '.cf5-arrow.izq{left:14px}.cf5-arrow.der{right:14px}';
  document.head.appendChild(css);

  /* ════════ ESTADO ════════ */
  var SIDES = { 'left-1':0, 'left-2':1, 'right-1':2, 'right-2':3 };
  var COLORES = {
    'hud-patrimonio':'#22C55E','hud-necesidades':'#A855F7',
    'hud-bitacora':'#C084FC','hud-financiero':'#22D3EE',
    'hud-activity':'#FB923C','hud-fijos':'#67E8F9','hud-variables':'#A5B4FC'
  };
  var _gL=null,_gR=null,_aL=null,_aR=null;
  var _cloneIdL=null,_cloneIdR=null;
  var _fallos=0,_muerto=false,_navegando=false;

  function esLateral(el){ return !!(el && el._side && (el._side in SIDES)); }
  function anillo(){
    if(!window._hudPanels) return [];
    return window._hudPanels
      .map(function(hp){ return hp.el || hp; })
      .filter(esLateral)
      .sort(function(a,b){
        if(a._side !== b._side) return SIDES[a._side] - SIDES[b._side];
        return (a._order||0) - (b._order||0);
      });
  }

  /* ════════ FANTASMAS (marco + clon real) ════════ */
  function _mkGhost(lado){
    var g = document.createElement('div');
    g.className = 'cf5-ghost lado-' + lado;
    g.innerHTML = '<div class="cf5-pos"></div><div class="cf5-wrap"></div>';
    g.addEventListener('click', function(){ navegar(lado==='izq' ? -1 : +1); });
    document.body.appendChild(g);
    return g;
  }
  function _mkArrow(lado){
    var a = document.createElement('div');
    a.className = 'cf5-arrow ' + lado;
    a.textContent = lado==='izq' ? '◀' : '▶';
    a.addEventListener('click', function(){ navegar(lado==='izq' ? -1 : +1); });
    document.body.appendChild(a);
    return a;
  }
  function asegurarUI(){
    if(!_gL) _gL=_mkGhost('izq');
    if(!_gR) _gR=_mkGhost('der');
    if(!_aL) _aL=_mkArrow('izq');
    if(!_aR) _aR=_mkArrow('der');
  }

  // Clonar el DOM real de la card vecina dentro del fantasma.
  // El clon es MÍO: se neutraliza por completo (sin ids duplicados, sin
  // clase hud-pnl que lo oculte, sin animaciones, sin eventos).
  function montarClon(g, cardEl, etiqueta, anchoMarco){
    var col = COLORES[cardEl.id] || '#8b5cf6';
    g.style.setProperty('--cf5-col', col);
    g.style.setProperty('--cf5-glow', col + '55');
    g.querySelector('.cf5-pos').textContent = etiqueta;
    var wrap = g.querySelector('.cf5-wrap');
    wrap.innerHTML = '';
    var c = cardEl.cloneNode(true);
    c.removeAttribute('id');
    c.removeAttribute('data-cf-ring');
    c.removeAttribute('data-cf-center');
    c.classList.remove('hud-pnl','hud-expanded');
    c.querySelectorAll('[id]').forEach(function(n){ n.removeAttribute('id'); });
    var wReal = cardEl.getBoundingClientRect().width || 330;
    if(wReal < 50) wReal = 330;   // oculta: rect 0 -> usar ancho típico
    c.style.cssText = 'position:static;display:block;width:'+Math.round(wReal)+
      'px;opacity:1;visibility:visible;transform:none;animation:none;'+
      'pointer-events:none;margin:0;left:auto;top:auto';
    wrap.appendChild(c);
    // Copiar bitmaps de los canvas (cloneNode deja canvases en blanco)
    try {
      var orig = cardEl.querySelectorAll('canvas');
      var dup  = c.querySelectorAll('canvas');
      for(var i=0;i<orig.length && i<dup.length;i++){
        dup[i].width = orig[i].width; dup[i].height = orig[i].height;
        var ctx = dup[i].getContext('2d');
        if(ctx && orig[i].width>0) ctx.drawImage(orig[i],0,0);
      }
    } catch(e){}
    var escala = anchoMarco / wReal;
    wrap.style.transform = 'scale(' + escala.toFixed(3) + ')';
    wrap.style.top = '26px';
  }

  /* ════════ APLICAR (idempotente) ════════ */
  function aplicar(){
    if(_muerto) return;
    try {
      var h = document.documentElement;
      var centro = window._hudExpanded || null;
      var activo = h.classList.contains('niv-1') && centro && esLateral(centro);

      if(!activo){
        // Sostener el aro durante la navegación: el micro-colapso entre
        // card y card NO limpia (asi las compactas jamás parpadean).
        if(_navegando) return;
        if(h.classList.contains('cf-on')) limpiar();
        return;
      }

      var aro = anillo();
      if(aro.length < 2){ limpiar(); return; }
      var idx = aro.indexOf(centro);
      if(idx < 0){ limpiar(); return; }

      asegurarUI();
      var n = aro.length;
      var prev = aro[(idx-1+n)%n], next = aro[(idx+1)%n];

      aro.forEach(function(el){
        if(el === centro){
          el.removeAttribute('data-cf-ring');
          el.setAttribute('data-cf-center','1');
        } else {
          el.removeAttribute('data-cf-center');
          el.setAttribute('data-cf-ring','1');
        }
      });

      var r = centro.getBoundingClientRect();
      if(r.width < 50) return;
      // Marcos: asoman por DETRÁS de la central (solapados ~34px)
      var gw = Math.min(460, Math.max(280, r.width * 0.42));
      var gh = Math.round(r.height * 0.92);
      var top = Math.max(64, r.top + (r.height - gh)/2);
      var solape = 34;
      _gL.style.width = gw+'px'; _gL.style.height = gh+'px';
      _gR.style.width = gw+'px'; _gR.style.height = gh+'px';
      _gL.style.left = Math.round(Math.max(6, r.left - gw + solape)) + 'px';
      _gL.style.top = top+'px';
      _gR.style.left = Math.round(Math.min(window.innerWidth - gw - 6, r.right - solape)) + 'px';
      _gR.style.top = top+'px';

      if(_cloneIdL !== prev.id){ montarClon(_gL, prev, '◀ '+(((idx-1+n)%n)+1)+' / '+n, gw); _cloneIdL = prev.id; }
      if(_cloneIdR !== next.id){ montarClon(_gR, next, (((idx+1)%n)+1)+' / '+n+' ▶', gw); _cloneIdR = next.id; }

      h.classList.add('cf-on');
      _fallos = 0;
    } catch(e){
      _fallos++;
      if(_fallos >= 3){
        _muerto = true;
        try{ limpiar(); }catch(e2){}
        console.warn('[CoverFlow] auto-desactivado tras 3 fallos:', e.message);
      }
    }
  }

  function limpiar(){
    var h = document.documentElement;
    h.classList.remove('cf-on','cf-girando');
    document.querySelectorAll('.hud-pnl[data-cf-ring],.hud-pnl[data-cf-center]')
      .forEach(function(el){
        el.removeAttribute('data-cf-ring');
        el.removeAttribute('data-cf-center');
      });
    _cloneIdL = _cloneIdR = null;
    if(_gL) _gL.querySelector('.cf5-wrap').innerHTML='';
    if(_gR) _gR.querySelector('.cf5-wrap').innerHTML='';
  }

  /* ════════ NAVEGAR — giro del aro ════════ */
  function navegar(delta){
    if(_muerto || _navegando) return;
    var centro = window._hudExpanded;
    if(!centro) return;
    var aro = anillo();
    var idx = aro.indexOf(centro);
    if(idx < 0) return;
    var destino = aro[(idx+delta+aro.length)%aro.length];
    if(!destino || destino === centro) return;
    _navegando = true;
    var h = document.documentElement;
    h.classList.add('cf-girando');   // los clones se deslizan al centro
    try {
      if(typeof window._hudCollapse === 'function') window._hudCollapse();
      setTimeout(function(){
        try { if(typeof window._hudExpand === 'function') window._hudExpand(destino); } catch(e){}
        setTimeout(function(){
          _navegando = false;
          aplicar();                 // nuevos vecinos montados…
          requestAnimationFrame(function(){
            h.classList.remove('cf-girando');   // …y entran deslizándose
          });
        }, 150);
      }, 70);
    } catch(e){ _navegando = false; h.classList.remove('cf-girando'); }
  }

  /* ════════ REACTIVIDAD ════════ */
  function hookear(){
    if(typeof window._hudExpand === 'function' && !window._hudExpand._cf4){
      var oe = window._hudExpand;
      var we = function(){ var r = oe.apply(this, arguments); setTimeout(aplicar, 90); return r; };
      we._cf4 = true; window._hudExpand = we;
    }
    if(typeof window._hudCollapse === 'function' && !window._hudCollapse._cf4){
      var oc = window._hudCollapse;
      var wc = function(){ var r = oc.apply(this, arguments); setTimeout(aplicar, 90); return r; };
      wc._cf4 = true; window._hudCollapse = wc;
    }
    if(!window._hudExpand || !window._hudExpand._cf4) setTimeout(hookear, 400);
  }
  hookear();
  setInterval(aplicar, 500);

  document.addEventListener('keydown', function(e){
    if(_muerto) return;
    if(!document.documentElement.classList.contains('cf-on')) return;
    if(e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if(e.key === 'ArrowLeft'){ e.preventDefault(); navegar(-1); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); navegar(+1); }
  });

  window._coverflow = {
    estado: function(){
      var aro = anillo();
      return {
        activo: document.documentElement.classList.contains('cf-on'),
        girando: document.documentElement.classList.contains('cf-girando'),
        muerto: _muerto, fallos: _fallos,
        centro: window._hudExpanded ? window._hudExpanded.id : null,
        clones: [_cloneIdL, _cloneIdR],
        aro: aro.map(function(el){ return el.id; })
      };
    },
    navegar: navegar
  };
})();
