// Offline support: keep the toolkit, its images and the handout on the device.
// Bump VERSION whenever any of these files change so phones pick up the update.
const VERSION = 'aitk-v4';
const CORE = [
  './', './index.html', './manifest.webmanifest', './handout.pdf',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './img/f1.jpg', './img/f2.jpg', './img/f3.jpg', './img/f4.jpg',
  './img/f5.jpg', './img/f6.jpg', './img/f7.jpg', './img/f8.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate';
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;   // leave outside links alone

  if (isPage) {
    // network first, so a fresh version shows when online; cached copy when offline
    // ('no-cache' revalidates with the server, so a fresh push shows up straight away)
    e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // everything else: cache first, then network (and remember it)
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
