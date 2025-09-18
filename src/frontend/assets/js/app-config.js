/**
 * Application Configuration
 * Centralized configuration for all hardcoded values and constants
 * Excludes cart-related configuration (handled separately)
 */

const AppConfig = {
    // DOM Selectors
    selectors: {
        // Banner elements
        banners: {
            bannerText: 'bannerText',
            bottomBannerText: 'bottomBannerText',
            saleEndsBannerText: 'saleEndsBannerText'
        },
        
        // Notification elements
        notifications: {
            container: '.notification',
            icon: '.notification-icon',
            message: '.notification-message',
            close: '.notification-close'
        },
        
        // Mobile menu elements
        mobile: {
            menu: '.mobile-menu',
            burger: '.burger-menu'
        },
        
        // Product elements
        product: {
            mainImage: 'mainImage',
            quantityInput: 'quantity',
            bundleOptions: 'input[name="bundle"]',
            bundleOptionElements: '.bundle-option',
            bundleTextElements: '.bundle-text'
        },
        
        // UI elements
        ui: {
            testimonials: '.testimonial-item',
            dots: '.dot',
            lazySections: '[data-lazy-load]',
            resultsSection: '.results-section',
            circleCharts: '.circle-chart',
            faqItems: '.faq-item'
        },
        
        // Form elements
        forms: {
            contact: 'contactForm',
            checkout: 'checkoutForm',
            checkoutItems: 'checkoutItems',
            checkoutTotal: 'checkoutTotal'
        },
        
        // Checkout form elements
        checkout: {
            submitButton: 'submit-button',
            buttonText: 'button-text',
            spinner: 'spinner',
            firstName: 'firstName',
            lastName: 'lastName',
            email: 'email'
        }
    },
    
    // Timing Constants
    timing: {
        // Animation timing
        testimonialInterval: 5000,
        staggerDelay: 200,
        animationFrame: 16,
        showDelay: 100,
        hideDelay: 300,
        defaultDuration: 4000,
        
        // Banner animation
        bannerRepeatCount: 20,
        
        // Progress ring animation
        progressRingFPS: 60,
        progressRingDuration: 1500
    },
    
    // UI Text Content
    text: {
        // Banner messages
        banners: {
            sales: 'SALES END TODAY',
            order: 'ORDER TODAY',
            customers: 'OVER 10,000 HAPPY CUSTOMERS',
            trending: 'FACEBOOKS #1 TRENDING PRODUCT',
            saleEnds: 'SALE ENDS TODAY',
            satisfiedCustomers: 'OVER 100,000+ SATISFIED CUSTOMERS'
        },
        
        // Notification icons
        icons: {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠',
            close: '×'
        },
        
        // Error messages
        errors: {
            cartModalNotFound: '❌ Cart modal element not found!',
            cartCountNotFound: '⚠️ Cart count element not found',
            cartCountMobileNotFound: '⚠️ Mobile cart count element not found',
            cartItemsNotFound: '⚠️ Cart items element not found',
            cartTotalNotFound: '⚠️ Cart total element not found',
            configurationNotLoaded: 'Pawsitive Peace configuration not loaded. Please refresh the page.',
            stripeKeyNotFound: 'Stripe publishable key not found in configuration. Please check server configuration.',
            cartEmpty: 'Your cart is empty'
        },
        
        // Success messages
        success: {
            cartManagerInitialized: '🛒 Cart manager initialized with',
            itemAddedToCart: '✅ Item added to cart:',
            itemRemovedFromCart: '🗑️ Item removed from cart',
            cartCleared: '🧹 Cart cleared',
            cartManagerCleanedUp: '🧹 Cart manager cleaned up',
            domCacheInitialized: '✅ DOM Cache initialized'
        }
    },
    
    // Animation Constants
    animation: {
        // Banner animation
        bannerSpacing: '2rem',
        bannerRepeatCount: 20,
        
        // Progress ring animation
        circumference: 226.2,
        threshold: 0.1,
        rootMargin: '50px',
        mobileThreshold: 0.7,
        desktopThreshold: 0.3,
        
        // Lazy loading
        lazyLoadThreshold: 0.1,
        lazyLoadRootMargin: '50px'
    },
    
    // Product Configuration
    product: {
        // Product ID prefix
        idPrefix: 'centy-liposomal-nad-bundle-',
        
        // Product image path
        imagePath: '../assets/images/recipe-rush-pdp-image-one.jpg',
        
        // Product display name prefix
        namePrefix: 'Centy – Liposomal NAD (',
        nameSuffix: ')'
    },
    
    // Analytics Configuration
    analytics: {
        pageTitle: 'Pawsitive Peace Home',
        currency: 'GBP'
    },
    
    // Memory Management
    memory: {
        cleanupEvents: ['beforeunload', 'visibilitychange']
    }
};

// Export for use in other modules
window.AppConfig = AppConfig;
