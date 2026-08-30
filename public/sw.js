// Service worker escrito a mano (sin Workbox): para 4 pantallas y un
// puñado de rutas de API no hace falta esa dependencia — esto es más
// liviano y más fácil de leer entero de una sentada.
//
// Qué hace:
// 1. Cachea el "shell" de la app (HTML/JS/CSS/imágenes propias) para que
//    la PWA abra instantáneo en visitas repetidas y funcione, degradada,
//    sin conexión.
// 2. Cachea las respuestas de la API (network-first, con fallback a lo
//    último guardado) — no para reemplazar el cache del backend, sino
//    para que en un 3G/4G inestable la app no se quede en blanco
//    esperando, y para gastar menos datos del plan del usuario en
//    navegaciones repetidas al mismo día/partido.
//
// /api/quota se deja pasar sin cachear: es gratis, local, y siempre
// tiene que reflejar el número real.

const CACHE_VERSION = "v1";
const SHELL_CACHE = `partidos-shell-${CACHE_VERSION}`;
const API_CACHE = `partidos-api-${CACHE_VERSION}`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== API_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // /api/quota nunca se cachea.
  if (url.pathname === "/api/quota") return;

  // Llamadas a la API (mismo origen o el backend en otro dominio — el
  // fetch del frontend ya pega con CORS, así que la respuesta es legible
  // y cacheable igual): red primero, y si no hay conexión (o el backend
  // de Render está durmiendo y tarda), lo último que haya guardado.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Solo cacheamos el shell de nuestro propio origen (HTML/JS/CSS/fuentes/
  // imágenes) — no tocamos requests a otros orígenes que no sean la API
  // (ej. Google Fonts ya tiene su propio cache HTTP de largo plazo).
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Abrir/recargar la app: red primero, con el shell cacheado como red
    // de contención si no hay conexión.
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // JS/CSS/imágenes propias: stale-while-revalidate — responde con lo
  // cacheado al toque (si hay) y actualiza en segundo plano. Como Vite
  // hashea los nombres de archivo por build, un deploy nuevo simplemente
  // pide un archivo con otro nombre — no hay riesgo de servir JS viejo
  // mezclado con HTML nuevo.
  event.respondWith(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
