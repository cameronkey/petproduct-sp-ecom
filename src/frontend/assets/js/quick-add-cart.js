/**
 * Quick Add Cart Manager
 * Handles the expandable cart functionality for single product additions
 */

// Quick Add Cart Functionality
function initQuickAddCart() {
    const toggle = document.getElementById('quickAddToggle');
    const cart = document.getElementById('quickAddCart');
    
    if (!toggle || !cart) return;
    
    toggle.addEventListener('click', function() {
        const isActive = cart.classList.contains('active');
        
        if (isActive) {
            // Close cart
            cart.classList.remove('active');
            toggle.classList.remove('active');
        } else {
            // Open cart
            cart.classList.add('active');
            toggle.classList.add('active');
        }
    });
    
    // Close cart when clicking outside (optimized with passive listener)
    document.addEventListener('click', function(event) {
        if (!cart.contains(event.target) && !toggle.contains(event.target)) {
            cart.classList.remove('active');
            toggle.classList.remove('active');
        }
    }, { passive: true });
}

// Add single product to cart
function addSingleToCart() {
    const product = {
        id: 'complete',
        name: 'Pupsicle Complete Bundle',
        price: 20,
        originalPrice: 33,
        quantity: 1,
        image: '../assets/images/pp-pdp-image-one.jpg'
    };
    
    window.CartManager.addItem(product);
    updateCartDisplay();
    
    // Close the quick add cart
    const cart = document.getElementById('quickAddCart');
    const toggle = document.getElementById('quickAddToggle');
    if (cart && toggle) {
        cart.classList.remove('active');
        toggle.classList.remove('active');
    }
    
    // Show success message (optional)
    console.log('Product added to cart!');
}

// Export functions for global access
window.QuickAddCart = {
    init: initQuickAddCart,
    addSingleToCart: addSingleToCart
};
