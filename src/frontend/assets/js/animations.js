/**
 * Animations Module
 * Handles all animation-related functionality including banners, progress rings, and testimonials
 */

// Animated Banner Functions
function initBannerAnimation() {
    const bannerText = DOMCache.banners.bannerText || document.getElementById(AppConfig.selectors.banners.bannerText);
    if (!bannerText) return;
    
    const messages = [AppConfig.text.banners.sales, AppConfig.text.banners.order];
    const spacing = AppConfig.animation.bannerSpacing;
    
    // Create repeated text pattern to fill the banner width
    function createRepeatedText() {
        const repeatedText = messages.join(' • ');
        // Repeat the pattern many times to ensure seamless looping
        const pattern = `${repeatedText} • `;
        return pattern.repeat(AppConfig.animation.bannerRepeatCount);
    }
    
    bannerText.textContent = createRepeatedText();
}

// Bottom Banner Functions
function initBottomBannerAnimation() {
    const bottomBannerText = DOMCache.banners.bottomBannerText || document.getElementById(AppConfig.selectors.banners.bottomBannerText);
    if (!bottomBannerText) return;
    
    const messages = [AppConfig.text.banners.customers, AppConfig.text.banners.trending];
    const spacing = AppConfig.animation.bannerSpacing;
    
    // Create repeated text pattern to fill the banner width
    function createRepeatedText() {
        const repeatedText = messages.join(' • ');
        // Repeat the pattern many times to ensure seamless looping
        const pattern = `${repeatedText} • `;
        return pattern.repeat(AppConfig.animation.bannerRepeatCount);
    }
    
    bottomBannerText.textContent = createRepeatedText();
}

// Sale Ends Banner Functions
function initSaleEndsBannerAnimation() {
    const saleEndsBannerText = DOMCache.banners.saleEndsBannerText || document.getElementById(AppConfig.selectors.banners.saleEndsBannerText);
    if (!saleEndsBannerText) return;
    
    const messages = [AppConfig.text.banners.saleEnds, AppConfig.text.banners.satisfiedCustomers];
    const spacing = AppConfig.animation.bannerSpacing;
    
    // Create repeated text pattern to fill the banner width
    function createRepeatedText() {
        const repeatedText = messages.join(' • ');
        // Repeat the pattern many times to ensure seamless looping
        const pattern = `${repeatedText} • `;
        return pattern.repeat(AppConfig.animation.bannerRepeatCount);
    }
    
    saleEndsBannerText.textContent = createRepeatedText();
}

// Lazy Loading for Sections
function initLazyLoading() {
    const lazySections = DOMCache.ui.lazySections;
    if (!lazySections || lazySections.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loaded');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: AppConfig.animation.lazyLoadThreshold,
        rootMargin: AppConfig.animation.lazyLoadRootMargin
    });
    
    lazySections.forEach(section => {
        observer.observe(section);
    });
}

// Testimonials functionality
let currentTestimonialIndex = 1;
let testimonialInterval;

function currentTestimonial(n) {
    currentTestimonialIndex = n;
    showTestimonial(n);
    resetTestimonialInterval();
}

function showTestimonial(n) {
    const testimonials = DOMCache.ui.testimonials;
    const dots = DOMCache.ui.dots;
    
    if (!testimonials || !dots) return;
    
    if (n > testimonials.length) currentTestimonialIndex = 1;
    if (n < 1) currentTestimonialIndex = testimonials.length;
    
    testimonials.forEach(testimonial => testimonial.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    testimonials[currentTestimonialIndex - 1].classList.add('active');
    dots[currentTestimonialIndex - 1].classList.add('active');
}

function nextTestimonial() {
    currentTestimonialIndex++;
    if (currentTestimonialIndex > 3) currentTestimonialIndex = 1;
    showTestimonial(currentTestimonialIndex);
}

function startTestimonialInterval() {
    testimonialInterval = setInterval(nextTestimonial, AppConfig.timing.testimonialInterval);
    if (window.MemoryManager) {
        MemoryManager.addTimer(testimonialInterval, 'interval');
    }
}

function resetTestimonialInterval() {
    if (window.MemoryManager) {
        MemoryManager.clearTimer(testimonialInterval);
    } else {
        clearInterval(testimonialInterval);
    }
    startTestimonialInterval();
}

// Calculate progress ring target offset
function calculateProgressOffset(percentage) {
    const circumference = AppConfig.animation.circumference;
    return circumference - (percentage / 100) * circumference;
}

// Setup individual progress ring animation
function setupProgressRingAnimation(chart, index) {
    const percentage = parseInt(chart.dataset.percentage);
    const targetOffset = calculateProgressOffset(percentage);
    
    // Set CSS custom property for target offset
    chart.style.setProperty('--target-offset', targetOffset);
    
    // Animate with slight delay for staggered effect
    const staggerTimer = setTimeout(() => {
        chart.classList.add('animate');
        animateCounter(chart.querySelector('.chart-percentage'), percentage);
    }, index * AppConfig.timing.staggerDelay);
    
    if (window.MemoryManager) {
        MemoryManager.addTimer(staggerTimer, 'timeout');
    }
}

// Setup intersection observer for progress rings
function setupProgressRingObserver() {
    const resultsSection = DOMCache.ui.resultsSection;
    if (!resultsSection) return;
    
    // Use higher threshold for mobile to trigger animation earlier
    const isMobile = window.innerWidth <= 768;
    const threshold = isMobile ? AppConfig.animation.mobileThreshold : AppConfig.animation.desktopThreshold;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateProgressRings();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold });
    
    observer.observe(resultsSection);
}

// Animate individual progress ring
function animateProgressRing(chart, index) {
    setupProgressRingAnimation(chart, index);
}

// Animate counter for progress ring
function animateCounter(element, target) {
    let current = 0;
    const increment = target / AppConfig.timing.progressRingFPS;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            if (window.MemoryManager) {
                MemoryManager.clearTimer(timer);
            } else {
                clearInterval(timer);
            }
        }
        element.textContent = Math.round(current) + '%';
    }, AppConfig.timing.animationFrame);
    
    if (window.MemoryManager) {
        MemoryManager.addTimer(timer, 'interval');
    }
}

// Main progress ring animations initialization
function initProgressRingAnimations() {
    setupProgressRingObserver();
}

// Main progress rings animation function
function animateProgressRings() {
    const circleCharts = DOMCache.ui.circleCharts;
    if (!circleCharts || circleCharts.length === 0) return;
    
    circleCharts.forEach((chart, index) => {
        animateProgressRing(chart, index);
    });
}

// Export functions for global access
window.initBannerAnimation = initBannerAnimation;
window.initBottomBannerAnimation = initBottomBannerAnimation;
window.initSaleEndsBannerAnimation = initSaleEndsBannerAnimation;
window.initLazyLoading = initLazyLoading;
window.currentTestimonial = currentTestimonial;
window.showTestimonial = showTestimonial;
window.nextTestimonial = nextTestimonial;
window.startTestimonialInterval = startTestimonialInterval;
window.resetTestimonialInterval = resetTestimonialInterval;
window.initProgressRingAnimations = initProgressRingAnimations;
window.animateProgressRings = animateProgressRings;
window.animateCounter = animateCounter;
