/* RAW Entry — Anim v.8.15 (sistema central de fade con GSAP)
   ════════════════════════════════════════════════════════════════════
   Motor de animación central de LifeOS. Construido sobre GSAP (local).

   FILOSOFÍA: nada en la app debe aparecer ni desaparecer de golpe. Todo
   panel, popup, card o cambio de sección pasa por aquí para tener un fade
   suave y consistente.

   El problema clásico que resuelve: display:none NO se puede animar (es
   instantáneo). GSAP lo resuelve con "autoAlpha" = opacity + visibility
   manejados juntos: hace fade de opacity y al terminar pone el display.

   API pública (window.RawAnim):
     · mostrar(el, opts)   → fade-in suave (desde oculto a visible)
     · ocultar(el, opts)   → fade-out suave (y al terminar lo oculta)
     · toggle(el, mostrar) → mostrar u ocultar según el booleano
     · fadeReemplazo(viejo, nuevo) → cruza un elemento por otro

   opts (todas opcionales): { dur, y, ease, display, onDone }
     dur     duración en segundos (default según tipo)
     y       desplazamiento vertical sutil en px (default 8 para entrar)
     display valor de display al mostrar (default '' = el del CSS)
     ease    curva (default suave)
     onDone  callback al terminar
   ════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  // Si GSAP no cargó (red caída, etc.), degradar a mostrar/ocultar simple
  // SIN animación, para que la app nunca se rompa por falta de GSAP.
  var HAY_GSAP = (typeof window.gsap !== 'undefined');
  if(!HAY_GSAP){
    console.warn('[RawAnim] GSAP no disponible — fades degradados a instantáneo');
  }

  // Respeta la preferencia del sistema de "reducir movimiento" (accesibilidad
  // y equipos lentos): si el usuario la activa, los fades son casi instantáneos.
  var REDUCE = false;
  try {
    REDUCE = window.matchMedia &&
             window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch(e){}

  // Duraciones base (segundos). Cortas: el objetivo es suavizar, no demorar.
  var DUR_IN   = 0.28;
  var DUR_OUT  = 0.20;
  var EASE_IN  = 'power2.out';
  var EASE_OUT = 'power2.in';

  function _dur(d, fallback){
    if(REDUCE) return 0.001;
    return (typeof d === 'number') ? d : fallback;
  }

  // ── MOSTRAR: fade-in desde oculto ──────────────────────────────────
  function mostrar(el, opts){
    if(!el) return;
    opts = opts || {};
    var disp = (opts.display !== undefined) ? opts.display : '';
    var y    = (opts.y !== undefined) ? opts.y : 8;

    if(!HAY_GSAP){
      el.style.display = disp;
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      if(opts.onDone) opts.onDone();
      return;
    }
    // Estado inicial: visible en el flujo (display puesto) pero transparente.
    window.gsap.killTweensOf(el);
    el.style.display = disp;
    window.gsap.fromTo(el,
      { autoAlpha: 0, y: y },
      { autoAlpha: 1, y: 0,
        duration: _dur(opts.dur, DUR_IN),
        ease: opts.ease || EASE_IN,
        clearProps: 'transform',   // limpiar el transform al final
        onComplete: opts.onDone || null
      });
  }

  // ── OCULTAR: fade-out y al terminar display:none ───────────────────
  function ocultar(el, opts){
    if(!el) return;
    opts = opts || {};
    var y = (opts.y !== undefined) ? opts.y : 6;

    if(!HAY_GSAP){
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
      el.style.display = 'none';
      if(opts.onDone) opts.onDone();
      return;
    }
    window.gsap.killTweensOf(el);
    window.gsap.to(el,
      { autoAlpha: 0, y: y,
        duration: _dur(opts.dur, DUR_OUT),
        ease: opts.ease || EASE_OUT,
        onComplete: function(){
          // autoAlpha ya puso visibility:hidden; añadimos display:none para
          // sacarlo del flujo, y reseteamos y para la próxima apertura.
          el.style.display = 'none';
          el.style.transform = '';
          if(opts.onDone) opts.onDone();
        }
      });
  }

  // ── TOGGLE: mostrar u ocultar según booleano ───────────────────────
  function toggle(el, mostrarBool, opts){
    if(mostrarBool) mostrar(el, opts);
    else ocultar(el, opts);
  }

  // ── FADE REEMPLAZO: cruzar viejo→nuevo (out del viejo, in del nuevo) ─
  function fadeReemplazo(viejo, nuevo, opts){
    opts = opts || {};
    if(viejo) ocultar(viejo, { dur: opts.dur, onDone: function(){
      if(nuevo) mostrar(nuevo, opts);
    }});
    else if(nuevo) mostrar(nuevo, opts);
  }

  window.RawAnim = {
    mostrar: mostrar,
    ocultar: ocultar,
    toggle: toggle,
    fadeReemplazo: fadeReemplazo,
    hayGsap: HAY_GSAP
  };
})();
