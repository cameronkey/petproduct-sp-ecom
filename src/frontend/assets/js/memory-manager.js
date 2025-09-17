/**
 * Memory Manager Module
 * Handles cleanup of event listeners, timers, and DOM references to prevent memory leaks
 */

const MemoryManager = {
    // Track all event listeners for cleanup
    eventListeners: new Map(),
    
    // Track all timers for cleanup
    timers: new Set(),
    
    // Track DOM references for cleanup
    domReferences: new Set(),
    
    // Add event listener with tracking
    addEventListener(element, event, handler, options = {}) {
        const key = `${element.constructor.name}-${event}`;
        
        // Remove existing listener if present
        if (this.eventListeners.has(key)) {
            const { element: oldElement, event: oldEvent, handler: oldHandler, options: oldOptions } = this.eventListeners.get(key);
            oldElement.removeEventListener(oldEvent, oldHandler, oldOptions);
        }
        
        // Add new listener
        element.addEventListener(event, handler, options);
        
        // Track for cleanup
        this.eventListeners.set(key, { element, event, handler, options });
        
        return key;
    },
    
    // Remove specific event listener
    removeEventListener(key) {
        if (this.eventListeners.has(key)) {
            const { element, event, handler, options } = this.eventListeners.get(key);
            element.removeEventListener(event, handler, options);
            this.eventListeners.delete(key);
        }
    },
    
    // Add timer with tracking
    addTimer(timerId, type = 'timeout') {
        this.timers.add({ id: timerId, type, timestamp: Date.now() });
        return timerId;
    },
    
    // Clear specific timer
    clearTimer(timerId) {
        const timer = Array.from(this.timers).find(t => t.id === timerId);
        if (timer) {
            if (timer.type === 'timeout') {
                clearTimeout(timerId);
            } else if (timer.type === 'interval') {
                clearInterval(timerId);
            }
            this.timers.delete(timer);
        }
    },
    
    // Add DOM reference for cleanup
    addDOMReference(element) {
        this.domReferences.add(element);
    },
    
    // Remove DOM reference
    removeDOMReference(element) {
        this.domReferences.delete(element);
    },
    
    // Clean up all tracked resources
    cleanup() {
        console.log('🧹 Cleaning up memory resources...');
        
        // Clean up event listeners
        this.eventListeners.forEach(({ element, event, handler, options }, key) => {
            try {
                element.removeEventListener(event, handler, options);
            } catch (error) {
                console.warn(`Failed to remove event listener ${key}:`, error);
            }
        });
        this.eventListeners.clear();
        
        // Clean up timers
        this.timers.forEach(({ id, type }) => {
            try {
                if (type === 'timeout') {
                    clearTimeout(id);
                } else if (type === 'interval') {
                    clearInterval(id);
                }
            } catch (error) {
                console.warn(`Failed to clear timer ${id}:`, error);
            }
        });
        this.timers.clear();
        
        // Clear DOM references
        this.domReferences.clear();
        
        console.log('✅ Memory cleanup complete');
    },
    
    // Get memory usage statistics
    getStats() {
        return {
            eventListeners: this.eventListeners.size,
            timers: this.timers.size,
            domReferences: this.domReferences.size
        };
    }
};

// Set up page unload cleanup
window.addEventListener('beforeunload', () => {
    MemoryManager.cleanup();
});

// Set up visibility change cleanup (for mobile)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, clean up some resources
        MemoryManager.cleanup();
    }
});

// Export for use in other modules
window.MemoryManager = MemoryManager;
