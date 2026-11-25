// Service worker: network first, cache as a fallback so the app also opens offline.
// While you develop, you always get the latest files from the server.

const CACHE = 'foodai-v1';
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
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html')))
  );
});
