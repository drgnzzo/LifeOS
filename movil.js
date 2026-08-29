/* ══════════════════════════════════════════════════════════════════════
   LifeOS · movil.js  v1.0 — lógica de la versión de bolsillo

   TRES PARTES
     1. Arranque: una sola llamada a getAll() trae todo y de paso abre la
        compuerta de endpoints diferidos de raw-core (si no, cada lectura
        suelta esperaría hasta 12 s al setTimeout de esa compuerta).
     2. Consultar: barras del SIM + un cuadro de preguntas.
     3. Capturar: menú generado desde _DIAL_ITEMS + motor de formularios.

   SOBRE EL CUADRO DE PREGUNTAS
   No es un modelo de lenguaje: es un buscador de patrones sobre datos que
   ya están en memoria. Responde al instante, sin red, sin llave de API y
   sin costo. La ventaja escondida es que las respuestas salen de
   SIMS.detalle(), que ya explica en español por qué cada barra está donde
   está. Si algún día quieres lenguaje natural de verdad hace falta una
   API con llave; se puede, pero es otra decisión (costo, latencia y un
   secreto que cuidar).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var el = function (id) { return document.getElementById(id); };
  var DATOS = null;

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Arranque ───────────────────────────────────────────────────── */
  function cargar() {
    el('barras').innerHTML = '<div class="vacio">Cargando…</div>';
    return api.getAll().then(function (d) {
      if (!d || d.error) throw new Error((d && d.error) || 'respuesta vacía');
      DATOS = d;
      /* raw-sims lee estas globales; son las mismas que llena el
         escritorio en raw-dashboard.js. Si cambian allá, cambian aquí. */
      if (d.nutricion)     window._nutData          = d.nutricion;
      if (d.entrenamiento) window._entData          = d.entrenamiento;
      if (d.activityCheck) window._actData          = d.activityCheck;
      if (d.logros)        window._logrosData       = d.logros;
      if (d.pensamientos)  window._pensamientosData = d.pensamientos;
      if (d.relaciones)    window._relacionesData   = d.relaciones;
      pintarBarras();
      pintarGajos();
    }).catch(function (e) {
      el('barras').innerHTML = '<div class="vacio">No se pudo cargar: ' +
        esc(e && e.message ? e.message : e) + '</div>';
    });
  }

  /* ── Barras ─────────────────────────────────────────────────────── */
  var ICONOS = {
    hambre:'🍔', energia:'⚡', cuerpo:'💪', higiene:'🚿', mental:'🧠',
    disfrute:'🎮', entorno:'🏠', social:'👥', trabajo:'💼', hidratacion:'💧'
  };
  var ROTULOS = {
    hambre:'Hambre', energia:'Energía', cuerpo:'Cuerpo', higiene:'Higiene',
    mental:'Mental', disfrute:'Disfrute', entorno:'Entorno', social:'Social',
    trabajo:'Trabajo', hidratacion:'Hidratación'
  };

  function color(v) {
    if (v === null) return '#4d5a6f';
    return v < 30 ? '#EF4444' : (v < 60 ? '#FBBF24' : '#4ADE80');
  }

  function pintarBarras() {
    if (!window.SIMS) { el('barras').innerHTML = '<div class="vacio">Motor no disponible</div>'; return; }
    var d = SIMS.detalle();
    el('barras').innerHTML = Object.keys(d).map(function (k) {
      var v = d[k].v, c = color(v);
      return '<div class="b" data-need="' + k + '" title="' + esc(d[k].por) + '">' +
        '<div class="b-top">' +
          '<span class="b-ico">' + (ICONOS[k] || '•') + '</span>' +
          '<span class="b-l">' + (ROTULOS[k] || k) + '</span>' +
          '<span class="b-v" style="color:' + c + '">' + (v === null ? '—' : v) + '</span>' +
        '</div>' +
        '<div class="b-bar"><i style="width:' + (v === null ? 0 : v) + '%;background:' + c + '"></i></div>' +
      '</div>';
    }).join('');
    var s = SIMS.score();
    el('score').innerHTML = (s === null ? '—' : s) + '<small>SCORE</small>';
  }

  el('barras').addEventListener('click', function (ev) {
    var c = ev.target.closest && ev.target.closest('.b');
    if (c) responder(c.getAttribute('data-need'));
  });

  /* ── Preguntar ──────────────────────────────────────────────────── */
  var SUGERENCIAS = ['cómo voy', 'agua', 'sueño', 'qué me falta hoy', 'cuánto gasté'];

  /* Cada patrón: qué palabras lo disparan y qué contesta. El orden manda,
     así que lo específico va antes que lo general. */
  var PATRONES = [
    { k:['como voy','cómo voy','estado','resumen','score','general'], f: rtaResumen },
    { k:['falta','pendiente','habito','hábito'], f: rtaPendientes },
    { k:['gast','saldo','dinero','plata'], f: rtaDinero },
    { k:['agua','hidrat','tomado','litro'], f: function(){ return rtaBarra('hidratacion'); } },
    { k:['sueño','sueno','dormi','dormí','energia','energía','descans'], f: function(){ return rtaBarra('energia'); } },
    { k:['comi','comí','comida','caloria','caloría','hambre','desayun','cen'], f: function(){ return rtaBarra('hambre'); } },
    { k:['entren','ejercicio','cuerpo','gym','pesas','corr'], f: function(){ return rtaBarra('cuerpo'); } },
    { k:['pensamiento','mental','cabeza'], f: function(){ return rtaBarra('mental'); } },
    { k:['social','amigo','gente','relacion'], f: function(){ return rtaBarra('social'); } },
    { k:['logro','disfrute','meta'], f: function(){ return rtaBarra('disfrute'); } },
    { k:['higiene','bañ','ducha'], f: function(){ return rtaBarra('higiene'); } },
    { k:['entorno','casa','orden'], f: function(){ return rtaBarra('entorno'); } },
    { k:['trabajo','chamba','electronics'], f: function(){ return rtaBarra('trabajo'); } }
  ];

  function rtaBarra(clave) {
    var d = SIMS.detalle()[clave];
    if (!d) return 'No conozco esa barra.';
    var t = ROTULOS[clave] || clave;
    if (d.v === null) return t + ': sin dato.\n' + d.por;
    return t + ': ' + d.v + '/100.\n' + d.por;
  }

  function rtaResumen() {
    var d = SIMS.detalle(), con = [], sin = [];
    Object.keys(d).forEach(function (k) {
      if (d[k].v === null) sin.push(ROTULOS[k] || k);
      else con.push({ k:k, v:d[k].v });
    });
    if (!con.length) return 'Todavía no hay datos suficientes para calcular nada.';
    con.sort(function (a, b) { return a.v - b.v; });
    var peores = con.slice(0, 3).map(function (x) { return (ROTULOS[x.k]||x.k) + ' ' + x.v; });
    var mejor  = con[con.length - 1];
    var txt = 'Score de vida: ' + SIMS.score() + '/100.\n' +
              'Lo más bajo: ' + peores.join(', ') + '.\n' +
              'Lo mejor: ' + (ROTULOS[mejor.k]||mejor.k) + ' ' + mejor.v + '.';
    if (sin.length) txt += '\nSin dato todavía: ' + sin.join(', ') + '.';
    return txt;
  }

  function rtaPendientes() {
    var a = window._actData;
    if (!a) return 'No tengo los hábitos cargados.';
    var k = ['L','M','W','J','V','S','D'][(new Date().getDay()+6)%7];
    var faltan = [];
    ['habitosPersonal','habitosElectronics'].forEach(function (g) {
      (a[g] || []).forEach(function (h) {
        if (!(h.checks && h.checks[k])) faltan.push(h.nombre || h.habito || h.titulo || '(sin nombre)');
      });
    });
    if (!faltan.length) return 'Nada pendiente: todos los hábitos de hoy están marcados.';
    return 'Te faltan ' + faltan.length + ' hábito(s) hoy:\n· ' + faltan.slice(0, 12).join('\n· ') +
           (faltan.length > 12 ? '\n… y ' + (faltan.length - 12) + ' más' : '');
  }

  function fmt(n) {
    var x = Number(n);
    return isNaN(x) ? String(n) : '$' + x.toLocaleString('es-MX', { maximumFractionDigits: 0 });
  }

  function rtaDinero() {
    if (!DATOS) return 'Todavía no cargan los datos.';
    var partes = [];
    var sh = DATOS.saldoHoy;
    if (sh && (sh.display || sh.valor !== undefined)) partes.push('Saldo de hoy: ' + (sh.display || sh.valor));
    var fa = DATOS.financieroAvanzado;
    if (fa) {
      if (fa.gastadoMes !== undefined) partes.push('Gastado en el mes: ' + fmt(fa.gastadoMes));
      if (fa.disponible !== undefined) partes.push('Disponible: ' + fmt(fa.disponible));
      if (fa.runway     !== undefined) partes.push('Runway: ' + fa.runway);
    }
    return partes.length ? partes.join('\n')
      : 'No encontré el resumen financiero en esta carga. Ábrelo en el escritorio.';
  }

  function responder(txt) {
    var q = String(txt || '').toLowerCase().trim();
    if (!q) return;
    var hallado = null;
    for (var i = 0; i < PATRONES.length && !hallado; i++) {
      for (var j = 0; j < PATRONES[i].k.length; j++) {
        if (q.indexOf(PATRONES[i].k[j]) !== -1) { hallado = PATRONES[i]; break; }
      }
    }
    /* Sin coincidencia se admite. Fingir comprensión es peor que el límite. */
    var r = hallado ? hallado.f()
      : 'No entendí eso. Prueba con: ' + SUGERENCIAS.join(' · ');
    el('rta').innerHTML = '<div class="rta">' + esc(r) + '</div>';
  }

  el('sug').innerHTML = SUGERENCIAS.map(function (s) {
    return '<button data-q="' + s + '">' + s + '</button>';
  }).join('');
  el('sug').addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('button');
    if (b) { el('q').value = b.getAttribute('data-q'); responder(b.getAttribute('data-q')); }
  });
  el('qgo').addEventListener('click', function () { responder(el('q').value); });
  el('q').addEventListener('keydown', function (e) { if (e.key === 'Enter') responder(el('q').value); });

  /* ── Capturar: el menú sale de _DIAL_ITEMS ──────────────────────── */
  /* Ejecutar el preset() del sub y leer el _dialPreset que deja es la
     forma de saber a dónde va cada uno SIN duplicar ese mapa aquí. Si
     mañana agregas un gajo al dial, aparece en el celular sin tocar
     este archivo. */
  function destinoDe(sub) {
    try {
      window._dialPreset = {};
      if (typeof sub.preset === 'function') sub.preset();
      return window._dialPreset || {};
    } catch (e) { return {}; }
  }

  function pintarGajos() {
    if (typeof _DIAL_ITEMS === 'undefined') {
      el('gajos').innerHTML = '<div class="vacio">No cargó el registro del dial.</div>'; return;
    }
    el('gajos').innerHTML = _DIAL_ITEMS.filter(Boolean).map(function (g, i) {
      return '<button class="gajo" data-g="' + i + '" style="--gc:' + (g.accent || '#8b5cf6') + '">' +
             esc(g.label || g.id) + '</button>';
    }).join('');
  }

  el('gajos').addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('.gajo');
    if (b) abrirGajo(_DIAL_ITEMS[+b.getAttribute('data-g')]);
  });

  function abrirGajo(g) {
    if (!g) return;
    /* "Ver sección" es navegación del escritorio, no captura. */
    var subs = (g.subs || []).filter(function (s) { return !/^ver /i.test(s.label || ''); });
    if (!subs.length) { hoja(g.label, '<div class="vacio">Este gajo no tiene capturas.</div>'); return; }
    var html = '<div class="subs">' + subs.map(function (s, i) {
      var d = destinoDe(s);
      var ficha = FORMS[d.tab] || FORMS[d.irA];
      return '<button class="sub" data-s="' + i + '">' +
        '<span class="pt" style="background:' + (s.accent || '#8b5cf6') + '"></span>' +
        esc(s.label || s.id) + (ficha ? '' : '<span class="na">aún no</span>') +
      '</button>';
    }).join('') + '</div>';
    hoja(g.label, html);
    el('hoja').querySelector('.subs').addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('.sub');
      if (!b) return;
      var s = subs[+b.getAttribute('data-s')];
      var d = destinoDe(s);
      var ficha = FORMS[d.tab] || FORMS[d.irA];
      if (!ficha) {
        hoja(s.label, '<div class="aviso mal">Esta captura todavía no está en la versión móvil.' +
          '<br><br>El menú se genera solo desde el dial, así que aparece aquí en cuanto exista ' +
          'su ficha. Por ahora, ábrela en el escritorio.</div>');
        return;
      }
      abrirForm(ficha, s.label, d);
    });
  }

  /* ── Motor de formularios ───────────────────────────────────────── */
  function hoja(titulo, cuerpo) {
    var h = el('hoja');
    h.innerHTML = '<div class="hoja-top"><button class="icobtn" id="cerrar">‹</button>' +
                  '<span class="t">' + esc(titulo || '') + '</span></div>' + cuerpo;
    h.classList.add('on');
    h.scrollTop = 0;
    el('cerrar').onclick = function () { h.classList.remove('on'); };
  }

  function abrirForm(ficha, titulo, preset) {
    var campos = ficha.campos.map(function (c) {
      var val = (preset && preset[c.id] !== undefined) ? preset[c.id]
              : (typeof c.valor === 'function' ? c.valor() : (c.valor || ''));
      var ctl;
      if (c.tipo === 'select') {
        ctl = '<select id="f_' + c.id + '">' + (c.ops || []).map(function (o) {
          return '<option' + (String(o) === String(val) ? ' selected' : '') + '>' + esc(o) + '</option>';
        }).join('') + '</select>';
      } else if (c.tipo === 'texto-largo') {
        ctl = '<textarea id="f_' + c.id + '">' + esc(val) + '</textarea>';
      } else {
        ctl = '<input id="f_' + c.id + '" type="' + (c.tipo || 'text') + '"' +
              (c.tipo === 'number' ? ' inputmode="decimal" step="any"' : '') +
              ' value="' + esc(val) + '"' + (c.ph ? ' placeholder="' + esc(c.ph) + '"' : '') + '>';
      }
      var rap = c.rapidos ? '<div class="rapidos" data-para="' + c.id + '">' +
        c.rapidos.map(function (r) { return '<button data-v="' + esc(r.v) + '">' + esc(r.t) + '</button>'; }).join('') +
        '</div>' : '';
      return '<div class="campo"><label>' + esc(c.et) + '</label>' + ctl + rap + '</div>';
    }).join('');

    hoja(titulo, campos + '<button class="guardar" id="gd">Guardar</button><div id="res"></div>');

    el('hoja').addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('.rapidos button');
      if (!b) return;
      var input = el('f_' + b.parentNode.getAttribute('data-para'));
      if (!input) return;
      /* Los rápidos SUMAN si el campo es numérico (vasos de agua que se
         acumulan) y SUSTITUYEN si es texto. */
      if (input.type === 'number') input.value = (Number(input.value) || 0) + Number(b.getAttribute('data-v'));
      else input.value = b.getAttribute('data-v');
      [].forEach.call(b.parentNode.children, function (x) { x.classList.remove('on'); });
      b.classList.add('on');
    });

    el('gd').onclick = function () {
      var v = {};
      ficha.campos.forEach(function (c) {
        var i = el('f_' + c.id); if (!i) return;
        v[c.id] = c.tipo === 'number' ? (Number(i.value) || 0) : i.value;
      });
      var falta = ficha.campos.filter(function (c) { return c.req && !v[c.id]; })
                              .map(function (c) { return c.et; });
      if (falta.length) {
        el('res').innerHTML = '<div class="aviso mal">Faltan: ' + esc(falta.join(', ')) + '</div>';
        return;
      }
      el('gd').disabled = true;
      el('res').innerHTML = '<div class="aviso">Guardando…</div>';
      Promise.resolve(ficha.guardar(v, preset || {})).then(function (r) {
        var bien = r && (r.ok === true || r.ok === undefined) && !r.error;
        el('res').innerHTML = '<div class="aviso ' + (bien ? 'ok' : 'mal') + '">' +
          (bien ? '✓ Guardado' : 'No se guardó: ' + esc((r && (r.error || r.mensaje)) || 'error desconocido')) +
          '</div>';
        el('gd').disabled = false;
        if (bien) setTimeout(function () { el('hoja').classList.remove('on'); cargar(); }, 700);
      }).catch(function (e) {
        el('res').innerHTML = '<div class="aviso mal">Falló: ' + esc(e && e.message ? e.message : e) + '</div>';
        el('gd').disabled = false;
      });
    };
  }

  /* ── Fichas de captura ──────────────────────────────────────────────
     La clave es el `tab` o el `irA` que deja el preset del dial. Para
     sumar una captura al móvil basta con añadir su ficha aquí: el menú
     ya la lista sola, y mientras tanto avisa "aún no" en vez de fingir. */
  function hoyISO() {
    var d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  var FORMS = {
    irAAguaForm: {
      campos: [
        { id:'fecha', et:'Fecha', tipo:'date', valor:hoyISO },
        { id:'agua',  et:'Litros', tipo:'number', req:true, ph:'0.25',
          rapidos:[{t:'+1 vaso (250 ml)',v:0.25},{t:'+½ L',v:0.5},{t:'+1 L',v:1}] }
      ],
      guardar: function (v) {
        return api.guardarNutricion({ fecha:v.fecha, momento:'Agua', comida:'Agua', agua:v.agua });
      }
    },
    irASuenoForm: {
      campos: [
        { id:'fecha',   et:'Fecha', tipo:'date', valor:hoyISO },
        { id:'horas',   et:'Horas', tipo:'number', req:true, ph:'7.5',
          rapidos:[{t:'6 h · 4 ciclos',v:6},{t:'7.5 h · 5 ciclos',v:7.5},{t:'9 h · 6 ciclos',v:9}] },
        { id:'minutos', et:'Minutos extra', tipo:'number' },
        { id:'calidad', et:'Calidad (1-5)', tipo:'select', ops:['1','2','3','4','5'], valor:'3' },
        { id:'notas',   et:'Notas', tipo:'texto-largo' }
      ],
      guardar: function (v) {
        return api.nuevoSueno({ fecha:v.fecha, horas:v.horas, minutos:v.minutos,
          calidad:v.calidad, tipo:'Descanso nocturno', notas:v.notas });
      }
    },
    irAAlcoholForm: {
      campos: [
        { id:'bebida', et:'Bebida', tipo:'text', req:true, ph:'Cerveza' },
        { id:'ml',     et:'Mililitros', tipo:'number', req:true,
          rapidos:[{t:'Caguama 940',v:940},{t:'Lata 355',v:355},{t:'Copa 150',v:150}] },
        { id:'pct',    et:'Grados (%)', tipo:'number', valor:'4.5' }
      ],
      guardar: function (v) { return api.nuevoAlcohol(v); }
    },
    nutricion: {
      campos: [
        { id:'fecha',    et:'Fecha', tipo:'date', valor:hoyISO },
        { id:'momento',  et:'Momento', tipo:'select', ops:['Desayuno','Comida','Cena','Snack'] },
        { id:'comida',   et:'Qué comiste', tipo:'text', req:true },
        { id:'calorias', et:'Calorías', tipo:'number' },
        { id:'proteina', et:'Proteína (g)', tipo:'number' },
        { id:'agua',     et:'Agua (L)', tipo:'number' }
      ],
      guardar: function (v) { return api.guardarNutricion(v); }
    },
    pensamiento: {
      campos: [
        { id:'texto',     et:'Qué estás pensando', tipo:'texto-largo', req:true },
        { id:'categoria', et:'Categoría', tipo:'select',
          ops:['Emoción','Idea','Reflexión','Decisión','Sueño'] },
        { id:'energia',   et:'Energía', tipo:'select', ops:['-1','0','1'], valor:'0' }
      ],
      guardar: function (v) { return api.guardarPensamiento(v); }
    },
    entrenamiento: {
      campos: [
        { id:'fecha',       et:'Fecha', tipo:'date', valor:hoyISO },
        { id:'tipo',        et:'Tipo', tipo:'select', ops:['Fuerza','Cardio','HIIT','Flex','Deporte'] },
        { id:'ejercicio',   et:'Ejercicio', tipo:'text', req:true },
        { id:'duracion',    et:'Minutos', tipo:'number', req:true,
          rapidos:[{t:'30',v:30},{t:'45',v:45},{t:'60',v:60}] },
        { id:'calQuemadas', et:'Calorías quemadas', tipo:'number' },
        { id:'notas',       et:'Notas', tipo:'texto-largo' }
      ],
      guardar: function (v) { return api.guardarEntrenamiento(v); }
    }
  };

  /* ── En marcha ──────────────────────────────────────────────────── */
  el('recargar').onclick = function () { cargar(); };
  cargar();
  /* Las barras decaen con el tiempo: se repintan solas, sin ir a la red. */
  setInterval(function () { if (DATOS) pintarBarras(); }, 30000);
  console.log('[movil] v1.0 — capturas generadas desde _DIAL_ITEMS, consultas locales');
})();
