// RusingÂcademy Community — Service Worker
// Strategy: Network-first for API/auth, Cache-first for static assets
// NEVER serve stale content for auth, admin, or API routes

const CACHE_NAME = 'ra-community-v1';
const STATIC_CACHE = 'ra-static-v1';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Patterns that must NEVER be cached (always network)
const NETWORK_ONLY_PATTERNS = [
  /\/api\//,          // All API calls (tRPC, auth, webhooks)
  /\/oauth/,          // OAuth flows
  /\/admin/,          // Admin routes
  /\/ws/,             // WebSocket
  /\/stripe/,         // Stripe webhooks
  /umami/,            // Analytics
  /hot-update/,       // Vite HMR (dev only)
  /__vite/,           // Vite internals (dev only)
];

// Patterns for cache-first strategy (immutable static assets)
const CACHE_FIRST_PATTERNS = [
  /\.(?:js|css)$/,            // JS and CSS bundles (hashed filenames)
  /\.(?:png|jpg|jpeg|gif|svg|ico|webp)$/, // Images
  /\.(?:woff2?|ttf|eot)$/,   // Fonts
  /fonts\.googleapis\.com/,   // Google Fonts CSS
  /fonts\.gstatic\.com/,      // Google Fonts files
];

// Install: pre-cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-cache failed for some URLs:', err);
      });
    })
  );
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch: route-based caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests entirely
  if (request.method !== 'GET') return;

  // Skip cross-origin requests except fonts
  if (url.origin !== self.location.origin &&
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  // Network-only: API, auth, admin, WebSocket, analytics
  if (NETWORK_ONLY_PATTERNS.some((pattern) => pattern.test(url.pathname + url.search))) {
    return;
  }

  // Cache-first: static assets with hashed filenames
  if (CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname) || pattern.test(url.href))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first: HTML pages (SPA navigation)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: network-first for everything else
  event.respondWith(networkFirst(request));
});

// Cache-first strategy: try cache, fallback to network
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // If both cache and network fail, return a basic offline response
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network-first strategy: try network, fallback to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // For HTML requests, try returning cached index.html (SPA fallback)
    if (request.headers.get('accept')?.includes('text/html')) {
      const indexCached = await caches.match('/');
      if (indexCached) return indexCached;
    }

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}
