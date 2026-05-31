/* RAW Entry — Home Carousel (móvil) v.6.030
   ╔══════════════════════════════════════════════════════════════════╗
   ║ FASE v6.030 — CARRUSEL DEL HOME MÓVIL                            ║
   ╚══════════════════════════════════════════════════════════════════╝
   El Home en móvil (<900px) deja de ser un stack vertical de secciones
   y pasa a ser un CARRUSEL horizontal estilo Apple Watch / jukebox.

   Modelo (Opción A — el overlay NO se toca):
   · El dial-overlay sigue siendo position:fixed cubriendo la pantalla,
     con su fondo cósmico vivo detrás de todo (z-index:9000).
   · Encima se monta un contenedor carrusel (#os-carousel, z-index:8500
     — por DEBAJO del overlay para el slide 0, ver más abajo).
   · Slide 0 = "slide del dial": un panel TRANSPARENTE del tamaño de la
     pantalla. No dibuja nada — es un hueco por el que se ve el dial
     que está detrás. Pulsar el centro del dial sigue funcionando
     porque el overlay está por encima en ese slide.
   · Slides 1..N = las .section reales del Home (Bancos, Financiero,
     Variables, Fijos, Patrimonio, Necesidades). Se MUEVEN físicamente
     dentro del carrusel (no se recrean: conservan contenido y
     listeners). En slides 1+, el carrusel se eleva por encima del
     overlay para que las cards sean visibles e interactivas.
   · Abajo: una fila de puntos indicadores (el "scrubber").

   Navegación:
   · Deslizar horizontal (scroll-snap) mueve entre dial y cards.
   · HOME en la barra superior → snap al slide 0 (window._osCarouselHome).
   · El router _osMostrar('home') invoca el snap al slide 0.

   Desktop (>=900px): este módulo NO hace nada. El Home de escritorio
   sigue con sus paneles HUD flotantes y _reposicionarHUD intactos.
*/
(function(){
  'use strict';

  var MOB_BP   = 900;          // breakpoint móvil
  var SECCIONES = [            // orden de los slides de cards
    'sec-entes', 'sec-financiero', 'sec-gastos',
    'sec-anualidad', 'sec-patrimonio', 'sec-maslow-inline'
  ];
  var SEC_LABEL = {
    'sec-entes':'Bancos', 'sec-financiero':'Financiero',
    'sec-gastos':'Variables', 'sec-anualidad':'Fijos',
    'sec-patrimonio':'Patrimonio', 'sec-maslow-inline':'Necesidades'
  };

  var _built   = false;
  var _track   = null;   // el scroller horizontal
  var _dots    = null;   // contenedor de puntos
  var _slides  = [];     // referencias a los slides (incluido el del dial)
  var _idx     = 0;      // slide activo
  var _snapRAF = 0;

  function esMovil(){ return window.innerWidth < MOB_BP; }

  /* ── Construcción del carrusel ───────────────────────────────────── */
  function build(){
    if(_built) return;
    if(!esMovil()) return;

    var anverso = document.getElementById('board-anverso');
    var mobSec  = document.getElementById('mob-sections');
    if(!anverso || !mobSec) return;

    // Contenedor raíz del carrusel
    var root = document.createElement('div');
    root.id = 'os-carousel';
    root.className = 'os-carousel';

    // Track scrolleable
    var track = document.createElement('div');
    track.id = 'os-carousel-track';
    track.className = 'os-carousel-track';

    // ── Slide 0: el "slide del dial" (transparente) ──
    var dialSlide = document.createElement('div');
    dialSlide.className = 'os-slide os-slide-dial';
    dialSlide.setAttribute('data-slide', '0');
    dialSlide.setAttribute('data-label', 'Dial');
    track.appendChild(dialSlide);
    _slides.push(dialSlide);

    // ── Slides 1..N: las .section reales ──
    SECCIONES.forEach(function(secId, i){
      var sec = document.getElementById(secId);
      if(!sec) return;
      var slide = document.createElement('div');
      slide.className = 'os-slide os-slide-card';
      slide.setAttribute('data-slide', String(i + 1));
      slide.setAttribute('data-label', SEC_LABEL[secId] || secId);
      // Mover la sección REAL dentro del slide (no se recrea)
      slide.appendChild(sec);
      // sec-entes nace con display:none — en el carrusel debe verse
      sec.style.display = '';
      track.appendChild(slide);
      _slides.push(slide);
    });

    root.appendChild(track);

    // ── Fila de puntos indicadores (scrubber) ──
    var dots = document.createElement('div');
    dots.className = 'os-carousel-dots';
    _slides.forEach(function(s, i){
      var d = document.createElement('button');
      d.className = 'os-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('data-go', String(i));
      d.setAttribute('aria-label', s.getAttribute('data-label') || ('Slide ' + i));
      d.addEventListener('click', function(){ goTo(i); });
      dots.appendChild(d);
    });
    root.appendChild(dots);

    // Insertar el carrusel dentro del board-anverso (que el router ya
    // gestiona como capa del Home). board-anverso pierde su display:none.
    anverso.style.display = '';
    anverso.appendChild(root);

    _track = track;
    _dots  = dots;
    _built = true;

    // Sincronizar punto activo al hacer scroll
    track.addEventListener('scroll', onScroll, { passive:true });

    // Posición inicial: slide del dial
    requestAnimationFrame(function(){ goTo(0, true); });
  }

  /* ── Scroll → actualizar índice y puntos ─────────────────────────── */
  function onScroll(){
    if(_snapRAF) cancelAnimationFrame(_snapRAF);
    _snapRAF = requestAnimationFrame(function(){
      if(!_track) return;
      var w = _track.clientWidth || 1;
      var i = Math.round(_track.scrollLeft / w);
      if(i !== _idx){
        _idx = i;
        syncDots();
      }
    });
  }

  function syncDots(){
    if(!_dots) return;
    Array.prototype.forEach.call(_dots.children, function(d, i){
      d.classList.toggle('active', i === _idx);
    });
    // En el slide del dial, el carrusel deja pasar los toques al overlay
    // (el dial está detrás). En slides de cards, el carrusel captura.
    var root = document.getElementById('os-carousel');
    if(root) root.classList.toggle('on-dial', _idx === 0);
  }

  /* ── Ir a un slide ───────────────────────────────────────────────── */
  function goTo(i, instant){
    if(!_track) return;
    i = Math.max(0, Math.min(_slides.length - 1, i));
    var w = _track.clientWidth || 1;
    _track.scrollTo({ left: i * w, behavior: instant ? 'auto' : 'smooth' });
    _idx = i;
    syncDots();
  }

  /* ── API pública para el router ──────────────────────────────────── */
  // HOME → snap al slide del dial (slide 0). Sin reconstruir nada.
  window._osCarouselHome = function(){
    if(!_built || !esMovil()) return;
    goTo(0);
  };
  // ¿Está el carrusel activo? (para que el router lo sepa)
  window._osCarouselActivo = function(){ return _built && esMovil(); };

  /* ── Arranque ────────────────────────────────────────────────────── */
  function init(){
    if(!esMovil()) return;     // desktop: el carrusel no existe
    build();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(init, 600);   // tras el arranque del overlay
    });
  } else {
    setTimeout(init, 600);
  }

  window._initOsCarousel = init;
})();
