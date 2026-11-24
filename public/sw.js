// Solo se guarda el aviso público: nunca documentos, respuestas API ni sesiones.
const CACHE = 'gestion-documental-offline-v1';
const OFFLINE = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('gestion-documental-offline-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate' || event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Limitar el fallback a rutas de la interfaz, sin interceptar API ni archivos.
  if (
    !/^\/(?:$|login\/?$|registro\/?$|(?:kiosko|tablet|calendario|firmas|usuarios|documentos|vehiculos|transportistas|conductores|trabajadores|materiales|entregas)(?:\/|$))/.test(
      url.pathname,
    )
  )
    return;
  if (/\.[a-z0-9]+$/i.test(url.pathname)) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});
