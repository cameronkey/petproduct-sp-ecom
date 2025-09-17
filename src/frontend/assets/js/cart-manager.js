/**
 * E-commerce Cart Manager
 * Handles cart persistence across page navigation
 * Uses IIFE pattern to avoid global namespace pollution
 */

(function() {
    'use strict';

    // Check if namespace already exists to prevent overwrites
    if (window.EcommerceApp && window.EcommerceApp.cart) {
        console.warn('⚠️ E-commerce cart already exists, skipping initialization');
        return;
    }

    // Create or extend the main namespace
    if (!window.EcommerceApp) {
        window.EcommerceApp = {};
    }

    // Cart implementation
    const cart = {
        items: [],

        // Initialize cart from localStorage
        init() {
            this.loadFromStorage();
            this.updateDisplay();
            this.setupEventListeners();
            console.log('🛒 Cart manager initialized with', this.items.length, 'items');
        },

        // Setup event listeners with MemoryManager integration
        setupEventListeners() {
            // Setup cart button event delegation
            if (window.MemoryManager) {
                MemoryManager.addEventListener(document, 'click', this.handleCartButtonClick.bind(this));
            } else {
                document.addEventListener('click', this.handleCartButtonClick.bind(this));
            }
        },

        // Handle cart button clicks with event delegation
        handleCartButtonClick(event) {
            const target = event.target;
            const cartItem = target.closest('.cart-item');
            
            if (!cartItem) return;
            
            const itemId = cartItem.getAttribute('data-item-id');
            if (!itemId) return;
            
            const action = target.getAttribute('data-action');
            
            // Handle quantity decrease
            if (action === 'decrease') {
                const item = this.items.find(i => i.id === itemId);
                if (item) {
                    this.updateQuantity(itemId, item.quantity - 1);
                }
            }
            
            // Handle quantity increase
            if (action === 'increase') {
                const item = this.items.find(i => i.id === itemId);
                if (item) {
                    this.updateQuantity(itemId, item.quantity + 1);
                }
            }
            
            // Handle remove button
            if (action === 'remove') {
                this.removeItem(itemId);
            }
        },

        // Add item to cart
        addItem(product) {
            if (!product || typeof product.id === 'undefined' || typeof product.quantity !== 'number' || product.quantity <= 0) {
                console.error('❌ Invalid product data:', product);
                return;
            }

            const existingIndex = this.items.findIndex(item => item.id === product.id);

            if (existingIndex > -1) {
                this.items[existingIndex].quantity += product.quantity;
            } else {
                this.items.push(product);
            }

            this.saveToStorage();
            this.updateDisplay();
            
            // Track add to cart event for analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'add_to_cart', {
                    items: [{
                        item_id: product.id,
                        item_name: product.name,
                        price: product.price,
                        currency: 'GBP',
                        quantity: product.quantity
                    }],
                    value: product.price * product.quantity,
                    currency: 'GBP'
                });
            }
            
            console.log('✅ Item added to cart:', product.name);
        },

        // Remove item from cart
        removeItem(productId) {
            this.items = this.items.filter(item => item.id !== productId);
            this.saveToStorage();
            this.updateDisplay();
            console.log('🗑️ Item removed from cart');
        },

        // Update item quantity
        updateQuantity(productId, newQuantity) {
            const item = this.items.find(item => item.id === productId);
            if (item) {
                if (newQuantity <= 0) {
                    this.removeItem(productId);
                } else {
                    item.quantity = newQuantity;
                    this.saveToStorage();
                    this.updateDisplay();
                }
            }
        },

        // Get cart items
        getItems() {
            return [...this.items];
        },

        // Get cart total
        getTotal() {
            return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        },

        // Get cart count
        getCount() {
            return this.items.reduce((sum, item) => sum + item.quantity, 0);
        },

        // Save cart to localStorage
        saveToStorage() {
            try {
                localStorage.setItem('recipeRushCart', JSON.stringify(this.items));
            } catch (error) {
                console.error('❌ Failed to save cart to localStorage:', error);
            }
        },

        // Load cart from localStorage
        loadFromStorage() {
            try {
                const savedCart = localStorage.getItem('recipeRushCart');
                if (savedCart) {
                    this.items = JSON.parse(savedCart);
                }
            } catch (error) {
                console.error('❌ Failed to load cart from localStorage:', error);
                this.items = [];
            }
        },

        // Update cart display using cached DOM elements
        updateDisplay() {
            this.updateCartCounts();
            this.updateCartItems();
            this.updateCartTotal();
            
            // Return whether all target DOM nodes were found
            return !!(DOMCache.cart.count && DOMCache.cart.items && DOMCache.cart.total);
        },

        // Update cart counts (desktop and mobile)
        updateCartCounts() {
            const count = this.getCount();
            
            if (DOMCache.cart.count) {
                DOMCache.cart.count.textContent = count;
            }
            
            if (DOMCache.cart.countMobile) {
                DOMCache.cart.countMobile.textContent = count;
            }
        },

        // Update cart items display
        updateCartItems() {
            if (!DOMCache.cart.items) return;
            
            DOMCache.cart.items.innerHTML = '';

            if (this.items.length === 0) {
                this.createEmptyCartMessage();
            } else {
                this.items.forEach(item => {
                    this.createCartItem(item);
                });
            }
        },

        // Create empty cart message
        createEmptyCartMessage() {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'cart-empty';
            emptyMessage.textContent = 'Your cart is empty';
            DOMCache.cart.items.appendChild(emptyMessage);
        },

        // Create individual cart item
        createCartItem(item) {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.setAttribute('data-item-id', item.id); // Add data attribute for event delegation

            // Product image
            const img = this.createCartItemImage(item);
            
            // Product details
            const details = this.createCartItemDetails(item);
            
            // Actions section
            const actions = this.createCartItemActions(item);

            cartItem.appendChild(img);
            cartItem.appendChild(details);
            cartItem.appendChild(actions);
            DOMCache.cart.items.appendChild(cartItem);
        },

        // Create cart item image
        createCartItemImage(item) {
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name;
            img.className = 'cart-item-image';
            return img;
        },

        // Create cart item details
        createCartItemDetails(item) {
            const details = document.createElement('div');
            details.className = 'cart-item-details';

            const nameHeader = document.createElement('h4');
            nameHeader.className = 'cart-item-name';
            nameHeader.textContent = item.name;

            const stockBadge = document.createElement('span');
            stockBadge.className = 'cart-item-stock';
            stockBadge.textContent = 'In Stock';

            const variantP = document.createElement('p');
            variantP.className = 'cart-item-variant';
            variantP.textContent = 'Digital Product';

            details.appendChild(nameHeader);
            details.appendChild(stockBadge);
            details.appendChild(variantP);

            return details;
        },

        // Create cart item actions (quantity, price, remove)
        createCartItemActions(item) {
            const actions = document.createElement('div');
            actions.className = 'cart-item-actions';

            // Quantity selector
            const quantityDiv = this.createQuantitySelector(item);
            
            // Price
            const priceSpan = this.createPriceDisplay(item);
            
            // Remove button
            const removeBtn = this.createRemoveButton(item);

            actions.appendChild(quantityDiv);
            actions.appendChild(priceSpan);
            actions.appendChild(removeBtn);

            return actions;
        },

        // Create quantity selector
        createQuantitySelector(item) {
            const quantityDiv = document.createElement('div');
            quantityDiv.className = 'cart-item-quantity';

            const decreaseBtn = document.createElement('button');
            decreaseBtn.className = 'cart-quantity-btn';
            decreaseBtn.textContent = '–';
            decreaseBtn.setAttribute('data-action', 'decrease');
            // Fallback onclick handler
            decreaseBtn.onclick = () => {
                this.updateQuantity(item.id, item.quantity - 1);
            };

            const quantitySpan = document.createElement('span');
            quantitySpan.className = 'cart-quantity-display';
            quantitySpan.textContent = item.quantity;

            const increaseBtn = document.createElement('button');
            increaseBtn.className = 'cart-quantity-btn';
            increaseBtn.textContent = '+';
            increaseBtn.setAttribute('data-action', 'increase');
            // Fallback onclick handler
            increaseBtn.onclick = () => {
                this.updateQuantity(item.id, item.quantity + 1);
            };

            quantityDiv.appendChild(decreaseBtn);
            quantityDiv.appendChild(quantitySpan);
            quantityDiv.appendChild(increaseBtn);

            return quantityDiv;
        },

        // Create price display
        createPriceDisplay(item) {
            const priceSpan = document.createElement('span');
            priceSpan.className = 'cart-item-price';
            priceSpan.textContent = `£${(item.price * item.quantity).toFixed(2)}`;
            return priceSpan;
        },

        // Create remove button
        createRemoveButton(item) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'cart-item-remove';
            removeBtn.innerHTML = '🗑️';
            removeBtn.setAttribute('data-action', 'remove');
            // Fallback onclick handler
            removeBtn.onclick = () => {
                this.removeItem(item.id);
            };
            return removeBtn;
        },

        // Update cart total
        updateCartTotal() {
            const total = this.getTotal();
            
            if (DOMCache.cart.total) {
                DOMCache.cart.total.textContent = `£${total.toFixed(2)}`;
            }
        },

        // Clear cart
        clear() {
            this.items = [];
            this.saveToStorage();
            this.updateDisplay();
            console.log('🧹 Cart cleared');
        },

        // Cleanup method for memory management
        cleanup() {
            // Remove event listeners
            if (window.MemoryManager) {
                MemoryManager.removeEventListener(document, 'click', this.handleCartButtonClick.bind(this));
            } else {
                document.removeEventListener('click', this.handleCartButtonClick.bind(this));
            }
            
            console.log('🧹 Cart manager cleaned up');
        }
    };

    // Assign cart to namespace
    window.EcommerceApp = window.EcommerceApp || {};
    window.EcommerceApp.cart = cart;

    // Export cart for external access (maintains backward compatibility)
    window.CartManager = cart;

    // Initialize cart immediately since config-loader.js handles the timing
    cart.init();

    // Check if updateDisplay found all target DOM nodes, and if not, add DOM readiness fallback
    const domNodesFound = cart.updateDisplay();
    if (!domNodesFound) {
        // One-time DOMContentLoaded fallback for cases where target nodes aren't ready yet
        const domReadyFallback = () => {
            cart.updateDisplay();
            // Remove the listener after first use
            document.removeEventListener('DOMContentLoaded', domReadyFallback);
        };

        // Check document.readyState first, then attach listener if needed
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', domReadyFallback);
        } else {
            // DOM is already ready, try updateDisplay one more time
            cart.updateDisplay();
        }
    }

    // Log the cart availability for debugging
    console.log('🛒 Cart manager loaded, CartManager available:', !!window.CartManager);
    console.log('🛒 Cart manager loaded, EcommerceApp.cart available:', !!window.EcommerceApp?.cart);

})();
