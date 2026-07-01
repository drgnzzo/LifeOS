/* RAW Entry — Auditor v.8.27 (auditor de layout permanente)
   ════════════════════════════════════════════════════════════════════
   HERRAMIENTA DE DIAGNÓSTICO PERMANENTE. Barre la app y detecta de un
   golpe los problemas de layout más comunes, sin que tengas que buscarlos
   a mano. En vez de que TÚ seas el detector de errores, lo es este módulo.

   CÓMO USARLO (desde la consola del navegador, F12):
     auditar()          → barre el estado actual y lista los problemas
     auditar('full')     → además revisa elementos ocultos/fuera de flujo
     auditarLoop(true)   → vigila en vivo (reporta cuando algo se rompe)
     auditarLoop(false)  → apaga la vigilancia

   QUÉ DETECTA:
     · Elementos visibles con tamaño 0×0 (rotos, como el bug de la card)
     · Elementos que se salen de la pantalla (cortados)
     · Elementos encimados (mismo espacio, se tapan)
     · Texto desbordado / cortado
     · Cards que deberían verse pero están invisibles
     · Contradicciones de estado (ej. niv-1 sin card central)
     · z-index sospechosos (cosas tapando cosas)
   ════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var VW = function(){ return window.innerWidth; };
  var VH = function(){ return window.innerHeight; };

  // ── Utilidades ─────────────────────────────────────────────────────
  function visible(el){
    var cs = getComputedStyle(el);
    return cs.display !== 'none' &&
           cs.visibility !== 'hidden' &&
           parseFloat(cs.opacity) > 0.01;
  }
  function rect(el){ return el.getBoundingClientRect(); }
  function nombre(el){
    return (el.id ? '#'+el.id : '') +
           (el.className && typeof el.className === 'string'
             ? '.'+el.className.trim().split(/\s+/).slice(0,2).join('.') : '') ||
           el.tagName.toLowerCase();
  }

  // ── Reglas de auditoría ────────────────────────────────────────────
  // Cada regla recibe la lista de elementos candidatos y empuja hallazgos.
  var PROBLEMAS = [];
  function reportar(sev, tipo, el, detalle){
    PROBLEMAS.push({ sev: sev, tipo: tipo, el: nombre(el), detalle: detalle, ref: el });
  }

  // 1) Tamaño 0×0 en algo que debería verse (el bug de la card central).
  function regla_tamanoCero(els){
    els.forEach(function(el){
      if(!visible(el)) return;
      var r = rect(el);
      // Solo nos importan contenedores con contenido, no spans vacíos.
      if((r.width < 2 || r.height < 2) && el.children.length > 0){
        reportar('ALTO', 'tamaño-0', el,
          'visible pero mide '+Math.round(r.width)+'×'+Math.round(r.height)+
          ' (tiene '+el.children.length+' hijos). Suele ser display:none heredado o zona sin calcular.');
      }
    });
  }

  // 2) Elementos que se salen de la pantalla (cortados).
  function regla_fueraDePantalla(els){
    var margen = 4; // tolerancia
    els.forEach(function(el){
      if(!visible(el)) return;
      var r = rect(el);
      if(r.width === 0 || r.height === 0) return;
      // Ignorar elementos intencionalmente posicionados fuera (offscreen).
      var cs = getComputedStyle(el);
      if(cs.position === 'fixed' || cs.position === 'absolute'){
        // Un poco fuera puede ser diseño; reportamos solo si está MUY fuera.
        if(r.right < -50 || r.left > VW()+50 || r.bottom < -50 || r.top > VH()+50) return;
      }
      var problemas = [];
      if(r.left < -margen)      problemas.push('cortado por izquierda ('+Math.round(r.left)+'px)');
      if(r.top  < -margen)      problemas.push('cortado arriba ('+Math.round(r.top)+'px)');
      if(r.right > VW()+margen) problemas.push('sale por derecha ('+Math.round(r.right-VW())+'px)');
      if(r.bottom> VH()+margen && cs.position !== 'static') {
        // Overflow vertical es común y legítimo (scroll). Solo lo marcamos
        // para elementos fixed/absolute que no deberían desbordar.
        if(cs.position === 'fixed') problemas.push('sale abajo ('+Math.round(r.bottom-VH())+'px)');
      }
      if(problemas.length){
        reportar('MEDIO', 'fuera-pantalla', el, problemas.join(', '));
      }
    });
  }

  // 3) Texto desbordado (contenido más grande que su caja, sin scroll).
  function regla_textoCortado(els){
    els.forEach(function(el){
      if(!visible(el)) return;
      var cs = getComputedStyle(el);
      // Solo si NO tiene scroll ni overflow visible permitido.
      if(cs.overflow === 'auto' || cs.overflow === 'scroll' ||
         cs.overflowY === 'auto' || cs.overflowY === 'scroll' ||
         cs.overflowX === 'auto' || cs.overflowX === 'scroll') return;
      if(cs.overflow === 'visible') return;
      // Desborde real: el contenido no cabe y está oculto (hidden/clip).
      if(el.scrollHeight > el.clientHeight + 3 && el.clientHeight > 0){
        reportar('BAJO', 'texto-cortado', el,
          'contenido '+el.scrollHeight+'px no cabe en '+el.clientHeight+'px (overflow:'+cs.overflow+')');
      }
    });
  }

  // 4) Elementos encimados: dos hermanos visibles que ocupan casi el mismo
  //    espacio (se tapan). Comparamos solo cards de nivel superior.
  function regla_encimados(els){
    var visibles = els.filter(function(el){
      if(!visible(el)) return false;
      var r = rect(el);
      return r.width > 40 && r.height > 40;
    });
    for(var i=0;i<visibles.length;i++){
      for(var j=i+1;j<visibles.length;j++){
        var a = visibles[i], b = visibles[j];
        // Saltar si uno contiene al otro (anidados, es normal).
        if(a.contains(b) || b.contains(a)) continue;
        var ra = rect(a), rb = rect(b);
        var solapeX = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
        var solapeY = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
        var areaSolape = solapeX * solapeY;
        var areaMenor = Math.min(ra.width*ra.height, rb.width*rb.height);
        // Solape > 60% del área menor = probable encimado no intencional.
        if(areaMenor > 0 && areaSolape / areaMenor > 0.6){
          reportar('MEDIO', 'encimados', a,
            'se solapa '+Math.round(areaSolape/areaMenor*100)+'% con '+nombre(b)+
            ' (¿uno debería estar oculto?)');
        }
      }
    }
  }

  // 5) Contradicciones de estado conocidas de LifeOS.
  function regla_contradicciones(){
    var h = document.documentElement;
    var niv = (h.className.match(/niv-\d/g)||[]).join(',');
    // En niv-1 debe haber una card central expandida.
    if(h.classList.contains('niv-1') && !h.classList.contains('niv-warp')){
      if(!window._hudExpanded){
        reportar('ALTO', 'contradicción', h,
          'estás en niv-1 pero no hay card central (_hudExpanded=null)');
      } else {
        var r = rect(window._hudExpanded);
        if(r.width < 2 || r.height < 2){
          reportar('ALTO', 'contradicción', window._hudExpanded,
            'niv-1 con card central en '+Math.round(r.width)+'×'+Math.round(r.height)+' (rota)');
        }
      }
    }
    // os-seccion en <html> pero NO estás en una sección → clase colgada.
    if(h.classList.contains('os-seccion') &&
       (window._osSeccion === 'home' || !window._osSeccion)){
      reportar('ALTO', 'contradicción', h,
        'html tiene clase "os-seccion" pero _osSeccion es home → cards ocultas por CSS !important (¡el bug 0x0!)');
    }
    // niv-2 sin ninguna board-face activa.
    if(h.classList.contains('niv-2')){
      var activa = document.querySelector('.board-face.active:not(.anverso)');
      if(!activa){
        reportar('MEDIO', 'contradicción', h,
          'estás en niv-2 pero ninguna sección (board-face) está activa');
      }
    }
  }

  // 6) Cards que deberían verse pero están invisibles por display:none inline.
  function regla_ocultasSospechosas(){
    var h = document.documentElement;
    if(h.classList.contains('niv-2') || h.classList.contains('os-seccion')) return; // normal ocultar
    var cards = document.querySelectorAll('.hud-pnl');
    cards.forEach(function(c){
      var cs = getComputedStyle(c);
      // Card con display:none en nivel 0/1 que NO es lateral de coverflow.
      if(cs.display === 'none' &&
         !c.hasAttribute('data-cf-ring') &&
         !c.hasAttribute('data-cf-center')){
        // En nivel 0 las laterales se ocultan a propósito; solo reportar la central.
        if(c === window._hudExpanded){
          reportar('ALTO', 'oculta-mal', c,
            'es la card central pero tiene display:none → no se verá');
        }
      }
    });
  }

  // ── Motor principal ────────────────────────────────────────────────
  function auditar(modo){
    PROBLEMAS = [];
    var t0 = performance.now();

    // Universo de elementos a revisar: cards, paneles, secciones, y sus
    // contenedores de contenido (no cada span, para no ahogar en ruido).
    var candidatos = Array.prototype.slice.call(document.querySelectorAll(
      '.hud-pnl, .board-face, .hud-expanded-content, .cf7-ghost, ' +
      '.popup-overlay, .panel-overlay, .entrada-dropdown, ' +
      '[id^="board-"], [id^="hud-"], .tm-card, .tm-wrap'
    ));

    regla_tamanoCero(candidatos);
    regla_fueraDePantalla(candidatos);
    regla_encimados(candidatos.filter(function(el){
      return el.classList.contains('hud-pnl') ||
             el.classList.contains('cf7-ghost') ||
             el.classList.contains('board-face');
    }));
    if(modo === 'full'){
      regla_textoCortado(candidatos);
    }
    regla_contradicciones();
    regla_ocultasSospechosas();

    var ms = (performance.now() - t0).toFixed(1);
    _imprimir(ms, candidatos.length);
    return PROBLEMAS;
  }

  function _imprimir(ms, total){
    var h = document.documentElement;
    var niv = (h.className.match(/niv-\d|niv-warp/g)||[]).join(',') || 'niv-0';
    console.log('%c╔═══ AUDITOR LAYOUT · '+niv+' ═══','color:#22d3ee;font-weight:bold');
    console.log('%c║ '+total+' elementos revisados en '+ms+'ms','color:#22d3ee');

    if(!PROBLEMAS.length){
      console.log('%c║ ✓ SIN PROBLEMAS DE LAYOUT','color:#4ade80;font-weight:bold');
      console.log('%c╚════════════════════════','color:#22d3ee');
      return;
    }

    var alto = PROBLEMAS.filter(function(p){return p.sev==='ALTO';});
    var medio= PROBLEMAS.filter(function(p){return p.sev==='MEDIO';});
    var bajo = PROBLEMAS.filter(function(p){return p.sev==='BAJO';});

    console.log('%c║ '+PROBLEMAS.length+' problemas: '+
      alto.length+' altos · '+medio.length+' medios · '+bajo.length+' bajos',
      'color:#f59e0b;font-weight:bold');
    console.log('%c╚════════════════════════','color:#22d3ee');

    function bloque(lista, color, etiqueta){
      if(!lista.length) return;
      console.log('%c'+etiqueta+' ('+lista.length+')','color:'+color+';font-weight:bold');
      lista.forEach(function(p){
        console.log('%c  ['+p.tipo+']','color:'+color,
          p.el, '→', p.detalle, p.ref);
      });
    }
    bloque(alto,  '#ef4444', '🔴 ALTOS (rompen la vista)');
    bloque(medio, '#f59e0b', '🟡 MEDIOS (se ven mal)');
    bloque(bajo,  '#94a3b8', '⚪ BAJOS (cosméticos)');
  }

  // ── Vigilancia en vivo ─────────────────────────────────────────────
  var _loopId = null;
  var _ultimoResumen = '';
  function auditarLoop(activar){
    if(activar){
      if(_loopId) return;
      console.log('%c👁 Vigilancia de layout ACTIVA (reporta cuando algo se rompe)','color:#4ade80');
      _loopId = setInterval(function(){
        var h = document.documentElement;
        // No auditar durante animaciones (mediciones contaminadas).
        if(h.classList.contains('niv-warp')) return;
        var prev = PROBLEMAS;
        PROBLEMAS = [];
        var cand = Array.prototype.slice.call(document.querySelectorAll(
          '.hud-pnl, .board-face, .cf7-ghost, .entrada-dropdown'));
        regla_tamanoCero(cand);
        regla_contradicciones();
        var altos = PROBLEMAS.filter(function(p){return p.sev==='ALTO';});
        var resumen = altos.map(function(p){return p.tipo+':'+p.el;}).join('|');
        if(altos.length && resumen !== _ultimoResumen){
          _ultimoResumen = resumen;
          console.log('%c⚠ LAYOUT ROTO ['+ (h.className.match(/niv-\d/g)||[]).join(',') +']','color:#ef4444;font-weight:bold');
          altos.forEach(function(p){
            console.log('%c  ['+p.tipo+']','color:#ef4444', p.el, '→', p.detalle);
          });
        } else if(!altos.length){
          _ultimoResumen = '';
        }
      }, 500);
    } else {
      if(_loopId){ clearInterval(_loopId); _loopId = null; }
      console.log('%c👁 Vigilancia de layout apagada','color:#94a3b8');
    }
  }

  // Exponer globalmente
  window.auditar = auditar;
  window.auditarLoop = auditarLoop;

  console.log('%c🔍 Auditor de layout cargado. Escribe auditar() en la consola.','color:#22d3ee');
})();
