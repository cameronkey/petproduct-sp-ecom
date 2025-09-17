/**
 * Utilities Module
 * Contains utility functions used across the application
 */

// Remove existing notifications to prevent stacking
function clearExistingNotifications() {
    const existingNotifications = document.querySelectorAll(AppConfig.selectors.notifications.container);
    existingNotifications.forEach(notification => {
        notification.remove();
    });
}

// Create notification DOM element
function createNotificationElement(type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    return notification;
}

// Create notification content elements
function createNotificationContent(message, type) {
    const icons = AppConfig.text.icons;

    const iconSpan = document.createElement('span');
    iconSpan.className = AppConfig.selectors.notifications.icon.replace('.', '');
    iconSpan.textContent = icons[type] || icons.info;

    const messageSpan = document.createElement('span');
    messageSpan.className = AppConfig.selectors.notifications.message.replace('.', '');
    messageSpan.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.className = AppConfig.selectors.notifications.close.replace('.', '');
    closeButton.textContent = AppConfig.text.icons.close;

    return { iconSpan, messageSpan, closeButton };
}

// Setup notification close handler
function setupNotificationCloseHandler(closeButton, notification) {
    const closeHandler = function() {
        const parentElement = this.parentElement;
        if (parentElement) {
            parentElement.remove();
        }
        // Clean up the event listener to prevent memory leaks
        closeButton.removeEventListener('click', closeHandler);
    };
    
    if (window.MemoryManager) {
        MemoryManager.addEventListener(closeButton, 'click', closeHandler);
    } else {
        closeButton.addEventListener('click', closeHandler);
    }
}

// Animate notification in
function animateNotificationIn(notification) {
    notification.style.transform = 'translateY(-100%)';
    notification.style.opacity = '0';

    const showTimer = setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    }, AppConfig.timing.showDelay);
    
    if (window.MemoryManager) {
        MemoryManager.addTimer(showTimer, 'timeout');
    }
}

// Setup notification auto-removal
function setupNotificationAutoRemoval(notification, duration) {
    if (duration <= 0) return;

    const hideTimer = setTimeout(() => {
        notification.style.transform = 'translateY(-100%)';
        notification.style.opacity = '0';
        
        const removeTimer = setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, AppConfig.timing.hideDelay);
        
        if (window.MemoryManager) {
            MemoryManager.addTimer(removeTimer, 'timeout');
        }
    }, duration);
    
    if (window.MemoryManager) {
        MemoryManager.addTimer(hideTimer, 'timeout');
    }
}

// Main notification function
function showNotification(message, type = 'info', duration = AppConfig.timing.defaultDuration) {
    // Remove existing notifications to prevent stacking
    clearExistingNotifications();

    // Create notification element
    const notification = createNotificationElement(type);

    // Create notification content
    const { iconSpan, messageSpan, closeButton } = createNotificationContent(message, type);

    // Setup close handler
    setupNotificationCloseHandler(closeButton, notification);

    // Assemble notification
    notification.appendChild(iconSpan);
    notification.appendChild(messageSpan);
    notification.appendChild(closeButton);

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    animateNotificationIn(notification);

    // Setup auto-removal
    setupNotificationAutoRemoval(notification, duration);
}

// Configuration validation function
function validateConfiguration() {
    if (!window.RECIPE_RUSH_CONFIG) {
        throw new Error(AppConfig.text.errors.configurationNotLoaded);
    }

    if (!window.RECIPE_RUSH_CONFIG.stripe || !window.RECIPE_RUSH_CONFIG.stripe.publishableKey) {
        throw new Error(AppConfig.text.errors.stripeKeyNotFound);
    }

    // Stripe configuration validated successfully
}

// Export functions for global access
window.showNotification = showNotification;
window.validateConfiguration = validateConfiguration;
