/* RAW Entry — Agente 007 v.1.1 (Q + espía integrados)
   ═══════════════════════════════════════════════════════════════════
   Sistema oficial de debugging de LifeOS. Duerme hasta que se invoca.
   USO en consola:
     q007()        → corre Q (check de entrega) y deja a 007 en misión
     q007.stop()   → retira al agente
     q007.ver      → versión del agente
   v1.1: sensores de fluidez — fps (banda de cuadros/seg), jsErr
   (contador de errores JS en vivo), cfSlots (mapa de slots del
   carrusel: cada card y su posición -3…+3 relativa al centro).
   Claude actualiza este archivo con sensores nuevos en cada entrega
   que lo requiera, igual que cualquier otro archivo del proyecto.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var VER = '007 v1.1 · esperado app v7.097';
  var _id = null;

  /* errores JS: contador pasivo desde la carga (peso cero) */
  var _jsErr = 0, _ultimoErr = '';
  window.addEventListener('error', function(e){
    _jsErr++;
    _ultimoErr = (e.message||'?').slice(0,80);
  });

  /* FPS: solo mide cuando 007 está en misión */
  var _fps = '·', _fpsRAF = null;
  function medirFPS(){
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

  function q007(){
    Q();
    if(_id) clearInterval(_id);
    if(_fpsRAF) cancelAnimationFrame(_fpsRAF);
    medirFPS();
    var prev = {};
    _id = setInterval(function(){
      var a = sensores();
      var c = Object.keys(a).filter(function(k){ return a[k] !== prev[k]; });
      if(c.length){
        console.log('🔄 ' + (performance.now()/1000).toFixed(1) + 's  ' +
          c.map(function(k){ return k + ': ' + (prev[k]||'·') + '→' + a[k]; }).join(' | '));
        prev = a;
      }
    }, 150);
    console.log('▶ 007 v1.1 en misión (con FPS y radar de errores). Retirar: q007.stop()');
    return VER;
  }
  q007.stop = function(){
    if(_id){ clearInterval(_id); _id = null; }
    if(_fpsRAF){ cancelAnimationFrame(_fpsRAF); _fpsRAF = null; _fps='·'; }
    console.log('🕴 007 retirado.');
  };
  q007.ver = VER;
  window.q007 = q007;
})();
