/* RAW Entry — Agente 007 v.1.3 (autoarranque ligero + integración auditor)
   ═══════════════════════════════════════════════════════════════════
   v1.3 — actualizado para app v8.27. Añadido el comando unificado
     diag() que corre el 007 + el auditor de layout de un solo golpe.
   v1.2 — AUTOARRANQUE LIGERO desde el segundo cero:
     · El espia arranca solo a los 800ms del DOMContentLoaded.
     · Tick a 250ms (vs 150ms antes) — menor presion sobre el hilo.
     · Sin rAF continuo de FPS (queda bajo demanda con q007.fps()).
     · SILENCIOSO al inicio: no imprime Q ni nada. Solo registra
       cambios reales en su buffer interno (window._007log).
   USO:
     diag()        → ★ COMANDO UNIFICADO: corre 007 + auditor de layout
     q007()        → enciende verbose: imprime Q completo + cambios en vivo
     q007.stop()   → retira por completo (apaga buffer y verbose)
     q007.fps()    → activa el medidor de FPS (rAF) bajo demanda
     q007.log      → ver buffer interno (ultimos 200 eventos)
     q007.ver      → version del agente
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var VER = '007 v1.3 · esperado app v8.27';
  var _id = null;
  var _verbose = false;
  var _buffer = [];           // historial circular de cambios
  var BUFFER_MAX = 200;

  /* Contador pasivo de errores JS (peso cero, siempre activo) */
  var _jsErr = 0, _ultimoErr = '';
  window.addEventListener('error', function(e){
    _jsErr++;
    _ultimoErr = (e.message||'?').slice(0,80);
  });

  /* FPS bajo demanda — solo arranca si q007.fps() lo enciende */
  var _fps = '·', _fpsRAF = null;
  function medirFPS(){
    if(_fpsRAF) return;
    var cuadros = 0, t0 = performance.now();
    (function tick(){
      cuadros++;
      var dt = performance.now() - t0;
      if(dt >= 500){
        var f = Math.round(cuadros * 1000 / dt);
        _fps = f >= 55 ? '60' : f >= 40 ? '45' : f >= 25 ? '30' : '<25!';
        cuadros = 0; t0 = performance.now();
      }
      _fpsRAF = requestAnimationFrame(tick);
    })();
  }
  function detenerFPS(){
    if(_fpsRAF){ cancelAnimationFrame(_fpsRAF); _fpsRAF = null; _fps = '·'; }
  }

  function Q(){
    var L = ['══ Q · ' + VER + ' ══'];
    L.push('Hero: ' + (document.querySelector('.hero-sub')||{textContent:'?'}).textContent.trim());
    L.push('API _coverflow: ' + (window._coverflow ? '✅' : '❌'));
    if(window._coverflow){
      try {
        var e0 = window._coverflow.estado();
        L.push('  muerto: ' + e0.muerto + ' | fallos: ' + e0.fallos);
        L.push('  aro (' + (e0.aro||[]).length + '): ' + (e0.aro||[]).join(' → '));
        if(e0.slots) L.push('  slots: ' + e0.slots);
      } catch(e){}
    }
    try {
      L.push('Compuerta: ' + ((typeof api!=='undefined' && api.getAll &&
        api.getAll.toString().indexOf('abrirGate')>=0) ? '✅' : '❌'));
    } catch(e){ L.push('Compuerta: error'); }
    L.push('Tokens HUD: ' + (getComputedStyle(document.documentElement)
      .getPropertyValue('--hud-form-bg').trim() ? '✅' : '❌'));
    L.push('Errores JS desde carga: ' + _jsErr + (_ultimoErr ? ' (último: '+_ultimoErr+')' : ''));
    L.push('Buffer interno: ' + _buffer.length + ' eventos (q007.log)');
    console.log(L.join('\n'));
  }

  function sensores(){
    var c2 = window._coverflow ? (function(){ try{ return window._coverflow.estado(); }catch(e){ return {}; } })() : {};
    var dialOv = document.getElementById('dial-overlay');
    var dialRect='·', dialPos='·';
    if(dialOv && window._dialVisible){
      var dc = dialOv.querySelector('canvas:not(#dial-particles)');
      if(dc){
        var rr = dc.getBoundingClientRect();
        dialRect = Math.round(rr.left+rr.width/2)+','+Math.round(rr.top+rr.height/2);
        dialPos = dc.style.position || 'css';
      }
    }
    var dd = document.getElementById('entrada-dropdown');
    var pc = document.getElementById('popup-concepto');
    return {
      niv: (document.documentElement.className.match(/niv-\w+/g)||[]).join(','),
      dialCentro: dialRect,
      dialPos: dialPos,
      exp: window._hudExpanded ? window._hudExpanded.id : 'no',
      cfOn: String(!!c2.activo),
      girando: String(!!c2.girando),
      cfSlots: c2.slots || '·',
      aroOcultas: String(document.querySelectorAll('.hud-pnl[data-cf-ring]').length),
      cfFallos: String(c2.fallos||0) + (c2.muerto ? '☠' : ''),
      fps: _fps,
      jsErr: String(_jsErr),
      form: dd ? String(dd.classList.contains('show')) : '-',
      popup: pc ? String(pc.classList.contains('show')) : '-'
    };
  }

  var _prev = {};
  function tick(){
    var a = sensores();
    var c = Object.keys(a).filter(function(k){ return a[k] !== _prev[k]; });
    if(c.length){
      var linea = (performance.now()/1000).toFixed(1) + 's  ' +
        c.map(function(k){ return k + ': ' + (_prev[k]||'·') + '→' + a[k]; }).join(' | ');
      // Siempre al buffer
      _buffer.push(linea);
      if(_buffer.length > BUFFER_MAX) _buffer.shift();
      // Verbose: tambien a consola
      if(_verbose) console.log('🔄 ' + linea);
      _prev = a;
    }
  }

  function arrancarTick(intervalo){
    if(_id) clearInterval(_id);
    _id = setInterval(tick, intervalo);
  }

  function q007(){
    _verbose = true;
    Q();
    // Subir ritmo cuando se enciende verbose (vigilancia activa)
    arrancarTick(150);
    console.log('▶ 007 v1.3 verbose ACTIVO. Retirar: q007.stop()');
    console.log('  Buffer previo (' + _buffer.length + ' eventos) en q007.log');
    return VER;
  }
  q007.stop = function(){
    if(_id){ clearInterval(_id); _id = null; }
    detenerFPS();
    _verbose = false;
    console.log('🕴 007 retirado por completo.');
  };
  q007.fps = function(){
    medirFPS();
    console.log('📊 FPS encendido. Apagar: q007.stop() o reiniciar verbose.');
  };
  q007.ver = VER;
  Object.defineProperty(q007, 'log', {
    get: function(){
      console.log('── Buffer 007 (' + _buffer.length + ' eventos) ──');
      _buffer.forEach(function(l){ console.log('  ' + l); });
      return _buffer.length + ' eventos impresos';
    }
  });
  window.q007 = q007;

  // ════════════════════════════════════════════════════════════════
  // COMANDO UNIFICADO diag() — corre el 007 + el auditor de layout de
  // un solo golpe. Es lo único que necesitas escribir para un chequeo
  // completo: estado general (007) + problemas de layout (auditor).
  //   diag()        → chequeo único completo (007 Q + auditoría)
  //   diag('watch') → además activa la vigilancia de layout en vivo
  //   diag('full')  → auditoría exhaustiva (incluye texto cortado)
  // ════════════════════════════════════════════════════════════════
  window.diag = function(modo){
    console.log('%c╔══════════════════════════════════════════╗','color:#8b5cf6;font-weight:bold');
    console.log('%c║   DIAG UNIFICADO · LifeOS                 ║','color:#8b5cf6;font-weight:bold');
    console.log('%c╚══════════════════════════════════════════╝','color:#8b5cf6;font-weight:bold');

    // 1) Estado general vía 007 (imprime el Q completo una vez).
    console.log('%c▼ ESTADO GENERAL (007)','color:#67e8f9;font-weight:bold');
    try {
      if(typeof q007 === 'function') q007();
    } catch(e){ console.log('  (007 no disponible:', e.message, ')'); }

    // 2) Auditoría de layout (el inspector visual).
    console.log('%c▼ AUDITORÍA DE LAYOUT','color:#22d3ee;font-weight:bold');
    try {
      if(typeof window.auditar === 'function'){
        window.auditar(modo === 'full' ? 'full' : undefined);
      } else {
        console.log('  (auditor no cargado — revisa que raw-auditor.js esté incluido)');
      }
    } catch(e){ console.log('  (auditor error:', e.message, ')'); }

    // 3) Vigilancia en vivo opcional.
    if(modo === 'watch'){
      if(typeof window.auditarLoop === 'function') window.auditarLoop(true);
    }

    console.log('%c══════════ fin diag ══════════','color:#8b5cf6');
    return '✓ diag completo';
  };

  console.log('%c🛠 Escribe diag() para un chequeo completo (007 + auditor de layout).','color:#8b5cf6;font-weight:bold');

  // ── AUTOARRANQUE LIGERO ──
  // Tras DOMContentLoaded + 800ms, arrancar el tick silencioso a 250ms.
  // Asi capturamos el arranque sin pesar en el hilo durante la carga.
  function autoArrancar(){
    setTimeout(function(){
      if(!_id) arrancarTick(250);
    }, 800);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', autoArrancar);
  } else {
    autoArrancar();
  }
})();
