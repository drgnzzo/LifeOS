/* LifeOS — Service Worker v.7.096
   PWA mínimo y honesto.
   · Cachea la "concha" de la app (shell): HTML, CSS, JS, iconos.
   · No cachea llamadas a la API (Apps Script) — esas siempre van a la
     red, así los datos están frescos.
   · Estrategia: network-first para la navegación (HTML), cache-first
     para los assets estáticos. Si la red falla y hay caché, sirve
     caché; si no, falla limpio.
   · Cuando subas una versión nueva del SW, incrementa CACHE_NAME
     (cambiando el número) para que se invaliden los archivos viejos.
*/
const CACHE_NAME = 'lifeos-e6t-13';
/* SHELL — v9.13
   Solo los assets que el HTML pide SIN `?v=`. El resto (todos los raw-*.js
   y .css) llevan query de versión, y `caches.match(req)` NO ignora la
   query: precachearlos aquí sin `?v=` creaba entradas que nunca se
   usaban —30 descargas muertas en cada instalación, incluidos 5 archivos
   de v11 que la app ni carga—.

   Los versionados se cachean solos en su primera petición (el handler
   `fetch` de abajo hace `c.put(req, copy)`), y el bump de `?v=` los
   invalida de forma natural. Un solo mecanismo, sin lista que mantener. */
const SHELL = [
  '/LifeOS/',
  '/LifeOS/index.html',
  '/LifeOS/icon-192.png',
  '/LifeOS/icon-512.png',
  '/LifeOS/manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(SHELL).catch(()=>{}))   // tolera fallos individuales
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                    // POST, etc. siempre red
  const url = new URL(req.url);

  // Apps Script / Google APIs / Sheets → siempre red, datos frescos.
  if (url.hostname.endsWith('googleusercontent.com') ||
      url.hostname.endsWith('script.google.com')     ||
      url.hostname.endsWith('googleapis.com')) {
    return;   // dejar al navegador hacer su petición normal
  }

  // Navegación (HTML): network-first → caché como respaldo.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/LifeOS/index.html')))
    );
    return;
  }

  // Assets estáticos: cache-first.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(()=>{});
      }
      return res;
    }).catch(() => caches.match(req)))
  );
});
