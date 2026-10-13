// Offline support: keeps a copy of every app file on the iPad.
// Files are served from the saved copy first, and refreshed in the
// background when there is a connection, so updates show on the next launch.
// Bump VERSION when files are added or removed.

const VERSION = 'boba-m1-1';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/main.js',
  'js/open.js',
  'js/shift.js',
  'js/logic.js',
  'js/menu.js',
  'js/config.js',
  'js/strings.js',
  'js/text.js',
  'js/assets.js',
  'js/audio.js',
  'js/character.js',
  'js/ui.js',
  'assets/app/icon-180.png',
  'assets/app/icon-192.png',
  'assets/app/icon-512.png',
  'assets/characters/boss.svg',
  'assets/characters/mochi.svg',
  'assets/characters/bao.svg',
  'assets/characters/taro.svg',
  'assets/icons/bell.svg',
  'assets/icons/check.svg',
  'assets/icons/clear.svg',
  'assets/icons/coin.svg',
  'assets/icons/drink.svg',
  'assets/icons/speaker.svg',
  'assets/icons/star.svg',
  'assets/icons/tea-matcha.svg',
  'assets/icons/tea-milk.svg',
  'assets/icons/tea-taro.svg',
  'assets/icons/topping-hearts.svg',
  'assets/icons/topping-jelly.svg',
  'assets/icons/topping-pearls.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const saved = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req)
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (saved) { e.waitUntil(fresh); return saved; }
      return (await fresh) || new Response('Offline', { status: 503 });
    }),
  );
});
