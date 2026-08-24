const CACHE = 'finanzas-v1';
const ARCHIVOS = [
  './',
  './index.html',
  './css/styles.css',
  './js/calc.js',
  './js/storage.js',
  './js/ui.js',
  './js/main.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(claves => Promise.all(
        claves.filter(clave => clave !== CACHE).map(clave => caches.delete(clave))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evento => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;
  if (new URL(peticion.url).origin !== self.location.origin) return;

  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion)
        .then(respuesta => {
          const copia = respuesta.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', copia));
          return respuesta;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  evento.respondWith(
    caches.match(peticion).then(almacenado => {
      const desdeRed = fetch(peticion)
        .then(respuesta => {
          if (respuesta && respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE).then(cache => cache.put(peticion, copia));
          }
          return respuesta;
        })
        .catch(() => almacenado);
      return almacenado || desdeRed;
    })
  );
});
