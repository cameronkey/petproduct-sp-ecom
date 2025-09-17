/**
 * Main Application Script
 * Initializes the application and coordinates all modules
 */

// DOM elements - will be initialized after DOM is ready
let cartModal, cartCount, cartCountMobile, cartItems, cartTotal;

// Cart operations now handled by CartManager
window.cartOperations = {
    getCart: () => window.CartManager.getItems(),
    getCartLength: () => window.CartManager.getCount(),
    getCartTotal: () => window.CartManager.getTotal()
};

// Cart will be loaded when DOM is ready, not immediately

// Stripe Configuration - Loaded securely from server configuration
// SECURITY: No hardcoded keys present - keys loaded from /api/config endpoint

// Initialize DOM cache and core elements
function initializeDOMCache() {
    DOMCache.init();
    
    // Initialize DOM elements from cache
    cartModal = DOMCache.cart.modal;
    cartCount = DOMCache.cart.count;
    cartCountMobile = DOMCache.cart.countMobile;
    cartItems = DOMCache.cart.items;
    cartTotal = DOMCache.cart.total;
}

// Validate required DOM elements
function validateDOMElements() {
    if (!cartModal) {
        console.error(AppConfig.text.errors.cartModalNotFound);
    }

    if (!cartCount) {
        console.warn(AppConfig.text.errors.cartCountNotFound);
    }

    if (!cartCountMobile) {
        console.warn(AppConfig.text.errors.cartCountMobileNotFound);
    }

    if (!cartItems) {
        console.warn(AppConfig.text.errors.cartItemsNotFound);
    }

    if (!cartTotal) {
        console.warn(AppConfig.text.errors.cartTotalNotFound);
    }
}

// Initialize all banner animations
function initializeBannerAnimations() {
    initBannerAnimation();
    initBottomBannerAnimation();
    initSaleEndsBannerAnimation();
}

// Initialize core application features
function initializeCoreFeatures() {
    // Initialize lazy loading for sections
    initLazyLoading();
    
    // Initialize quick add cart
    if (window.QuickAddCart) {
        window.QuickAddCart.init();
    }
    
    // Initialize bundle selection
    initBundleSelection();
    
    // Initialize product data
    updateProductData();
}

// Setup configuration validation
function setupConfigurationValidation() {
    // Wait for configuration to be loaded before validating
    if (window.RECIPE_RUSH_CONFIG) {
        validateConfiguration();
    } else {
        // Listen for configuration ready event from config-loader.js
        if (window.MemoryManager) {
            MemoryManager.addEventListener(window, 'configReady', () => {
                validateConfiguration();
            }, { once: true });
        } else {
            window.addEventListener('configReady', () => {
                validateConfiguration();
            }, { once: true });
        }
    }
}

// Validate external dependencies
function validateExternalDependencies() {
    // Check if Stripe is available (only log if we're on a page that needs it)
    if (typeof Stripe !== 'undefined') {
        // Stripe library loaded successfully
    } else {
        // Only show error on pages that actually need Stripe (like checkout)
        if (window.location.pathname.includes('checkout') || window.location.pathname.includes('payment')) {
            console.error('❌ Stripe library not found! Check if script is loaded');
        }
    }
}

// Setup analytics and tracking
function setupAnalytics() {
    // Track page view
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: AppConfig.analytics.pageTitle,
            page_location: window.location.href
        });
    }
}

// Initialize event listeners and interactions
function initializeEventListeners() {
    // Cart is now managed by CartManager
    updateCartDisplay();
    setupEventListeners();
    
    // Initialize testimonials slider
    startTestimonialInterval();
    
    // Add scroll listener for cart modal positioning (already optimized with passive: true)
    if (window.MemoryManager) {
        MemoryManager.addEventListener(window, 'scroll', updateCartModalPosition, { passive: true });
    } else {
        window.addEventListener('scroll', updateCartModalPosition, { passive: true });
    }
    
    // Initialize progress ring animations
    initProgressRingAnimations();
}

// Handle initialization errors
function handleInitializationError(error) {
    console.error('❌ Configuration validation failed:', error);
    // Show user-friendly error message
    document.body.innerHTML = `
        <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;">
            <h1>Configuration Error</h1>
            <p>Failed to initialize application. Please refresh the page.</p>
            <p>Error: ${error.message}</p>
        </div>
    `;
}

// Initialize the application
function initializeApp() {
    try {
        // Initialize DOM cache first
        initializeDOMCache();
        
        // Initialize banner animations
        initializeBannerAnimations();
        
        // Initialize core features
        initializeCoreFeatures();
        
        // Validate required elements
        validateDOMElements();
        
        // Setup configuration validation
        setupConfigurationValidation();
        
        // Validate external dependencies
        validateExternalDependencies();
        
        // Setup analytics
        setupAnalytics();
        
        // Initialize event listeners
        initializeEventListeners();

    } catch (error) {
        handleInitializationError(error);
    }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    if (window.MemoryManager) {
        MemoryManager.addEventListener(document, 'DOMContentLoaded', initializeApp);
    } else {
        document.addEventListener('DOMContentLoaded', initializeApp);
    }
} else {
    // DOM is already ready, initialize immediately
    initializeApp();
}

// Export functions for use in other scripts
window.recipeRush = {
    addToCart,
    removeFromCart,
    updateQuantity,
    openCart,
    closeCart,
    changeImage,
    increaseQuantity,
    decreaseQuantity
};

// Make functions globally available for HTML onclick handlers
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.openCart = openCart;
window.closeCart = closeCart;
window.changeImage = changeImage;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.showCheckoutForm = showCheckoutForm;
window.closeCheckout = closeCheckout;
window.openUserMenu = openUserMenu;
window.initBundleSelection = initBundleSelection;
window.updateProductData = updateProductData;