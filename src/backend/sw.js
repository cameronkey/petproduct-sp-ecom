// Service Worker for performance and offline support
const CACHE_NAME = 'reciperush-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/catalog.html',
    '/contact.html',
    '/privacy-policy.html',
    '/terms-of-service.html',
    '/refund-policy.html',
    '/cancel.html',
    '/success.html',
    '/styles.css',
    '/script.js',
    '/catalog.js',
    '/contact.js',
    '/js/config-loader.js',
    '/js/cart-manager.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Use Promise.allSettled for safer caching - won't fail if some files are missing
                return Promise.allSettled(
                    urlsToCache.map(url =>
                        cache.add(url).catch(err => {
                            console.warn(`Failed to cache ${url}:`, err);
                            return null; // Continue with other files
                        })
                    )
                );
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
