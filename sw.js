// Offline support: keeps a copy of every app file on the iPad.
// Files are served from the saved copy first, and refreshed in the
// background when there is a connection, so updates show on the next launch.
// Bump VERSION when files are added or removed.

const VERSION = 'boba-m5-1';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/accessories/beanie.svg',
  'assets/accessories/bow.svg',
  'assets/accessories/bowtie.svg',
  'assets/accessories/cap.svg',
  'assets/accessories/crown.svg',
  'assets/accessories/flower.svg',
  'assets/accessories/glasses-heart.svg',
  'assets/accessories/glasses-round.svg',
  'assets/accessories/glasses-sun.svg',
  'assets/accessories/party.svg',
  'assets/accessories/scarf.svg',
  'assets/app/icon-180.png',
  'assets/app/icon-192.png',
  'assets/app/icon-512.png',
  'assets/cards/boba.jpg',
  'assets/cards/finish.jpg',
  'assets/cards/hearts.jpg',
  'assets/cards/howmuch.jpg',
  'assets/cards/ice.jpg',
  'assets/cards/jelly.jpg',
  'assets/cards/sugar.jpg',
  'assets/cards/tea.jpg',
  'assets/characters/bao.svg',
  'assets/characters/boss.svg',
  'assets/characters/dumpling.svg',
  'assets/characters/hop.svg',
  'assets/characters/mochi.svg',
  'assets/characters/momo.svg',
  'assets/characters/pebble.svg',
  'assets/characters/taro.svg',
  'assets/decor/balloons.svg',
  'assets/decor/clock.svg',
  'assets/decor/lights.svg',
  'assets/decor/pet.svg',
  'assets/decor/picture.svg',
  'assets/decor/plant.svg',
  'assets/decor/rug.svg',
  'assets/icons/badge-bowl.svg',
  'assets/icons/badge-day.svg',
  'assets/icons/badge-empty.svg',
  'assets/icons/badge-register.svg',
  'assets/icons/batch.svg',
  'assets/icons/bell.svg',
  'assets/icons/bowl-empty.svg',
  'assets/icons/bowl-full.svg',
  'assets/icons/bowls.svg',
  'assets/icons/brew-yes.svg',
  'assets/icons/brew.svg',
  'assets/icons/check.svg',
  'assets/icons/clear.svg',
  'assets/icons/coin.svg',
  'assets/icons/cross.svg',
  'assets/icons/cup-matcha.svg',
  'assets/icons/cup-milk.svg',
  'assets/icons/cup-taro.svg',
  'assets/icons/cups.svg',
  'assets/icons/drink.svg',
  'assets/icons/extra-yes.svg',
  'assets/icons/fresh-yes.svg',
  'assets/icons/ice-lots.svg',
  'assets/icons/ice-none.svg',
  'assets/icons/ice-some.svg',
  'assets/icons/lids.svg',
  'assets/icons/music-bubbly.svg',
  'assets/icons/music-dragon.svg',
  'assets/icons/music-off.svg',
  'assets/icons/music-rainy.svg',
  'assets/icons/music-sunny.svg',
  'assets/icons/radio.svg',
  'assets/icons/rail.svg',
  'assets/icons/register.svg',
  'assets/icons/size-large.svg',
  'assets/icons/size-small.svg',
  'assets/icons/speaker.svg',
  'assets/icons/star.svg',
  'assets/icons/sugar-lots.svg',
  'assets/icons/sugar-none.svg',
  'assets/icons/sugar-some.svg',
  'assets/icons/tea-matcha.svg',
  'assets/icons/tea-milk.svg',
  'assets/icons/tea-taro.svg',
  'assets/icons/ticket.svg',
  'assets/icons/tickets.svg',
  'assets/icons/topping-hearts.svg',
  'assets/icons/topping-jelly.svg',
  'assets/icons/topping-none.svg',
  'assets/icons/topping-pearls.svg',
  'css/style.css',
  'js/assets.js',
  'js/audio.js',
  'js/before.js',
  'js/catalog.js',
  'js/character.js',
  'js/closing.js',
  'js/config.js',
  'js/decor.js',
  'js/decorview.js',
  'js/howto.js',
  'js/jobs.js',
  'js/logic.js',
  'js/main.js',
  'js/meet.js',
  'js/menu.js',
  'js/music.js',
  'js/open.js',
  'js/orderview.js',
  'js/pause.js',
  'js/radio.js',
  'js/settings.js',
  'js/shift.js',
  'js/storage.js',
  'js/strings.js',
  'js/text.js',
  'js/tutorial.js',
  'js/ui.js',
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
