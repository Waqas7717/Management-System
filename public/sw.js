// Minimal service worker so browsers offer "Install app". It does not cache anything,
// so the app always loads the latest version from the server.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
