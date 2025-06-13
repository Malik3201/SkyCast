/**
 * SkyCast - Sun Position Animation
 * 
 * This file contains a more attractive animation for the sun position
 * showing sunrise and sunset times in a sleek, minimalist design
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the sun position animation if the elements exist
  initSunPositionAnimation();
});

/**
 * Initialize the sun position animation
 */
function initSunPositionAnimation() {
  // Check if we need to create the sun info section
  const weatherCard = document.getElementById('weather-card');
  if (!weatherCard) return;
  
  // Create the sun info section if it doesn't exist
  let sunInfoSection = document.getElementById('sun-info-section');
  if (!sunInfoSection) {
    sunInfoSection = createSunInfoSection();
    
    // Insert after the weather card
    weatherCard.parentNode.insertBefore(sunInfoSection, weatherCard.nextSibling);
  }
  
  // Initialize the position update
  window.updateSunPosition = function(sunriseTimestamp, sunsetTimestamp, currentTimestamp) {
    if (!sunriseTimestamp || !sunsetTimestamp) return;
    
    const sunPosition = document.querySelector('.sun-position');
    if (!sunPosition) return;
    
    const now = currentTimestamp || Date.now();
    const sunrise = sunriseTimestamp * 1000; // Convert to milliseconds
    const sunset = sunsetTimestamp * 1000; // Convert to milliseconds
    
    // Calculate day duration
    const dayDuration = sunset - sunrise;
    
    // Calculate current position percentage
    let positionPercent = 0;
    
    if (now < sunrise) {
      // Before sunrise
      positionPercent = 0;
    } else if (now > sunset) {
      // After sunset
      positionPercent = 100;
    } else {
      // During day
      positionPercent = ((now - sunrise) / dayDuration) * 100;
    }
    
    // Update sun position
    sunPosition.style.left = `${positionPercent}%`;
    
    // Update times in the UI
    const sunriseTime = document.getElementById('sunrise-time');
    const sunsetTime = document.getElementById('sunset-time');
    
    if (sunriseTime && sunsetTime) {
      sunriseTime.textContent = formatTime(sunrise);
      sunsetTime.textContent = formatTime(sunset);
    }
    
    // Add a glowing effect to the sun based on time of day
    if (positionPercent < 25) {
      // Morning glow - warmer
      sunPosition.style.background = `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--sunrise-start')}, ${getComputedStyle(document.documentElement).getPropertyValue('--sunrise-end')})`;
    } else if (positionPercent > 75) {
      // Evening glow - redder
      sunPosition.style.background = `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--sunset-start')}, ${getComputedStyle(document.documentElement).getPropertyValue('--sunset-end')})`;
    } else {
      // Mid-day
      sunPosition.style.background = `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--sunrise-end')}, ${getComputedStyle(document.documentElement).getPropertyValue('--sunset-start')})`;
    }
    
    // Animate the arc for visual enhancement
    const sunArc = document.querySelector('.sun-arc');
    if (sunArc) {
      // Apply subtle animation
      sunArc.style.borderTopColor = `rgba(35, 57, 93, ${0.1 + (positionPercent / 200)})`;
    }
    
    // Return if we're in day or night
    return now >= sunrise && now <= sunset ? 'day' : 'night';
  };
}

/**
 * Create the sun information section with animation elements
 * @returns {HTMLElement} The created section
 */
function createSunInfoSection() {
  const section = document.createElement('section');
  section.id = 'sun-info-section';
  section.className = 'sun-info-section';
  
  // Create the interior HTML structure
  section.innerHTML = `
    <h2>Sunrise & Sunset</h2>
    <div class="sun-info-container">
      <div class="sun-path-animation">
        <div class="sun-arc"></div>
        <div class="sun-position"></div>
      </div>
      <div class="sun-element sunrise">
        <div class="sun-icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v2"/>
            <path d="M12 20v2"/>
            <path d="m4.93 4.93 1.41 1.41"/>
            <path d="m17.66 17.66 1.41 1.41"/>
            <path d="M2 12h2"/>
            <path d="M20 12h2"/>
            <path d="m6.34 17.66-1.41 1.41"/>
            <path d="m19.07 4.93-1.41 1.41"/>
            <circle cx="12" cy="12" r="4"/>
          </svg>
        </div>
        <div class="sun-time" id="sunrise-time">--:--</div>
        <div class="sun-label">Sunrise</div>
      </div>
      <div class="sun-element sunset">
        <div class="sun-icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 10V2"/>
            <path d="m4.93 10.93 1.41-1.41"/>
            <path d="M2 18h2"/>
            <path d="M20 18h2"/>
            <path d="m19.07 10.93-1.41-1.41"/>
            <path d="M22 22H2"/>
            <path d="m16 6-4 4-4-4"/>
            <path d="M16 18a4 4 0 0 0-8 0"/>
          </svg>
        </div>
        <div class="sun-time" id="sunset-time">--:--</div>
        <div class="sun-label">Sunset</div>
      </div>
    </div>
  `;
  
  return section;
}

/**
 * Format timestamp to time string (HH:MM)
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // Format with leading zeros
  const formattedHours = hours < 10 ? `0${hours}` : hours;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${formattedHours}:${formattedMinutes}`;
} 