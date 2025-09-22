// Service Worker for performance and offline support
const CACHE_NAME = 'pawsitivepeace-v2';
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
    '/assets/css/styles.css',
    '/assets/js/script.js',
    '/assets/js/catalog.js',
    '/assets/js/contact.js',
    '/assets/js/config-loader.js',
    '/assets/js/cart-manager.js',
    '/assets/js/animations.js',
    '/assets/js/dom-cache.js',
    '/assets/js/utilities.js',
    '/assets/js/app-config.js',
    '/assets/js/product-tabs.js',
    '/assets/js/ui-interactions.js',
    '/assets/js/form-handlers.js',
    '/assets/js/product-functions.js',
    '/assets/js/image-gallery.js',
    '/assets/js/gif-player.js',
    '/assets/js/memory-manager.js',
    '/assets/js/cart-operations.js',
    '/assets/js/quick-add-cart.js'
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
