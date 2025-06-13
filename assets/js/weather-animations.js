/**
 * Weather Animations
 * - Creates and controls anime-style weather element animations
 * - Syncs animations with current weather conditions and time of day
 */

document.addEventListener('DOMContentLoaded', function() {
  // Create animation container if it doesn't exist
  let animContainer = document.querySelector('.weather-animations');
  if (!animContainer) {
    animContainer = document.createElement('div');
    animContainer.className = 'weather-animations';
    document.body.prepend(animContainer);
    
    // Create elements
    createClouds(animContainer);
    createSun(animContainer);
    createMoon(animContainer);
    createRain(animContainer);
    
    // Initially hide sun/moon based on theme
    updateAnimationsForTheme(document.documentElement.getAttribute('data-theme'));
    
    // Watch for theme changes
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateAnimationsForTheme(document.documentElement.getAttribute('data-theme'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
  }
  
  // Set initial weather class based on current conditions
  updateWeatherClass();
  
  // Initialize animations immediately
  setTimeout(() => {
    updateWeatherClass();
  }, 100);
});

/**
 * Create cloud elements
 */
function createClouds(container) {
  for (let i = 1; i <= 3; i++) {
    const cloud = document.createElement('div');
    cloud.className = `cloud cloud-${i}`;
    container.appendChild(cloud);
  }
}

/**
 * Create sun element
 */
function createSun(container) {
  const sun = document.createElement('div');
  sun.className = 'sun';
  container.appendChild(sun);
}

/**
 * Create moon element
 */
function createMoon(container) {
  const moon = document.createElement('div');
  moon.className = 'moon';
  container.appendChild(moon);
}

/**
 * Create rain elements
 */
function createRain(container) {
  const rainContainer = document.createElement('div');
  rainContainer.className = 'rain-container';
  
  // Create multiple rain drops
  for (let i = 0; i < 20; i++) {
    const rainDrop = document.createElement('div');
    rainDrop.className = 'rain-drop';
    rainContainer.appendChild(rainDrop);
  }
  
  container.appendChild(rainContainer);
}

/**
 * Update animations based on theme (dark/light)
 */
function updateAnimationsForTheme(theme) {
  // Sun visibility in dark mode
  const sun = document.querySelector('.sun');
  if (sun) {
    sun.style.opacity = theme === 'dark' ? '0' : '1';
  }
  
  // Moon visibility in light mode
  const moon = document.querySelector('.moon');
  if (moon) {
    moon.style.opacity = theme === 'dark' ? '1' : '0';
  }
  
  // Cloud brightness in dark mode
  const clouds = document.querySelectorAll('.cloud');
  clouds.forEach(cloud => {
    cloud.style.filter = theme === 'dark' ? 'brightness(0.4) blur(1px)' : 'blur(1px)';
  });
}

/**
 * Update weather classes on body based on current conditions
 */
function updateWeatherClass() {
  // Default to clear day weather if no weather data is available yet
  let weatherCondition = 'clear';
  let isDay = getCurrentTimeOfDay(); // Use current time if no weather data
  
  // Try to get the current weather data
  if (window.currentWeatherData) {
    const data = window.currentWeatherData;
    
    // Determine day/night
    if (data.weather && data.weather[0] && data.weather[0].icon) {
      isDay = !data.weather[0].icon.includes('n');
    }
    
    // Get weather condition
    if (data.weather && data.weather[0]) {
      weatherCondition = data.weather[0].main.toLowerCase();
    }
  }
  
  // Remove all weather classes
  document.body.classList.remove(
    'weather-clear',
    'weather-clouds',
    'weather-few-clouds',
    'weather-rain',
    'weather-drizzle',
    'weather-thunderstorm',
    'weather-snow',
    'weather-mist',
    'weather-day',
    'weather-night'
  );
  
  // Add appropriate weather class
  document.body.classList.add(`weather-${weatherCondition}`);
  
  // Add day/night class
  document.body.classList.add(isDay ? 'weather-day' : 'weather-night');
  
  console.log(`Updated weather animations: ${weatherCondition}, ${isDay ? 'day' : 'night'}`);
}

/**
 * Get current time of day based on local time
 */
function getCurrentTimeOfDay() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18; // Day is 6 AM to 6 PM
}

// Function to be called after weather data is loaded
function updateAnimationsForWeather(weatherData) {
  window.currentWeatherData = weatherData;
  updateWeatherClass();
}

// Export the update function for other modules to use
window.updateAnimationsForWeather = updateAnimationsForWeather; 