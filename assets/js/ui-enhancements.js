/**
 * SkyCast - UI Enhancements
 * 
 * This file contains JavaScript enhancements for improving UI interactions,
 * adding smooth animations, transitions, and other visual effects
 * without breaking existing functionality.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Apply card reveal animations
  initCardAnimations();
  
  // Add hover effects to weather stat cards
  initStatCardEffects();
  
  // Add scroll animations for hourly cards
  initHourlyScroll();
  
  // Enhance search box interactions
  enhanceSearchBox();
});

/**
 * Initialize card reveal animations with staggered timing
 */
function initCardAnimations() {
  // Get all cards and sections that should animate
  const cards = document.querySelectorAll('.weather-card, .daily-card, .hourly-card');
  
  // Set up Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Add staggered delay based on index
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, index * 100);
        
        // Stop observing after revealing
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  // Start observing each card
  cards.forEach(card => {
    // Add base reveal class
    card.classList.add('reveal-card');
    observer.observe(card);
  });
}

/**
 * Add interactive effects to stat cards
 */
function initStatCardEffects() {
  const statItems = document.querySelectorAll('.stat-item');
  
  statItems.forEach(item => {
    // Add subtle hover lift effect
    item.addEventListener('mouseenter', () => {
      const value = item.querySelector('.stat-value');
      if (value) {
        value.classList.add('pulse');
      }
    });
    
    item.addEventListener('mouseleave', () => {
      const value = item.querySelector('.stat-value');
      if (value) {
        value.classList.remove('pulse');
      }
    });
  });
}

/**
 * Enhance hourly cards scroll with smooth scrolling
 */
function initHourlyScroll() {
  const scrollContainer = document.querySelector('.scroll-container');
  
  if (scrollContainer) {
    // Add smooth scroll on wheel
    scrollContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      scrollContainer.scrollLeft += e.deltaY;
    });
    
    // Add scroll buttons for better UX if container exists
    const hourlySection = document.querySelector('.hourly-forecast');
    if (hourlySection) {
      const scrollLeftBtn = document.createElement('button');
      scrollLeftBtn.className = 'scroll-btn scroll-left';
      scrollLeftBtn.innerHTML = '&lsaquo;';
      scrollLeftBtn.setAttribute('aria-label', 'Scroll left');
      
      const scrollRightBtn = document.createElement('button');
      scrollRightBtn.className = 'scroll-btn scroll-right';
      scrollRightBtn.innerHTML = '&rsaquo;';
      scrollRightBtn.setAttribute('aria-label', 'Scroll right');
      
      hourlySection.appendChild(scrollLeftBtn);
      hourlySection.appendChild(scrollRightBtn);
      
      // Add scroll button functionality
      scrollLeftBtn.addEventListener('click', () => {
        scrollContainer.scrollBy({
          left: -300,
          behavior: 'smooth'
        });
      });
      
      scrollRightBtn.addEventListener('click', () => {
        scrollContainer.scrollBy({
          left: 300,
          behavior: 'smooth'
        });
      });
      
      // Show/hide scroll buttons based on scroll position
      scrollContainer.addEventListener('scroll', () => {
        const isAtStart = scrollContainer.scrollLeft === 0;
        const isAtEnd = scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 10;
        
        scrollLeftBtn.style.opacity = isAtStart ? '0' : '1';
        scrollRightBtn.style.opacity = isAtEnd ? '0' : '1';
      });
      
      // Trigger scroll event to set initial button state
      scrollContainer.dispatchEvent(new Event('scroll'));
    }
  }
}

/**
 * Enhance search box with subtle animations
 */
function enhanceSearchBox() {
  const searchBox = document.querySelector('.search-box');
  const searchInput = document.getElementById('search-input');
  
  if (searchBox && searchInput) {
    // Add focus animation
    searchInput.addEventListener('focus', () => {
      searchBox.classList.add('focused');
    });
    
    searchInput.addEventListener('blur', () => {
      searchBox.classList.remove('focused');
    });
    
    // Add typing animation (subtle scale)
    searchInput.addEventListener('input', () => {
      searchBox.classList.add('typing');
      setTimeout(() => {
        searchBox.classList.remove('typing');
      }, 200);
    });
  }
}

/**
 * Add a subtle parallax effect to weather cards on mouse move
 * This creates a sense of depth without being distracting
 */
function initParallaxEffect() {
  const weatherCards = document.querySelectorAll('.weather-card');
  
  weatherCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate position as percentage of card dimensions
      const xPercent = x / rect.width;
      const yPercent = y / rect.height;
      
      // Calculate tilt amount (max 2 degrees)
      const tiltX = (xPercent - 0.5) * 2;
      const tiltY = (yPercent - 0.5) * -2;
      
      // Apply subtle transform
      card.style.transform = `perspective(1000px) rotateX(${tiltY}deg) rotateY(${tiltX}deg) translateZ(10px)`;
    });
    
    card.addEventListener('mouseleave', () => {
      // Reset transform on mouse leave with transition
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    });
  });
}

// Add smooth page transitions
window.addEventListener('pageshow', () => {
  document.body.classList.add('page-visible');
});

// Function to run when document is fully loaded 
window.addEventListener('load', () => {
  // Initialize parallax effect
  initParallaxEffect();
  
  // Add animation class to body to enable transitions
  document.body.classList.add('animations-ready');
  
  // Remove loading screen with fade out if it exists
  const loader = document.getElementById('loader');
  if (loader) {
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 500);
  }
}); 