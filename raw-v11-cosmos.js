/* LifeOS v11.3 — raw-v11-cosmos.js (E3-D8)
   ═══════════════════════════════════════════════════════════════════
   EL FONDO CÓSMICO v9 — EXACTO. Bloque VERBATIM de raw-overlay.js
   1063-3424: anillos de Dyson, rayos, ~580 estrellas, constelaciones,
   espirales, nebulosas, polvo, mandalas, halos lejanos, warp y
   _ondaCosmica. Cero reescritura: el holder se llama _dialOverlay
   (mismo nombre que su closure original) y el canvas queda DETRÁS de
   #gl (z-index:1) — el renderer es alpha:true, el 3D se dibuja encima.
   Shims: _hudExpanded=null (sus pausas de v9 nunca disparan aquí) y
   las clases niv-* ausentes = el loop corre siempre.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
var _hudExpanded = null;
var _dialOverlay = document.createElement('div');
_dialOverlay.id = 'v11-cosmos';
_dialOverlay.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;background:#020810';
document.body.insertBefore(_dialOverlay, document.body.firstChild);

  var _particlesCanvas = document.createElement('canvas');
  _particlesCanvas.id = 'dial-particles';
  _particlesCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:1';
  // v5.202: opacity 0.75 → 1. Con 0.75 el fondo de estrellas/nebulosas
  // dejaba ver el gris de detrás → se sumaba al efecto "lavado".
  _dialOverlay.appendChild(_particlesCanvas);

  (function initEverything(){
    // ══════════════════════════════════════════════════════════════════
    //  v5.168: TODO INTEGRADO Y EN MOVIMIENTO
    //  • Rayos curvos que parten del CENTRO ABSOLUTO y rotan
    //  • Estrellas en órbitas keplerianas (nacen, brillan, mueren)
    //  • Constelaciones (grupos irregulares de estrellas conectadas)
    //  • Red neuronal: sinapsis fugaces entre estrellas cercanas
    //  • Pulsos viajando por rayos y sinapsis
    //  • Vórtices puntuales con ondas concéntricas
    //  • Trayectorias caóticas de Lorenz
    //  • Espirales áureas girando
    //  • Nebulosa moduladora (zonas brillantes/oscuras)
    //  El dial queda visualmente ENCIMA del canvas (z-index 0).
    //  Por eso los rayos pueden partir del centro absoluto sin problema.
    // ══════════════════════════════════════════════════════════════════
    var pctx, lastT = 0, animId = null, _frameCounter = 0;
    var W = 0, H = 0, CX = 0, CY = 0, DIAL_R = 0, MAX_R = 0;
    var PALETTE = ['#A78BFA', '#22D3EE', '#4ADE80', '#C4B5FD', '#67E8F9', '#86EFAC'];
    var PHI = (1 + Math.sqrt(5)) / 2;

    // Estructuras
    var stars = [];
    var rays = [];            // rayos del centro absoluto
    var meteors = [];         // v5.169: estrellas fugaces / meteoros
    var dust = [];            // v5.169: polvo cósmico (puntitos pequeños)
    var orbitRings = [];      // v5.169: anillos orbitales sutiles
    var interMesh = [];       // v5.171: red interestelar (no pasa por el centro)
    var mandalas = [];        // v5.171: geometría tipo crop circles
    var warpParticles = [];   // v5.181: disco de acreción / agujero negro central
    var constellations = [];  // grupos de estrellas conectadas
    var synapses = [];        // conexiones fugaces neuronales
    var pulses = [];
    var vortices = [];
    var lorenzTrails = [];    // trayectorias caóticas
    var spirals = [];         // espirales áureas
    var nebulaBlobs = [];     // gaussianas moviéndose

    var globalT = 0;
    var galaxyRotation = 0;   // rotación global de la galaxia

    /* v7.030 — FASE 4A · WARP DE TRANSICIÓN
       Efecto velocidad-luz al cruzar de nivel. _warpEnergia va de 0 a 1
       y decae sola; mientras es >0, las estrellas se mueven en radio y
       se dibujan estiradas como líneas (efecto Star Wars). Con energía
       0, el motor se comporta EXACTAMENTE como antes — es aditivo.
         _warpDir = +1  → estrellas hacia el centro (sumergirse)
         _warpDir = -1  → estrellas hacia afuera   (emerger)
       raw-niveles.js dispara el warp vía window._dispararWarp(dir). */
    var _warpEnergia = 0;
    var _warpDir     = 1;
    window._dispararWarp = function(dir){
      _warpDir = (dir < 0) ? -1 : 1;
      _warpEnergia = 1;
    };

    /* v8.41 — ONDAS EXPANSIVAS (matemática de batcloud: uRings). Cuando
       pasa algo REAL en la app (guardar entrada, completar hábito, SOS),
       una onda recorre el campo de estrellas iluminándolas a su paso
       (brillo gaussiano según distancia al frente de onda) + un anillo
       tenue visible. El cosmos RESPONDE a tus acciones.
       API: window._ondaCosmica(colorOpcional)
       Costo: solo cuando hay ondas vivas (máx 3); nada en reposo. */
    var _ondas = [];
    window._ondaCosmica = function(color){
      if(_ondas.length >= 3) _ondas.shift();
      _ondas.push({ r: 20, color: color || '#A78BFA', alpha: 1 });
    };
    function _ondasTick(dt){
      for(var i = _ondas.length - 1; i >= 0; i--){
        var o = _ondas[i];
        o.r += 620 * dt;                       // velocidad de propagación px/s
        o.alpha = Math.max(0, 1 - o.r / (MAX_R * 1.15));
        if(o.alpha <= 0.01) _ondas.splice(i, 1);
      }
    }
    function _ondasBoost(rEstrella){
      // Brillo extra si la estrella está cerca del frente de alguna onda.
      var b = 0;
      for(var i = 0; i < _ondas.length; i++){
        var d = rEstrella - _ondas[i].r;
        if(d > -70 && d < 70){
          b += Math.exp(-(d*d) / 1800) * _ondas[i].alpha;   // gauss σ≈30
        }
      }
      return b;
    }
    function _ondasDibujar(){
      for(var i = 0; i < _ondas.length; i++){
        var o = _ondas[i];
        pctx.beginPath();
        pctx.arc(CX, CY, o.r, 0, Math.PI * 2);
        pctx.strokeStyle = o.color;
        pctx.globalAlpha = o.alpha * 0.22;
        pctx.lineWidth = 1.5;
        pctx.stroke();
        pctx.globalAlpha = 1;
      }
    }

    /* v9.3 — MOTAS ÁMBAR (lenguaje joseph-san): unas pocas partículas
       DORADAS y CÁLIDAS flotando muy cerca de la cámara, subiendo lento
       como polvo iluminado. El contraste de temperatura (ámbar cálido
       sobre cosmos frío teal/violeta) da vida sin competir con las
       estrellas. 22 motas = costo despreciable. */
    var _motas = [];
    (function(){
      for(var i = 0; i < 22; i++){
        _motas.push({
          x: Math.random(), y: Math.random(),
          vx: (Math.random() - 0.5) * 6, vy: -3 - Math.random() * 5,
          r: 0.7 + Math.random() * 1.3,
          ph: Math.random() * Math.PI * 2,
          tw: 0.4 + Math.random() * 0.8,
          prof: 1.15 + Math.random() * 0.5
        });
      }
    })();
    function _motasDibujar(dt){
      for(var i = 0; i < _motas.length; i++){
        var m = _motas[i];
        m.x += (m.vx * dt) / W; m.y += (m.vy * dt) / H;
        m.ph += m.tw * dt;
        if(m.y < -0.02){ m.y = 1.02; m.x = Math.random(); }
        if(m.x < -0.02) m.x = 1.02; else if(m.x > 1.02) m.x = -0.02;
        var px = m.x * W + _camGX * (m.prof - 0.85);
        var py = m.y * H + _camGY * (m.prof - 0.85);
        var a = 0.16 + 0.22 * (Math.sin(m.ph) + 1) / 2;
        pctx.fillStyle = 'rgba(252,211,77,' + a.toFixed(2) + ')';
        pctx.beginPath(); pctx.arc(px, py, m.r, 0, 6.2832); pctx.fill();
        if(m.r > 1.6){
          pctx.fillStyle = 'rgba(245,158,11,' + (a * 0.25).toFixed(2) + ')';
          pctx.beginPath(); pctx.arc(px, py, m.r * 2.6, 0, 6.2832); pctx.fill();
        }
      }
    }

    /* v8.19 — CÁMARA VIRTUAL · smooth parallax / camera movement.
       Una "cámara" con dos ejes (camX, camY) en rango ~[-1,1]. El TARGET lo
       fija el mouse (escritorio) o el giroscopio (móvil); el valor CURRENT
       persigue al target con un lerp suave cada frame (nunca brusco). Al
       dibujar, cada capa se desplaza por camX/Y × su profundidad: estrellas
       grandes (cerca) se mueven más, pequeñas (lejos) menos → parallax 3D.
       Aditivo: con cámara en 0,0 el fondo se ve EXACTAMENTE como antes. */
    var _camTX = 0, _camTY = 0;   // target (-1..1)
    var _camX  = 0, _camY  = 0;   // current (suavizado)
    var _CAM_AMP = 15;            // amplitud en px del desplazamiento (sutil)
    // v8.38 — FASE E: cámara compartida con drawStars para el parallax POR
    // ESTRELLA (Z continuo). Se asignan cada frame desde el loop.
    var _camGX = 0, _camGY = 0;
    var _cuLast = null;   // v8.44: última card expandida (para el count-up)
    var _CAM_LERP = 0.04;         // qué tan rápido persigue (bajo = más suave/flotante)

    // Mouse (escritorio): normaliza la posición a [-1,1] desde el centro.
    function _camOnMouse(e){
      var w = window.innerWidth || 1, h = window.innerHeight || 1;
      _camTX = (e.clientX / w) * 2 - 1;
      _camTY = (e.clientY / h) * 2 - 1;
    }
    // Giroscopio (móvil): gamma = inclinación izq/der, beta = adelante/atrás.
    function _camOnTilt(e){
      if(e.gamma == null || e.beta == null) return;
      // gamma ∈ [-90,90], beta ∈ [-180,180]; acotamos a un rango cómodo.
      _camTX = Math.max(-1, Math.min(1, e.gamma / 35));
      _camTY = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
    }
    window.addEventListener('mousemove', _camOnMouse, { passive: true });
    // El giroscopio en iOS requiere permiso explícito; si está disponible sin
    // permiso (Android y otros), se engancha directo. No forzamos el prompt
    // de iOS aquí para no ser intrusivos; se puede activar con un gesto luego.
    if(typeof window.DeviceOrientationEvent !== 'undefined' &&
       typeof window.DeviceOrientationEvent.requestPermission !== 'function'){
      window.addEventListener('deviceorientation', _camOnTilt, { passive: true });
    }
    // Exponer un activador de giroscopio para iOS (que pide permiso con gesto).
    window._activarParallaxGiro = function(){
      try {
        if(typeof window.DeviceOrientationEvent !== 'undefined' &&
           typeof window.DeviceOrientationEvent.requestPermission === 'function'){
          window.DeviceOrientationEvent.requestPermission().then(function(st){
            if(st === 'granted') window.addEventListener('deviceorientation', _camOnTilt, { passive: true });
          }).catch(function(){});
        }
      } catch(e){}
    };

    /* v8.36 — CONTRA-MOVIMIENTO DIEGÉTICO. El contenido interno de las
       cards ([id$="-inner"]) flota opuesto a la cámara con un tilt 3D
       mínimo. Ficha de rendimiento:
       · corre dentro del frame loop existente (cero loops nuevos)
       · guard de reposo: si la cámara no cambió, no escribe NADA al DOM
       · translate3d + rotate = solo composite (GPU), nunca layout/reflow
       · la lista de inners se cachea (querySelectorAll cada ~7s, no por frame)
       · en niv-2 / móvil se resetea y descansa */
    var _ctrInners = null, _ctrRefresco = 0, _ctrLastX = 99, _ctrLastY = 99, _ctrActivo = false;
    var _velGlitch = 0;   // v8.42: energía del glitch por velocidad (0..1)
    function _ctrMov(){
      // Guard de reposo: cámara quieta = ni un write al DOM.
      if(Math.abs(_camX - _ctrLastX) < 0.0015 && Math.abs(_camY - _ctrLastY) < 0.0015){
        // decaer el glitch aunque la cámara pare
        if(_velGlitch > 0.01){ _velGlitch *= 0.86; } else { return; }
      }
      // v8.42 — VELOCITY-GLITCH (joseph-san): la VELOCIDAD del movimiento
      // alimenta una energía de "degradación de señal". Movimiento brusco →
      // los hologramas sufren un RGB-split sutil (los canales de color se
      // separan un instante) que decae solo. Mouse suave = imagen perfecta.
      var _vx = _camX - _ctrLastX, _vy = _camY - _ctrLastY;
      var _vel = Math.sqrt(_vx*_vx + _vy*_vy);
      if(_vel > 0.012) _velGlitch = Math.min(1, _velGlitch + _vel * 6);
      _velGlitch *= 0.90;   // decaimiento
      _ctrLastX = _camX; _ctrLastY = _camY;

      if(!_ctrInners || --_ctrRefresco <= 0){
        _ctrInners = document.querySelectorAll('.hud-pnl > [id$="-inner"]');
        _ctrRefresco = 220;   // re-cachear cada ~220 frames por si el DOM cambió
      }
      var tx = (-_camX * 3.5).toFixed(2), ty = (-_camY * 3.5).toFixed(2);
      var rx = ( _camY * 0.7).toFixed(2), ry = (-_camX * 0.7).toFixed(2);
      var t = 'perspective(900px) translate3d('+tx+'px,'+ty+'px,0) rotateX('+rx+'deg) rotateY('+ry+'deg)';
      // RGB-split vía text-shadow (rojo a un lado, cian al otro) — barato,
      // solo cuando hay energía; con energía ~0 se limpia el filtro.
      var g = _velGlitch;
      var sombra = (g > 0.06)
        ? (1.6*g).toFixed(2)+'px 0 rgba(255,60,60,'+(0.35*g).toFixed(2)+'), '+
          (-1.6*g).toFixed(2)+'px 0 rgba(60,220,255,'+(0.35*g).toFixed(2)+')'
        : '';
      for(var i = 0; i < _ctrInners.length; i++){
        _ctrInners[i].style.transform = t;
        _ctrInners[i].style.textShadow = sombra;
      }
      _ctrActivo = true;
    }
    // Al entrar a nivel 2 el frame loop se pausa; limpiar el transform para
    // que las secciones no hereden un tilt congelado.
    var _ctrObs = new MutationObserver(function(){
      if(document.documentElement.classList.contains('niv-2') && _ctrActivo){
        if(_ctrInners){ for(var i=0;i<_ctrInners.length;i++){ _ctrInners[i].style.transform = ''; _ctrInners[i].style.textShadow = ''; } }
        _ctrActivo = false; _ctrLastX = 99; _ctrLastY = 99;
      }
    });
    _ctrObs.observe(document.documentElement, { attributes:true, attributeFilter:['class'] });

    /* v9.9 — DIRECTOR DE TRANSICIONES: las animaciones diegéticas del dial
       se disparan en CUALQUIER cambio de nivel (tabs, clics, scroll), no
       solo cuando hay warp — antes estaban ancladas a niv-warp y la mayoría
       de las rutas de navegación lo saltan. Clases de un solo uso que se
       retiran al terminar (transform final = identidad, geometría limpia). */
    var _nivPrev = 0;
    function _nivelActual(){
      var h = document.documentElement.classList;
      if(h.contains('niv-2')) return 2;
      if(h.contains('niv-1')) return 1;
      return 0;
    }
    new MutationObserver(function(){
      var n = _nivelActual();
      if(n === _nivPrev) return;
      var bajando = n > _nivPrev;
      _nivPrev = n;
      var cv = document.getElementById('dial-canvas');
      if(!cv) return;
      cv.classList.remove('dial-anim-down','dial-anim-up');
      void cv.offsetWidth;   // reiniciar la animación
      cv.classList.add(bajando ? 'dial-anim-down' : 'dial-anim-up');
      cv.addEventListener('animationend', function fin(){
        cv.classList.remove('dial-anim-down','dial-anim-up');
        cv.removeEventListener('animationend', fin);
      });
    }).observe(document.documentElement, { attributes:true, attributeFilter:['class'] });

    /* v8.44 — MICROCOPY DE SISTEMA (lenguaje joseph-san): hint discreto
       en la esquina inferior derecha, contextual al nivel. Fuente mono,
       casi invisible. Se actualiza con el mismo observer de clases. */
    var _hintEl = document.createElement('div');
    _hintEl.id = 'raw-hint';
    _hintEl.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:10px;z-index:9490;'+
      'font-family:"JetBrains Mono",ui-monospace,monospace;font-size:9px;'+
      'letter-spacing:.16em;color:var(--hud-text-faint,rgba(200,210,220,0.25));'+
      'pointer-events:none;text-transform:uppercase;transition:opacity .4s ease';
    document.body.appendChild(_hintEl);
    function _hintRefrescar(){
      var h = document.documentElement;
      if(h.classList.contains('mob')){ _hintEl.style.opacity = '0'; return; }
      var txt = '';
      if(h.classList.contains('niv-2'))      txt = '[←/→] Secciones';
      else if(h.classList.contains('cf-on')) txt = '[←/→] Girar anillo · [Clic] Entrar';
      else if(h.classList.contains('niv-1')) txt = '[Clic] Card lateral · [←/→] Girar';
      else                                    txt = '[Clic] Expandir · [←/→] Secciones';
      _hintEl.textContent = txt;
      _hintEl.style.opacity = '1';
    }
    new MutationObserver(_hintRefrescar)
      .observe(document.documentElement, { attributes:true, attributeFilter:['class'] });
    _hintRefrescar();

    function resize(){
      var dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      CX = W / 2; CY = H / 2;
      DIAL_R = Math.min(W, H) * 0.22;
      MAX_R = Math.hypot(W/2, H/2) + 30;
      _particlesCanvas.width = W * dpr;
      _particlesCanvas.height = H * dpr;
      _particlesCanvas.style.width = W + 'px';
      _particlesCanvas.style.height = H + 'px';
      pctx = _particlesCanvas.getContext('2d');
      pctx.scale(dpr, dpr);
    }

    // ── KEPLER: velocidad angular según radio ──
    function angularVel(r){
      return 0.18 / Math.sqrt(Math.max(50, r));
    }

    function polar2cart(r, theta){
      return { x: CX + Math.cos(theta) * r, y: CY + Math.sin(theta) * r };
    }

    // ══════════════════════════════════════════════════════════════════
    //  NEBULOSA: blobs gaussianos que se mueven
    // ══════════════════════════════════════════════════════════════════
    function initNebula(){
      nebulaBlobs = [];
      for(var i = 0; i < 5; i++){
        nebulaBlobs.push({
          x: CX + (Math.random() - 0.5) * W * 0.8,
          y: CY + (Math.random() - 0.5) * H * 0.8,
          radius: 220 + Math.random() * 180,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          phase: Math.random() * Math.PI * 2,
          color: PALETTE[i % PALETTE.length],
        });
      }
    }

    var _nebT = 0;
    function updateNebula(dt){
      // v9.3 — DRIFT ORGÁNICO: antes los blobs rebotaban en los bordes
      // (vx *= -1, ping-pong mecánico). Ahora cada blob oscila alrededor
      // de un ancla con DOS ondas de frecuencias no armónicas (pseudo-ruido
      // suave y barato) y el ancla deriva lentísimo con wrap continuo.
      // El brillo estelar que modula la nebulosa ahora "respira" orgánico.
      _nebT += dt;
      nebulaBlobs.forEach(function(b, i){
        if(b._of1 === undefined){
          b._ax = b.x; b._ay = b.y;
          b._of1 = 0.05 + (i % 5) * 0.013;
          b._of2 = 0.083 + (i % 7) * 0.011;
          b._oa1 = 30 + (i % 4) * 18;
          b._oa2 = 22 + (i % 3) * 14;
          b._ph1 = i * 2.399; b._ph2 = i * 1.713;
        }
        b._ax += b.vx * dt * 0.4;
        b._ay += b.vy * dt * 0.4;
        if(b._ax < -80) b._ax = W + 80; else if(b._ax > W + 80) b._ax = -80;
        if(b._ay < -80) b._ay = H + 80; else if(b._ay > H + 80) b._ay = -80;
        b.x = b._ax + Math.sin(_nebT * b._of1 + b._ph1) * b._oa1;
        b.y = b._ay + Math.sin(_nebT * b._of2 + b._ph2) * b._oa2;
        b.phase += dt * 0.3;
      });
    }

    function nebulaIntensityAt(x, y){
      var sum = 0;
      for(var i = 0; i < nebulaBlobs.length; i++){
        var b = nebulaBlobs[i];
        var d = Math.hypot(x - b.x, y - b.y);
        if(d < b.radius){
          var falloff = 1 - (d / b.radius);
          sum += falloff * falloff * (0.7 + 0.3 * Math.sin(b.phase));
        }
      }
      return Math.min(1, 0.5 + sum * 0.4);
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.201 — NEBULOSA VISIBLE (capa offscreen pre-renderizada)
    //  Optimización: la nebulosa es estática (solo deriva lentísimo), así
    //  que se pinta UNA vez a un canvas offscreen y por frame solo se hace
    //  un drawImage — costo casi nulo. Da el color/textura del mockup sin
    //  recalcular gradientes cada frame.
    //  nebulaIntensityAt (arriba) NO se toca: sigue modulando estrellas.
    // ══════════════════════════════════════════════════════════════════
    var _nebCanvas = null;       // canvas offscreen con la nebulosa pintada
    var _nebDriftX = 0, _nebDriftY = 0;

    // v5.217: la nebulosa es difusa y borrosa — construirla a MEDIA
    // resolución (1/4 de los píxeles) es invisible al ojo pero 4x más
    // barato. drawNebulaLayer la escala de vuelta al pintar.
    var _NEB_SCALE = 0.5;
    function buildNebulaLayer(){
      _nebCanvas = document.createElement('canvas');
      _nebCanvas.width  = Math.max(1, Math.round(W * _NEB_SCALE));
      _nebCanvas.height = Math.max(1, Math.round(H * _NEB_SCALE));
      var nc = _nebCanvas.getContext('2d', { willReadFrequently: true });
      // Escalar el contexto para que el código de dibujo siga usando
      // coordenadas W/H normales sin cambios.
      nc.scale(_NEB_SCALE, _NEB_SCALE);

      // Colores de nebulosa — morados/azules/cian como el mockup objetivo.
      var NEB_COLORS = [
        'rgba(124, 58, 237, ALPHA)',   // violeta profundo
        'rgba(59, 130, 246, ALPHA)',   // azul
        'rgba(34, 211, 238, ALPHA)',   // cian
        'rgba(139, 92, 246, ALPHA)',   // violeta medio
      ];

      // Manchas de nebulosa. Concentradas en esquinas/bordes (como el
      // mockup), evitando el centro para no competir con el dial.
      // [cx_rel, cy_rel, radio_rel, colorIdx, intensidad]
      var blobs = [
        [0.08, 0.82, 0.42, 0, 0.85],   // abajo-izquierda — fuerte
        [0.92, 0.70, 0.46, 2, 0.90],   // abajo-derecha — fuerte (cian)
        [0.04, 0.30, 0.34, 3, 0.55],   // arriba-izquierda — media
        [0.97, 0.22, 0.30, 1, 0.50],   // arriba-derecha — media
        [0.50, 0.95, 0.40, 0, 0.45],   // borde inferior centro — suave
        [0.72, 0.90, 0.30, 3, 0.40],   // relleno abajo
        [0.20, 0.60, 0.26, 1, 0.35],   // mancha suelta izquierda
      ];

      // Cada mancha = varias capas de gradiente radial superpuestas con
      // leve offset, para que el borde sea irregular y no un círculo.
      blobs.forEach(function(b){
        var bx = b[0] * W, by = b[1] * H;
        var br = b[2] * Math.min(W, H);
        var baseColor = NEB_COLORS[b[3]];
        var intensity = b[4];
        var capas = 4;
        for(var c = 0; c < capas; c++){
          var ox = bx + (Math.sin(c * 2.1) * br * 0.22);
          var oy = by + (Math.cos(c * 1.7) * br * 0.22);
          var rad = br * (0.55 + c * 0.18);
          // Alpha por capa: el additive hace que el solape se vea denso.
          var a = (intensity * 0.10) * (1 - c / capas);
          var g = nc.createRadialGradient(ox, oy, 0, ox, oy, rad);
          g.addColorStop(0,   baseColor.replace('ALPHA', a.toFixed(3)));
          g.addColorStop(0.5, baseColor.replace('ALPHA', (a * 0.45).toFixed(3)));
          g.addColorStop(1,   baseColor.replace('ALPHA', '0'));
          nc.globalCompositeOperation = 'lighter';
          nc.fillStyle = g;
          nc.fillRect(0, 0, W, H);
        }
      });

      // Una pasada de "polvo" fino dentro de las nebulosas para textura.
      nc.globalCompositeOperation = 'lighter';
      for(var d = 0; d < 220; d++){
        var blob = blobs[Math.floor(Math.random() * blobs.length)];
        var ang = Math.random() * Math.PI * 2;
        var dist = Math.random() * blob[2] * Math.min(W, H) * 0.7;
        var dx = blob[0] * W + Math.cos(ang) * dist;
        var dy = blob[1] * H + Math.sin(ang) * dist;
        var col = NEB_COLORS[blob[3]].replace('ALPHA', (0.04 + Math.random() * 0.06).toFixed(3));
        nc.fillStyle = col;
        nc.beginPath();
        nc.arc(dx, dy, 0.5 + Math.random() * 1.4, 0, Math.PI * 2);
        nc.fill();
      }
      nc.globalCompositeOperation = 'source-over';
    }

    // Dibuja la nebulosa pre-renderizada con un drift lentísimo (parallax).
    function drawNebulaLayer(dt){
      if(!_nebCanvas) return;
      _nebDriftX = Math.sin(globalT * 0.03) * 14;
      _nebDriftY = Math.cos(globalT * 0.022) * 10;
      pctx.save();
      pctx.globalCompositeOperation = 'lighter';
      pctx.globalAlpha = 0.9;
      // v5.217: el canvas está a media resolución — escalarlo a tamaño
      // completo al pintar. drawImage con dimensiones destino lo estira.
      pctx.drawImage(_nebCanvas, _nebDriftX, _nebDriftY, W, H);
      pctx.restore();
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.201 — HALOS LEJANOS (objetos cósmicos con aro)
    //  Puntos brillantes con un aro tenue alrededor, repartidos por el
    //  fondo — las "esferas" lejanas del mockup. Ligeros: vectoriales.
    // ══════════════════════════════════════════════════════════════════
    var farHalos = [];
    function buildFarHalos(){
      farHalos = [];
      var n = 6;  // v5.203: uno menos, más espaciados
      for(var i = 0; i < n; i++){
        farHalos.push({
          x: 0.10 + Math.random() * 0.80,   // relativo a W
          y: 0.10 + Math.random() * 0.80,   // relativo a H
          ringR: 16 + Math.random() * 16,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          // v5.203: brillo FIJO por halo (sin pulso). Cada uno tiene su
          // intensidad estable — discretos, no parpadeantes.
          bright: 0.35 + Math.random() * 0.30,
        });
      }
    }
    function drawFarHalos(dt){
      // v5.203: halos QUIETOS y sutiles — sin pulso. Objetos lejanos
      // discretos, no luces parpadeando caóticas.
      pctx.save();
      pctx.globalCompositeOperation = 'lighter';
      for(var i = 0; i < farHalos.length; i++){
        var h = farHalos[i];
        var hx = h.x * W, hy = h.y * H;
        // No dibujar si cae sobre el dial central (queda feo encima).
        if(Math.hypot(hx - CX, hy - CY) < DIAL_R * 1.5) continue;
        // Núcleo brillante — alpha fijo
        var cg = pctx.createRadialGradient(hx, hy, 0, hx, hy, 3.5);
        cg.addColorStop(0, h.color);
        cg.addColorStop(1, 'transparent');
        pctx.globalAlpha = h.bright;
        pctx.fillStyle = cg;
        pctx.beginPath(); pctx.arc(hx, hy, 3.5, 0, Math.PI*2); pctx.fill();
        // Aro alrededor — tenue y fijo
        pctx.globalAlpha = 0.14;
        pctx.strokeStyle = h.color;
        pctx.lineWidth = 1;
        pctx.beginPath();
        pctx.arc(hx, hy, h.ringR, 0, Math.PI*2);
        pctx.stroke();
      }
      pctx.restore();
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.201 — ANILLOS CONCÉNTRICOS DEL DIAL (estructura tipo Dyson)
    //  Varios aros alrededor del dial: unos continuos finos, otros
    //  segmentados/punteados, con glow, girando a distintas velocidades.
    //  Vectorial y ligero — ~8 aros, trazos simples.
    // ══════════════════════════════════════════════════════════════════
    var dialRings = [];
    function buildDialRings(){
      dialRings = [];
      // v5.203: 5 aros (antes 8). TODOS giran en la MISMA dirección
      // (horario) y a velocidad LENTA y pareja → se leen como un solo
      // sistema ordenado, no 8 cosas sueltas girando caóticas.
      // [factor_radio, tipo, grosor, nSegmentos]
      var defs = [
        [1.20, 'solid',  1.0,  0],
        [1.36, 'dashed', 1.2, 36],
        [1.54, 'ticks',  1.3, 72],
        [1.74, 'solid',  0.8,  0],
        [1.96, 'dashed', 0.9, 30],
      ];
      var ROT_BASE = 0.018;  // velocidad base lenta, igual para todos
      defs.forEach(function(d, i){
        dialRings.push({
          rFactor: d[0], type: d[1], width: d[2], nSeg: d[3],
          // Todos en la misma dirección. Los exteriores apenas más
          // lentos (parallax sutil), pero el MISMO sentido.
          rotSpeed: ROT_BASE * (1 - i * 0.10),
          rot: 0,  // arrancan alineados, no aleatorio
          color: i % 2 === 0 ? '#A78BFA' : '#22D3EE',
          phase: i * 0.7,
        });
      });
    }
    function drawDialRings(dt){
      pctx.save();
      pctx.globalCompositeOperation = 'lighter';
      for(var i = 0; i < dialRings.length; i++){
        var ring = dialRings[i];
        ring.rot += ring.rotSpeed * dt;
        ring.phase += dt * 0.6;
        var R = DIAL_R * ring.rFactor;
        // Glow suave que respira
        var breathe = 0.5 + 0.5 * Math.sin(ring.phase);
        var baseA = 0.10 + breathe * 0.10;
        pctx.strokeStyle = ring.color;
        pctx.lineWidth = ring.width;
        pctx.shadowColor = ring.color;
        pctx.shadowBlur = 6;

        if(ring.type === 'solid'){
          pctx.globalAlpha = baseA;
          pctx.beginPath();
          pctx.arc(CX, CY, R, 0, Math.PI * 2);
          pctx.stroke();
        } else if(ring.type === 'dashed'){
          pctx.globalAlpha = baseA * 1.3;
          var segLen = (Math.PI * 2) / ring.nSeg;
          for(var s = 0; s < ring.nSeg; s += 2){
            var a0 = ring.rot + s * segLen;
            pctx.beginPath();
            pctx.arc(CX, CY, R, a0, a0 + segLen * 0.7);
            pctx.stroke();
          }
        } else if(ring.type === 'ticks'){
          pctx.globalAlpha = baseA * 1.1;
          pctx.shadowBlur = 3;
          for(var t = 0; t < ring.nSeg; t++){
            var ang = ring.rot + (t / ring.nSeg) * Math.PI * 2;
            var inner = R - 3, outer = R + 3;
            pctx.beginPath();
            pctx.moveTo(CX + Math.cos(ang) * inner, CY + Math.sin(ang) * inner);
            pctx.lineTo(CX + Math.cos(ang) * outer, CY + Math.sin(ang) * outer);
            pctx.stroke();
          }
        }
      }
      pctx.shadowBlur = 0;
      pctx.restore();
    }


    //  RAYOS DEL CENTRO ABSOLUTO (parten de CX,CY y rotan)
    // ══════════════════════════════════════════════════════════════════
    function buildRays(){
      rays = [];
      var nRays = 14;  // v5.169: más rayos
      for(var i = 0; i < nRays; i++){
        rays.push({
          theta: (i / nRays) * Math.PI * 2 + Math.random() * 0.3,
          length: 0.55 + ((i * 13) % 5) * 0.10,  // factor de MAX_R
          rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.025 + (i % 3) * 0.012),
          curvature: ((i * 7) % 3 - 1) * 0.6,
          phase: i * 0.6,
          color: PALETTE[i % PALETTE.length],
          // Vida pulsante
          lifePhase: i * Math.PI / 4,
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  ESTRELLAS EN ÓRBITAS (keplerianas)
    // ══════════════════════════════════════════════════════════════════
    function buildStars(){
      stars = [];
      // v7.066 — recorte agresivo: techo 460 (era 580), piso 280 (era 368).
      // El ojo no distingue 580 vs 460 estrellas en un fondo, pero el costo
      // de cada estrella en cada frame es real. ~20% menos costo.
      var nStars = Math.max(280, Math.min(460, Math.floor((W * H) / 3800)));
      if(_lowEndDevice) nStars = Math.floor(nStars * 0.55); // v5.217: menos estrellas en equipos modestos
      for(var i = 0; i < nStars; i++){
        var u = Math.random();
        var r = 30 + (MAX_R - 30) * Math.pow(u, 0.7);
        var theta = Math.random() * Math.PI * 2;
        stars.push({
          r: r,
          theta: theta,
          omega: angularVel(r),
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.8 + Math.random() * 1.6,
          baseSize: 0.5 + Math.random() * 1.4,
          age: Math.random() * 10,
          lifespan: 8 + Math.random() * 12,
          isHub: Math.random() < 0.1,
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  CONSTELACIONES (grupos irregulares conectados)
    // ══════════════════════════════════════════════════════════════════
    function buildConstellations(){
      constellations = [];
      var nConst = _lowEndDevice ? 7 : 13;  // v5.217: menos constelaciones en equipos modestos
      for(var c = 0; c < nConst; c++){
        // Centro del grupo en órbita
        var cR = 200 + Math.random() * (MAX_R - 250);
        var cTheta = (c / nConst) * Math.PI * 2 + Math.random() * 0.5;
        var nPoints = 3 + Math.floor(Math.random() * 4);
        var points = [];
        for(var p = 0; p < nPoints; p++){
          // Cada punto a un offset polar pequeño del centro del grupo
          var dR = (Math.random() - 0.5) * 80;
          var dTheta = (Math.random() - 0.5) * 0.4;
          points.push({
            dR: dR,
            dTheta: dTheta,
            phase: Math.random() * Math.PI * 2,
            twinkleSpeed: 1.2 + Math.random() * 2.0,
            baseSize: 0.8 + Math.random() * 0.8,
          });
        }
        constellations.push({
          cR: cR,
          cTheta: cTheta,
          omega: angularVel(cR),
          points: points,
          color: PALETTE[c % PALETTE.length],
          age: Math.random() * 6,
          lifespan: 10 + Math.random() * 8,
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  ESPIRALES ÁUREAS (girando)
    // ══════════════════════════════════════════════════════════════════
    function buildSpirals(){
      spirals = [];
      for(var i = 0; i < 2; i++){
        spirals.push({
          direction: i === 0 ? 1 : -1,
          phaseOffset: i * Math.PI,
          turns: 3.5,
          a: 45,
          b: 0.306,
          color: i === 0 ? '#A78BFA' : '#22D3EE',
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (i === 0 ? 0.04 : -0.03),
          lifePhase: i * Math.PI,
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  LORENZ
    // ══════════════════════════════════════════════════════════════════
    function spawnLorenz(){
      lorenzTrails.push({
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
        z: 5 + Math.random() * 10,
        history: [],
        color: Math.random() < 0.5 ? '#4ADE80' : '#C4B5FD',
        scale: 10 + Math.random() * 6,
        centerX: CX + (Math.random() - 0.5) * W * 0.6,
        centerY: CY + (Math.random() - 0.5) * H * 0.6,
        age: 0,
        maxAge: 8 + Math.random() * 4,
      });
    }

    function updateLorenz(dt){
      for(var i = lorenzTrails.length - 1; i >= 0; i--){
        var l = lorenzTrails[i];
        l.age += dt;
        if(l.age >= l.maxAge){ lorenzTrails.splice(i, 1); continue; }
        // Sistema de Lorenz
        var step = dt * 0.4;
        var dx = 10 * (l.y - l.x);
        var dy = l.x * (28 - l.z) - l.y;
        var dz = l.x * l.y - (8/3) * l.z;
        l.x += dx * step;
        l.y += dy * step;
        l.z += dz * step;
        var px = l.centerX + l.x * l.scale * 0.5;
        var py = l.centerY + (l.z - 28) * l.scale * 0.5;
        // v5.170: si se sale del viewport, acelerar el fin de vida
        // pero gradualmente — NO morir de golpe. Lo dejamos en la fase de
        // fade-out (>0.8 del lifespan) en lugar de matar instantáneamente.
        if(px < -50 || px > W + 50 || py < -50 || py > H + 50){
          // Llevarlo al 82% de la vida (en fase fade-out) si no está ya ahí
          var targetAge = l.maxAge * 0.82;
          if(l.age < targetAge) l.age = targetAge;
          continue; // no agregar al history este punto
        }
        l.history.push({ x: px, y: py });
        if(l.history.length > 45) l.history.shift();
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  VÓRTICES
    // ══════════════════════════════════════════════════════════════════
    function spawnVortex(){
      var r = 100 + Math.random() * (MAX_R - 150);
      var theta = Math.random() * Math.PI * 2;
      vortices.push({
        r: r, theta: theta,
        omega: angularVel(r),
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        age: 0,
        lifespan: 3 + Math.random() * 2,
        maxRadius: 50 + Math.random() * 40,
      });
    }

    // ══════════════════════════════════════════════════════════════════
    //  SINAPSIS: neuronas conectándose fugazmente
    // ══════════════════════════════════════════════════════════════════
    function spawnSynapse(){
      if(stars.length < 2) return;
      var s1 = stars[Math.floor(Math.random() * stars.length)];
      if(!s1._cachedX) return;
      var best = null, bestD = Infinity;
      for(var i = 0; i < stars.length; i++){
        var s2 = stars[i];
        if(s2 === s1 || !s2._cachedX) continue;
        var d = Math.hypot(s1._cachedX - s2._cachedX, s1._cachedY - s2._cachedY);
        if(d > 280) continue;
        if(d < bestD){ bestD = d; best = s2; }
      }
      if(!best) return;
      synapses.push({
        s1: s1, s2: best,
        age: 0,
        lifespan: 2.0 + Math.random() * 2.5,   // v5.170: 2-4.5s (antes 1-2.5)
        color: s1.color,
      });
    }

    // ══════════════════════════════════════════════════════════════════
    //  PULSOS
    // ══════════════════════════════════════════════════════════════════
    function spawnPulse(){
      var pool = [];
      rays.forEach(function(r){ pool.push({ type:'ray', ref:r }); });
      synapses.forEach(function(s){
        if(s.age < s.lifespan * 0.7) pool.push({ type:'synapse', ref:s });
      });
      if(!pool.length) return;
      var sel = pool[Math.floor(Math.random() * pool.length)];
      pulses.push({
        type: sel.type,
        ref: sel.ref,
        t: 0,
        speed: 0.4 + Math.random() * 0.4,
        forward: sel.type === 'ray' ? (Math.random() < 0.8) : (Math.random() < 0.5),
        tailT: 0.18 + Math.random() * 0.10,
        life: 1,
      });
    }

    // ══════════════════════════════════════════════════════════════════
    //  DIBUJOS
    // ══════════════════════════════════════════════════════════════════

    // ══════════════════════════════════════════════════════════════════
    //  v5.181: EFECTO WARP / AGUJERO NEGRO (prueba)
    //  Disco de acreción toroidal en el centro absoluto. Partículas que
    //  espiralan hacia adentro acelerando (como materia cayendo al
    //  horizonte de eventos). Queda detrás del dial.
    // ══════════════════════════════════════════════════════════════════
    var warpParticles = [];
    // v5.203: el ciclo cósmico (cosmicPhase/cosmicMode/cosmicCycleTime)
    // se eliminó — el warp ahora es disco de acreción de flujo constante.

    function buildWarp(){
      warpParticles = [];
      // v5.203: disco de acreción — menos partículas (no hace falta llenar
      // toda la pantalla; el flujo hacia el centro es lo que importa).
      var nWarp = _lowEndDevice ? 170 : 340; // v5.217: menos partículas de warp en equipos modestos
      var diag = Math.hypot(W/2, H/2);
      for(var i = 0; i < nWarp; i++){
        warpParticles.push(spawnWarpParticle(diag));
      }
    }

    function spawnWarpParticle(diag){
      if(diag === undefined) diag = Math.hypot(W/2, H/2);
      // v5.203: nace en cualquier radio, distribución uniforme por área.
      var minR = DIAL_R * 0.6;
      var maxR = diag + 60;
      var r = minR + (maxR - minR) * Math.sqrt(Math.random());
      return {
        r: r,
        theta: Math.random() * Math.PI * 2,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        size: 0.4 + Math.random() * 1.3,
        phase: Math.random() * Math.PI * 2,
        // Velocidad de caída individual — leve variación para que no
        // caigan todas exactamente igual (se ve más orgánico).
        fallRate: 0.85 + Math.random() * 0.3,
        _reborn: 1,
      };
    }

    // v5.204 — AGUJERO NEGRO QUE RESPIRA. Ciclo lento (~52s):
    //  · fase JALAR    → las partículas espiralan hacia el centro
    //  · fase EXPULSAR → el agujero "exhala" y las saca hacia afuera
    // Todo LENTO y orbitando: la órbita (giro) está siempre presente,
    // la componente radial (entrar/salir) es suave y cíclica. Ni la
    // succión violenta de v5.203 ni el campo quieto. Orgánico.
    var _warpCycleT = 0;
    function drawWarp(dt){
      var diag = Math.hypot(W/2, H/2);
      var eventHorizon = DIAL_R * 0.62;

      // ── CICLO RESPIRATORIO ──
      // breath: +1 = jalando al máximo · −1 = expulsando al máximo.
      // Transición con seno → sin saltos. Ciclo largo = cambio lento.
      _warpCycleT += dt;
      var CYCLE = 52;  // segundos por ciclo completo (jalar + expulsar)
      var breath = Math.sin((_warpCycleT / CYCLE) * Math.PI * 2);

      for(var i = 0; i < warpParticles.length; i++){
        var w = warpParticles[i];

        // ── ÓRBITA: siempre presente, misma dirección, LENTA ──
        // Más rápido cerca del centro pero suave (kepleriano amortiguado).
        var safeR = Math.max(eventHorizon, w.r);
        var angVel = (40 / Math.pow(safeR, 0.85)) * 0.42;  // v5.204: giro lento
        w.theta += angVel * dt;
        w.phase += dt * 1.2;

        // ── RADIAL: jalar / expulsar, LENTO y suave ──
        var prox = 1 - Math.min(1, w.r / diag);   // 0 lejos, 1 centro
        // Fuerza base muy suave. breath>0 jala (radialVel negativo),
        // breath<0 expulsa (radialVel positivo).
        // La atracción crece un poco cerca del centro, la expansión
        // crece un poco lejos — pero todo MUY moderado.
        var pullStrength = 8 + prox * 14;          // suave (antes 14+90)
        var pushStrength = 8 + (1 - prox) * 12;
        var radialVel;
        if(breath > 0){
          radialVel = -pullStrength * breath * w.fallRate;
        } else {
          radialVel = pushStrength * (-breath) * w.fallRate;
        }
        w.r += radialVel * dt;

        // ── LÍMITES: tragada al centro / no salirse del todo ──
        if(w.r <= eventHorizon){
          // Solo es "tragada" si está en fase de jalar; si está
          // expulsando, simplemente rebota suave hacia afuera.
          if(breath > 0){
            w.r = diag * (0.72 + Math.random() * 0.40);
            w.theta = Math.random() * Math.PI * 2;
            w.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            w._reborn = 0;
          } else {
            w.r = eventHorizon + 2;
          }
        } else if(w.r > diag + 70){
          w.r = diag + 70;
        }
        if(w._reborn < 1){
          w._reborn = Math.min(1, w._reborn + dt * 1.0);
        }

        // ── RENDER ──
        var px = CX + Math.cos(w.theta) * w.r;
        var py = CY + Math.sin(w.theta) * w.r;
        var twinkle = 0.7 + 0.3 * Math.sin(w.phase);
        var nearHorizon = Math.max(0, 1 - (w.r - eventHorizon) / (DIAL_R * 1.0));
        // Brillo modulado por la fase: un poco más vivo al jalar.
        var cycleGlow = 0.82 + 0.18 * Math.abs(breath);
        var alpha = (0.16 + prox * 0.46) * twinkle * w._reborn * cycleGlow;
        if(nearHorizon > 0) alpha *= (1 + nearHorizon * 0.9);
        var radius = w.size * (0.7 + prox * 0.7) * (1 + nearHorizon * 0.6);
        var col = prox > 0.7 ? '#E0F2FE' : w.color;
        pctx.fillStyle = col + Math.floor(Math.max(0, Math.min(1, alpha)) * 220).toString(16).padStart(2, '0');
        // v5.214 — OPTIMIZACIÓN: glow solo en partículas que de verdad lo
        // lucen — las cercanas al centro (prox alto) o entrando al
        // horizonte. Las lejanas, que son la mayoría, van sin shadowBlur.
        // v7.065 OPT — umbral subido de 0.45 a 0.55: las partículas entre
        // 0.45 y 0.55 tenían un glow casi imperceptible que sí costaba
        // ciclos. Visualmente indistinguible, computacionalmente ~10%
        // menos costoso para el warp.
        if(prox > 0.55 || nearHorizon > 0){
          pctx.shadowColor = col;
          pctx.shadowBlur = 2 + prox * 9 + nearHorizon * 10;
        } else {
          pctx.shadowBlur = 0;
        }
        pctx.beginPath();
        pctx.arc(px, py, radius, 0, Math.PI * 2);
        pctx.fill();
      }
      pctx.shadowBlur = 0;
    }

    function drawSpirals(dt){
      spirals.forEach(function(sp, idx){
        sp.rotation += sp.rotSpeed * dt;
        sp.lifePhase += dt * 0.08;
        var pulse = (Math.sin(sp.lifePhase) + 1) / 2;
        var alpha = 0.05 + pulse * 0.18;
        if(alpha < 0.03) return;
        pctx.beginPath();
        var prev = null;
        var steps = 220;
        var thetaMax = sp.turns * Math.PI * 2;
        for(var i = 0; i <= steps; i++){
          var theta = (i / steps) * thetaMax;
          var r = sp.a * Math.exp(sp.b * theta);
          if(r > MAX_R) break;
          var ang = sp.direction * theta + sp.rotation + sp.phaseOffset;
          var x = CX + Math.cos(ang) * r;
          var y = CY + Math.sin(ang) * r;
          if(!prev) pctx.moveTo(x, y);
          else pctx.lineTo(x, y);
          prev = { x: x, y: y };
        }
        var alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
        pctx.strokeStyle = sp.color + alphaHex;
        pctx.lineWidth = 0.9;
        pctx.stroke();
      });
    }

    function drawRays(dt){
      rays.forEach(function(ray){
        ray.theta += ray.rotSpeed * dt;
        ray.lifePhase += dt * 0.4;
        var pulse = (Math.sin(ray.lifePhase) + 1) / 2;
        var alpha = 0.30 + pulse * 0.45;

        // v7.067 OPT — cachear trig del ángulo y del perpendicular.
        // Antes se llamaban Math.cos/Math.sin 6 veces por rayo por
        // frame. Ahora 4. Pequeño pero suma con 14 rayos × 30fps.
        var cosT = Math.cos(ray.theta);
        var sinT = Math.sin(ray.theta);
        var perpAng = ray.theta + Math.PI / 2;
        var cosP = Math.cos(perpAng);
        var sinP = Math.sin(perpAng);

        // v5.171: rayLen MÁS ALLÁ de MAX_R para que se pierdan en el horizonte
        var rayLen = (MAX_R + 200) * ray.length + 150;
        var endX = CX + cosT * rayLen;
        var endY = CY + sinT * rayLen;
        // Control point: curvado perpendicularmente
        var midR = rayLen * 0.5;
        var bend = ray.curvature * rayLen * 0.3;
        var cpx = CX + cosT * midR + cosP * bend;
        var cpy = CY + sinT * midR + sinP * bend;
        // Cachear para pulsos
        ray._a = { x: CX, y: CY };
        ray._b = { x: endX, y: endY };
        ray._cp = { x: cpx, y: cpy };

        // v5.174: GRADIENTE biselado — el rayo es tenue cerca del centro
        // (debajo del dial) y se intensifica al salir del radio del dial.
        // El dial visualmente "domina" su zona.
        // (v7.067 intentó cachear gradientes pero rompió visualmente
        // porque los endpoints rotan cada frame. Revertido a recrearlos.)
        var grad = pctx.createLinearGradient(CX, CY, endX, endY);
        var fadeFrac = (DIAL_R + 30) / rayLen;       // hasta qué fracción del rayo es "interior"
        fadeFrac = Math.max(0.05, Math.min(0.6, fadeFrac));
        // Alpha mínimo dentro del dial (muy tenue) y alpha pleno fuera
        var innerAlpha = alpha * 0.18;                // 18% del alpha normal en el centro
        var midAlpha   = alpha * 0.55;                // 55% en la transición
        var outerAlpha = alpha;                       // 100% afuera
        function hex(a){ return Math.floor(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0'); }
        grad.addColorStop(0, ray.color + hex(innerAlpha));
        grad.addColorStop(fadeFrac * 0.5, ray.color + hex(innerAlpha));
        grad.addColorStop(fadeFrac, ray.color + hex(midAlpha));
        grad.addColorStop(Math.min(0.98, fadeFrac + 0.15), ray.color + hex(outerAlpha));
        grad.addColorStop(1, ray.color + hex(outerAlpha * 0.85));

        pctx.strokeStyle = grad;
        pctx.lineWidth = 1.0 + pulse * 0.8;
        // Sin shadow para no contaminar la zona del dial; el glow vive
        // solo en los pulsos que viajan
        pctx.shadowBlur = 0;
        pctx.beginPath();
        pctx.moveTo(CX, CY);
        pctx.quadraticCurveTo(cpx, cpy, endX, endY);
        pctx.stroke();
      });
    }

    function drawStars(dt){
      // v7.030 — FASE 4A: factor warp suavizado (curva, no lineal) para
      // que el destello golpee fuerte y se desvanezca con gracia.
      // v8.20 — HYPERDRIVE: curva más explosiva. Antes era energía² (suave);
      // ahora un arranque con "punch": sqrt al inicio hace que el estiramiento
      // golpee fuerte de inmediato, luego decae. Da el latigazo del salto.
      var warp = _warpEnergia > 0
        ? (Math.pow(_warpEnergia, 1.4) * (0.7 + 0.3 * Math.sqrt(_warpEnergia)))
        : 0;
      for(var i = 0; i < stars.length; i++){
        var s = stars[i];
        s.theta += s.omega * dt;
        s.age += dt;
        s.phase += s.twinkleSpeed * dt;
        // v7.030 — WARP: durante el destello, las estrellas se desplazan
        // en radio. _warpDir +1 las jala al centro (sumergirse), -1 las
        // expulsa hacia afuera (emerger). Es un empujón temporal: cuando
        // _warpEnergia vuelve a 0, las órbitas siguen como siempre.
        // v8.34 — el desplazamiento radial del warp viejo se retira: el motor
        // Z-3D (abajo) maneja el movimiento del túnel por perspectiva. Cada
        // estrella mantiene su "carril" (radio/ángulo) y viaja solo en Z.
        if(s.age > s.lifespan){
          s.r = 30 + (MAX_R - 30) * Math.pow(Math.random(), 0.7);
          s.theta = Math.random() * Math.PI * 2;
          s.omega = angularVel(s.r);
          s.age = 0;
          s.lifespan = 8 + Math.random() * 12;
          s.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        }
        var lifeFrac = s.age / s.lifespan;
        var lifeAlpha;
        if(lifeFrac < 0.20) lifeAlpha = lifeFrac / 0.20;
        else if(lifeFrac > 0.75) lifeAlpha = (1 - lifeFrac) / 0.25;
        else lifeAlpha = 1;
        if(lifeAlpha <= 0){ s._cachedX = null; continue; }
        var twinkle = (Math.sin(s.phase) + 1) / 2;
        var rad = s.baseSize * (0.7 + twinkle * 0.7) * (s.isHub ? 1.5 : 1);
        // v7.067 OPT — polar2cart inlinado para evitar crear un objeto
        // {x,y} por estrella por frame (580 × 30fps = 17400 obj/seg
        // que iban al GC). Las coordenadas van directamente en pX, pY.
        var pX = CX + Math.cos(s.theta) * s.r;
        var pY = CY + Math.sin(s.theta) * s.r;
        // v8.38 — FASE E · Z CONTINUO: parallax POR ESTRELLA. La capa del
        // canvas ya se traslada 0.85 con la cámara; aquí cada estrella suma
        // su DELTA individual según profundidad (baseSize): las grandes
        // ("cercanas", prof→1.3) se desplazan más que la capa, las pequeñas
        // ("lejanas", prof→0.55) menos → profundidad continua, no 2 planos.
        // Costo: 2 mult + 2 sumas por estrella. En reposo (cámara quieta)
        // _camGX/Y son ~0 y el delta se desvanece solo.
        var _prof = 0.55 + (s.baseSize / 1.9) * 0.75;
        pX += _camGX * (_prof - 0.85);
        pY += _camGY * (_prof - 0.85);
        var neb = nebulaIntensityAt(pX, pY);
        var alpha = lifeAlpha * (0.5 + twinkle * 0.45) * neb;
        // v8.41 — onda expansiva: brillo extra al paso del frente de onda.
        if(_ondas.length){
          var _ob = _ondasBoost(s.r);
          if(_ob > 0.01){ alpha = Math.min(1, alpha + _ob * 0.85); }
        }
        s._cachedX = pX; s._cachedY = pY;
        var colHex = s.color + Math.floor(alpha * 220).toString(16).padStart(2, '0');

        if(warp > 0.04){
          // ══ HYPERDRIVE Z-3D (v8.34) — profundidad REAL con perspectiva ══
          // Cada estrella recibe una coordenada Z virtual (s._wz). Durante el
          // warp, Z decrece → la estrella VIENE HACIA TI. La posición en
          // pantalla se proyecta con perspectiva (factor = 1/z): al fondo se
          // ve pequeña y cerca del centro; al acercarse crece y escapa hacia
          // los bordes acelerando — el túnel 3D de verdad (como Three.js,
          // pero con una división por estrella). El trazo va de la posición
          // actual a la posición con el Z de hace un instante (cola de
          // perspectiva real, no un largo inventado).
          if(s._wz === undefined){
            // Entrar al túnel: repartir en profundidad [0.35 .. 2.8]
            s._wz = 0.35 + Math.random() * 2.45;
          }
          var _dzVel = (0.85 + (s.baseSize/1.9) * 0.5) * warp;   // cercanas algo más rápidas
          var _zPrev = s._wz;
          s._wz += (_warpDir > 0 ? -1 : 1) * _dzVel * dt * 2.2;   // sumergirse: z decrece
          // v8.41 — VÓRTICE ESPAGUETI (matemática de joseph-san): torsión
          // angular con decaimiento exponencial según el radio. El centro
          // gira violento, los bordes casi nada → las estrellas espiralan
          // hacia adentro mientras viajan en Z. exp(-r×3) adaptado a
          // nuestro rango (su exp(-r×7) era para UV 0..0.7).
          var _rN = Math.min(1, s.r / MAX_R);
          s.theta += _warpDir * Math.exp(-_rN * 3.0) * warp * 2.4 * dt;
          // Reciclaje del túnel: al pasar la cámara renace al fondo (y viceversa)
          if(s._wz < 0.18){ s._wz = 2.6 + Math.random()*0.5; _zPrev = s._wz; }
          if(s._wz > 3.1){ s._wz = 0.2 + Math.random()*0.2;  _zPrev = s._wz; }

          var _f  = 1 / s._wz;      // factor de perspectiva actual
          var _fp = 1 / _zPrev;     // factor de hace un instante (para la cola)
          // v8.41 — VÓRTICE ESPAGUETI (receta joseph-san): torsión angular
          // con decaimiento exponencial exp(-r×7) — el centro gira violento,
          // los bordes casi nada → las estelas se curvan en espiral hacia
          // adentro. La cabeza y la cola usan torsiones distintas (según su
          // Z), así el trazo mismo se curva: espagueti, no línea recta.
          var _rN = s.r / MAX_R;
          var _twBase = Math.exp(-_rN * 7.0) * warp * 2.4;
          var _angH = s.theta + _twBase / s._wz;      // cabeza: más torsión al acercarse
          var _angT = s.theta + _twBase / _zPrev;     // cola: torsión de hace un instante
          var _dirX = Math.cos(_angH), _dirY = Math.sin(_angH);
          var _dirXT = Math.cos(_angT), _dirYT = Math.sin(_angT);
          var _px1 = CX + _dirX * s.r * _f,  _py1 = CY + _dirY * s.r * _f;   // cabeza
          var _px2 = CX + _dirX * s.r * _fp, _py2 = CY + _dirY * s.r * _fp;  // cola
          // La cola mínima garantiza trazo visible incluso recién nacida.
          if(Math.abs(_px1-_px2) + Math.abs(_py1-_py2) < 2){ _px2 = _px1 - _dirX*2; _py2 = _py1 - _dirY*2; }

          // Alpha y grosor según cercanía: lejos tenue y fino, cerca brillante y grueso.
          var _cercania = Math.min(1, _f / 2.2);
          var alphaZ = alpha * (0.35 + _cercania * 0.85);
          if(alphaZ > 1) alphaZ = 1;
          pctx.strokeStyle = s.color + Math.floor(alphaZ * 235).toString(16).padStart(2, '0');
          pctx.lineWidth = Math.max(0.6, rad * _f * 0.8);
          pctx.lineCap = 'round';
          if((s.isHub || s.baseSize > 1.4) && _cercania > 0.5){
            pctx.shadowColor = s.color;
            pctx.shadowBlur = 6 + warp * 10;
          } else {
            pctx.shadowBlur = 0;
          }
          pctx.beginPath();
          pctx.moveTo(_px2, _py2);
          pctx.lineTo(_px1, _py1);
          pctx.stroke();
        } else {
          // Al salir del warp, limpiar la Z para el próximo salto.
          if(s._wz !== undefined) s._wz = undefined;
          // ── Estrella normal: punto (motor original, sin tocar) ──
          pctx.fillStyle = colHex;
          // v7.065 OPT — umbral baseSize subido de 1.4 a 1.55. Las
          // estrellas entre 1.4 y 1.55 tenían un glow muy débil que
          // apenas se notaba pero costaba ciclos (shadowBlur es la
          // operación más cara de canvas). Visualmente sin diferencia,
          // ~15-20% menos costo por frame en drawStars.
          if(s.isHub || s.baseSize > 1.55){
            pctx.shadowColor = s.color;
            pctx.shadowBlur = (s.isHub ? 8 : 4) + twinkle * (s.isHub ? 16 : 6);
          } else {
            pctx.shadowBlur = 0;
          }
          pctx.beginPath();
          pctx.arc(pX, pY, rad, 0, Math.PI * 2);
          pctx.fill();
        }
      }
      pctx.shadowBlur = 0;
    }

    function drawConstellations(dt){
      for(var c = constellations.length - 1; c >= 0; c--){
        var con = constellations[c];
        con.cTheta += con.omega * dt;
        con.age += dt;
        if(con.age >= con.lifespan){
          // Respawn
          con.cR = 200 + Math.random() * (MAX_R - 250);
          con.cTheta = Math.random() * Math.PI * 2;
          con.omega = angularVel(con.cR);
          con.age = 0;
          con.lifespan = 10 + Math.random() * 8;
          con.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        }
        var lifeFrac = con.age / con.lifespan;
        var lifeAlpha;
        if(lifeFrac < 0.20) lifeAlpha = lifeFrac / 0.20;  // v5.170: fade in más largo
        else if(lifeFrac > 0.75) lifeAlpha = (1 - lifeFrac) / 0.25;  // v5.170: fade out más largo
        else lifeAlpha = 1;
        if(lifeAlpha <= 0) continue;

        var centerPt = polar2cart(con.cR, con.cTheta);
        // Cachear posiciones de cada estrella del grupo
        var positions = con.points.map(function(p){
          p.phase += p.twinkleSpeed * dt;
          return polar2cart(con.cR + p.dR, con.cTheta + p.dTheta);
        });

        // Dibujar conexiones del grupo (líneas tenues)
        for(var k = 0; k < positions.length - 1; k++){
          var a = lifeAlpha * 0.40;
          pctx.strokeStyle = con.color + Math.floor(a * 255).toString(16).padStart(2, '0');
          pctx.lineWidth = 0.7;
          pctx.shadowColor = con.color;
          pctx.shadowBlur = 4;
          pctx.beginPath();
          pctx.moveTo(positions[k].x, positions[k].y);
          pctx.lineTo(positions[k+1].x, positions[k+1].y);
          pctx.stroke();
        }
        // Dibujar las estrellas del grupo (más brillantes que las orbitales)
        for(var k = 0; k < positions.length; k++){
          var pp = positions[k];
          var pt = con.points[k];
          var twk = (Math.sin(pt.phase) + 1) / 2;
          var rad = pt.baseSize * (0.8 + twk * 0.8);
          var a = lifeAlpha * (0.6 + twk * 0.4);
          pctx.fillStyle = con.color + Math.floor(a * 230).toString(16).padStart(2, '0');
          pctx.shadowColor = con.color;
          pctx.shadowBlur = 6 + twk * 10;
          pctx.beginPath();
          pctx.arc(pp.x, pp.y, rad, 0, Math.PI * 2);
          pctx.fill();
        }
        pctx.shadowBlur = 0;
      }
    }

    function drawSynapses(dt){
      for(var i = synapses.length - 1; i >= 0; i--){
        var syn = synapses[i];
        syn.age += dt;
        if(syn.age >= syn.lifespan){
          synapses.splice(i, 1);
          continue;
        }
        var frac = syn.age / syn.lifespan;
        var alpha;
        if(frac < 0.25) alpha = frac / 0.25;
        else if(frac > 0.65) alpha = (1 - frac) / 0.35;
        else alpha = 1;
        alpha *= 0.55;
        if(!syn.s1._cachedX || !syn.s2._cachedX) continue;
        var p1 = { x: syn.s1._cachedX, y: syn.s1._cachedY };
        var p2 = { x: syn.s2._cachedX, y: syn.s2._cachedY };
        var mx = (p1.x + p2.x) / 2;
        var my = (p1.y + p2.y) / 2;
        var dx = p2.x - p1.x, dy = p2.y - p1.y;
        var len = Math.hypot(dx, dy) || 1;
        var perpX = -dy / len, perpY = dx / len;
        var off = 18;
        syn._cp = { x: mx + perpX * off, y: my + perpY * off };
        syn._p1 = p1; syn._p2 = p2;
        pctx.strokeStyle = syn.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        pctx.lineWidth = 0.95;
        pctx.shadowColor = syn.color;
        pctx.shadowBlur = 5;
        pctx.beginPath();
        pctx.moveTo(p1.x, p1.y);
        pctx.quadraticCurveTo(syn._cp.x, syn._cp.y, p2.x, p2.y);
        pctx.stroke();
        pctx.shadowBlur = 0;
      }
    }

    function drawVortices(dt){
      for(var i = vortices.length - 1; i >= 0; i--){
        var v = vortices[i];
        v.age += dt;
        if(v.age >= v.lifespan){ vortices.splice(i, 1); continue; }
        v.theta += v.omega * dt;
        var p = polar2cart(v.r, v.theta);
        var frac = v.age / v.lifespan;
        // v5.170: fade in/out global del vórtice
        var globalAlpha;
        if(frac < 0.15) globalAlpha = frac / 0.15;
        else if(frac > 0.80) globalAlpha = (1 - frac) / 0.20;
        else globalAlpha = 1;
        for(var k = 0; k < 3; k++){
          var phaseFrac = (frac + k * 0.25) % 1;
          var radius = phaseFrac * v.maxRadius;
          var a = (1 - phaseFrac) * 0.40 * globalAlpha;
          if(a < 0.02) continue;
          pctx.strokeStyle = v.color + Math.floor(a * 255).toString(16).padStart(2, '0');
          pctx.lineWidth = 1.0;
          pctx.shadowColor = v.color;
          pctx.shadowBlur = 5 * globalAlpha;
          pctx.beginPath();
          pctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          pctx.stroke();
        }
        pctx.shadowBlur = 0;
      }
    }

    function drawLorenz(){
      lorenzTrails.forEach(function(traj){
        if(traj.history.length < 2) return;
        var lifeFrac = traj.age / traj.maxAge;
        var globalAlpha = 1;
        if(lifeFrac < 0.15) globalAlpha = lifeFrac / 0.15;
        else if(lifeFrac > 0.80) globalAlpha = (1 - lifeFrac) / 0.20;
        globalAlpha = Math.max(0, Math.min(1, globalAlpha));
        if(globalAlpha < 0.02) return;
        pctx.lineCap = 'round';
        for(var i = 1; i < traj.history.length; i++){
          var a = (i / traj.history.length) * 0.50 * globalAlpha;
          pctx.strokeStyle = traj.color + Math.floor(a * 200).toString(16).padStart(2, '0');
          pctx.lineWidth = 0.9 * (i / traj.history.length) + 0.3;
          pctx.beginPath();
          pctx.moveTo(traj.history[i-1].x, traj.history[i-1].y);
          pctx.lineTo(traj.history[i].x, traj.history[i].y);
          pctx.stroke();
        }
        var head = traj.history[traj.history.length - 1];
        pctx.fillStyle = traj.color;
        pctx.shadowColor = traj.color;
        pctx.shadowBlur = 8 * globalAlpha;
        pctx.beginPath();
        pctx.arc(head.x, head.y, 1.6 * globalAlpha, 0, Math.PI * 2);
        pctx.fill();
        pctx.shadowBlur = 0;
      });
    }

    function bezierPoint(a, cp, b, t){
      var u = 1 - t;
      return {
        x: u*u*a.x + 2*u*t*cp.x + t*t*b.x,
        y: u*u*a.y + 2*u*t*cp.y + t*t*b.y,
      };
    }

    function drawPulses(){
      for(var pi = pulses.length - 1; pi >= 0; pi--){
        var p = pulses[pi];
        var a, cp, b, color;
        if(p.type === 'ray'){
          var ray = p.ref;
          if(!ray._a) continue;
          a = ray._a; cp = ray._cp; b = ray._b; color = ray.color;
        } else {
          var syn = p.ref;
          if(!syn._p1 || syn.age >= syn.lifespan) {
            pulses.splice(pi, 1);
            continue;
          }
          a = syn._p1; cp = syn._cp; b = syn._p2; color = syn.color;
        }
        var t = p.forward ? p.t : (1 - p.t);
        var samples = [];
        var steps = 12;
        for(var i = 0; i <= steps; i++){
          var tt = t - (p.forward ? 1 : -1) * (i / steps) * p.tailT;
          if(tt < 0 || tt > 1) continue;
          samples.push({ pt: bezierPoint(a, cp, b, tt), alpha: 1 - i / steps });
        }
        if(samples.length < 2) continue;
        pctx.lineCap = 'round';
        for(var s = 1; s < samples.length; s++){
          var aa = samples[s].alpha * p.life * 0.95;
          pctx.strokeStyle = color + Math.floor(aa * 230).toString(16).padStart(2, '0');
          pctx.lineWidth = (p.type === 'ray' ? 2.0 : 1.7) * samples[s].alpha;
          pctx.beginPath();
          pctx.moveTo(samples[s-1].pt.x, samples[s-1].pt.y);
          pctx.lineTo(samples[s].pt.x, samples[s].pt.y);
          pctx.stroke();
        }
        var head = bezierPoint(a, cp, b, t);
        pctx.fillStyle = color;
        pctx.shadowColor = color;
        pctx.shadowBlur = p.type === 'ray' ? 14 : 10;
        pctx.beginPath();
        pctx.arc(head.x, head.y, p.type === 'ray' ? 2.6 : 2.0, 0, Math.PI * 2);
        pctx.fill();
        pctx.shadowBlur = 0;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.169: METEOROS (estrellas fugaces)
    //  v5.170: las trayectorias se extienden MÁS ALLÁ del viewport para
    //  que parezca que se pierden en el horizonte, no que mueren en el borde
    // ══════════════════════════════════════════════════════════════════
    function spawnMeteor(){
      // El meteoro parte de fuera del viewport y termina MÁS allá del lado opuesto
      var side = Math.floor(Math.random() * 4);
      var startX, startY, endX, endY;
      var OVERSHOOT = 250;  // v5.170: distancia más allá del viewport
      switch(side){
        case 0:
          startX = Math.random() * W;
          startY = -OVERSHOOT;
          endX = startX + (Math.random() - 0.5) * 600;
          endY = H + OVERSHOOT;
          break;
        case 1:
          startX = W + OVERSHOOT;
          startY = Math.random() * H;
          endX = -OVERSHOOT;
          endY = startY + (Math.random() - 0.5) * 600;
          break;
        case 2:
          startX = Math.random() * W;
          startY = H + OVERSHOOT;
          endX = startX + (Math.random() - 0.5) * 600;
          endY = -OVERSHOOT;
          break;
        case 3:
          startX = -OVERSHOOT;
          startY = Math.random() * H;
          endX = W + OVERSHOOT;
          endY = startY + (Math.random() - 0.5) * 600;
          break;
      }
      meteors.push({
        startX: startX, startY: startY,
        endX: endX, endY: endY,
        t: 0,
        speed: 0.45 + Math.random() * 0.35,    // v5.170: un poco más lentos para que se vean
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        trailLen: 120 + Math.random() * 100,
      });
    }

    function drawMeteors(dt){
      for(var i = meteors.length - 1; i >= 0; i--){
        var m = meteors[i];
        m.t += m.speed * dt;
        if(m.t >= 1){ meteors.splice(i, 1); continue; }
        // v5.170: fade in al inicio (primeros 0.10) y fade out al final (últimos 0.10)
        var lifeAlpha;
        if(m.t < 0.10) lifeAlpha = m.t / 0.10;
        else if(m.t > 0.90) lifeAlpha = (1 - m.t) / 0.10;
        else lifeAlpha = 1;
        if(lifeAlpha <= 0) continue;
        // Posición actual
        var hx = m.startX + (m.endX - m.startX) * m.t;
        var hy = m.startY + (m.endY - m.startY) * m.t;
        // Posición de la cola
        var totalDist = Math.hypot(m.endX - m.startX, m.endY - m.startY);
        var tailFrac = m.trailLen / totalDist;
        var tt = Math.max(0, m.t - tailFrac);
        var tx = m.startX + (m.endX - m.startX) * tt;
        var ty = m.startY + (m.endY - m.startY) * tt;
        // Gradiente lineal del rastro, modulado por lifeAlpha
        var grad = pctx.createLinearGradient(tx, ty, hx, hy);
        grad.addColorStop(0, m.color + '00');
        grad.addColorStop(1, m.color + Math.floor(0.93 * lifeAlpha * 255).toString(16).padStart(2, '0'));
        pctx.strokeStyle = grad;
        pctx.lineWidth = 1.6 * lifeAlpha;
        pctx.shadowColor = m.color;
        pctx.shadowBlur = 10 * lifeAlpha;
        pctx.beginPath();
        pctx.moveTo(tx, ty);
        pctx.lineTo(hx, hy);
        pctx.stroke();
        // Cabeza brillante
        pctx.fillStyle = m.color + Math.floor(lifeAlpha * 255).toString(16).padStart(2, '0');
        pctx.shadowBlur = 14 * lifeAlpha;
        pctx.beginPath();
        pctx.arc(hx, hy, 2.2 * lifeAlpha, 0, Math.PI * 2);
        pctx.fill();
        pctx.shadowBlur = 0;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.169: POLVO CÓSMICO (puntitos diminutos)
    // ══════════════════════════════════════════════════════════════════
    function buildDust(){
      dust = [];
      var n = Math.floor((W * H) / 4400);  // v7.065 OPT: vuelta a densidad pre-v5.180. Cuesta ~40% menos en frame, visualmente casi idéntico (220→130 partículas en 1920x1080).
      for(var i = 0; i < n; i++){
        // Polvo en coordenadas polares (también orbita lentamente)
        var r = 40 + Math.random() * (MAX_R - 40);
        var theta = Math.random() * Math.PI * 2;
        dust.push({
          r: r,
          theta: theta,
          omega: angularVel(r) * 0.7,   // un poco más lento
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.5 + Math.random() * 1.5,
          baseSize: 0.15 + Math.random() * 0.45,
          color: Math.random() < 0.7 ? '#FFFFFF' : PALETTE[Math.floor(Math.random() * PALETTE.length)],
        });
      }
    }

    function drawDust(dt){
      for(var i = 0; i < dust.length; i++){
        var d = dust[i];
        d.theta += d.omega * dt;
        d.phase += d.twinkleSpeed * dt;
        var twk = (Math.sin(d.phase) + 1) / 2;
        var alpha = 0.18 + twk * 0.30;
        // v7.067 OPT — polar2cart inlinado (130 partículas × 30fps =
        // 3900 obj/seg menos al GC)
        var dX = CX + Math.cos(d.theta) * d.r;
        var dY = CY + Math.sin(d.theta) * d.r;
        // Modular por nebulosa
        var neb = nebulaIntensityAt(dX, dY);
        alpha *= neb;
        pctx.fillStyle = d.color + Math.floor(alpha * 200).toString(16).padStart(2, '0');
        pctx.beginPath();
        pctx.arc(dX, dY, d.baseSize * (0.7 + twk * 0.5), 0, Math.PI * 2);
        pctx.fill();
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.169: ANILLOS ORBITALES (sugieren las órbitas, muy sutiles)
    // ══════════════════════════════════════════════════════════════════
    // ══════════════════════════════════════════════════════════════════
    //  v5.172: ANILLOS CONCÉNTRICOS tipo HALO / DYSON / STARGATE
    //  Estructuras arquitectónicas, no apenas-visible-dash:
    //  • Anillo principal sólido con glow
    //  • Anillo paralelo dual (estilo Halo)
    //  • Segmentos brillantes ("ventanas") que rotan
    //  • Tick marks geométricos (estilo Stargate, sin glifos)
    // ══════════════════════════════════════════════════════════════════
    function buildOrbitRings(){
      orbitRings = [];
      // 8 anillos a radios graduados — densidad uniforme desde dial hasta horizonte
      var minR = DIAL_R + 80;
      var maxR_local = Math.min(MAX_R - 40, Math.hypot(W/2, H/2) + 20);
      var nRings = 8;
      for(var i = 0; i < nRings; i++){
        var t = i / (nRings - 1);
        var r = minR + (maxR_local - minR) * t;
        if(r >= MAX_R - 10) break;
        // Determinar tipo: alternar para variedad
        var style;
        if(i === 0 || i === 3 || i === 6) style = 'halo';        // anillo doble
        else if(i === 1 || i === 5) style = 'segmented';         // con ventanas rotantes
        else if(i === 2 || i === 7) style = 'stargate';          // con tick marks
        else style = 'solid';                                     // anillo simple
        orbitRings.push({
          r: r,
          phase: i * Math.PI / 4,
          phaseSpeed: 0.12 + i * 0.03,
          color: PALETTE[i % PALETTE.length],
          style: style,
          // Rotación propia para los anillos con elementos rotatorios
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.04 + (i % 3) * 0.02),
          // Número de segmentos/ticks (8-16 según tamaño)
          nSegments: 8 + (i % 5) * 2,
        });
      }
    }

    function drawOrbitRings(dt){
      orbitRings.forEach(function(ring){
        ring.phase += ring.phaseSpeed * dt;
        ring.rotation += ring.rotSpeed * dt;
        var pulse = (Math.sin(ring.phase) + 1) / 2;
        // Alpha base más alto (eran demasiado sutiles)
        var alpha = 0.12 + pulse * 0.16;
        if(alpha < 0.04) return;

        var col = ring.color;
        var alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');

        // --- ANILLO PRINCIPAL (todos los estilos lo tienen) ---
        pctx.strokeStyle = col + alphaHex;
        pctx.lineWidth = 1.0;
        pctx.shadowColor = col;
        pctx.shadowBlur = 4 + pulse * 4;
        pctx.beginPath();
        pctx.arc(CX, CY, ring.r, 0, Math.PI * 2);
        pctx.stroke();

        if(ring.style === 'halo'){
          // Anillo paralelo dual (interior y exterior, 4-6px de separación)
          var separation = 5;
          var outerAlpha = Math.floor(alpha * 0.7 * 255).toString(16).padStart(2, '0');
          pctx.strokeStyle = col + outerAlpha;
          pctx.lineWidth = 0.6;
          pctx.beginPath();
          pctx.arc(CX, CY, ring.r + separation, 0, Math.PI * 2);
          pctx.stroke();
          pctx.beginPath();
          pctx.arc(CX, CY, ring.r - separation, 0, Math.PI * 2);
          pctx.stroke();
        } else if(ring.style === 'segmented'){
          // "Ventanas" brillantes rotando sobre el anillo
          pctx.shadowBlur = 8 + pulse * 6;
          var segArc = (Math.PI * 2) / ring.nSegments;
          var segLen = segArc * 0.35;  // 35% de cada segmento es brillante
          for(var s = 0; s < ring.nSegments; s++){
            var a0 = ring.rotation + s * segArc;
            var a1 = a0 + segLen;
            // Solo cada 2 segmentos para no saturar
            if(s % 2 !== 0) continue;
            var segAlpha = alpha * (1.4 + pulse * 0.6);
            segAlpha = Math.min(0.85, segAlpha);
            pctx.strokeStyle = col + Math.floor(segAlpha * 255).toString(16).padStart(2, '0');
            pctx.lineWidth = 2.0;
            pctx.beginPath();
            pctx.arc(CX, CY, ring.r, a0, a1);
            pctx.stroke();
          }
        } else if(ring.style === 'stargate'){
          // Tick marks geométricos perpendiculares al anillo
          pctx.shadowBlur = 6;
          var tickLen = 7;
          var tickAlpha = Math.floor(alpha * 1.3 * 255).toString(16).padStart(2, '0');
          pctx.strokeStyle = col + tickAlpha;
          pctx.lineWidth = 1.2;
          for(var t2 = 0; t2 < ring.nSegments; t2++){
            var ang = ring.rotation + (t2 / ring.nSegments) * Math.PI * 2;
            var innerR = ring.r - tickLen / 2;
            var outerR = ring.r + tickLen / 2;
            var ix = CX + Math.cos(ang) * innerR;
            var iy = CY + Math.sin(ang) * innerR;
            var ox = CX + Math.cos(ang) * outerR;
            var oy = CY + Math.sin(ang) * outerR;
            pctx.beginPath();
            pctx.moveTo(ix, iy);
            pctx.lineTo(ox, oy);
            pctx.stroke();
          }
          // Puntos luminosos cada 4 ticks (nodos brillantes estilo stargate)
          pctx.fillStyle = col;
          pctx.shadowBlur = 10;
          for(var t3 = 0; t3 < ring.nSegments; t3 += 4){
            var ang2 = ring.rotation + (t3 / ring.nSegments) * Math.PI * 2;
            var px = CX + Math.cos(ang2) * ring.r;
            var py = CY + Math.sin(ang2) * ring.r;
            pctx.beginPath();
            pctx.arc(px, py, 1.8 + pulse * 0.7, 0, Math.PI * 2);
            pctx.fill();
          }
        }

        pctx.shadowBlur = 0;
      });
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.171: RED INTERESTELAR (sinapsis que NO pasa por el centro)
    //  Conexiones efímeras entre estrellas cercanas que descartan
    //  cualquier traza cuyo midpoint quede dentro del radio del dial.
    //  Se distingue de las "synapses" en que tienen vida más larga
    //  y forman cadenas de varias estrellas (no solo 2).
    // ══════════════════════════════════════════════════════════════════
    function spawnInterMesh(){
      if(stars.length < 3) return;
      // Punto de partida: una estrella activa con posición cacheada
      var attempts = 0;
      var start = null;
      while(attempts < 8 && !start){
        var cand = stars[Math.floor(Math.random() * stars.length)];
        if(cand._cachedX) start = cand;
        attempts++;
      }
      if(!start) return;

      // Construir cadena de 3-5 nodos: cada uno conectado al siguiente más cercano
      var chain = [start];
      var current = start;
      var nLinks = 2 + Math.floor(Math.random() * 3); // 2-4 enlaces (3-5 nodos)
      var used = { };
      used[stars.indexOf(start)] = true;

      for(var step = 0; step < nLinks; step++){
        // Buscar vecino cercano que NO pase por el centro
        var nextNode = null, bestD = Infinity;
        for(var k = 0; k < stars.length; k++){
          if(used[k]) continue;
          var cand2 = stars[k];
          if(!cand2._cachedX) continue;
          var d = Math.hypot(current._cachedX - cand2._cachedX, current._cachedY - cand2._cachedY);
          if(d > 300 || d < 60) continue;
          // Midpoint de la línea
          var mx = (current._cachedX + cand2._cachedX) / 2;
          var my = (current._cachedY + cand2._cachedY) / 2;
          // Descartar si pasa cerca del dial
          if(Math.hypot(mx - CX, my - CY) < DIAL_R + 80) continue;
          if(d < bestD){ bestD = d; nextNode = cand2; }
        }
        if(!nextNode) break;
        chain.push(nextNode);
        used[stars.indexOf(nextNode)] = true;
        current = nextNode;
      }
      if(chain.length < 2) return;

      interMesh.push({
        chain: chain,
        age: 0,
        lifespan: 3.5 + Math.random() * 3.0,  // vive 3.5-6.5s
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      });
    }

    function drawInterMesh(dt){
      for(var i = interMesh.length - 1; i >= 0; i--){
        var im = interMesh[i];
        im.age += dt;
        if(im.age >= im.lifespan){ interMesh.splice(i, 1); continue; }
        var frac = im.age / im.lifespan;
        var alpha;
        if(frac < 0.20) alpha = frac / 0.20;
        else if(frac > 0.70) alpha = (1 - frac) / 0.30;
        else alpha = 1;
        alpha *= 0.55;
        // Verificar que todas las estrellas de la cadena siguen activas
        var allActive = true;
        for(var k = 0; k < im.chain.length; k++){
          if(!im.chain[k]._cachedX){ allActive = false; break; }
        }
        if(!allActive){ interMesh.splice(i, 1); continue; }

        // Dibujar la cadena: segmentos consecutivos con leve curva
        pctx.lineCap = 'round';
        for(var k = 0; k < im.chain.length - 1; k++){
          var s1 = im.chain[k], s2 = im.chain[k + 1];
          var mx = (s1._cachedX + s2._cachedX) / 2;
          var my = (s1._cachedY + s2._cachedY) / 2;
          var dx = s2._cachedX - s1._cachedX, dy = s2._cachedY - s1._cachedY;
          var len = Math.hypot(dx, dy) || 1;
          var perpX = -dy / len, perpY = dx / len;
          var off = (k % 2 === 0 ? 1 : -1) * 14;
          var cpx = mx + perpX * off;
          var cpy = my + perpY * off;
          pctx.strokeStyle = im.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
          pctx.lineWidth = 0.85;
          pctx.shadowColor = im.color;
          pctx.shadowBlur = 4;
          pctx.beginPath();
          pctx.moveTo(s1._cachedX, s1._cachedY);
          pctx.quadraticCurveTo(cpx, cpy, s2._cachedX, s2._cachedY);
          pctx.stroke();
        }
        pctx.shadowBlur = 0;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.171: MANDALAS / CROP CIRCLES
    //  Geometría con simetría rotacional en zonas alejadas del centro
    //  Aparecen, giran, se desvanecen. NUNCA en el centro.
    // ══════════════════════════════════════════════════════════════════
    function spawnMandala(){
      // Posición en una de las zonas alejadas del dial
      var attempt = 0;
      var px, py;
      while(attempt < 15){
        // Punto random en el viewport
        px = 100 + Math.random() * (W - 200);
        py = 100 + Math.random() * (H - 200);
        // Debe estar lejos del dial
        if(Math.hypot(px - CX, py - CY) > DIAL_R + 200) break;
        attempt++;
      }
      if(attempt >= 15) return;

      var radius = 35 + Math.random() * 50;
      // Verificar que el mandala completo cabe en el viewport
      if(px - radius < 20 || px + radius > W - 20) return;
      if(py - radius < 20 || py + radius > H - 20) return;

      var nPoints = 6 + Math.floor(Math.random() * 5); // 6-10 puntos (simetría rotacional)
      var pattern = Math.floor(Math.random() * 3);     // 0=flor, 1=estrella, 2=anillos

      mandalas.push({
        x: px, y: py,
        radius: radius,
        nPoints: nPoints,
        pattern: pattern,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() < 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.25),
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        age: 0,
        lifespan: 6 + Math.random() * 4,
      });
    }

    function drawMandalas(dt){
      for(var i = mandalas.length - 1; i >= 0; i--){
        var m = mandalas[i];
        m.age += dt;
        if(m.age >= m.lifespan){ mandalas.splice(i, 1); continue; }
        m.rotation += m.rotSpeed * dt;
        var frac = m.age / m.lifespan;
        var alpha;
        if(frac < 0.20) alpha = frac / 0.20;
        else if(frac > 0.75) alpha = (1 - frac) / 0.25;
        else alpha = 1;
        alpha *= 0.42;

        var col = m.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        pctx.strokeStyle = col;
        pctx.fillStyle = col;
        pctx.shadowColor = m.color;
        pctx.shadowBlur = 6;
        pctx.lineWidth = 0.8;

        if(m.pattern === 0){
          // Patrón flor: círculos pequeños distribuidos angularmente
          // + un círculo central
          pctx.beginPath();
          pctx.arc(m.x, m.y, m.radius * 0.35, 0, Math.PI * 2);
          pctx.stroke();
          for(var k = 0; k < m.nPoints; k++){
            var ang = m.rotation + (k / m.nPoints) * Math.PI * 2;
            var cx = m.x + Math.cos(ang) * m.radius * 0.6;
            var cy = m.y + Math.sin(ang) * m.radius * 0.6;
            pctx.beginPath();
            pctx.arc(cx, cy, m.radius * 0.25, 0, Math.PI * 2);
            pctx.stroke();
          }
        } else if(m.pattern === 1){
          // Patrón estrella: líneas radiales con punto en cada extremo
          for(var k = 0; k < m.nPoints; k++){
            var ang = m.rotation + (k / m.nPoints) * Math.PI * 2;
            var ex = m.x + Math.cos(ang) * m.radius;
            var ey = m.y + Math.sin(ang) * m.radius;
            pctx.beginPath();
            pctx.moveTo(m.x, m.y);
            pctx.lineTo(ex, ey);
            pctx.stroke();
            // Punto en la punta
            pctx.beginPath();
            pctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
            pctx.fill();
          }
          // Líneas entre puntos alternos (estrella interna)
          if(m.nPoints >= 6){
            pctx.beginPath();
            for(var k = 0; k < m.nPoints; k++){
              var ang = m.rotation + (k / m.nPoints) * Math.PI * 2;
              var nextAng = m.rotation + ((k + 2) % m.nPoints / m.nPoints) * Math.PI * 2;
              var ax = m.x + Math.cos(ang) * m.radius;
              var ay = m.y + Math.sin(ang) * m.radius;
              var bx = m.x + Math.cos(nextAng) * m.radius;
              var by = m.y + Math.sin(nextAng) * m.radius;
              pctx.moveTo(ax, ay);
              pctx.lineTo(bx, by);
            }
            pctx.stroke();
          }
        } else {
          // Patrón anillos concéntricos con puntos en ellos
          for(var ring = 1; ring <= 3; ring++){
            var rr = m.radius * (ring / 3);
            pctx.beginPath();
            pctx.arc(m.x, m.y, rr, 0, Math.PI * 2);
            pctx.stroke();
            // Puntos sobre el anillo
            for(var k = 0; k < m.nPoints; k++){
              var ang = m.rotation * (ring % 2 === 0 ? 1 : -1) + (k / m.nPoints) * Math.PI * 2;
              var px2 = m.x + Math.cos(ang) * rr;
              var py2 = m.y + Math.sin(ang) * rr;
              pctx.beginPath();
              pctx.arc(px2, py2, 1.2, 0, Math.PI * 2);
              pctx.fill();
            }
          }
        }
        pctx.shadowBlur = 0;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  FRAME PRINCIPAL
    // ══════════════════════════════════════════════════════════════════
    // v5.214 — cap de FPS. El loop corría a 60fps; para un fondo
    // decorativo, ~40fps se ve igual de fluido y es 1/3 menos de trabajo.
    // dt se acumula igual, así que la animación va a la misma velocidad
    // real — solo se dibujan menos frames.
    // v7.066 — cap bajado de 40 a 30 fps. Para un fondo decorativo,
    // 30fps es perfectamente fluido (el cine es 24fps). Bajar de 40 a
    // 30 es 25% menos frames pintados. Visualmente indetectable.
    var _minFrameMs = 1000 / 30;
    // v7.073 — cachés para abaratar cada frame:
    var _haloRectT = 0, _haloRects = [];   // rects de cards (refresh máx. c/400ms)
    var _vigCache  = null;                 // gradientes de viñeta (uno por tamaño)
    function frame(t){
      var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016;
      // v5.214: si la pestaña está oculta, no dibujar — solo reprogramar.
      if(document.hidden){
        lastT = t;
        animId = requestAnimationFrame(frame);
        return;
      }
      // v7.066 — Pausa adicional cuando la ventana NO tiene foco (la PWA
      // perdió foco aunque siga "visible" para el navegador). Esto evita
      // que LifeOS siga consumiendo CPU cuando estás usando YouTube u
      // otra app encima. document.hasFocus() es más estricto que
      // document.hidden: hidden solo se activa con minimizado/pestaña
      // oculta, hasFocus se activa también cuando la ventana sigue
      // visible pero no es la activa.
      if(!document.hasFocus()){
        lastT = t;
        animId = requestAnimationFrame(frame);
        return;
      }
      // v7.065 OPT — En Nivel 2 una sección a pantalla completa (Activity,
      // Logros, etc.) tapa totalmente el cosmos. Seguir pintando 580
      // estrellas/frame que nadie ve es desperdicio. Pausamos hasta
      // que el usuario regrese a Nivel 0 o 1. Cuando regrese, el frame
      // se reanuda y todo sigue en su sitio porque dt se sigue calculando.
      if(document.documentElement.classList.contains('niv-2')){
        lastT = t;
        animId = requestAnimationFrame(frame);
        return;
      }
      // Si no ha pasado el intervalo mínimo, saltar este frame.
      if(lastT && (t - lastT) < _minFrameMs){
        animId = requestAnimationFrame(frame);
        return;
      }
      lastT = t;
      if(!pctx){ animId = requestAnimationFrame(frame); return; }
      pctx.clearRect(0, 0, W, H);
      globalT += dt;
      galaxyRotation += 0.01 * dt;

      // v8.19 — CÁMARA: el valor actual persigue suave al target (mouse/giro).
      // v8.26 — REACTIVADO (el bug 0x0 no era esto). Frame-rate independiente.
      var _lerpF = 1 - Math.pow(1 - _CAM_LERP, dt * 60);
      _camX += (_camTX - _camX) * _lerpF;
      _camY += (_camTY - _camY) * _lerpF;
      var _camPxX = _camX * _CAM_AMP;   // desplazamiento base en px
      var _camPxY = _camY * _CAM_AMP;
      _camGX = _camPxX; _camGY = _camPxY;   // v8.38: compartir con drawStars

      // v8.36 — FASE C · CONTRA-MOVIMIENTO DIEGÉTICO (firma Metroid Prime).
      // El cosmos se mueve CON la cámara (parallax); el contenido holográfico
      // de las cards flota sutilmente EN CONTRA + un tilt 3D mínimo → tres
      // planos de profundidad: cosmos (lejos) / marcos (medio) / hologramas
      // (cerca). Solo transform = composite en GPU, cero layout. Los MARCOS
      // (.hud-pnl) y el dial canvas NO se tocan: el motor de layout los mide
      // y un transform contaminaría esas mediciones (lección aprendida).
      _ctrMov();

      // v8.44 — COUNT-UP al expandir: si cambió la card expandida, animar
      // sus números (.num) tras un respiro (los datos renderizan async).
      // Costo: UNA comparación por frame.
      if(window._hudExpanded !== _cuLast){
        _cuLast = window._hudExpanded;
        if(_cuLast && window.RawAnim && window.RawAnim.countUpEn){
          (function(card){
            setTimeout(function(){
              if(window._hudExpanded === card){
                var cont = card.querySelector('.hud-expanded-content');
                if(cont) window.RawAnim.countUpEn(cont);
              }
            }, 420);
          })(_cuLast);
        }
      }

      // v7.031 — FASE 4A: decaer la energía del warp. Dura ~1.5s en
      // apagarse (subido desde 0.9s) — el destello se siente más.
      if(_warpEnergia > 0){
        _warpEnergia -= dt / 1.6;
        if(_warpEnergia < 0) _warpEnergia = 0;
      }
      // v8.41 — avanzar las ondas expansivas (solo si hay vivas).
      if(_ondas.length) _ondasTick(dt);

      // 1) Actualizar nebulosa (modulador de estrellas — sin cambios)
      updateNebula(dt);

      // v8.19 — PARALLAX POR CAPAS: cada grupo se desplaza por la cámara
      // según su profundidad. Lejos (nebulosa) se mueve poco; cerca
      // (estrellas/hubs) se mueve más. Usamos translate del canvas (save/
      // restore) para NO tocar ningún cálculo de coordenadas existente.
      // Capa LEJANA (nebulosa + polvo): parallax suave 0.35.
      pctx.save();
      pctx.translate(_camPxX * 0.35, _camPxY * 0.35);

      // 1b) v5.201: NEBULOSA VISIBLE — capa offscreen al fondo de todo.
      // (v7.067 intentó pintar cada 2 frames para ahorrar costo, pero
      // como el canvas se limpia cada frame, esto causaba parpadeo
      // estroboscópico a 15Hz. Revertido a pintar siempre.)
      _frameCounter++;
      drawNebulaLayer(dt);

      // 2) Polvo cósmico (capa más al fondo)
      drawDust(dt);
      pctx.restore();

      // Capa MEDIA/CERCANA (resto: estrellas, constelaciones, etc.):
      // parallax más marcado 0.85 → sensación de profundidad real.
      pctx.save();
      pctx.translate(_camPxX * 0.85, _camPxY * 0.85);

      // 3) Anillos orbitales sutiles
      // v5.187: drawOrbitRings desactivado (aros mecánicos poco orgánicos)

      // 3b) v5.181: Efecto warp / agujero negro (centro)
      // v5.201: warp muy suavizado — ver drawWarp (ciclo casi imperceptible).
      drawWarp(dt);

      // 4) Espirales áureas (fondo)
      drawSpirals(dt);

      // 4b) v5.201: ANILLOS CONCÉNTRICOS del dial (estructura tipo Dyson)
      drawDialRings(dt);

      // 5) Rayos del centro (giran)
      drawRays(dt);

      // 6) v5.179: Lorenz e interMesh eliminados (aparecían/desaparecían sin propósito)
      // updateLorenz(dt);
      // drawLorenz();

      // 7) Vórtices
      // v7.065 OPT — Comentado: array vortices siempre vacío (nadie llama
      // spawnVortex). drawVortices(dt) gastaba ciclo cada frame en
      // forEach sobre array de longitud 0. El código de la función
      // queda preservado para una eventual reactivación futura con
      // propósito (ej: aparecer al expandir cards).
      // drawVortices(dt);

      // 8) Sinapsis
      // v7.065 OPT — Comentado: array synapses siempre vacío (nadie llama
      // spawnSynapse). Mismo motivo que vórtices. Función preservada
      // para futuro despertar con propósito (ej: aparecer al guardar
      // un pensamiento o conectar una nota).
      // drawSynapses(dt);

      // 8b) v5.179: red interestelar también eliminada
      // drawInterMesh(dt);

      // 8c) v5.171: Mandalas eliminados en v5.172 (distraían)
      // drawMandalas(dt);

      // 9) Constelaciones
      drawConstellations(dt);

      // 10) Estrellas
      drawStars(dt);
      _motasDibujar(dt);
      if(_ondas.length) _ondasDibujar();

      // 10b) v5.201: HALOS LEJANOS (objetos cósmicos con aro)
      drawFarHalos(dt);

      // 11) Meteoros (encima de las estrellas, dramáticos)
      drawMeteors(dt);

      // 12) Pulsos (encima de todo)
      for(var pi = pulses.length - 1; pi >= 0; pi--){
        var p = pulses[pi];
        p.t += p.speed * dt;
        if(p.t > 1 + p.tailT){ pulses.splice(pi, 1); continue; }
        if(p.t > 1) p.life = Math.max(0, 1 - (p.t - 1) / p.tailT);
      }
      // v5.171: HALOS DE INTERACCIÓN — cada card visible emite un halo
      // tenue al canvas. Las partículas/estrellas que pasan cerca quedan
      // "iluminadas" porque el halo se acumula con el additive blending.
      try {
        if(window._hudPanels){
          // v7.073 — getBoundingClientRect fuerza un reflow del DOM. Leerlo
          // por card y por frame eran ~420 reflows/seg (14 cards × 30fps).
          // Ahora los rects se refrescan máx. cada 400ms: los halos son
          // tenues (alpha ≤0.08) y las cards casi siempre están quietas,
          // así que es visualmente idéntico.
          var _hNow = performance.now();
          if(_hNow - _haloRectT > 400){
            _haloRectT = _hNow;
            _haloRects.length = 0;
            for(var hr = 0; hr < window._hudPanels.length; hr++){
              var cEl = window._hudPanels[hr].el;
              if(!cEl || !cEl.offsetParent){ _haloRects.push(null); continue; }
              var rb = cEl.getBoundingClientRect();
              var hu = cEl.style.getPropertyValue('--ac') || '#A78BFA';
              if(hu.charAt(0) !== '#') hu = '#A78BFA';
              _haloRects.push({ l: rb.left, t: rb.top, r: rb.right, b: rb.bottom, w: rb.width, h: rb.height, hue: hu });
            }
          }
          pctx.save();
          pctx.globalCompositeOperation = 'lighter';
          for(var hp = 0; hp < _haloRects.length; hp++){
            var rect = _haloRects[hp];
            if(!rect) continue;
            if(rect.w < 10 || rect.h < 10) continue;
            // Solo cards visibles
            if(rect.b < 0 || rect.t > H) continue;
            if(rect.r < 0 || rect.l > W) continue;
            var cx = rect.l + rect.w / 2;
            var cy = rect.t + rect.h / 2;
            var radius = Math.max(rect.w, rect.h) * 0.7;
            var hue = rect.hue;
            // Glow modulado por el tiempo global (pulsa lento)
            var glowPulse = 0.55 + 0.45 * Math.sin(globalT * 0.7 + hp * 0.5);
            var alpha = 0.04 + glowPulse * 0.04;
            var halo = pctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            halo.addColorStop(0, hue + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
            halo.addColorStop(0.6, hue + '08');
            halo.addColorStop(1, hue + '00');
            pctx.fillStyle = halo;
            pctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
          }
          pctx.restore();
        }
      } catch(e){}

      drawPulses();

      // v8.19 — cerrar el parallax de la capa cercana. La viñeta (abajo) es
      // el marco fijo del viewport: NO debe moverse con la cámara.
      pctx.restore();

      // v5.171: Vignette suave en los bordes — todo se desvanece al
      // acercarse a los límites del viewport, así nada termina "cortado"
      // v7.073 — los 4 gradientes de la viñeta solo dependen de W/H: se
      // crean UNA vez por tamaño (antes se creaban 5 gradientes nuevos por
      // frame, incluido uno muerto que nunca se usaba). Visual idéntico.
      var vignetteMargin = 80;
      if(!_vigCache || _vigCache.W !== W || _vigCache.H !== H){
        var vTop = pctx.createLinearGradient(0, 0, 0, vignetteMargin);
        vTop.addColorStop(0, 'rgba(0,0,0,1)'); vTop.addColorStop(1, 'rgba(0,0,0,0)');
        var vBot = pctx.createLinearGradient(0, H - vignetteMargin, 0, H);
        vBot.addColorStop(0, 'rgba(0,0,0,0)'); vBot.addColorStop(1, 'rgba(0,0,0,1)');
        var vLeft = pctx.createLinearGradient(0, 0, vignetteMargin, 0);
        vLeft.addColorStop(0, 'rgba(0,0,0,1)'); vLeft.addColorStop(1, 'rgba(0,0,0,0)');
        var vRight = pctx.createLinearGradient(W - vignetteMargin, 0, W, 0);
        vRight.addColorStop(0, 'rgba(0,0,0,0)'); vRight.addColorStop(1, 'rgba(0,0,0,1)');
        _vigCache = { W: W, H: H, top: vTop, bot: vBot, left: vLeft, right: vRight };
      }
      pctx.save();
      pctx.globalCompositeOperation = 'destination-out';
      pctx.fillStyle = _vigCache.top;   pctx.fillRect(0, 0, W, vignetteMargin);
      pctx.fillStyle = _vigCache.bot;   pctx.fillRect(0, H - vignetteMargin, W, vignetteMargin);
      pctx.fillStyle = _vigCache.left;  pctx.fillRect(0, 0, vignetteMargin, H);
      pctx.fillStyle = _vigCache.right; pctx.fillRect(W - vignetteMargin, 0, vignetteMargin, H);
      pctx.restore();

      // Spawns periódicos
      // v5.179: sinapsis desactivadas (líneas entre estrellas que parecían no tener origen)
      if(pulses.length < 10 && Math.random() < 0.09) spawnPulse();
      // v5.179: vórtices desactivados (ondas concéntricas que aparecían en puntos sin contexto)
      // v5.177: Lorenz desactivado (trazos caóticos sin propósito visible)
      if(meteors.length < 3 && Math.random() < 0.015) spawnMeteor();
      // v5.171: Red interestelar y mandalas
      // v5.177: interMesh desactivado (cadenas confusas sin destino claro)
      // v5.172: mandalas desactivados (aparecían/desaparecían y distraían)
      // if(mandalas.length < 3 && Math.random() < 0.008) spawnMandala();

      animId = requestAnimationFrame(frame);
    }

    // v5.217 — detección de dispositivo modesto. Si el equipo tiene
    // pocos núcleos, se baja densidad de partículas para que vaya fluido
    // en celulares de gama media. Una PC potente nunca entra aquí.
    var _lowEndDevice = (function(){
      try {
        var cores = navigator.hardwareConcurrency || 8;
        var mem   = navigator.deviceMemory || 8;
        return cores <= 4 || mem <= 4;
      } catch(e){ return false; }
    })();
    window._ovLowEnd = _lowEndDevice;

    // v5.217 — CONSTRUCCIÓN DIFERIDA. Antes start() corría los 10
    // build*() síncronos antes del primer frame → el overlay se atascaba
    // unos segundos al abrir. Ahora arranca YA con lo esencial (estrellas
    // + dial) y construye el resto repartido en los siguientes frames.
    // Las funciones draw*() ya comprueban si su array está vacío, así que
    // una capa aún no construida simplemente no se dibuja todavía.
    function start(){
      // ════════════════════════════════════════════════════════════════
      // v7.061 — En móvil v6.032 apagaba el motor entero porque "fundía
      // los teléfonos". Pero esa decisión se tomó cuando además se
      // montaban las 14 cards HUD pesadas. v7.060 las eliminó. Ahora
      // probamos el motor encendido en móvil PERO en modo bajo: forzamos
      // _lowEndDevice = true (55% estrellas, sin shadowBlur en chicas,
      // menos constelaciones, menos partículas warp). El frame ya se
      // pausa con document.hidden (v5.214), así que ahorra batería al
      // bloquear el iPhone. Si el teléfono se traba o se calienta,
      // revertir esta versión a la guard original de v6.032.
      if(window.innerWidth < 900){
        _lowEndDevice = true;
        window._ovLowEnd = true;
      }

      resize();
      // v7.078 — EL CANVAS DEL COSMOS SE MUDA A <body> (z:0).
      // Vivía DENTRO de #dial-overlay; al entrar a una sección,
      // _osMostrar llama cerrarDial() que esconde el overlay completo
      // — y con él, el fondo cósmico. El CSS html.niv-2 #dial-particles
      // {blur(12px)} prueba que el diseño siempre quiso el cosmos
      // visible en TODOS los niveles. En body z:0 (canvas z:0, dial
      // z:5 — el lenguaje original), ningún show/hide del overlay
      // vuelve a matarlo. El blur por nivel aplica por id, intacto.
      try {
        if(_particlesCanvas.parentNode !== document.body){
          _particlesCanvas.style.position = 'fixed';
          _particlesCanvas.style.inset = '0';
          _particlesCanvas.style.zIndex = '0';
          _particlesCanvas.style.pointerEvents = 'none';
          document.body.insertBefore(_particlesCanvas, document.body.firstChild);
          var _ovBg = document.getElementById('dial-overlay');
          if(_ovBg) _ovBg.style.background = 'transparent';
        }
      } catch(e){}
      // ── Esencial: se construye YA (barato, y es lo que más se nota) ──
      buildStars();
      buildDialRings();
      // ── Listas vacías ──
      synapses = []; pulses = []; vortices = [];
      lorenzTrails = []; meteors = [];
      interMesh = []; mandalas = [];
      farHalos = []; constellations = []; spirals = [];
      dust = []; rays = []; warpParticles = [];
      _nebCanvas = null;
      globalT = 0;
      galaxyRotation = 0;
      lastT = 0;

      // ── Arrancar la animación INMEDIATAMENTE ──
      if(animId) cancelAnimationFrame(animId);
      animId = requestAnimationFrame(frame);
      // v6.000: bandera global — el fondo cósmico ahora se construye y
      // anima UNA sola vez en toda la vida de la app. abrirDial consulta
      // esta bandera para no re-arrancar (ni reconstruir) la animación.
      window._particlesRunning = true;

      // v7.074 — AUTO-RECUPERACIÓN DE LA NEBULOSA.
      // _nebCanvas es un offscreen pintado UNA vez. Si Chrome desaloja
      // la memoria gráfica (ventana tapada — p.ej. Task Manager con
      // Shift+Esc — o suspensión), queda EN BLANCO para siempre y el
      // fondo "se pierde" hasta recargar. Al recuperar foco se muestrean
      // 9 puntos de alpha: si TODOS son 0, la nebulosa fue desalojada y
      // se reconstruye (~10-30ms, una vez). Si no, no se toca — así el
      // patrón aleatorio no cambia en cada alt-tab.
      function _nebulaEnBlanco(){
        if(!_nebCanvas) return false;   // aún no construida: la cascada la hará
        try {
          var nc2 = _nebCanvas.getContext('2d');
          var nw = _nebCanvas.width, nh = _nebCanvas.height;
          for(var gy = 1; gy <= 3; gy++){
            for(var gx = 1; gx <= 3; gx++){
              var d = nc2.getImageData(Math.floor(nw*gx/4), Math.floor(nh*gy/4), 1, 1).data;
              if(d[3] > 0) return false;
            }
          }
          return true;
        } catch(e){ return false; }
      }
      var _nebRebuildT = 0;
      function _recuperarNebula(){
        var now = Date.now();
        if(now - _nebRebuildT < 4000) return;   // throttle anti alt-tab rápido
        if(!_nebulaEnBlanco()) return;
        _nebRebuildT = now;
        try { buildNebulaLayer(); } catch(e){}
      }
      window.addEventListener('focus', _recuperarNebula);
      document.addEventListener('visibilitychange', function(){
        if(!document.hidden) _recuperarNebula();
      });

      // ── Capas pesadas: escalonadas en frames sucesivos, no bloquean ──
      var _buildQueue = [
        function(){ initNebula(); },
        function(){ buildNebulaLayer(); },     // la más cara — sola en su slot
        function(){ buildRays(); buildFarHalos(); },
        function(){ buildConstellations(); },
        function(){ buildSpirals(); buildDust(); },
        function(){ buildWarp(); },
        function(){ for(var i=0;i<3;i++) spawnPulse();
                    for(var j=0;j<2;j++) spawnMeteor(); },
      ];
      var _qi = 0;
      function _runQueue(){
        if(_qi >= _buildQueue.length) return;
        _buildQueue[_qi]();
        _qi++;
        // Un paso por frame: reparte el costo, el arranque no se atasca.
        requestAnimationFrame(_runQueue);
      }
      requestAnimationFrame(_runQueue);
    }

    function stop(){
      if(animId){ cancelAnimationFrame(animId); animId = null; }
      window._particlesRunning = false;
    }

    window._particlesStart = start;
    window._particlesStop  = stop;

    // v7.077 — ARRANQUE GARANTIZADO DEL COSMOS.
    // El ÚNICO punto que arrancaba el fondo era abrirDial(); si el
    // usuario tocaba una pestaña del panel ANTES de que el overlay
    // abriera, el cosmos no se construía NUNCA — y la subida 2→1
    // evita abrirDial a propósito (para no re-disparar la cascada),
    // así que tampoco lo arrancaba. Sin cosmos: sin fondo, sin blur
    // (no hay nada que difuminar) y sin warp en las transiciones.
    // El cosmos es el fondo universal de TODOS los niveles y su
    // frame-loop ya se pausa solo en niv-2 / sin foco / oculto, así
    // que arrancarlo siempre no cuesta CPU extra dentro de secciones.
    function _arranqueGarantizado(){
      setTimeout(function(){
        if(!window._particlesRunning) start();
      }, 900);   // tras el arranque normal (abrirDial lo hace a los 200ms)
    }
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', _arranqueGarantizado);
    } else {
      _arranqueGarantizado();
    }

    window.addEventListener('resize', function(){
      if(_particlesCanvas.isConnected){   // v7.078: offsetParent es null en position:fixed
        resize();
        initNebula();
        buildNebulaLayer();   // v5.201: re-render nebulosa al nuevo tamaño
        buildFarHalos();      // v5.201
        buildDialRings();     // v5.201
        buildRays();
        buildStars();
        buildConstellations();
        buildSpirals();
        buildDust();          // v5.169
        // v5.187: buildOrbitRings desactivado
      buildWarp();          // v5.181
      }
    });
  })();
})();
