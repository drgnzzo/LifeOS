/* RAW Entry — Agente 007 v.1.0 (Q + espía integrados)
   ═══════════════════════════════════════════════════════════════════
   Sistema oficial de debugging de LifeOS. Duerme hasta que se invoca.
   USO en consola:
     q007()        → corre Q (check de entrega) y deja a 007 en misión
     q007.stop()   → retira al agente
     q007.ver      → versión del agente
   Claude actualiza este archivo con sensores nuevos en cada entrega
   que lo requiera, igual que cualquier otro archivo del proyecto.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var VER = '007 v1.0 · esperado app v7.096';
  var _id = null;

  function Q(){
    var L = ['══ Q · ' + VER + ' ══'];
    L.push('Hero: ' + (document.querySelector('.hero-sub')||{textContent:'?'}).textContent.trim());
    L.push('API _coverflow: ' + (window._coverflow ? '✅' : '❌'));
    if(window._coverflow){
      try {
        var e0 = window._coverflow.estado();
        L.push('  muerto: ' + e0.muerto + ' | fallos: ' + e0.fallos);
        L.push('  aro (' + (e0.aro||[]).length + '): ' + (e0.aro||[]).join(' → '));
      } catch(e){}
    }
    try {
      L.push('Compuerta: ' + ((typeof api!=='undefined' && api.getAll &&
        api.getAll.toString().indexOf('abrirGate')>=0) ? '✅' : '❌'));
    } catch(e){ L.push('Compuerta: error'); }
    L.push('Tokens HUD: ' + (getComputedStyle(document.documentElement)
      .getPropertyValue('--hud-form-bg').trim() ? '✅' : '❌'));
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
      clones: (c2.clones||[]).join('|'),
      aroOcultas: String(document.querySelectorAll('.hud-pnl[data-cf-ring]').length),
      cfFallos: String(c2.fallos||0) + (c2.muerto ? '☠' : ''),
      form: dd ? String(dd.classList.contains('show')) : '-',
      popup: pc ? String(pc.classList.contains('show')) : '-'
    };
  }

  function q007(){
    Q();
    if(_id) clearInterval(_id);
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
    console.log('▶ 007 en misión. Retirar: q007.stop()');
    return VER;
  }
  q007.stop = function(){
    if(_id){ clearInterval(_id); _id = null; console.log('🕴 007 retirado.'); }
  };
  q007.ver = VER;
  window.q007 = q007;
})();
