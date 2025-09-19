/**
 * Video Player - Click to Play Functionality
 * Handles click-to-play for video containers
 */

class VideoPlayer {
    constructor() {
        this.init();
    }

    init() {
        this.setupVideoContainers();
    }

    setupVideoContainers() {
        const videoContainers = document.querySelectorAll('.video-container');
        
        videoContainers.forEach(container => {
            container.addEventListener('click', (e) => {
                this.playVideo(container);
            });
        });
    }

    playVideo(container) {
        const video = container.querySelector('.video-preview');
        
        if (!video) {
            return;
        }

        // Toggle playing state
        if (container.classList.contains('playing')) {
            video.pause();
            container.classList.remove('playing');
        } else {
            video.play();
            container.classList.add('playing');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new VideoPlayer();
});

// Export for potential external use
window.VideoPlayer = VideoPlayer;
