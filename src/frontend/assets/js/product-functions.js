/**
 * Product Functions Module
 * Handles product-related functionality including bundle selection and product data management
 */

// Validate bundle selection elements
function validateBundleElements() {
    const bundleOptions = DOMCache.product.bundleOptions;
    const bundleOptionElements = DOMCache.product.bundleOptionElements;
    
    if (!bundleOptions || bundleOptions.length === 0) return false;
    if (!bundleOptionElements || bundleOptionElements.length === 0) return false;
    
    return true;
}

// Handle bundle selection change
function handleBundleSelection(event) {
    if (event.target.name !== 'bundle') return;
    
    const bundleOptionElements = DOMCache.product.bundleOptionElements;
    
    // Remove selected class from all options (using cached elements)
    bundleOptionElements.forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Add selected class to current option
    event.target.closest('.bundle-option').classList.add('selected');
    
    // Update product data for cart
    updateProductData();
}

// Setup bundle selection event listeners
function setupBundleEventListeners() {
    if (window.MemoryManager) {
        MemoryManager.addEventListener(document, 'change', handleBundleSelection);
    } else {
        document.addEventListener('change', handleBundleSelection);
    }
}

// Find selected bundle option
function findSelectedBundle() {
    const bundleOptions = DOMCache.product.bundleOptions;
    if (!bundleOptions || bundleOptions.length === 0) return null;
    
    for (let i = 0; i < bundleOptions.length; i++) {
        if (bundleOptions[i].checked) {
            return bundleOptions[i];
        }
    }
    
    return null;
}

// Extract bundle data from selected option
function extractBundleData(selectedBundle) {
    const price = selectedBundle.dataset.price;
    const originalPrice = selectedBundle.dataset.original;
    const quantity = selectedBundle.value;
    
    // Get bundle text for display name using cached elements
    const bundleOptionElement = selectedBundle.closest('.bundle-option');
    const bundleTextElement = bundleOptionElement ? bundleOptionElement.querySelector('.bundle-text') : null;
    const bundleText = bundleTextElement ? bundleTextElement.textContent : `Bundle ${quantity}`;
    
    return {
        price: parseFloat(price),
        originalPrice: parseFloat(originalPrice),
        quantity: parseInt(quantity),
        bundleText: bundleText
    };
}

// Update global product data
function updateGlobalProductData(bundleData) {
    window.currentProduct = {
        id: `${AppConfig.product.idPrefix}${bundleData.quantity}`,
        name: `${AppConfig.product.namePrefix}${bundleData.bundleText}${AppConfig.product.nameSuffix}`,
        price: bundleData.price,
        originalPrice: bundleData.originalPrice,
        quantity: bundleData.quantity,
        image: AppConfig.product.imagePath
    };
    
    console.log('Product data updated:', window.currentProduct);
}

// Main bundle selection initialization
function initBundleSelection() {
    if (!validateBundleElements()) return;
    
    setupBundleEventListeners();
}

// Main product data update function
function updateProductData() {
    const selectedBundle = findSelectedBundle();
    if (!selectedBundle) return;
    
    const bundleData = extractBundleData(selectedBundle);
    updateGlobalProductData(bundleData);
}

// Export functions for global access
window.initBundleSelection = initBundleSelection;
window.updateProductData = updateProductData;
