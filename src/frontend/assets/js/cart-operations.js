/**
 * Cart Operations Module
 * Handles all cart-related functionality including add, remove, update, and display
 */

// Cart functionality
function addToCart() {
    const quantity = 1;
    
    // Use current product data if available, otherwise fallback to default
    let product;
    
    if (window.currentProduct) {
        product = {
            ...window.currentProduct,
            quantity: quantity
        };
    } else {
        // Fallback for old product layout
        product = {
            id: 'complete',
            name: 'Complete Bundle',
            price: 20,
            originalPrice: 33,
            quantity: quantity,
            image: '../assets/images/pp-pdp-image-one.jpg'
        };
    }

    // Use the cart manager to add the item
    window.CartManager.addItem(product);
    
    // Track add to cart event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'add_to_cart', {
            items: [{
                item_id: product.id,
                item_name: product.name,
                price: product.price,
                currency: 'GBP'
            }],
            value: product.price,
            currency: 'GBP'
        });
    }
    
    // Get product name for notification
    const productName = 'The Pupsicle';
    showNotification(`${productName} added to cart!`, 'success', 2000);
    
    // Trigger cart badge pulse animation
    if (window.pulseCartBadge) {
        pulseCartBadge();
    }
}

function removeFromCart(productId) {
    window.CartManager.removeItem(productId);
    showNotification('Item removed from cart!', 'info', 2000);
}

function updateQuantity(productId, newQuantity) {
    window.CartManager.updateQuantity(productId, newQuantity);
}

// Cart display is now handled by CartManager
function updateCartDisplay() {
    if (window.CartManager && typeof window.CartManager.updateDisplay === 'function') {
        window.CartManager.updateDisplay();
    } else {
        console.warn('⚠️ CartManager not available yet, skipping cart display update');
        // Retry after a short delay
        const retryTimer = setTimeout(() => {
            if (window.CartManager && typeof window.CartManager.updateDisplay === 'function') {
                // CartManager now available, updating display
                window.CartManager.updateDisplay();
            }
        }, 500);
        MemoryManager.addTimer(retryTimer, 'timeout');
    }
}

// Modal functions
function updateCartModalPosition() {
    const cartModal = DOMCache.cart.modal;
    if (!cartModal) return;
    
    const modalContent = cartModal.querySelector('.modal-content');
    if (!modalContent) return;
    
    const scrollY = window.scrollY;
    const isAtTop = scrollY <= 10; // Small threshold for "at top"
    
    // Check if animated banner exists on this page
    const hasAnimatedBanner = document.getElementById(AppConfig.selectors.banners.bannerText) !== null;
    
    if (isAtTop) {
        modalContent.classList.remove('scrolled');
        // Adjust top position based on whether banner exists
        if (hasAnimatedBanner) {
            modalContent.style.top = '130px'; // With banner
        } else {
            modalContent.style.top = '80px'; // Without banner
        }
    } else {
        modalContent.classList.add('scrolled');
        // When scrolled, position below header regardless of banner
        modalContent.style.top = '82px';
    }
}

function openCart() {
    const cartModal = DOMCache.cart.modal;
    if (!cartModal) {
        console.warn('⚠️ Cart modal not initialized yet, waiting for initialization...');
        // Wait for cart to be initialized
        const checkInterval = setInterval(() => {
            const modal = DOMCache.cart.modal;
            if (modal) {
                MemoryManager.clearTimer(checkInterval);
                // Cart modal now available, opening cart
                modal.style.display = 'block';
                updateCartModalPosition();
                const showTimer = setTimeout(() => modal.classList.add('show'), 10);
                MemoryManager.addTimer(showTimer, 'timeout');
            }
        }, 100);
        MemoryManager.addTimer(checkInterval, 'interval');
        
        // Timeout after 5 seconds
        const timeoutTimer = setTimeout(() => {
            MemoryManager.clearTimer(checkInterval);
            if (!DOMCache.cart.modal) {
                console.error('❌ Cart modal failed to initialize after 5 seconds');
                alert('Cart system is still loading. Please refresh the page and try again.');
            }
        }, 5000);
        MemoryManager.addTimer(timeoutTimer, 'timeout');
        return;
    }
    cartModal.style.display = 'block';
    updateCartModalPosition();
    const showTimer = setTimeout(() => cartModal.classList.add('show'), 10);
    MemoryManager.addTimer(showTimer, 'timeout');
}

function closeCart() {
    const cartModal = DOMCache.cart.modal;
    if (!cartModal) {
        console.error('❌ Cart modal not initialized. Please refresh the page.');
        return;
    }
    cartModal.classList.remove('show');
    const hideTimer = setTimeout(() => {
        cartModal.style.display = 'none';
    }, 300);
    MemoryManager.addTimer(hideTimer, 'timeout');
}

// Export functions for global access
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.updateCartDisplay = updateCartDisplay;
window.openCart = openCart;
window.closeCart = closeCart;
window.updateCartModalPosition = updateCartModalPosition;
