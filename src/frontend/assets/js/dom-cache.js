/**
 * DOM Cache System
 * Centralized DOM element caching for performance optimization
 * Reduces repeated DOM queries and improves performance
 */

// DOM Cache System - stores frequently used elements for performance
const DOMCache = {
    // Cart elements
    cart: {
        modal: null,
        count: null,
        countMobile: null,
        items: null,
        total: null
    },
    
    // Mobile menu elements
    mobile: {
        menu: null,
        burger: null
    },
    
    // Form elements
    forms: {
        contact: null,
        checkout: null,
        checkoutItems: null,
        checkoutTotal: null
    },
    
    // Checkout form elements
    checkout: {
        submitButton: null,
        buttonText: null,
        spinner: null,
        firstName: null,
        lastName: null,
        email: null
    },
    
    // Product elements
    product: {
        mainImage: null,
        quantityInput: null,
        bundleOptions: null,
        bundleOptionElements: null,
        bundleTextElements: null
    },
    
    // UI elements
    ui: {
        testimonials: null,
        dots: null,
        lazySections: null,
        resultsSection: null,
        circleCharts: null,
        faqItems: null
    },
    
    // Banner elements
    banners: {
        bannerText: null,
        bottomBannerText: null,
        saleEndsBannerText: null
    },
    
    // Initialize cache - call this after DOM is ready
    init() {
        // Cart elements
        this.cart.modal = document.getElementById('cartModal');
        this.cart.count = document.getElementById('cartCount');
        this.cart.countMobile = document.getElementById('cartCountMobile');
        this.cart.items = document.getElementById('cartItems');
        this.cart.total = document.getElementById('cartTotal');
        
        // Mobile menu elements
        this.mobile.menu = document.querySelector('.mobile-menu');
        this.mobile.burger = document.querySelector('.burger-menu');
        
        // Form elements
        this.forms.contact = document.getElementById('contactForm');
        this.forms.checkout = document.getElementById('checkoutForm');
        this.forms.checkoutItems = document.getElementById('checkoutItems');
        this.forms.checkoutTotal = document.getElementById('checkoutTotal');
        
        // Checkout form elements
        this.checkout.submitButton = document.getElementById('submit-button');
        this.checkout.buttonText = document.getElementById('button-text');
        this.checkout.spinner = document.getElementById('spinner');
        this.checkout.firstName = document.getElementById('firstName');
        this.checkout.lastName = document.getElementById('lastName');
        this.checkout.email = document.getElementById('email');
        
        // Product elements
        this.product.mainImage = document.getElementById('mainImage');
        this.product.quantityInput = document.getElementById('quantity');
        this.product.bundleOptions = document.querySelectorAll('input[name="bundle"]');
        this.product.bundleOptionElements = document.querySelectorAll('.bundle-option');
        this.product.bundleTextElements = document.querySelectorAll('.bundle-text');
        
        // UI elements
        this.ui.testimonials = document.querySelectorAll('.testimonial-item');
        this.ui.dots = document.querySelectorAll('.dot');
        this.ui.lazySections = document.querySelectorAll('[data-lazy-load]');
        this.ui.resultsSection = document.querySelector('.results-section');
        this.ui.circleCharts = document.querySelectorAll('.circle-chart');
        this.ui.faqItems = document.querySelectorAll('.faq-item');
        
        // Banner elements
        this.banners.bannerText = document.getElementById('bannerText');
        this.banners.bottomBannerText = document.getElementById('bottomBannerText');
        this.banners.saleEndsBannerText = document.getElementById('saleEndsBannerText');
        
        console.log('✅ DOM Cache initialized');
    },
    
    // Helper method to get element with fallback
    get(selector, fallback = null) {
        const element = document.querySelector(selector);
        return element || fallback;
    },
    
    // Helper method to get element by ID with fallback
    getById(id, fallback = null) {
        const element = document.getElementById(id);
        return element || fallback;
    }
};

// Export for use in other modules
window.DOMCache = DOMCache;
