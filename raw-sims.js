/* ══════════════════════════════════════════════════════════════════════
   LifeOS · raw-sims.js  v1.1
   MOTOR DE NECESIDADES — transposición del sistema de motivos de Los Sims

   ── LA IDEA ─────────────────────────────────────────────────────────
   En Los Sims cada motivo es un número 0-100 que BAJA SOLO con el tiempo
   y se RECARGA con acciones, proporcional a lo que hiciste (dormir más
   horas llena más energía; una comida grande llena más hambre). El ánimo
   general es el promedio. Aquí es igual, pero las "acciones" son tus
   registros reales del Sheet.

   ── LA REGLA QUE MANDA ──────────────────────────────────────────────
   No hay servidor ni tareas programadas (CLAUDE.md §1). Así que ninguna
   barra se guarda: cada necesidad es una FUNCIÓN PURA de
       (tus registros del Sheet, la hora de ahora).
   Eso tiene tres consecuencias buenas:
     · Las barras bajan en tiempo real solas, sin cron ni backend.
     · No hay estado que se corrompa ni que sincronizar entre dispositivos.
     · Abrir la app en otro lado da exactamente el mismo número.

   ── DE DÓNDE SALE CADA BARRA ────────────────────────────────────────
     hidratacion  nutricion.hoy.agua      vs meta de agua
     hambre       nutricion.hoy.cal       vs meta de calorías
     energia      último sueño            ciclos de 1.5h + calidad − alcohol
     cuerpo       último entrenamiento    días desde la última sesión
     higiene      hábito con tag 'higiene'
     entorno      hábito con tag 'entorno'
     mental       pensamientos            días desde el último
     social       relaciones              días desde la última interacción
     disfrute     logros                  días desde el último completado
     trabajo      hábitos Electronics     % completado hoy

   Una necesidad SIN FUENTE devuelve null, no 0. El renderer pinta null en
   gris ("sin dato") en vez de rojo. Un cero debe significar "vas mal",
   nunca "no hay información" — confundirlos fue el defecto de la versión
   anterior, donde cinco barras marcaban 0 para siempre porque nunca se
   escribió su fórmula.

   ── AJUSTES ─────────────────────────────────────────────────────────
   Todo lo calibrable vive en SIMS.META. Se puede tocar en caliente desde
   la consola para experimentar:  SIMS.META.horaDespertar = 6; simsDiag()

   ── CONSOLA ─────────────────────────────────────────────────────────
     simsDiag()    tabla con cada barra, su valor y POR QUÉ está ahí
     SIMS.META     los parámetros calibrables
   ══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var META = {
    /* Sueño: los ciclos duran ~1.5 h. Dormir 7.5 h son 5 ciclos completos.
       Se puntúa por CICLOS, no por horas: despertar a media fase deja
       peor descanso que despertar entre ciclo y ciclo, aunque el reloj
       diga lo mismo. Por eso hay castigo por fracción intermedia. */
    cicloSuenoH:      1.5,
    ciclosMeta:       5,        // 5 × 1.5 h = 7.5 h
    castigoMediaFase: 8,        // puntos que se restan por despertar a media fase

    /* Ventana del día. Sin dato de a qué hora despertaste, se asume esta
       hora. Si te levantas a otra, cámbiala aquí. */
    horaDespertar:    7,
    horasDespiertoMax:16,

    /* Ritmo de caída — perfil EXIGENTE.
       Números en "puntos por día" (o por hora donde se indica). */
    energiaPorHoraDespierto: 4,   // tras 6 h despierto empieza a pesar
    energiaGraciaH:          6,
    cuerpoPorDia:           50,   // 2 días sin entrenar → 0
    higienePorHora:        4.2,   // ~24 h desde el último check → 0
    entornoPorDia:          33,   // 3 días
    mentalPorDia:           35,   // ~3 días
    socialPorDia:           25,   // 4 días
    disfrutePorDia:         15,   // ~7 días
    hambreCastigoPorHora:   10,   // por cada hora sin comer pasadas 5

    /* Metas. Se sobreescriben con tu hoja "Metas Nutrición" al cargar. */
    metaAguaL:      2.5,
    metaCalorias:   1800,
    minutosSemanaOMS: 150,

    /* Peso de cada barra en el Score de vida. */
    pesos: {
      energia:1.4, hidratacion:1.2, hambre:1.2, cuerpo:1.2, mental:1.1,
      social:1.0, higiene:0.9, trabajo:0.9, disfrute:0.7, entorno:0.6
    }
  };

  /* ── Utilidades de tiempo ──────────────────────────────────────────── */
  function _ahora(){ return new Date(); }

  function _horasDespierto(){
    var d = _ahora();
    var h = d.getHours() + d.getMinutes()/60 - META.horaDespertar;
    if (h < 0) h += 24;                       // madrugada: sigue siendo "ayer"
    return Math.max(0, Math.min(META.horasDespiertoMax, h));
  }

  function _aFecha(v){
    if (!v) return null;
    if (v instanceof Date) return isNaN(v) ? null : v;
    var s = String(v).trim();
    var m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);          // dd/MM/yyyy
    if (m) return new Date(+m[3], +m[2]-1, +m[1]);
    var d = new Date(s.length > 10 ? s : s + 'T00:00:00');  // yyyy-MM-dd
    return isNaN(d) ? null : d;
  }

  function _diasDesde(v){
    var d = _aFecha(v); if (!d) return null;
    var hoy = _ahora();
    var a = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    var b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.max(0, Math.round((a - b) / 86400000));
  }

  function _clamp(n){ return Math.max(0, Math.min(100, Math.round(n))); }

  /* v1.1 — Nunca confíes en items[0].

     getEntrenamiento y getPensamientos hacen .reverse() antes de
     devolver, así que items[0] es la ÚLTIMA fila de la hoja. Y la última
     fila suele venir vacía o a medio llenar: su fecha llega como '' y
     _aFecha devuelve null. Resultado: "fecha ilegible" aunque hubiera
     treinta registros buenos detrás.

     Esto recorre TODOS y se queda con el más reciente que sí se pueda
     leer. Deja de depender del orden en que el backend los mande. */
  function _diasDelMasReciente(items, campo){
    if (!items || !items.length) return null;
    var mejor = null;
    for (var i = 0; i < items.length; i++){
      var d = _diasDesde(items[i][campo || 'fecha']);
      if (d !== null && (mejor === null || d < mejor)) mejor = d;
    }
    return mejor;
  }

  /* Nota: devuelve null, NO 0, cuando no hay fuente. Ver cabecera. */
  function _sinDato(motivo){ return { v:null, por:motivo }; }

  /* ── Acceso a los datos que ya cargó la app ────────────────────────── */
  function _nut(){ return window._nutData || null; }
  function _ent(){ return window._entData || null; }
  function _act(){ return window._actData || null; }
  function _sue(){ return window._sueDataSims || null; }
  function _alc(){ return window._alcDataSims || null; }

  function _diaKey(){ return ['L','M','W','J','V','S','D'][(_ahora().getDay()+6)%7]; }

  /* Hábitos personales etiquetados con un tag sims (columna `sims`). */
  function _habitosConTag(tag){
    var a = _act(); if (!a) return null;
    var lista = (a.habitosPersonal || []).filter(function(h){
      return String(h.sims||'').toLowerCase().trim() === tag;
    });
    return lista.length ? lista : null;
  }

  /* ── LAS DIEZ NECESIDADES ──────────────────────────────────────────── */

  /* Hidratación y hambre comparten idea: no basta con llegar a la meta al
     final del día, hay que ir al ritmo. A las 2 de la tarde deberías
     llevar aproximadamente la mitad. Eso es lo "exigente". */
  function _hidratacion(){
    var n = _nut();
    if (!n || !n.hoy) return _sinDato('sin registro de nutrición hoy');
    var meta = META.metaAguaL, tomado = Number(n.hoy.agua) || 0;
    var hd = _horasDespierto();
    if (hd < 1) return { v:100, por:'recién despierto, sin deuda de agua' };
    var esperado = meta * (hd / META.horasDespiertoMax);
    var v = _clamp(tomado / esperado * 100);
    return { v:v, por: tomado.toFixed(1)+' L de ' + esperado.toFixed(1) +
             ' L esperados a esta hora (meta diaria ' + meta + ' L)' };
  }

  function _hambre(){
    var n = _nut();
    if (!n || !n.hoy) return _sinDato('sin registro de nutrición hoy');
    var meta = META.metaCalorias, comido = Number(n.hoy.cal) || 0;
    var hd = _horasDespierto();
    if (hd < 1) return { v:100, por:'recién despierto' };
    var esperado = meta * (hd / 14);
    var v = _clamp(comido / esperado * 100);

    /* Castigo agudo: llevar muchas horas sin probar bocado pesa aunque
       el total del día vaya bien. */
    var items = (n.hoy.items || []);
    if (items.length) {
      var ultima = items[items.length-1];
      var hm = String(ultima.momento||'').match(/(\d{1,2}):(\d{2})/);
      if (hm) {
        var d = _ahora();
        var horas = d.getHours() + d.getMinutes()/60 - (+hm[1] + (+hm[2])/60);
        if (horas > 5) v = _clamp(v - (horas-5) * META.hambreCastigoPorHora);
      }
    }
    return { v:v, por: Math.round(comido)+' kcal de ' + Math.round(esperado) +
             ' esperadas a esta hora (meta ' + meta + ')' };
  }

  /* Energía: el corazón del sistema. Ciclos completos, calidad declarada,
     castigo por alcohol y desgaste por horas despierto. */
  function _energia(){
    var s = _sue();
    if (!s) return _sinDato('la fuente de sueño no cargó (revisa api.getSueno)');
    if (!s.registros || !s.registros.length) return _sinDato('la hoja de sueño está vacía');
    /* Mismo cuidado que arriba: se elige el registro más reciente que
       tenga fecha legible, no el primero del arreglo. */
    var reg = null, mejor = null;
    for (var i = 0; i < s.registros.length; i++){
      var d = _diasDesde(s.registros[i].fecha);
      if (d !== null && (mejor === null || d < mejor)) { mejor = d; reg = s.registros[i]; }
    }
    if (!reg) return _sinDato('ningún registro de sueño tiene fecha legible');
    var dias = mejor;
    if (dias > 1) return _sinDato('el último sueño registrado es de hace ' + dias + ' días');

    var horas   = Number(reg.total) || 0;
    var ciclos  = horas / META.cicloSuenoH;
    var completos = Math.floor(ciclos);
    var frac    = ciclos - completos;
    var base    = Math.min(100, completos / META.ciclosMeta * 100);

    var nota = completos + ' ciclos (' + horas.toFixed(1) + ' h)';
    if (frac > 0.15 && frac < 0.85) { base -= META.castigoMediaFase; nota += ', despertaste a media fase'; }

    var cal = Number(reg.calidad) || 3;
    base *= (0.8 + 0.05 * cal);                     // calidad 1→0.85 · 5→1.05
    nota += ', calidad ' + cal + '/5';

    var a = _alc();
    if (a && a.hoy && a.hoy.gr > 0) {
      var pen = Math.min(20, a.hoy.gr * 0.6);
      base -= pen;
      nota += ', −' + Math.round(pen) + ' por alcohol';
    }

    var hd = _horasDespierto();
    var desgaste = Math.max(0, (hd - META.energiaGraciaH) * META.energiaPorHoraDespierto);
    if (desgaste > 0) nota += ', −' + Math.round(desgaste) + ' por ' + Math.round(hd) + ' h despierto';

    return { v:_clamp(base - desgaste), por:nota };
  }

  function _cuerpo(){
    var e = _ent();
    if (!e || !e.items || !e.items.length) return _sinDato('sin entrenamientos registrados');
    var dias = _diasDelMasReciente(e.items);
    if (dias === null) return _sinDato('ningún entrenamiento tiene fecha legible');
    var v = 100 - dias * META.cuerpoPorDia;

    var min7 = e.items.reduce(function(acc, it){
      var d = _diasDesde(it.fecha);
      return acc + ((d !== null && d <= 7) ? (Number(it.duracion)||0) : 0);
    }, 0);
    var bono = Math.min(15, min7 / META.minutosSemanaOMS * 15);

    return { v:_clamp(v + bono), por: (dias === 0 ? 'entrenaste hoy' : 'hace ' + dias + ' día(s)') +
             ' · ' + Math.round(min7) + ' min esta semana (meta OMS ' + META.minutosSemanaOMS + ')' };
  }

  function _porHabito(tag, caidaPorDia, caidaPorHora){
    var lista = _habitosConTag(tag);
    if (!lista) return _sinDato('ningún hábito etiquetado como "' + tag + '"');
    var k = _diaKey();
    var hechoHoy = lista.some(function(h){ return h.checks && h.checks[k]; });
    if (hechoHoy) return { v:100, por:'hecho hoy' };
    var d = _ahora();
    var horas = d.getHours() + d.getMinutes()/60;
    /* v1.1 — Antes sumaba 12 h "desde anoche", y con 4.2 puntos por hora
       la barra tocaba fondo a las 11 de la mañana. Demasiado castigo por
       algo que quizá hiciste hace un rato. Ahora decae desde medianoche:
       llega a 0 a las 24 h, que era la intención original. */
    var v = caidaPorHora
      ? 100 - horas * caidaPorHora
      : 100 - caidaPorDia;
    return { v:_clamp(v), por:'sin marcar hoy' };
  }

  function _mental(){
    var p = window._pensamientosData;
    if (!p || !p.items || !p.items.length) return _sinDato('sin pensamientos registrados');
    var dias = _diasDelMasReciente(p.items);
    if (dias === null) return _sinDato('ningún pensamiento tiene fecha legible');
    return { v:_clamp(100 - dias * META.mentalPorDia),
             por: dias === 0 ? 'escribiste hoy' : 'hace ' + dias + ' día(s)' };
  }

  function _social(){
    var r = window._relacionesData;
    if (!r || !r.items || !r.items.length) return _sinDato('sin relaciones registradas');
    var mejor = null;
    r.items.forEach(function(x){
      var d = _diasDesde(x.ultimaVez);
      if (d !== null && (mejor === null || d < mejor)) mejor = d;
    });
    if (mejor === null) return _sinDato('ninguna relación tiene fecha de última interacción');
    return { v:_clamp(100 - mejor * META.socialPorDia),
             por: mejor === 0 ? 'convivencia hoy' : 'hace ' + mejor + ' día(s)' };
  }

  function _disfrute(){
    var l = window._logrosData;
    if (!l || !l.items || !l.items.length) return _sinDato('sin logros registrados');
    var hechos = l.items.filter(function(x){ return x.completado==='Sí' || x.completado===true; });
    if (!hechos.length) return { v:0, por:'ningún logro completado todavía' };
    var mejor = null;
    hechos.forEach(function(x){
      var d = _diasDesde(x.fecha);
      if (d !== null && (mejor === null || d < mejor)) mejor = d;
    });
    if (mejor === null) return { v:50, por: hechos.length + ' logros completados, sin fechas' };
    return { v:_clamp(100 - mejor * META.disfrutePorDia),
             por:'último logro hace ' + mejor + ' día(s) · ' + hechos.length + ' completados' };
  }

  function _trabajo(){
    var a = _act();
    if (!a || !(a.habitosElectronics||[]).length) return _sinDato('sin hábitos de Electronics');
    var k = _diaKey(), lista = a.habitosElectronics;
    var hechos = lista.filter(function(h){ return h.checks && h.checks[k]; }).length;
    return { v:_clamp(hechos / lista.length * 100),
             por: hechos + ' de ' + lista.length + ' hábitos hoy' };
  }

  /* ── Ensamblado ────────────────────────────────────────────────────── */
  var _CALC = {
    hambre:      _hambre,
    hidratacion: _hidratacion,
    energia:     _energia,
    cuerpo:      _cuerpo,
    higiene:     function(){ return _porHabito('higiene', null, META.higienePorHora); },
    mental:      _mental,
    disfrute:    _disfrute,
    entorno:     function(){ return _porHabito('entorno', META.entornoPorDia, null); },
    social:      _social,
    trabajo:     _trabajo
  };

  function detalle(){
    var out = {};
    Object.keys(_CALC).forEach(function(k){
      try { out[k] = _CALC[k](); }
      catch(e){ out[k] = { v:null, por:'error en la fórmula: ' + e.message }; }
    });
    return out;
  }

  function calcular(){
    var d = detalle(), out = {};
    Object.keys(d).forEach(function(k){ out[k] = d[k].v; });
    return out;
  }

  /* Score de vida: promedio ponderado de las barras QUE TIENEN DATO.
     Las que no lo tienen no cuentan ni a favor ni en contra — promediar
     un null como 0 sería exactamente la mentira que este archivo evita. */
  function score(){
    var d = detalle(), suma = 0, peso = 0;
    Object.keys(d).forEach(function(k){
      if (d[k].v === null) return;
      var w = META.pesos[k] || 1;
      suma += d[k].v * w; peso += w;
    });
    return peso ? Math.round(suma / peso) : null;
  }

  /* ── Fuentes que no vienen en getAll ───────────────────────────────── */
  function cargarFuentes(){
    var api = window.api; if (!api) return Promise.resolve();
    var tareas = [];
    if (api.getSueno) tareas.push(api.getSueno().then(function(r){
      if (r && r.ok) window._sueDataSims = r; }).catch(function(){}));
    if (api.getAlcohol) tareas.push(api.getAlcohol().then(function(r){
      if (r && r.ok) window._alcDataSims = r; }).catch(function(){}));
    if (api.getMetasNutricion) tareas.push(api.getMetasNutricion().then(function(r){
      if (r && r.ok) {
        if (r.agua)     META.metaAguaL    = Number(r.agua)     || META.metaAguaL;
        if (r.calorias) META.metaCalorias = Number(r.calorias) || META.metaCalorias;
      }
    }).catch(function(){}));
    return Promise.all(tareas);
  }

  /* ── Reloj: esto es lo que hace que las barras bajen a la vista ─────
     No toca la red. Solo recalcula funciones puras y repinta. */
  var _reloj = null;
  function arrancarReloj(ms){
    if (_reloj) clearInterval(_reloj);
    _reloj = setInterval(function(){
      try {
        if (typeof window.renderSimsBandSimsStyle === 'function')
          window.renderSimsBandSimsStyle('hud-sim-band-grid');
        if (typeof window.renderSimsNeeds === 'function' &&
            document.getElementById('hud-sim-needs-grid'))
          window.renderSimsNeeds('hud-sim-needs-grid');
      } catch(e){}
    }, ms || 30000);
    return _reloj;
  }

  function simsDiag(){
    var d = detalle(), filas = {};
    Object.keys(d).forEach(function(k){
      filas[k] = { valor: d[k].v === null ? 'sin dato' : d[k].v, porque: d[k].por };
    });
    if (console.table) console.table(filas); else console.log(filas);
    console.log('Score de vida:', score(), '· horas despierto:', _horasDespierto().toFixed(1));
    return filas;
  }

  window.SIMS = {
    VERSION:'1.1', META:META, calcular:calcular, detalle:detalle, score:score,
    cargarFuentes:cargarFuentes, arrancarReloj:arrancarReloj
  };
  window.simsDiag = simsDiag;

  cargarFuentes().then(function(){
    try {
      if (typeof window.renderSimsBandSimsStyle === 'function')
        window.renderSimsBandSimsStyle('hud-sim-band-grid');
    } catch(e){}
    arrancarReloj(30000);
  });

  console.log('[sims] motor de necesidades v1.1 · simsDiag() para ver por qué está cada barra');
})();
