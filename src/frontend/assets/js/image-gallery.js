/**
 * Image Gallery Module
 * Handles thumbnail navigation for product images
 */

class ImageGallery {
    constructor() {
        this.mainImage = null;
        this.thumbnails = [];
        this.currentIndex = 0;
        this.images = [
            '../assets/images/recipe-rush-pdp-image-one.jpg',
            '../assets/images/recipe-rush-pdp-image-two.jpg',
            '../assets/images/recipe-rush-pdp-image-three.jpg',
            '../assets/images/recipe-rush-pdp-image-four.jpg'
        ];
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupGallery());
        } else {
            this.setupGallery();
        }
    }

    setupGallery() {
        // Find the main product image
        this.mainImage = document.querySelector('.main-product-image img');
        
        if (!this.mainImage) {
            console.warn('ImageGallery: Main product image not found');
            return;
        }

        console.log('ImageGallery: Main image found', this.mainImage);

        console.log('ImageGallery: Creating thumbnails...');
        this.createThumbnails();
        this.setupEventListeners();
        this.preloadImages();
    }

    createThumbnails() {
        // Find the product image container
        const imageContainer = this.mainImage.closest('.main-product-image');
        if (!imageContainer) return;

        // Create main image container wrapper
        const mainImageContainer = document.createElement('div');
        mainImageContainer.className = 'main-image-container';
        
        // Move the main image into the wrapper
        this.mainImage.parentNode.insertBefore(mainImageContainer, this.mainImage);
        mainImageContainer.appendChild(this.mainImage);

        // Create thumbnail container
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'thumbnail-container';
        
        // Create thumbnails
        this.images.forEach((imageSrc, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            if (index === 0) thumbnail.classList.add('active');
            
            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = `Product image ${index + 1}`;
            img.loading = 'lazy';
            
            thumbnail.appendChild(img);
            thumbnailContainer.appendChild(thumbnail);
            this.thumbnails.push(thumbnail);
        });

        // Insert thumbnail container before the main image container
        imageContainer.insertBefore(thumbnailContainer, mainImageContainer);
    }

    setupEventListeners() {
        this.thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', () => this.switchImage(index));
            thumbnail.addEventListener('mouseenter', () => this.highlightThumbnail(index));
            thumbnail.addEventListener('mouseleave', () => this.unhighlightThumbnail(index));
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    switchImage(index) {
        if (index === this.currentIndex) return;

        // Update main image with smooth transition
        this.mainImage.style.opacity = '0';
        
        setTimeout(() => {
            this.mainImage.src = this.images[index];
            this.mainImage.alt = `Product image ${index + 1}`;
            this.mainImage.style.opacity = '1';
        }, 150);

        // Update active thumbnail
        this.thumbnails[this.currentIndex].classList.remove('active');
        this.thumbnails[index].classList.add('active');
        
        this.currentIndex = index;
    }

    highlightThumbnail(index) {
        if (index !== this.currentIndex) {
            this.thumbnails[index].classList.add('hover');
        }
    }

    unhighlightThumbnail(index) {
        this.thumbnails[index].classList.remove('hover');
    }

    preloadImages() {
        // Preload all images for smooth switching
        this.images.forEach(imageSrc => {
            const img = new Image();
            img.src = imageSrc;
        });
    }

    handleResize() {
        const thumbnailContainer = document.querySelector('.thumbnail-container');
        if (!thumbnailContainer) return;

        if (window.innerWidth <= 768) {
            // Mobile: show thumbnails in horizontal layout
            thumbnailContainer.style.display = 'flex';
        } else {
            // Desktop: show thumbnails in vertical layout
            thumbnailContainer.style.display = 'flex';
        }
    }

    hideThumbnails() {
        const thumbnailContainer = document.querySelector('.thumbnail-container');
        if (thumbnailContainer) {
            thumbnailContainer.style.display = 'none';
        }
    }

    showThumbnails() {
        const thumbnailContainer = document.querySelector('.thumbnail-container');
        if (thumbnailContainer) {
            thumbnailContainer.style.display = 'flex';
        }
    }
}

// Initialize gallery when script loads
let imageGallery;

// Ensure DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        imageGallery = new ImageGallery();
    });
} else {
    imageGallery = new ImageGallery();
}

// Export for global access if needed
window.ImageGallery = ImageGallery;
