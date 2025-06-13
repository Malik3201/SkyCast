/**
 * Alerts - SkyCast
 * 
 * Handles fetching and displaying weather alerts
 */

import { fetchWeatherData, fetchWeatherDataByCoords } from './main.js';

// DOM Elements
const alertsContainer = document.getElementById('alerts-container');
const alertsLoading = document.getElementById('alerts-loading');
const noAlertsMessage = document.getElementById('no-alerts-message');
const cityName = document.getElementById('city-name');
const countryName = document.getElementById('country-name');
const countryFlag = document.getElementById('country-flag');
const localTime = document.getElementById('local-time');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feels-like');
const weatherIcon = document.getElementById('weather-icon');
const weatherDescription = document.getElementById('weather-description');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');

// Search elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');

// API endpoints
const OPENWEATHER_API_KEY = '1e65f1891bcb8c28e6f6f9a93c4cac8c';
const OPENWEATHER_ALERTS_API = 'https://api.openweathermap.org/data/2.5/onecall';
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5/';

document.addEventListener('DOMContentLoaded', () => {
  // Setup search functionality
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
  
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
  }
  
  if (locationBtn) {
    locationBtn.addEventListener('click', getUserLocation);
  }
  
  // Theme toggle functionality
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
    checkThemePreference();
  }
  
  // Show no alerts message by default
  showNoAlertsMessage('Please search for a location to check weather alerts.');
  
  // Check for saved location or use default
  const savedLocation = localStorage.getItem('skycast-location');
  
  if (savedLocation) {
    const { lat, lon, name } = JSON.parse(savedLocation);
    fetchAlertsByCoords(lat, lon, name);
  }
  
  // Listen for location updates from other parts of the app
  window.addEventListener('locationUpdated', (e) => {
    const { lat, lon, name } = e.detail;
    fetchAlertsByCoords(lat, lon, name);
  });
  
  // Setup chatbot button
  const chatBotBtn = document.getElementById('chat-bot-btn');
  if (chatBotBtn) {
    chatBotBtn.addEventListener('click', () => {
      window.location.href = 'assistant.html';
    });
  }
});

/**
 * Handle search functionality
 */
function handleSearch() {
  const query = searchInput ? searchInput.value.trim() : '';
  if (query) {
    console.log('Searching for:', query);
    fetchAlertsByCity(query);
  }
}

/**
 * Get user's current location
 */
function getUserLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by this browser.');
    return;
  }
  
  if (locationBtn) {
    locationBtn.textContent = 'Detecting location...';
    locationBtn.disabled = true;
  }
  
  showLoading();
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("Geolocation success:", position.coords);
      const { latitude, longitude } = position.coords;
      
      fetchAlertsByCoords(latitude, longitude);
      
      if (locationBtn) {
        locationBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Use my location
        `;
        locationBtn.disabled = false;
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
      hideLoading();
      
      let errorMsg = 'Unable to retrieve your location.';
      switch(error.code) {
        case 1:
          errorMsg += ' Please allow location access in your browser settings.';
          break;
        case 2:
          errorMsg += ' Position unavailable. Please try again later.';
          break;
        case 3:
          errorMsg += ' Request timed out. Please try again.';
          break;
      }
      
      alert(errorMsg);
      
      if (locationBtn) {
        locationBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Use my location
        `;
        locationBtn.disabled = false;
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

/**
 * Fetch weather data by city name (standalone function for alerts page)
 */
async function fetchWeatherData(city) {
  const response = await fetch(
    `${WEATHER_API_BASE_URL}weather?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error('Weather data not found');
  }
  
  return await response.json();
}

/**
 * Fetch weather data by coordinates (standalone function for alerts page)
 */
async function fetchWeatherDataByCoords(lat, lon) {
  const response = await fetch(
    `${WEATHER_API_BASE_URL}weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error('Weather data not found');
  }
  
  return await response.json();
}

/**
 * Fetch alerts by city name
 */
async function fetchAlertsByCity(city) {
  showLoading();
  
  try {
    // First get the weather data to obtain coordinates
    const weatherData = await fetchWeatherData(city);
    if (!weatherData || !weatherData.coord) {
      throw new Error('Unable to get coordinates for this location');
    }
    
    // Update current conditions display
    updateCurrentConditions(weatherData);
    
    // Then fetch the alerts using the coordinates
    const { lat, lon } = weatherData.coord;
    fetchOneCallData(lat, lon);
    
  } catch (error) {
    console.error('Error fetching alerts by city:', error);
    hideLoading();
    showNoAlertsMessage('Error loading alerts. Please try again.');
  }
}

/**
 * Fetch alerts by coordinates
 */
async function fetchAlertsByCoords(lat, lon, locationName) {
  showLoading();
  
  try {
    // First get the weather data for the location
    const weatherData = await fetchWeatherDataByCoords(lat, lon);
    
    // Update current conditions display
    updateCurrentConditions(weatherData);
    
    // Fetch alerts data
    fetchOneCallData(lat, lon);
    
  } catch (error) {
    console.error('Error fetching alerts by coordinates:', error);
    hideLoading();
    showNoAlertsMessage('Error loading alerts. Please try again.');
  }
}

/**
 * Fetch OneCall API data which includes alerts
 */
async function fetchOneCallData(lat, lon) {
  try {
    const response = await fetch(`${OPENWEATHER_ALERTS_API}?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&units=metric&appid=${OPENWEATHER_API_KEY}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch alerts data');
    }
    
    const data = await response.json();
    
    // Update the alerts UI
    updateAlertsUI(data);
    
  } catch (error) {
    console.error('Error fetching alerts data:', error);
    hideLoading();
    showNoAlertsMessage('Error loading alerts. Please try again.');
  }
}

/**
 * Update the alerts UI
 */
function updateAlertsUI(data) {
  hideLoading();
  
  // Make sure alerts section is visible
  const alertsSection = document.getElementById('alerts-section');
  if (alertsSection) {
    alertsSection.classList.remove('hidden');
  }
  
  // Check if there are any alerts
  if (!data.alerts || data.alerts.length === 0) {
    showNoAlertsMessage();
    return;
  }
  
  // Hide no alerts message
  if (noAlertsMessage) {
    noAlertsMessage.classList.add('hidden');
  }
  
  // Clear existing alerts
  const existingAlerts = alertsContainer.querySelectorAll('.alert-card');
  existingAlerts.forEach(alert => alert.remove());
  
  // Create and append alert cards
  data.alerts.forEach(alert => {
    const alertCard = createAlertCard(alert);
    alertsContainer.appendChild(alertCard);
  });
}

/**
 * Create an alert card element
 */
function createAlertCard(alert) {
  const alertCard = document.createElement('div');
  alertCard.className = `alert-card ${getSeverityClass(alert.event)}`;
  
  // Format times
  const start = formatDate(alert.start);
  const end = formatDate(alert.end);
  
  alertCard.innerHTML = `
    <div class="alert-header">
      <h3 class="alert-title">${alert.event}</h3>
      <div class="alert-source">Source: ${alert.sender_name}</div>
    </div>
    <div class="alert-time">
      <div class="alert-start">Starts: ${start}</div>
      <div class="alert-end">Ends: ${end}</div>
    </div>
    <div class="alert-description">${alert.description}</div>
  `;
  
  return alertCard;
}

/**
 * Update current conditions display
 */
function updateCurrentConditions(data) {
  if (cityName) cityName.textContent = data.name || '--';
  
  if (countryName && data.sys && data.sys.country) {
    countryName.textContent = data.sys.country;
    fetchCountryFlag(data.sys.country);
  }
  
  if (localTime) {
    const timezone = data.timezone; // Timezone offset in seconds
    const currentTime = new Date((Date.now() / 1000 + timezone) * 1000);
    localTime.textContent = currentTime.toLocaleString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'UTC'
    });
  }
  
  if (temperature && data.main && data.main.temp) {
    temperature.textContent = Math.round(data.main.temp);
  }
  
  if (feelsLike && data.main && data.main.feels_like) {
    feelsLike.textContent = Math.round(data.main.feels_like);
  }
  
  if (weatherIcon && data.weather && data.weather[0]) {
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
  }
  
  if (weatherDescription && data.weather && data.weather[0]) {
    weatherDescription.textContent = data.weather[0].description;
  }
  
  if (humidity && data.main && data.main.humidity) {
    humidity.textContent = `${data.main.humidity}%`;
  }
  
  if (wind && data.wind && data.wind.speed) {
    const direction = getWindDirection(data.wind.deg);
    wind.textContent = `${data.wind.speed.toFixed(1)} m/s ${direction}`;
  }
  
  if (pressure && data.main && data.main.pressure) {
    pressure.textContent = `${data.main.pressure} hPa`;
  }
  
  if (visibility && data.visibility) {
    visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  }
}

/**
 * Fetch country flag
 */
async function fetchCountryFlag(countryCode) {
  try {
    if (!countryFlag) return;
    
    countryFlag.src = `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
    countryFlag.alt = `Flag of ${countryCode}`;
  } catch (error) {
    console.error('Error fetching country flag:', error);
    countryFlag.style.display = 'none';
  }
}

/**
 * Helper function to get wind direction from degrees
 */
function getWindDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5);
  return directions[index % 16];
}

