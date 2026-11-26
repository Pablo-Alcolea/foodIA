// Service worker: network first, cache as a fallback so the app also opens offline.
// While you develop, you always get the latest files from the server.
// Recipe photos (assets/recipes/) are not precached: each one is cached the first time it is shown.

const CACHE = 'foodai-v2';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'data/recipes.json', 'data/ingredients.json',
  'js/main.js', 'js/store.js', 'js/router.js', 'js/config.js',
  'js/lib/dates.js', 'js/lib/utils.js', 'js/lib/dom.js',
  'js/domain/catalog.js', 'js/domain/fridge.js', 'js/domain/stats.js', 'js/domain/recipes.js', 'js/domain/demo.js',
  'js/services/recognition.js', 'js/ui/icons.js', 'js/ui/components.js',
  'js/views/home.js', 'js/views/scan.js', 'js/views/recipe.js', 'js/views/cook.js', 'js/views/fridge.js',
  'js/views/shopping.js', 'js/views/calendar.js', 'js/views/discover.js', 'js/views/favorites.js', 'js/views/profile.js',
  'assets/icon.svg', 'assets/icon-192.png', 'assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // Always ask the server whether code and data changed (a quick 304 if not), so a new
  // version shows up on the next reload. Photos rarely change and may come from the HTTP cache.
  const fresh = url.pathname.includes('/assets/recipes/') ? fetch(req) : fetch(req, { cache: 'no-cache' });
  event.respondWith(
    fresh
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html')))
  );
});
