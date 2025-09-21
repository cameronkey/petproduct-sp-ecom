// Contact page specific functionality
// Checkout functionality is handled by script.js

// Configuration for fetch operations
const FETCH_CONFIG = {
    TIMEOUT_MS: 10000,
    MAX_RETRIES: 2,
    BASE_DELAY_MS: 1000,
    MAX_DELAY_MS: 5000
};

// Initialize contact form functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeContactForm();
    initializeEmailJS();
});

// Initialize contact form
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

// Initialize EmailJS
function initializeEmailJS() {
    try {
        if (typeof emailjs !== 'undefined') {
            emailjs.init('8N1ptQ1ogjxnsC_1I'); // EmailJS Public Key
        }
    } catch (error) {
        console.error('EmailJS initialization failed:', error);
    }
}

// Handle contact form submission
async function handleContactSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Disable submit button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    try {
        // Get form data
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };
        
        // Basic validation
        if (!data.name || !data.email || !data.message) {
            throw new Error('Please fill in all required fields.');
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new Error('Please enter a valid email address.');
        }
        
        // Send email using EmailJS
        if (typeof emailjs !== 'undefined') {
            await emailjs.send('service_48u5jcp', 'template_okhrf9f', {
                from_name: data.name,
                from_email: data.email,
                subject: data.subject || 'Contact Form Submission',
                message: data.message
            });
        } else {
            // Fallback to server endpoint if EmailJS is not available
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Failed to send message. Please try again.');
            }
        }
        
        // Success
        showSuccessMessage('Thank you! Your message has been sent successfully.');
        form.reset();
        
    } catch (error) {
        console.error('Contact form error:', error);
        showErrorMessage(error.message || 'Failed to send message. Please try again.');
    } finally {
        // Restore submit button
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Show success message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const form = document.getElementById('contactForm');
    form.parentNode.insertBefore(successDiv, form.nextSibling);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 5000);
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const form = document.getElementById('contactForm');
    form.parentNode.insertBefore(errorDiv, form.nextSibling);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Mobile menu functionality (if not already handled by script.js)
function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
    }
}

// Close mobile menu
function closeMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.remove('active');
    }
}

// Export functions for use in HTML
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
