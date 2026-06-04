/* RAW Entry — Cover Flow Nivel 1 v.7.067
   ╔══════════════════════════════════════════════════════════════════╗
   ║ FASE v7.067 — COVER FLOW                                         ║
   ╚══════════════════════════════════════════════════════════════════╝
   Cuando una card se expande en Nivel 1, las cards no-expandidas se
   reorganizan como Cover Flow: solo 2 visibles a cada lado de la
   central, en perspectiva 3D, con rotación leve. El resto desaparece.

   Navegación:
     · Flechas ← → del teclado: expande la lateral correspondiente.
     · Click en una lateral: la expande.
     · Click en el dial (centro) o tecla Escape: colapsa todo (Nivel 0).

   No invade el sistema actual. Se engancha así:
     · Escucha window._hudExpanded vía MutationObserver (cambios de
       clase en <html> con niv-1).
     · Cuando detecta niv-1: identifica la card expandida, las cards
       expandibles vecinas (las que están en _EXPAND_CONFIG), aplica
       clases CSS y transforms.
     · Cuando vuelve a niv-0: limpia todo.

   Solo escritorio. Móvil usa carrusel propio.
*/
(function(){
  'use strict';

  if(window.innerWidth < 900) return;

  var _activo = false;
  var _laterales = [];  // [{el, side, distance}]
  var _expandida = null;
  var _kbdListener = null;
  var _clickListener = null;

  // ── CSS inyectado ──────────────────────────────────────────────
  function inyectarCSS(){
    if(document.getElementById('coverflow-css')) return;
    var s = document.createElement('style');
    s.id = 'coverflow-css';
    s.textContent = [
      // En modo coverflow, todas las hud-pnl QUE NO son la expandida
      // ni laterales próximas, se ocultan.
      'html.coverflow-on .hud-pnl:not(.hud-expanded):not(.cf-lateral){',
      '  opacity:0 !important;',
      '  pointer-events:none !important;',
      '  transform:scale(.85) translateY(20px) !important;',
      '  transition:opacity .35s ease, transform .35s ease !important;',
      '}',
      // Las laterales próximas: visibles, en perspectiva 3D
      'html.coverflow-on .cf-lateral{',
      '  opacity:.55 !important;',
      '  pointer-events:auto !important;',
      '  cursor:pointer;',
      '  transition:transform .42s cubic-bezier(.22,1,.36,1), opacity .35s ease, filter .35s ease !important;',
      '  filter:blur(.4px) saturate(.85);',
      '  transform-style:preserve-3d;',
      '  z-index:5 !important;',
      '}',
      'html.coverflow-on .cf-lateral:hover{',
      '  opacity:.85 !important;',
      '  filter:none;',
      '}',
      // Las cuatro posiciones laterales (2 izq, 2 der)
      'html.coverflow-on .cf-lateral.cf-l1{',
      '  transform:perspective(1200px) translateX(-110%) translateY(-50%) translateZ(-80px) rotateY(38deg) scale(.78) !important;',
      '  top:50% !important; left:50% !important; right:auto !important; bottom:auto !important;',
      '}',
      'html.coverflow-on .cf-lateral.cf-l2{',
      '  transform:perspective(1200px) translateX(-180%) translateY(-50%) translateZ(-160px) rotateY(48deg) scale(.62) !important;',
      '  top:50% !important; left:50% !important; right:auto !important; bottom:auto !important;',
      '  opacity:.30 !important;',
      '}',
      'html.coverflow-on .cf-lateral.cf-r1{',
      '  transform:perspective(1200px) translateX(10%) translateY(-50%) translateZ(-80px) rotateY(-38deg) scale(.78) !important;',
      '  top:50% !important; left:50% !important; right:auto !important; bottom:auto !important;',
      '}',
      'html.coverflow-on .cf-lateral.cf-r2{',
      '  transform:perspective(1200px) translateX(80%) translateY(-50%) translateZ(-160px) rotateY(-48deg) scale(.62) !important;',
      '  top:50% !important; left:50% !important; right:auto !important; bottom:auto !important;',
      '  opacity:.30 !important;',
      '}',
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── Identificar cards expandibles ──────────────────────────────
  // Lo sabemos de dos formas: (a) las que están en _EXPAND_CONFIG,
  // (b) las que NO son las cards superiores fijas (user, sim, stats,
  // track, mision, logro, nivel). Vamos por (b) — más robusto.
  function obtenerCardsExpandibles(){
    if(!window._hudPanels) return [];
    var fijasIds = ['hud-user','hud-sim-band','hud-stats','hud-track','hud-mision','hud-logro','hud-nivel'];
    return window._hudPanels
      .map(function(hp){ return hp.el; })
      .filter(function(el){
        if(!el || !el.id) return false;
        if(fijasIds.indexOf(el.id) !== -1) return false;
        // Verificar que no sea shell vacío de móvil
        if(el.style.display === 'none' && !el.firstElementChild) return false;
        return true;
      });
  }

  // ── Calcular las 4 laterales más cercanas a la expandida ──────
  function calcularLaterales(){
    var todas = obtenerCardsExpandibles();
    var idx = todas.indexOf(_expandida);
    if(idx === -1) return [];
    var n = todas.length;
    var laterales = [];
    // L1: anterior (-1), L2: -2, R1: siguiente (+1), R2: +2
    // Con wrap-around.
    [
      { offset: -1, clase: 'cf-l1' },
      { offset: -2, clase: 'cf-l2' },
      { offset:  1, clase: 'cf-r1' },
      { offset:  2, clase: 'cf-r2' },
    ].forEach(function(p){
      var i = (idx + p.offset + n) % n;
      if(i === idx) return;
      laterales.push({ el: todas[i], clase: p.clase, idx: i });
    });
    return laterales;
  }

  // ── Activar coverflow ─────────────────────────────────────────
  function activar(panelExpandido){
    if(!panelExpandido) return;
    _expandida = panelExpandido;

    // Limpiar laterales previas
    _laterales.forEach(function(l){
      l.el.classList.remove('cf-lateral','cf-l1','cf-l2','cf-r1','cf-r2');
    });

    // Calcular nuevas
    _laterales = calcularLaterales();
    _laterales.forEach(function(l){
      l.el.classList.add('cf-lateral', l.clase);
    });

    document.documentElement.classList.add('coverflow-on');
    _activo = true;

    if(!_kbdListener){
      _kbdListener = onKeydown;
      window.addEventListener('keydown', _kbdListener);
    }
    if(!_clickListener){
      _clickListener = onClickLateral;
      document.addEventListener('click', _clickListener, true);
    }
  }

  // ── Desactivar coverflow ───────────────────────────────────────
  function desactivar(){
    _laterales.forEach(function(l){
      l.el.classList.remove('cf-lateral','cf-l1','cf-l2','cf-r1','cf-r2');
    });
    _laterales = [];
    _expandida = null;
    document.documentElement.classList.remove('coverflow-on');
    _activo = false;

    if(_kbdListener){
      window.removeEventListener('keydown', _kbdListener);
      _kbdListener = null;
    }
    if(_clickListener){
      document.removeEventListener('click', _clickListener, true);
      _clickListener = null;
    }
  }

  // ── Navegación: flechas teclado ────────────────────────────────
  function onKeydown(e){
    if(!_activo) return;
    if(e.key === 'ArrowRight'){
      e.preventDefault();
      navegar(+1);
    } else if(e.key === 'ArrowLeft'){
      e.preventDefault();
      navegar(-1);
    } else if(e.key === 'Escape'){
      e.preventDefault();
      if(typeof window._hudCollapse === 'function') window._hudCollapse();
    }
  }

  function navegar(dir){
    var todas = obtenerCardsExpandibles();
    var idx = todas.indexOf(_expandida);
    if(idx === -1) return;
    var nuevo = (idx + dir + todas.length) % todas.length;
    var nuevaCard = todas[nuevo];
    if(typeof window._hudExpand === 'function') window._hudExpand(nuevaCard);
  }

  // ── Click en lateral: expandirla ──────────────────────────────
  function onClickLateral(e){
    if(!_activo) return;
    var lat = e.target.closest('.cf-lateral');
    if(!lat) return;
    e.preventDefault();
    e.stopPropagation();
    if(typeof window._hudExpand === 'function') window._hudExpand(lat);
  }

  // ── Observer: detecta cambios en window._hudExpanded ──────────
  // Se vigila la clase 'niv-1' en <html>, que raw-niveles toggle
  // sincrónicamente con la expansión.
  function watcher(){
    var html = document.documentElement;
    var observer = new MutationObserver(function(){
      var enN1 = html.classList.contains('niv-1');
      var expandida = window._hudExpanded;

      if(enN1 && expandida && expandida !== _expandida){
        // Entró a Nivel 1 o cambió de card expandida
        activar(expandida);
      } else if(!enN1 && _activo){
        // Salió de Nivel 1
        desactivar();
      }
    });
    observer.observe(html, { attributes:true, attributeFilter:['class'] });
  }

  // ── Arranque ──────────────────────────────────────────────────
  function init(){
    inyectarCSS();
    watcher();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
