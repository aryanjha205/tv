const CACHE_NAME = 'ott-pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/admin.html',
    '/css/style.css',
    '/js/app.js',
    '/js/player.js',
    '/js/admin.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    // Don't cache API requests
    if (event.request.url.includes('/api/')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
