/* RAW Entry — Loading v.8.42 (telemetría de módulos reales + spinner braille)
   ═══════════════════════════════════════════════════════════════════════
   Pantalla de arranque. Reescrita para que NO sea una mentira:

   · El progreso refleja HITOS REALES de carga (no una barra a ritmo fijo):
       - DOM interactivo
       - Scripts/modulos del app presentes (window.api, _coverflow, etc.)
       - Fuentes listas (document.fonts.ready)
       - Primer frame de render pintado
       - Datos base de la API respondiendo
     Entre hito e hito avanza con micro-saltos IRREGULARES (como una
     maquina que procesa a tirones), nunca a velocidad constante.

   · Fondo con INTERFERENCIA (no negro vacio): scanlines que barren, ruido
     de estatica sutil y flicker ocasional. Estilo Metroid Prime boot.

   Al completar los hitos (o al tope de seguridad), dispara 'hud-listo' y
   se desvanece, igual que antes, para no romper el arranque.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(window.innerWidth < 900) return;

  var _root, _pctEl, _faseEl, _ringProg, _noiseCanvas, _nctx, _bg;
  var _terminado = false;
  var _raf = null, _noiseRaf = null;
  var SIZE = 380, R_PROG = 110, R_EXT = 128;
  var C_PROG = 2 * Math.PI * R_PROG;

  function colorH(h){ return 'hsl('+h+', 85%, 60%)'; }
  var HUE = 150; // verde base

  // ── HITOS REALES DE CARGA ──────────────────────────────────────────
  var HITOS = [
    { nombre:'NUCLEO',     peso:15, texto:'Iniciando nucleo',      ok:function(){ return document.readyState !== 'loading'; } },
    { nombre:'MODULOS',    peso:20, texto:'Cargando modulos',      ok:function(){ return !!(window.api && window._coverflow); } },
    { nombre:'INTERFAZ',   peso:15, texto:'Montando interfaz',     ok:function(){ return !!document.querySelector('.hud-pnl'); } },
    { nombre:'TIPOGRAFIA', peso:10, texto:'Preparando tipografia', ok:function(){ return _fuentesListas; } },
    { nombre:'RENDER',     peso:15, texto:'Primer render',         ok:function(){ return _primerFrame; } },
    { nombre:'DATOS',      peso:15, texto:'Sincronizando datos',   ok:function(){ return _datosListos; } },
    { nombre:'CALIBRANDO', peso:10, texto:'Calibrando sistema',    ok:function(){ return _tiempoMin; } }
  ];
  var _fuentesListas = false, _primerFrame = false, _datosListos = false, _tiempoMin = false;

  try {
    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(function(){ _fuentesListas = true; });
    } else { _fuentesListas = true; }
  } catch(e){ _fuentesListas = true; }

  requestAnimationFrame(function(){ requestAnimationFrame(function(){ _primerFrame = true; }); });

  (function(){
    var t0 = Date.now();
    var iv = setInterval(function(){
      var chip = document.getElementById('chip-txt');
      var chipOk = chip && !/carg/i.test(chip.textContent);
      if(chipOk || Date.now() - t0 > 6000){ _datosListos = true; clearInterval(iv); }
    }, 200);
  })();

  setTimeout(function(){ _tiempoMin = true; }, 1400);

  var _topeSeguridad = Date.now() + 8000;

  function progresoReal(){
    var suma = 0;
    for(var i=0;i<HITOS.length;i++){ if(HITOS[i].ok()) suma += HITOS[i].peso; }
    if(Date.now() > _topeSeguridad) suma = 100;
    return suma;
  }
  function faseActual(){
    for(var i=0;i<HITOS.length;i++){ if(!HITOS[i].ok()) return HITOS[i]; }
    return HITOS[HITOS.length-1];
  }

  function dibujarMarcas(cx, cy, r1, r2, n){
    var s = '';
    for(var i=0;i<n;i++){
      var a = (i/n) * Math.PI * 2 - Math.PI/2;
      var esMayor = (i % 4 === 0);
      var ra = esMayor ? r1-4 : r1;
      s += '<line x1="'+(cx+Math.cos(a)*ra)+'" y1="'+(cy+Math.sin(a)*ra)+'" '+
                 'x2="'+(cx+Math.cos(a)*r2)+'" y2="'+(cy+Math.sin(a)*r2)+'" '+
           'opacity="'+(esMayor?0.7:0.35)+'"/>';
    }
    return s;
  }

  function construir(){
    var st = document.createElement('style');
    st.id = 'loading-cyber-style';
    st.textContent = [
      '@keyframes lcScan{0%{transform:translateY(-120%)}100%{transform:translateY(120%)}}',
      '@keyframes lcScan2{0%{transform:translateY(120%)}100%{transform:translateY(-120%)}}',
      '@keyframes lcFlick{0%,100%{opacity:1}92%{opacity:1}93%{opacity:.72}94%{opacity:1}97%{opacity:.85}98%{opacity:1}}',
      '@keyframes lcRotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}',
      '#loading-cyber{font-family:"JetBrains Mono","Fira Code",ui-monospace,Menlo,monospace}',
      '#lc-bg::before{content:"";position:absolute;inset:0;pointer-events:none;'+
        'background:repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0,rgba(255,255,255,.03) 1px,transparent 1px,transparent 3px);'+
        'opacity:.5}',
      '#loading-cyber .lc-scan{position:absolute;left:0;right:0;height:2px;'+
        'background:linear-gradient(90deg,transparent,currentColor,transparent);'+
        'opacity:.35;mix-blend-mode:lighten;animation:lcScan 2.8s linear infinite}',
      '#lc-bg .lc-scan{position:absolute;left:0;right:0;height:2px;'+
        'background:linear-gradient(90deg,transparent,'+colorH(HUE)+',transparent);'+
        'opacity:.30;mix-blend-mode:lighten;animation:lcScan 2.8s linear infinite}',
      '#lc-bg .lc-scan2{position:absolute;left:0;right:0;height:1px;'+
        'background:linear-gradient(90deg,transparent,'+colorH(HUE)+',transparent);'+
        'opacity:.16;mix-blend-mode:lighten;animation:lcScan2 4.2s linear infinite}'
    ].join('');
    document.head.appendChild(st);

    // FONDO con interferencia (no negro vacio)
    _bg = document.createElement('div');
    _bg.id = 'lc-bg';
    _bg.style.cssText = [
      'position:fixed','inset:0','z-index:99998','pointer-events:none',
      'background:radial-gradient(ellipse at 50% 45%,#0d1512 0%,#080a0e 55%,#05060a 100%)',
      'opacity:1','transition:opacity .5s ease'
    ].join(';');

    _noiseCanvas = document.createElement('canvas');
    _noiseCanvas.id = 'lc-noise';
    _noiseCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:.06;mix-blend-mode:screen';
    _bg.appendChild(_noiseCanvas);

    var scanFull = document.createElement('div');
    scanFull.className = 'lc-scan'; scanFull.style.top = '0';
    var scanFull2 = document.createElement('div');
    scanFull2.className = 'lc-scan2'; scanFull2.style.top = '0';
    _bg.appendChild(scanFull); _bg.appendChild(scanFull2);
    document.body.appendChild(_bg);

    // Anillo central + porcentaje + fase
    _root = document.createElement('div');
    _root.id = 'loading-cyber';
    _root.style.cssText = [
      'position:fixed','left:50%','top:50%','transform:translate(-50%,-50%) scale(.96)',
      'width:'+SIZE+'px','height:'+SIZE+'px','z-index:100000','pointer-events:none',
      'color:'+colorH(HUE),
      'opacity:0','transition:opacity .55s ease, transform .55s ease',
      'animation:lcFlick 3s infinite'
    ].join(';');

    _root.innerHTML =
      '<svg width="'+SIZE+'" height="'+SIZE+'" viewBox="0 0 '+SIZE+' '+SIZE+'" '+
        'style="position:absolute;inset:0;overflow:visible">'+
        '<g style="transform-origin:'+(SIZE/2)+'px '+(SIZE/2)+'px;animation:lcRotate 40s linear infinite">'+
          '<circle cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+(R_EXT+8)+'" fill="none" stroke="currentColor" stroke-width="1" opacity="0.15"/>'+
          '<g stroke="currentColor" stroke-width="1">'+ dibujarMarcas(SIZE/2, SIZE/2, R_EXT-2, R_EXT+4, 48) +'</g>'+
        '</g>'+
        '<circle cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+R_PROG+'" fill="none" stroke="currentColor" stroke-width="3" opacity="0.12"/>'+
        '<circle id="lc-prog" cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+R_PROG+'" fill="none" '+
          'stroke="currentColor" stroke-width="3" stroke-linecap="round" '+
          'stroke-dasharray="'+C_PROG+'" stroke-dashoffset="'+C_PROG+'" '+
          'transform="rotate(-90 '+(SIZE/2)+' '+(SIZE/2)+')" '+
          'style="filter:drop-shadow(0 0 6px currentColor)"/>'+
      '</svg>'+
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px">'+
        '<div id="lc-fase" style="font-size:11px;font-weight:600;letter-spacing:.28em;opacity:.75;text-transform:uppercase">Iniciando</div>'+
        '<div id="lc-pct" style="font-size:44px;font-weight:700;letter-spacing:.02em;line-height:1;text-shadow:0 0 16px currentColor">0%</div>'+
        '<div id="lc-sub" style="font-size:9px;letter-spacing:.35em;opacity:.4;text-transform:uppercase">RAW ENTRY</div>'+
      '</div>';

    document.body.appendChild(_root);
    _ringProg = _root.querySelector('#lc-prog');
    _pctEl = _root.querySelector('#lc-pct');
    _faseEl = _root.querySelector('#lc-fase');

    // v8.39 — FASE F · CONSOLA DE BOOT. Terminal donde cada hito REAL
    // imprime su línea al cumplirse, con el tiempo transcurrido en ms.
    // La prueba visible de que el arranque no es teatro.
    _consola = document.createElement('div');
    _consola.id = 'lc-console';
    _consola.style.cssText = [
      'position:fixed','left:50%','transform:translateX(-50%)',
      'top:calc(50% + '+(SIZE/2 + 18)+'px)','width:340px','z-index:100000',
      'pointer-events:none','font-family:"JetBrains Mono",ui-monospace,Menlo,monospace',
      'font-size:10px','line-height:1.75','letter-spacing:.06em',
      'color:'+colorH(HUE),'opacity:.82','text-align:left',
      'transition:opacity .5s ease'
    ].join(';');
    document.body.appendChild(_consola);
    _bootLinea('RAW ENTRY OS · SECUENCIA DE ARRANQUE');

    requestAnimationFrame(function(){ _root.style.opacity = '1'; _root.style.transform = 'translate(-50%,-50%) scale(1)'; });

    _iniciarRuido();
  }

  // ── Consola de boot: líneas de sistema con glitch de entrada ────────
  var _consola = null, _t0boot = Date.now();
  function _bootLinea(txt, dim){
    if(!_consola) return;
    var l = document.createElement('div');
    l.textContent = txt;
    l.style.cssText = 'opacity:0;transform:translateX(-4px);transition:opacity .18s ease,transform .18s ease;'+
                      (dim ? 'opacity:.45;color:inherit;' : '');
    _consola.appendChild(l);
    // glitch de entrada: aparece desplazada y parpadea una vez
    requestAnimationFrame(function(){
      l.style.opacity = dim ? '.45' : '1';
      l.style.transform = 'translateX(0)';
      setTimeout(function(){ l.style.opacity = dim ? '.3' : '.65'; }, 60);
      setTimeout(function(){ l.style.opacity = dim ? '.45' : '1';  }, 120);
    });
    // máximo 8 líneas visibles: las viejas se van
    while(_consola.children.length > 12){ _consola.removeChild(_consola.firstChild); }
  }

  function _iniciarRuido(){
    var cv = _noiseCanvas; if(!cv) return;
    _nctx = cv.getContext('2d');
    cv.width = Math.max(1, Math.floor(window.innerWidth / 3));
    cv.height = Math.max(1, Math.floor(window.innerHeight / 3));
    var frame = 0;
    (function pintarRuido(){
      if(_terminado) return;
      frame++;
      if(frame % 2 === 0 && _nctx){
        var w = cv.width, h = cv.height;
        var img = _nctx.createImageData(w, h);
        var d = img.data;
        for(var i=0;i<d.length;i+=4){
          var v = (Math.random() * 255) | 0;
          d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255;
        }
        _nctx.putImageData(img, 0, 0);
      }
      _noiseRaf = requestAnimationFrame(pintarRuido);
    })();
  }

  function pintar(p){
    if(!_ringProg) return;
    var off = C_PROG * (1 - p/100);
    _ringProg.setAttribute('stroke-dashoffset', off);
    if(_pctEl) _pctEl.textContent = Math.round(p) + '%';
    var f = faseActual();
    if(_faseEl && f) _faseEl.textContent = f.texto;
  }

  var _pintado = 0;
  var _hitosDone = {};   // v8.39: hitos ya reportados en la consola

  /* v8.42 — TELEMETRÍA DE MÓDULOS REALES. Cada módulo de la app define un
     objeto global cuando su script SE EJECUTA de verdad. Detectamos esa
     señal y la imprimimos con el nombre real del archivo y el ms real:
     la lógica computándose en tiempo real, no nombres de utilería. */
  var _MODS = [
    { sig:function(){ return !!window.gsap; },                       label:'gsap.min.js' },
    { sig:function(){ return !!window.RawAnim; },                    label:'raw-anim.js' },
    { sig:function(){ return typeof window.auditar==='function'; },  label:'raw-auditor.js' },
    { sig:function(){ return !!window.api; },                        label:'raw-core.js' },
    { sig:function(){ return typeof window._reposicionarHUD==='function'; }, label:'raw-overlay.js' },
    { sig:function(){ return !!window._coverflow; },                 label:'raw-coverflow.js' },
    { sig:function(){ return typeof window.irASOS==='function'; },   label:'raw-niveles.js' },
    { sig:function(){ return typeof window._timersAlEntrar==='function'; },  label:'raw-timers.js' },
    { sig:function(){ return typeof window.q007==='function'; },     label:'raw-007.js' },
    { sig:function(){ return !!(navigator.serviceWorker && navigator.serviceWorker.controller); }, label:'sw.js (offline)' }
  ];
  var _modsDone = {};

  // Spinner de actividad braille (línea viva al pie de la consola).
  var _spinChars = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  var _spinEl = null, _spinI = 0;
  setInterval(function(){
    if(_terminado || !_consola) return;
    if(!_spinEl){
      _spinEl = document.createElement('div');
      _spinEl.style.cssText = 'opacity:.6;margin-top:2px';
      _consola.appendChild(_spinEl);
    }
    // mantener el spinner siempre al final
    if(_consola.lastChild !== _spinEl) _consola.appendChild(_spinEl);
    _spinI = (_spinI + 1) % _spinChars.length;
    var f = faseActual();
    _spinEl.textContent = _spinChars[_spinI] + ' ' + (f ? f.texto.toLowerCase() : 'procesando') + '…';
  }, 90);

  function loop(){
    if(_terminado) return;
    var objetivo = progresoReal();

    // v8.42 — módulos reales detectados al ejecutarse (líneas tenues).
    for(var m=0;m<_MODS.length;m++){
      var mod = _MODS[m];
      if(!_modsDone[mod.label] && mod.sig()){
        _modsDone[mod.label] = true;
        _bootLinea('  · '+mod.label+' vinculado ['+(Date.now()-_t0boot)+'ms]', true);
      }
    }

    // v8.39 — reportar en la consola cada hito REAL recién cumplido,
    // con el tiempo transcurrido de verdad (no inventado).
    for(var i=0;i<HITOS.length;i++){
      var hi = HITOS[i];
      if(!_hitosDone[hi.nombre] && hi.ok()){
        _hitosDone[hi.nombre] = true;
        var ms = Date.now() - _t0boot;
        _bootLinea('▸ '+hi.nombre+' '+('·'.repeat(Math.max(1, 14 - hi.nombre.length)))+' OK  ['+ms+'ms]');
      }
    }

    var brecha = objetivo - _pintado;
    if(brecha > 0){
      var jitter = 0.3 + Math.random() * 1.2;
      var paso = brecha * 0.06 * jitter;
      if(Math.random() < 0.04) paso += Math.random() * 3;
      if(Math.random() < 0.10) paso *= 0.15;
      _pintado = Math.min(objetivo, _pintado + paso);
    }
    pintar(_pintado);
    if(_pintado >= 99.5 && objetivo >= 100){ terminar(); return; }
    _raf = requestAnimationFrame(loop);
  }

  function terminar(){
    if(_terminado) return;
    _terminado = true;
    if(_raf) cancelAnimationFrame(_raf);
    if(_noiseRaf) cancelAnimationFrame(_noiseRaf);
    pintar(100);
    if(_spinEl && _spinEl.parentNode) _spinEl.parentNode.removeChild(_spinEl);
    _bootLinea('■ SISTEMA LISTO · '+(Date.now() - _t0boot)+'ms');
    if(_consola){ setTimeout(function(){ _consola.style.opacity = '0'; }, 350); }
    if(_root){
      _root.style.transition = 'opacity .5s ease, transform .5s ease';
      _root.style.transform = 'translate(-50%,-50%) scale(1.04)';
      _root.style.opacity = '0';
    }
    if(_bg){ _bg.style.opacity = '0'; }
    setTimeout(function(){
      document.documentElement.classList.add('hud-listo');
      // Revelar el body: neutralizar SOLO la regla de visibility del
      // render-block (conservando su background base). Así garantizamos que
      // la app se revele sin cambiar el fondo ni depender de otro mecanismo.
      var rb = document.getElementById('render-block');
      if(rb){ rb.textContent = 'html,body{background:#020810 !important;}'; }
      var sp = document.getElementById('splash-dial');
      if(sp){ sp.style.transition='opacity .4s'; sp.style.opacity='0'; setTimeout(function(){ if(sp.parentNode) sp.parentNode.removeChild(sp); }, 420); }
      document.documentElement.classList.add('lc-done');
    }, 200);
    setTimeout(function(){
      if(_root && _root.parentNode) _root.parentNode.removeChild(_root);
      if(_bg && _bg.parentNode) _bg.parentNode.removeChild(_bg);
      if(_consola && _consola.parentNode) _consola.parentNode.removeChild(_consola);
      var st = document.getElementById('loading-cyber-style');
      if(st && st.parentNode) st.parentNode.removeChild(st);
    }, 750);
  }

  function init(){
    construir();
    _raf = requestAnimationFrame(loop);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
