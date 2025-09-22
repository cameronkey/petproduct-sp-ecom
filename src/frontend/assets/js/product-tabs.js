/**
 * Product Tabs Module
 * Handles tab switching functionality for product information
 */

class ProductTabs {
    constructor() {
        this.tabButtons = [];
        this.tabPanels = [];
        this.activeTab = 'how-to-use';
        this.mobileActiveTab = 'mobile-how-to-use';
        this.lastWidth = window.innerWidth;
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupTabs());
        } else {
            this.setupTabs();
        }
    }

    setupTabs() {
        // Find tab elements (both desktop and mobile)
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabPanels = document.querySelectorAll('.tab-panel');

        if (this.tabButtons.length === 0 || this.tabPanels.length === 0) {
            console.warn('ProductTabs: Tab elements not found');
            return;
        }

        console.log('ProductTabs: Setting up tabs...');

        // Add click event listeners to tab buttons
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // Add resize listener to handle screen size changes
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Set initial active tab based on screen size
        this.initializeActiveTabs();
    }

    handleResize() {
        const currentWidth = window.innerWidth;
        const wasMobile = this.lastWidth <= 768;
        const isMobile = currentWidth <= 768;
        
        if (wasMobile !== isMobile) {
            this.lastWidth = currentWidth;
            this.initializeActiveTabs();
        }
    }

    initializeActiveTabs() {
        if (window.innerWidth <= 768) {
            this.switchTab(this.mobileActiveTab);
        } else {
            this.switchTab(this.activeTab);
        }
    }

    switchTab(tabId) {
        // Remove active class from all buttons and panels
        this.tabButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        this.tabPanels.forEach(panel => {
            panel.classList.remove('active');
        });

        // Add active class to selected button and panel
        const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
        const activePanel = document.getElementById(tabId);

        if (activeButton && activePanel) {
            activeButton.classList.add('active');
            activePanel.classList.add('active');
            this.activeTab = tabId;
            
            console.log(`ProductTabs: Switched to tab: ${tabId}`);
        }
    }

    // Public method to switch tabs programmatically
    showTab(tabId) {
        this.switchTab(tabId);
    }
}

// Initialize tabs when script loads
let productTabs;

// Ensure DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        productTabs = new ProductTabs();
    });
} else {
    productTabs = new ProductTabs();
}

// Export for global access if needed
window.ProductTabs = ProductTabs;
