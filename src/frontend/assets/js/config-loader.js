/**
 * Simple Configuration Loader
 * Just loads config and other scripts - no complex logic
 */

(function() {
    'use strict';

    // Load configuration
    async function loadConfiguration() {
        try {
            // Determine the base URL based on environment
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const baseUrl = isLocal ? 'http://localhost:3000' : 'https://pawsitivepeace-backend.onrender.com';
            const configUrl = `${baseUrl}/api/config`;
            
            console.log(`🔧 Loading configuration from: ${configUrl}`);
            
            const response = await fetch(configUrl);
            if (!response.ok) {
                throw new Error(`Failed to load configuration: ${response.status}`);
            }
            const config = await response.json();
            window.PAWSITIVE_PEACE_CONFIG = Object.freeze(config);
            
            console.log('✅ Configuration loaded successfully');
            
            // Signal that configuration is ready
            window.dispatchEvent(new CustomEvent('configReady', { detail: config }));
        } catch (error) {
            console.error('❌ Configuration failed:', error);
            throw error;
        }
    }

    // Load script
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    // Initialize
    async function initialize() {
        try {
            await loadConfiguration();
            
            // Only load cart-manager.js if not already loaded
            if (!window.cartManagerLoaded) {
                await loadScript('js/cart-manager.js');
                window.cartManagerLoaded = true;
            }
            
            // Don't load script.js, catalog.js, or contact.js - they're already loaded by HTML
            // This prevents duplicate loading and conflicts
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
        }
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();