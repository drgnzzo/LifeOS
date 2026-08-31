/* ══════════════════════════════════════════════════════════════════════
   LifeOS · raw-auth.js  v9.22
   ─────────────────────────────────────────────────────────────────────
   Puerta TOTP. Pide el código de 6 dígitos, guarda el pase y lo deja a
   disposición del transporte.

   REGLAS QUE RESPETA
   · No envuelve ningún api.getX. Solo expone window.AUTH; quien inyecta
     el pase es el interior de apiGet/apiPost en raw-core.js.
   · Todo su CSS cuelga de #lifeos-auth. Ninguna regla global.
   · Si este archivo no carga, raw-core.js sigue igual que antes:
     comprueba window.AUTH antes de usarlo.
   · No habla con la API por apiPost — usaría el pase que todavía no
     existe. Hace su propio fetch, con el mismo Content-Type que exige
     Apps Script (text/plain;charset=utf-8, sin preflight CORS).

   CONSOLA
     AUTH.estado()        qué pase hay y cuándo vence
     AUTH.cerrarSesion()  borra el pase local y vuelve a pedir código
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CLAVE   = 'lifeos_pase_v1';
  var MARGEN  = 60000;   // ms: se da por vencido 1 min antes, por si acaso

  /* v9.17 — El pase vive en sessionStorage, NO en localStorage: se borra
     solo al cerrar la pestaña. Recargar no molesta; cerrar sí obliga a
     teclear el codigo otra vez.

     Consecuencias, para que no sorprendan:
     · Cada pestaña es una sesion aparte. Abrir la app en una pestaña
       nueva pide codigo aunque la otra siga abierta.
     · La app instalada (PWA) es su propio contexto: tambien pide.
     · El pase del servidor sigue durando 12 h. Esto es el cliente
       olvidandolo antes, no el backend acortandolo — el techo de arriba
       manda y no se puede estirar desde aqui.

     Para volver a "recordar 12 h", cambia ALMACEN a window.localStorage
     y sube el ?v= de este archivo. Nada mas. */
  var ALMACEN = window.sessionStorage;
  var _espera = null;    // promesa única mientras el modal está abierto

  /* ── Almacén del pase ─────────────────────────────────────────── */
  function _leer() {
    try {
      var s = ALMACEN.getItem(CLAVE);
      if (!s) return null;
      var o = JSON.parse(s);
      if (!o || !o.pase || !o.expira) return null;
      if (Date.now() > (o.expira - MARGEN)) return null;
      return o;
    } catch (e) { return null; }
  }

  function _guardar(pase, expira) {
    try { ALMACEN.setItem(CLAVE, JSON.stringify({ pase: pase, expira: expira })); }
    catch (e) { /* si el almacen falla, el pase vive solo en memoria */ }
  }

  function _borrar() {
    try { ALMACEN.removeItem(CLAVE); } catch (e) {}
  }

  function pase() { var o = _leer(); return o ? o.pase : null; }

  /* ── Petición de login (fetch propio, sin pasar por apiPost) ───── */
  function _urlApi() {
    if (typeof API_URL !== 'undefined' && API_URL) return API_URL;
    console.error('[AUTH] No encuentro API_URL. ¿raw-core.js cargó antes?');
    return null;
  }

  function _login(codigo) {
    var url = _urlApi();
    if (!url) return Promise.reject(new Error('Sin API_URL'));
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'authLogin', codigo: codigo })
    }).then(function (r) { return r.text(); })
      .then(function (t) {
        try { return JSON.parse(t); }
        catch (e) { throw new Error('El servidor no respondió JSON. Revisa el despliegue.'); }
      });
  }

  /* ── Modal ────────────────────────────────────────────────────── */
  var CSS = [
    '#lifeos-auth{position:fixed;inset:0;z-index:2147483000;display:flex;',
    'align-items:center;justify-content:center;background:#05070c;',
    'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}',
    '#lifeos-auth .la-caja{width:min(92vw,360px);padding:34px 30px 30px;',
    'border-radius:18px;background:#0d1119;border:1px solid #1e2634;',
    'box-shadow:0 24px 70px rgba(0,0,0,.6);text-align:center;}',
    '#lifeos-auth .la-marca{font-size:11px;letter-spacing:.24em;',
    'text-transform:uppercase;color:#5c6b82;margin:0 0 18px;}',
    '#lifeos-auth .la-titulo{font-size:19px;font-weight:600;color:#e8edf5;margin:0 0 6px;}',
    '#lifeos-auth .la-pie{font-size:13px;line-height:1.5;color:#7d8ba0;margin:0 0 22px;}',
    '#lifeos-auth input{width:100%;box-sizing:border-box;padding:14px 10px;',
    'font-size:30px;letter-spacing:.34em;text-align:center;font-weight:600;',
    'color:#e8edf5;background:#070b12;border:1px solid #253044;border-radius:12px;',
    'outline:none;transition:border-color .15s;font-variant-numeric:tabular-nums;}',
    '#lifeos-auth input:focus{border-color:#3d7dff;}',
    '#lifeos-auth input:disabled{opacity:.5;}',
    '#lifeos-auth.la-mal input{border-color:#e0525f;animation:la-tiembla .3s;}',
    '@keyframes la-tiembla{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}',
    '75%{transform:translateX(6px)}}',
    '#lifeos-auth .la-aviso{min-height:20px;margin:14px 0 0;font-size:13px;color:#e0525f;}',
    '#lifeos-auth .la-aviso.la-neutro{color:#7d8ba0;}',
    '#lifeos-auth .la-barra{height:2px;margin:18px 0 0;border-radius:2px;',
    'background:#1a2130;overflow:hidden;}',
    '#lifeos-auth .la-barra i{display:block;height:100%;background:#3d7dff;',
    'transform-origin:left;transition:transform .95s linear;}',
    '#lifeos-auth .la-nota{margin:12px 0 0;font-size:11px;color:#4d5a6f;}'
  ].join('');

  function _montar() {
    var est = document.createElement('style');
    est.id = 'lifeos-auth-css';
    est.textContent = CSS;
    document.head.appendChild(est);

    var el = document.createElement('div');
    el.id = 'lifeos-auth';
    el.innerHTML =
      '<div class="la-caja" role="dialog" aria-modal="true" aria-label="Acceso a LifeOS">' +
        '<p class="la-marca">LifeOS</p>' +
        '<h1 class="la-titulo">Codigo de acceso</h1>' +
        '<p class="la-pie">Los 6 digitos de Google Authenticator,<br>o un codigo de respaldo.</p>' +
        /* v9.22 — maxlength 9 y sin inputmode numerico: los codigos de
           respaldo son XXXX-XXXX y llevan letras. Con el filtro anterior
           (solo digitos, tope 6) eran imposibles de teclear. */
        '<input id="la-codigo" type="text" inputmode="text" autocomplete="one-time-code" ' +
               'autocapitalize="characters" spellcheck="false" ' +
               'maxlength="9" placeholder="000000" aria-label="Codigo de acceso">' +
        '<div class="la-barra"><i id="la-barra"></i></div>' +
        '<p class="la-aviso la-neutro" id="la-aviso">El codigo cambia cada 30 segundos.</p>' +
        '<p class="la-nota">La sesion termina al cerrar esta pestana.</p>' +
        '<p class="la-nota" style="margin-top:4px">Sin telefono: teclea un codigo de respaldo y pulsa Enter.</p>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  /* Barra que se vacía con la ventana de 30 s del TOTP. Es solo un
     indicador: el servidor tolera ±1 paso, así que un código tecleado
     justo en el cambio sigue sirviendo. */
  function _arrancarBarra() {
    var barra = document.getElementById('la-barra');
    if (!barra) return null;
    var pinta = function () {
      var restan = 30 - (Math.floor(Date.now() / 1000) % 30);
      barra.style.transform = 'scaleX(' + (restan / 30) + ')';
    };
    pinta();
    return setInterval(pinta, 950);
  }

  function _mostrar() {
    return new Promise(function (resolver) {
      var previo = document.getElementById('lifeos-auth');
      if (previo) previo.remove();

      var el      = _montar();
      var campo   = document.getElementById('la-codigo');
      var aviso   = document.getElementById('la-aviso');
      var reloj   = _arrancarBarra();
      var enVuelo = false;

      var decir = function (txt, neutro) {
        aviso.textContent = txt;
        aviso.className = 'la-aviso' + (neutro ? ' la-neutro' : '');
      };

      var cerrar = function (p) {
        if (reloj) clearInterval(reloj);
        var css = document.getElementById('lifeos-auth-css');
        if (css) css.remove();
        el.remove();
        resolver(p);
      };

      var enviar = function () {
        /* v9.22 — Ya no se limpia a digitos: eso borraba los codigos de
           respaldo. Se manda tal cual y el backend decide cual es. */
        var cod = (campo.value || '').trim();
        if (cod.length < 6 || enVuelo) return;
        enVuelo = true;
        campo.disabled = true;
        el.classList.remove('la-mal');
        decir('Verificando...', true);

        _login(cod).then(function (r) {
          if (r && r.ok && r.pase) {
            _guardar(r.pase, r.expira);
            /* Si entro con un respaldo se avisa: son finitos y no vuelven. */
            decir(r.conRespaldo ? (r.aviso || 'Listo.') : 'Listo.', true);
            setTimeout(function () { cerrar(r.pase); }, 250);
            return;
          }
          enVuelo = false;
          campo.disabled = false;
          campo.value = '';
          el.classList.add('la-mal');
          decir((r && r.mensaje) ? r.mensaje : 'No se pudo validar el codigo.');
          campo.focus();
        }).catch(function (err) {
          enVuelo = false;
          campo.disabled = false;
          el.classList.add('la-mal');
          decir('Sin conexion con el servidor: ' + err.message);
          campo.focus();
        });
      };

      campo.addEventListener('input', function () {
        /* Se permiten letras (respaldo) y digitos (TOTP). El guion se
           conserva por legibilidad; el backend lo ignora. */
        var limpio = (campo.value || '').toUpperCase()
                       .replace(/[^A-Z0-9-]/g, '').slice(0, 9);
        if (campo.value !== limpio) campo.value = limpio;
        el.classList.remove('la-mal');
        /* Se envia solo cuando son 6 digitos puros: el TOTP tiene largo
           fijo. Un respaldo se manda con Enter, porque si no se
           dispararia a medio teclear. */
        if (/^\d{6}$/.test(limpio)) enviar();
      });
      campo.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); enviar(); }
      });

      setTimeout(function () { try { campo.focus(); } catch (e) {} }, 60);
    });
  }

  /* ── API pública ──────────────────────────────────────────────── */
  /* Devuelve un pase válido, abriendo el modal solo si hace falta.

     Recibe el pase que acaba de ser rechazado (o null si no había).
     Eso resuelve el problema del arranque: la app dispara quince
     peticiones a la vez, las quince fallan, y las quince piden pase.
     - Si ya hay un pase DISTINTO del que falló, alguien lo renovó
       mientras tanto: se reutiliza y no se abre nada.
     - Si es el mismo, se borra y se pide código.
     - Mientras el modal está abierto, todas comparten una sola promesa.
     Sin esto, una petición lenta que llega tarde borraría el pase recién
     obtenido y volvería a abrir el modal encima. */
  function asegurarPase(paseCaducado) {
    var actual = pase();
    if (actual && actual !== paseCaducado) return Promise.resolve(actual);
    if (paseCaducado) _borrar();
    if (_espera) return _espera;
    _espera = _mostrar().then(function (p) { _espera = null; return p; },
                              function (e) { _espera = null; throw e; });
    return _espera;
  }

  function cerrarSesion() {
    _borrar();
    console.log('[AUTH] Pase borrado. Recarga la pagina para volver a entrar.');
    return true;
  }

  /* El pase no sale de esta pestaña, pero si el equipo es compartido
     conviene tirarlo al cerrar en vez de confiar en el navegador. */
  window.addEventListener('pagehide', function () { _borrar(); });

  function estado() {
    var o = _leer();
    var info = o
      ? { hayPase: true, vence: new Date(o.expira).toLocaleString(),
          minutosRestantes: Math.round((o.expira - Date.now()) / 60000) }
      : { hayPase: false };
    console.log('[AUTH]', JSON.stringify(info, null, 2));
    return info;
  }

  window.AUTH = {
    pase: pase,
    asegurarPase: asegurarPase,
    cerrarSesion: cerrarSesion,
    estado: estado
  };
})();
