/**
 * Form Handlers Module
 * Handles contact forms, checkout forms, and form-related functionality
 */

// Form handlers
function handleContactForm(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    // Simulate form submission
    showNotification('Message sent successfully!', 'success');

    // Reset form
    event.target.reset();
}

// Checkout functionality
function showCheckoutForm() {
    const cart = window.CartManager.getItems();
    if (!cart || cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    // Opening checkout form

    // Populate checkout items
    const checkoutItems = DOMCache.forms.checkoutItems;
    const checkoutTotal = DOMCache.forms.checkoutTotal;

    if (checkoutItems) {
        checkoutItems.innerHTML = '';
        cart.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'checkout-item';
            itemDiv.innerHTML = `
                <div class="checkout-item-info">
                    <strong>${item.name}</strong>
                    <span>Qty: ${item.quantity}</span>
                </div>
                <div class="checkout-item-price">£${(item.price * item.quantity).toFixed(2)}</div>
            `;
            checkoutItems.appendChild(itemDiv);
        });
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (checkoutTotal) {
        checkoutTotal.textContent = `£${total.toFixed(2)}`;
    }

    // Close cart and show checkout
    closeCart();
    const checkoutModal = DOMCache.getById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.style.display = 'block';
    }

    // Checkout modal displayed, initializing checkout form

    // Initialize checkout form
    initializeStripe();
}

function closeCheckout() {
    const checkoutModal = DOMCache.getById('checkoutModal');
    const checkoutForm = DOMCache.forms.checkout;
    
    if (checkoutModal) {
        checkoutModal.style.display = 'none';
    }
    // Reset form
    if (checkoutForm) {
        checkoutForm.reset();
    }
}

function initializeStripe() {
    try {
        // Setting up checkout form

        // Handle form submission
        const checkoutForm = DOMCache.forms.checkout;
        if (checkoutForm) {
            // Checkout form found, setting up event listener
            // Remove existing listener to prevent duplicates
            checkoutForm.removeEventListener('submit', handleCheckoutSubmit);
            checkoutForm.addEventListener('submit', handleCheckoutSubmit);
            // Event listener attached successfully
        } else {
            console.error('Checkout form not found!');
        }

        // Checkout form initialized successfully

    } catch (error) {
        console.error('Error initializing checkout form:', error);
        showNotification('Checkout system initialization failed. Please refresh and try again.', 'error');
    }
}

function handleCheckoutSubmit(event) {
    event.preventDefault();

    const submitButton = DOMCache.checkout.submitButton;
    const buttonText = DOMCache.checkout.buttonText;
    const spinner = DOMCache.checkout.spinner;

    if (!submitButton || !buttonText || !spinner) return;

    // Disable button and show spinner
    submitButton.disabled = true;
    buttonText.textContent = 'Processing...';
    spinner.classList.remove('hidden');

    // Get form data
    const firstName = DOMCache.checkout.firstName?.value;
    const lastName = DOMCache.checkout.lastName?.value;
    const email = DOMCache.checkout.email?.value;

    // Basic validation
    if (!firstName || !lastName || !email) {
        showNotification('Please fill in all customer details.', 'error');
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
        return;
    }

    // Email validation
    if (!email.includes('@')) {
        showNotification('Please enter a valid email address.', 'error');
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
        return;
    }

    // Process payment directly (no card details needed for Stripe Checkout)
    processPayment(firstName, lastName, email);
}

async function processPayment(firstName, lastName, email) {
    try {
        // Validate configuration before proceeding
        validateConfiguration();

        showNotification('Creating checkout session...', 'info');

        // Get cart items from cart manager
        const cart = window.CartManager.getItems();
        
        // Prepare cart items for Stripe
        const items = cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || 'https://pawsitivepeace.online/images/the-pupsicle-pdp-image-one.jpg'
        }));

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Get CSRF token from meta tag
        // Fetching CSRF token
        const csrfResponse = await fetch('https://recipe-rush.onrender.com/csrf-token');
        // CSRF response status
        
        if (!csrfResponse.ok) {
            throw new Error(`CSRF token fetch failed: ${csrfResponse.status}`);
        }
        
        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.token;
        // CSRF token received
        // CSRF token length
        
        if (!csrfToken) {
            throw new Error('CSRF token is empty');
        }

        // Create checkout session via your backend
        // Sending payment request
        // CSRF token being sent
        // Request headers
        
        const response = await fetch('https://recipe-rush.onrender.com/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify({
                items: items,
                customerEmail: email,
                customerName: `${firstName} ${lastName}`,
                total: total
            })
        }).catch(error => {
            console.error('Network error:', error);
            throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.url) {
            showNotification('Redirecting to secure payment...', 'success');
            window.location.href = data.url;
        } else if (data && data.sessionId) {
            // Back-compat if server still returns only sessionId
            showNotification('Redirecting to secure payment...', 'success');
            window.location.href = `https://recipe-rush.onrender.com/checkout-session/${data.sessionId}`;
        } else {
            throw new Error('No checkout URL or sessionId received');
        }

    } catch (error) {
        console.error('Payment processing error:', error);
        showNotification('Payment setup failed. Please try again.', 'error');

        // Re-enable button
        const submitButton = DOMCache.checkout.submitButton;
        const buttonText = DOMCache.checkout.buttonText;
        const spinner = DOMCache.checkout.spinner;

        if (submitButton && buttonText && spinner) {
            submitButton.disabled = false;
            buttonText.textContent = 'Pay Now';
            spinner.classList.add('hidden');
        }
    }
}

// Export functions for global access
window.handleContactForm = handleContactForm;
window.showCheckoutForm = showCheckoutForm;
window.closeCheckout = closeCheckout;
window.initializeStripe = initializeStripe;
window.handleCheckoutSubmit = handleCheckoutSubmit;
window.processPayment = processPayment;
