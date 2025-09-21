/**
 * UI Interactions Module
 * Handles mobile menu, modals, and other UI interactions
 */

// Mobile Menu Functions
function toggleMobileMenu() {
    const mobileMenu = DOMCache.mobile.menu;
    const burgerButton = DOMCache.mobile.burger;
    
    if (mobileMenu && mobileMenu.classList.contains('active')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const mobileMenu = DOMCache.mobile.menu;
    const burgerButton = DOMCache.mobile.burger;

    if (!mobileMenu) return;
    
    mobileMenu.style.display = 'block';

    // Trigger animation
    const animationTimer = setTimeout(() => {
        mobileMenu.classList.add('active');
    }, 10);
    if (window.MemoryManager) {
        MemoryManager.addTimer(animationTimer, 'timeout');
    }

    // Update aria-expanded for accessibility
    if (burgerButton) {
        burgerButton.setAttribute('aria-expanded', 'true');
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    const mobileMenu = DOMCache.mobile.menu;
    const burgerButton = DOMCache.mobile.burger;

    if (!mobileMenu) return;
    
    mobileMenu.classList.remove('active');

    // Wait for animation to complete before hiding
    const hideTimer = setTimeout(() => {
        mobileMenu.style.display = 'none';
    }, 300);
    if (window.MemoryManager) {
        MemoryManager.addTimer(hideTimer, 'timeout');
    }

    // Update aria-expanded for accessibility
    if (burgerButton) {
        burgerButton.setAttribute('aria-expanded', 'false');
    }

    // Restore body scroll
    document.body.style.overflow = 'auto';
}


// FAQ Accordion Functions
function toggleFaq(button) {
    const faqItem = button.closest('.faq-item');
    if (!faqItem) return;
    
    const isActive = faqItem.classList.contains('active');
    
    // Close all other FAQ items
    const faqItems = DOMCache.ui.faqItems;
    if (faqItems) {
        faqItems.forEach(item => {
            item.classList.remove('active');
        });
    }
    
    // Toggle current item
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Product image functionality
function changeImage(src) {
    const mainImage = DOMCache.product.mainImage;
    if (mainImage) {
        mainImage.src = src;
    }

    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
        if (thumb.src === src) {
            thumb.classList.add('active');
        }
    });
}

// Quantity controls
function increaseQuantity() {
    const quantityInput = DOMCache.product.quantityInput;
    if (quantityInput) {
        quantityInput.value = parseInt(quantityInput.value) + 1;
    }
}

function decreaseQuantity() {
    const quantityInput = DOMCache.product.quantityInput;
    if (quantityInput) {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    }
}

// Handle modal close when clicking outside
function handleModalClose(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Prevent modal close when clicking inside modal content
function handleModalContentClick(event) {
    if (event.target.closest('.modal-content')) {
        event.stopPropagation();
    }
}

// Handle form submissions
function handleFormSubmission(event) {
    if (event.target.id === 'contactForm') {
        handleContactForm(event);
    }
}

// Setup modal event listeners
function setupModalEventListeners() {
    // Close modals when clicking outside (optimized with passive listener)
    if (window.MemoryManager) {
        MemoryManager.addEventListener(window, 'click', handleModalClose, { passive: true });
    } else {
        window.addEventListener('click', handleModalClose, { passive: true });
    }

    // Prevent modal close when clicking inside modal content (optimized with event delegation)
    if (window.MemoryManager) {
        MemoryManager.addEventListener(document, 'click', handleModalContentClick, { passive: true });
    } else {
        document.addEventListener('click', handleModalContentClick, { passive: true });
    }
}

// Setup form event listeners
function setupFormEventListeners() {
    // Handle form submissions with event delegation
    if (window.MemoryManager) {
        MemoryManager.addEventListener(document, 'submit', handleFormSubmission);
    } else {
        document.addEventListener('submit', handleFormSubmission);
    }
}

// Main event listeners setup
function setupEventListeners() {
    setupModalEventListeners();
    setupFormEventListeners();
}

// Export functions for global access
window.toggleMobileMenu = toggleMobileMenu;
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.toggleFaq = toggleFaq;
window.changeImage = changeImage;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.setupEventListeners = setupEventListeners;