/**
 * Helper function to determine severity class for alerts
 */
function getSeverityClass(eventType) {
  eventType = eventType.toLowerCase();
  
  // Extreme events
  if (eventType.includes('extreme') || 
      eventType.includes('tornado') || 
      eventType.includes('hurricane') || 
      eventType.includes('typhoon')) {
    return 'severity-extreme';
  }
  
  // Severe events
  if (eventType.includes('severe') || 
      eventType.includes('warning') || 
      eventType.includes('thunderstorm') || 
      eventType.includes('flood')) {
    return 'severity-severe';
  }
  
  // Moderate events
  if (eventType.includes('moderate') || 
      eventType.includes('watch') || 
      eventType.includes('advisory')) {
    return 'severity-moderate';
  }
  
  // Default to minor
  return 'severity-minor';
}

/**
 * Format date for display
 */
function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}

/**
 * Show loading indicator
 */
function showLoading() {
  const loadingSection = document.getElementById('loading-section');
  if (loadingSection) {
    loadingSection.classList.remove('hidden');
  }
  
  const alertsSection = document.getElementById('alerts-section');
  if (alertsSection) {
    alertsSection.classList.add('hidden');
  }
  
  if (noAlertsMessage) {
    noAlertsMessage.classList.add('hidden');
  }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  const loadingSection = document.getElementById('loading-section');
  if (loadingSection) {
    loadingSection.classList.add('hidden');
  }
}

/**
 * Show no alerts message
 */
function showNoAlertsMessage(message = 'No active weather alerts for this location.') {
  // Make sure alerts section is visible
  const alertsSection = document.getElementById('alerts-section');
  if (alertsSection) {
    alertsSection.classList.remove('hidden');
  }
  
  // Show no alerts message
  if (noAlertsMessage) {
    noAlertsMessage.classList.remove('hidden');
    
    // Update the main message text (the first p element after h3)
    const mainMessage = noAlertsMessage.querySelector('p:first-of-type');
    if (mainMessage) {
      mainMessage.textContent = message;
    }
  }
  
  // Clear any existing alert cards
  if (alertsContainer) {
    const existingAlerts = alertsContainer.querySelectorAll('.alert-card');
    existingAlerts.forEach(alert => alert.remove());
  }
}

/**
 * Check and set theme preference
 */
function checkThemePreference() {
  const savedTheme = localStorage.getItem('skycastTheme');
  
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    // Check user's system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('skycastTheme', 'dark');
    }
  }
}

/**
 * Toggle theme between light and dark
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('skycastTheme', newTheme);
} 