// Import configuration
import { OPENWEATHER_API_KEY } from '../../data/config.js';
import { initChat, updateChatbotLocationData, updateChatbotWeatherData } from './chatbot.js';

// Constants
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5/';
const WEATHER_ICON_URL = 'https://openweathermap.org/img/wn/';
const COUNTRIES_API_URL = 'https://restcountries.com/v3.1/alpha/';
const DEFAULT_UNITS = 'metric';
const CUSTOM_ICONS_PATH = 'assets/icons/weather/';

// CSS RGB variables for dynamic styling
document.documentElement.style.setProperty('--primary-color-rgb', '67, 97, 238'); // Modern blue
document.documentElement.style.setProperty('--secondary-color-rgb', '247, 37, 133'); // Vibrant pink
document.documentElement.style.setProperty('--accent-color-rgb', '114, 9, 183'); // Rich purple

// Update RGB values when theme changes
const updateRgbValues = (isDark) => {
  if (isDark) {
    document.documentElement.style.setProperty('--primary-color-rgb', '76, 201, 240'); // Brighter blue for dark
  } else {
    document.documentElement.style.setProperty('--primary-color-rgb', '67, 97, 238'); // Modern blue
  }
};

// Weather condition mappings to our custom icons
const WEATHER_ICONS_MAP = {
  '01d': 'sun.svg',            // Clear day
  '01n': 'moon.svg',           // Clear night
  '02d': 'cloudy.svg',         // Few clouds day
  '02n': 'cloudy.svg',         // Few clouds night
  '03d': 'cloudy.svg',         // Scattered clouds day
  '03n': 'cloudy.svg',         // Scattered clouds night
  '04d': 'cloudy.svg',         // Broken clouds day
  '04n': 'cloudy.svg',         // Broken clouds night
  '09d': 'rain.svg',           // Shower rain day
  '09n': 'rain.svg',           // Shower rain night
  '10d': 'rain.svg',           // Rain day
  '10n': 'rain.svg',           // Rain night
  '11d': 'storm.svg',          // Thunderstorm day
  '11n': 'storm.svg',          // Thunderstorm night
  '13d': 'snow.svg',           // Snow day
  '13n': 'snow.svg',           // Snow night
  '50d': 'haze.svg',           // Mist day
  '50n': 'haze.svg',           // Mist night
  'animated-clouds': 'animated-clouds.svg', // Animated clouds
  'sunrise': 'sunrise.svg',    // Sunrise icon
  'sunset': 'sunset.svg',      // Sunset icon
  'default': 'default.svg'     // Default icon
};

// DOM Elements
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainNav = document.querySelector('.main-nav');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const loader = document.getElementById('loader');
const weatherCard = document.getElementById('weather-card');
const hourlyForecastSection = document.getElementById('hourly-forecast');
const dailyForecastSection = document.getElementById('daily-forecast');
const weatherAlertsSection = document.getElementById('weather-alerts');
const mapSection = document.getElementById('map-section');
const themeToggle = document.getElementById('theme-toggle');

// Elements for current weather
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

// Elements for hourly forecast
const hourlyCards = document.getElementById('hourly-cards');

// Elements for daily forecast
const dailyForecastGrid = document.getElementById('daily-forecast-grid');

// Elements for alerts
const alertsContainer = document.getElementById('alerts-container');

// Map instance
let map = null;
let currentYear = document.getElementById('current-year');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  setupEventListeners();
  
  // Set current year in footer
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // Check for saved theme preference
  checkThemePreference();
  
  // Try to get user location immediately
  promptGeolocation();
  
  // Initialize chatbot
  initChat();
});

// Function to prompt geolocation
function promptGeolocation() {
  if (navigator.geolocation) {
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Geolocation success:", position.coords);
        const { latitude, longitude } = position.coords;
        
        // Call the API with coordinates
        fetchWeatherDataByCoords(latitude, longitude);
        
        // Save coordinates to localStorage
        localStorage.setItem('weatherAppLocation', JSON.stringify({
          lat: latitude,
          lon: longitude
        }));
      },
      (error) => {
        console.error('Geolocation error code:', error.code, 'message:', error.message);
        
        // Fall back to saved location or show manual search UI
        const savedLocation = localStorage.getItem('weatherAppLocation');
        if (savedLocation) {
          checkSavedLocation();
        } else {
          hideLoading();
          showManualSearchUI();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    console.warn("Geolocation is not supported.");
    showManualSearchUI();
  }
}

// Function to show manual search UI when geolocation fails
function showManualSearchUI() {
  hideLoading();
  
  // Highlight the search box to encourage manual entry
  if (searchInput) {
    searchInput.classList.add('highlight-search');
    searchInput.placeholder = "Enter a city name to get started...";
    setTimeout(() => {
      searchInput.classList.remove('highlight-search');
    }, 2000);
  }
}

// Function to set up event listeners
function setupEventListeners() {
  // Mobile menu toggle
  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }
  
  // Search functionality
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
  
  // Enter key for search
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
  }
  
  // Location button
  if (locationBtn) {
    locationBtn.addEventListener('click', getUserLocation);
  }
  
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Chat bot button
  const chatBotButton = document.getElementById('chat-bot-btn');
  if (chatBotButton) {
    chatBotButton.addEventListener('click', () => {
      // Redirect to assistant page
      window.location.href = 'assistant.html';
    });
  }
  
  // Close mobile menu with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav && mainNav.classList.contains('active')) {
      toggleMobileMenu();
    }
  });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (mainNav && mainNav.classList.contains('active') &&
        !mainNav.contains(e.target) && 
        !mobileMenuToggle.contains(e.target)) {
      toggleMobileMenu();
    }
  });
}

// Toggle mobile menu
function toggleMobileMenu() {
  const nav = document.querySelector('.main-nav');
  const toggle = document.querySelector('.mobile-menu-toggle');
  const body = document.body;
  
  // Create mobile overlay if it doesn't exist
  let overlay = document.querySelector('.mobile-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);
    
    // Add click event to overlay to close menu
    overlay.addEventListener('click', () => {
      toggleMobileMenu();
    });
  }
  
  // Toggle classes
  nav.classList.toggle('active');
  toggle.classList.toggle('active');
  overlay.classList.toggle('active');
  
  // Toggle spans for animation
  const spans = toggle.querySelectorAll('span');
  if (toggle.classList.contains('active')) {
    // Transform to X
    spans[0].style.transform = 'translateY(9px) rotate(45deg)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'translateY(-9px) rotate(-45deg)';
    
    // Prevent scrolling when menu is open
    body.style.overflow = 'hidden';
  } else {
    // Reset to hamburger
    spans[0].style.transform = 'none';
    spans[1].style.opacity = '1';
    spans[2].style.transform = 'none';
    
    // Re-enable scrolling
    body.style.overflow = '';
  }
}

// Toggle theme between light and dark
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  // Apply theme to document
  document.documentElement.setAttribute('data-theme', newTheme);
  
  // Store user preference
  localStorage.setItem('skycastTheme', newTheme);
  
  // Update theme toggle button
  updateThemeToggle(newTheme);
  
  // Update RGB values for dynamic styling
  updateRgbValues(newTheme === 'dark');
  
  // Apply smooth transition for UI elements
  document.body.style.transition = 'background-color 0.5s ease';
  
  // Refresh weather background effects if they exist
  const existingWeatherBg = document.getElementById('weather-background');
  if (existingWeatherBg) {
    // Get the current weather type from body classes
    const bodyClasses = document.body.className;
    const weatherMatch = bodyClasses.match(/weather-(\w+)/g);
    
    if (weatherMatch) {
      // Find the main weather type (not night)
      const mainWeatherType = weatherMatch.find(cls => !cls.includes('night'))?.replace('weather-', '');
      const isNight = weatherMatch.some(cls => cls.includes('night'));
      
      if (mainWeatherType) {
        // Simulate icon code for night detection
        const simulatedIconCode = isNight ? '01n' : '01d';
        addWeatherBackgroundEffects(mainWeatherType, simulatedIconCode);
      }
    }
  }
  
  // If map is initialized, we need to redraw it with appropriate styles
  if (map) {
    setTimeout(() => {
      const lat = map.getCenter().lat;
      const lng = map.getCenter().lng;
      const zoom = map.getZoom();
      const cityLabel = document.querySelector('.leaflet-popup-content')?.textContent || null;
      
      // Reinitialize map with current coordinates and zoom level
      map.remove();
      map = L.map('map').setView([lat, lng], zoom);
      
      // Add the appropriate tile layer
      addMapTileLayer();
      
      // Re-add marker if needed
      if (cityLabel) {
        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`<b>${cityLabel.replace(/^\s*<b>|\s*<\/b>\s*$/g, '')}</b>`);
      }
    }, 300);
  }
}

// Update theme toggle button based on current theme
function updateThemeToggle(theme) {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  
  if (theme === 'dark') {
    themeToggle.classList.add('dark');
    themeToggle.setAttribute('aria-label', 'Switch to light mode');
  } else {
    themeToggle.classList.remove('dark');
    themeToggle.setAttribute('aria-label', 'Switch to dark mode');
  }
}

// Check and set theme preference
function checkThemePreference() {
  // Get saved theme from localStorage
  const savedTheme = localStorage.getItem('skycastTheme');
  
  // If user has a saved preference, use that
  if (savedTheme === 'dark' || savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggle(savedTheme);
    updateRgbValues(savedTheme === 'dark');
    return;
  }
  
  // Otherwise, check system preference
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (isDarkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('skycastTheme', 'dark');
    updateThemeToggle('dark');
    updateRgbValues(true);
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('skycastTheme', 'light');
    updateThemeToggle('light');
    updateRgbValues(false);
  }
  
  // Add listener for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('skycastTheme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('skycastTheme', newTheme);
      updateThemeToggle(newTheme);
      updateRgbValues(e.matches);
    }
  });
}

// Handle search
function handleSearch() {
  const query = searchInput ? searchInput.value.trim() : '';
  if (query) {
    showLoading();
    fetchWeatherData(query);
  }
}

// Get user's location
function getUserLocation() {
  if (navigator.geolocation) {
    if (locationBtn) {
      locationBtn.textContent = 'Detecting location...';
      locationBtn.disabled = true;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Geolocation success:", position.coords); // Debug
        const { latitude, longitude } = position.coords;
        
        // Call the API with coordinates
        fetchWeatherDataByCoords(latitude, longitude);
        
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
        console.error('Geolocation error code:', error.code, 'message:', error.message);
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
        timeout: 10000, // Extended timeout
        maximumAge: 0
      }
    );
  } else {
    alert('Geolocation is not supported by this browser.');
  }
}

// Check if user has saved location
function checkSavedLocation() {
  const savedLocation = localStorage.getItem('weatherAppLocation');
  if (savedLocation) {
    const locationData = JSON.parse(savedLocation);
    
    showLoading();
    
    if (locationData.name) {
      fetchWeatherData(locationData.name);
      if (searchInput) searchInput.value = locationData.name;
    } else if (locationData.lat && locationData.lon) {
      fetchWeatherDataByCoords(locationData.lat, locationData.lon);
    }
  }
}

// Add map tile layer based on current theme
function addMapTileLayer() {
  if (!map) return;
  
  // Get current theme
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const isDarkTheme = currentTheme === 'dark';
  
  // Select appropriate tile layer based on theme
  const tileLayer = isDarkTheme
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    
  const attribution = isDarkTheme
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  
  // Add the tile layer
  L.tileLayer(tileLayer, {
    attribution: attribution,
    maxZoom: 19
  }).addTo(map);
}

// Show loading state
function showLoading() {
  if (loader) loader.classList.remove('hidden');
  if (weatherCard) weatherCard.classList.add('hidden');
  if (hourlyForecastSection) hourlyForecastSection.classList.add('hidden');
  if (dailyForecastSection) dailyForecastSection.classList.add('hidden');
  if (weatherAlertsSection) weatherAlertsSection.classList.add('hidden');
  if (mapSection) mapSection.classList.add('hidden');
}

// Hide loading state
function hideLoading() {
  if (loader) loader.classList.add('hidden');
  if (weatherCard) weatherCard.classList.remove('hidden');
  if (hourlyForecastSection) hourlyForecastSection.classList.remove('hidden');
  if (dailyForecastSection) dailyForecastSection.classList.remove('hidden');
  if (weatherAlertsSection) weatherAlertsSection.classList.remove('hidden');
  if (mapSection) mapSection.classList.remove('hidden');
}

// Fetch weather data by city name
async function fetchWeatherData(city) {
  try {
    // Fetch current weather
    const currentWeatherResponse = await fetch(
      `${WEATHER_API_BASE_URL}weather?q=${encodeURIComponent(city)}&units=${DEFAULT_UNITS}&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!currentWeatherResponse.ok) {
      throw new Error('City not found');
    }
    
    const currentWeatherData = await currentWeatherResponse.json();
    const { lat, lon } = currentWeatherData.coord;
    
    // Save to local storage
    localStorage.setItem('weatherAppLocation', JSON.stringify({
      name: currentWeatherData.name,
      lat,
      lon,
      country: currentWeatherData.sys.country
    }));
    
    // Fetch additional data with OneCall API
    await fetchOneCallData(lat, lon);
    
    // Update UI with current weather data
    updateWeatherUI(currentWeatherData);
    
    // Fetch and display country flag
    fetchCountryFlag(currentWeatherData.sys.country);
    
    // Initialize map
    initMap(lat, lon, currentWeatherData.name);
    
  } catch (error) {
    console.error('Error fetching weather data:', error);
    hideLoading();
    alert('Could not find weather data for the specified city. Please check the city name and try again.');
  }
}

// Fetch weather data by coordinates
async function fetchWeatherDataByCoords(lat, lon) {
  try {
    // Fetch current weather by coordinates
    const currentWeatherResponse = await fetch(
      `${WEATHER_API_BASE_URL}weather?lat=${lat}&lon=${lon}&units=${DEFAULT_UNITS}&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!currentWeatherResponse.ok) {
      throw new Error('Weather data not found');
    }
    
    const currentWeatherData = await currentWeatherResponse.json();
    
    // Save to local storage
    localStorage.setItem('weatherAppLocation', JSON.stringify({
      name: currentWeatherData.name,
      lat,
      lon,
      country: currentWeatherData.sys.country
    }));
    
    // Fetch additional data with OneCall API
    await fetchOneCallData(lat, lon);
    
    // Update UI with current weather data
    updateWeatherUI(currentWeatherData);
    
    // Fetch and display country flag
    fetchCountryFlag(currentWeatherData.sys.country);
    
    // Initialize map
    initMap(lat, lon, currentWeatherData.name);
    
  } catch (error) {
    console.error('Error fetching weather data by coordinates:', error);
    hideLoading();
    alert('Could not fetch weather data for your location. Please try again.');
  }
}

// Fetch OneCall API data (includes hourly, daily, and alerts)
async function fetchOneCallData(lat, lon) {
  try {
    console.log(`Fetching OneCall data for lat: ${lat}, lon: ${lon}`);
    
    // Fixed endpoint for OneCall API - v3.0 uses different structure than v2.5
    const oneCallResponse = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${DEFAULT_UNITS}&exclude=minutely&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!oneCallResponse.ok) {
      const errorText = await oneCallResponse.text();
      console.error(`OneCall API error: ${errorText}`);
      
      // If OneCall API fails, try with the forecast endpoint as backup
      console.log("Attempting fallback to forecast endpoint");
      await fetchFallbackForecast(lat, lon);
      
      return;
    }
    
    const oneCallData = await oneCallResponse.json();
    console.log("OneCall data:", oneCallData);
    
    // Update hourly forecast UI
    if (oneCallData.hourly && oneCallData.hourly.length > 0) {
      updateHourlyForecastUI(oneCallData.hourly);
      if (hourlyForecastSection) hourlyForecastSection.classList.remove('hidden');
    }
    
    // Update daily forecast UI
    if (oneCallData.daily && oneCallData.daily.length > 0) {
      updateDailyForecastUI(oneCallData.daily);
      if (dailyForecastSection) dailyForecastSection.classList.remove('hidden');
    }
    
    // Update alerts UI if available
    if (oneCallData.alerts && oneCallData.alerts.length > 0) {
      updateAlertsUI(oneCallData.alerts);
      if (weatherAlertsSection) weatherAlertsSection.classList.remove('hidden');
    }
    
  } catch (error) {
    console.error('Error fetching OneCall data:', error);
    
    // Try the fallback approach using the standard forecast endpoint
    try {
      await fetchFallbackForecast(lat, lon);
    } catch (fallbackError) {
      console.error('Fallback forecast fetch also failed:', fallbackError);
    }
  }
}

// Fallback to standard forecast endpoint for 5-day forecast
async function fetchFallbackForecast(lat, lon) {
  try {
    console.log("Using fallback forecast endpoint");
    
    // Standard 5-day forecast endpoint
    const forecastResponse = await fetch(
      `${WEATHER_API_BASE_URL}forecast?lat=${lat}&lon=${lon}&units=${DEFAULT_UNITS}&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!forecastResponse.ok) {
      throw new Error('Forecast data not found');
    }
    
    const forecastData = await forecastResponse.json();
    console.log("Fallback forecast data:", forecastData);
    
    // Extract hourly forecast from 5-day/3-hour forecast
    const hourlyData = forecastData.list.map(item => ({
      dt: item.dt,
      temp: item.main.temp,
      feels_like: item.main.feels_like,
      pressure: item.main.pressure,
      humidity: item.main.humidity,
      weather: item.weather,
      pop: item.pop || 0
    }));
    
    // Update hourly forecast UI with extracted data
    updateHourlyForecastUI(hourlyData);
    if (hourlyForecastSection) hourlyForecastSection.classList.remove('hidden');
    
    // Extract daily forecast by grouping by day
    const dailyData = processDailyForecast(forecastData.list);
    
    // Update daily forecast UI with extracted data
    updateDailyForecastUI(dailyData);
    if (dailyForecastSection) dailyForecastSection.classList.remove('hidden');
    
  } catch (error) {
    console.error('Error fetching fallback forecast data:', error);
  }
}

// Process 3-hour forecast into daily forecast
function processDailyForecast(forecastList) {
  // Group forecasts by day
  const dailyForecasts = {};
  
  forecastList.forEach(forecast => {
    const date = new Date(forecast.dt * 1000);
    const day = date.toISOString().split('T')[0];
    
    if (!dailyForecasts[day]) {
      dailyForecasts[day] = {
        dt: forecast.dt,
        temp: { min: forecast.main.temp, max: forecast.main.temp },
        weather: forecast.weather
      };
    } else {
      // Update min/max temperatures
      dailyForecasts[day].temp.min = Math.min(dailyForecasts[day].temp.min, forecast.main.temp);
      dailyForecasts[day].temp.max = Math.max(dailyForecasts[day].temp.max, forecast.main.temp);
      
      // Use weather from midday if available (around 12:00)
      const hour = date.getHours();
      if (hour >= 11 && hour <= 14) {
        dailyForecasts[day].weather = forecast.weather;
      }
    }
  });
  
  // Convert to array format similar to OneCall daily data
  return Object.values(dailyForecasts);
}

// Update weather UI
function updateWeatherUI(data) {
  // Update city name and country
  if (cityName) cityName.textContent = data.name;
  if (countryName && data.sys && data.sys.country) countryName.textContent = data.sys.country;
  
  // Update animations with current weather data
  if (window.updateAnimationsForWeather) {
    window.updateAnimationsForWeather(data);
  }
  
  // Update local time
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
  
  // Update temperature with animation
  if (temperature && data.main && data.main.temp) {
    // Create counter animation effect
    const targetTemp = Math.round(data.main.temp);
    const startTemp = 0;
    const duration = 1500; // milliseconds
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Ease-out function for smoother animation
      const easeOutQuad = t => t * (2 - t);
      const easedProgress = easeOutQuad(progress);
      
      const currentTemp = Math.floor(startTemp + (targetTemp - startTemp) * easedProgress);
      temperature.textContent = currentTemp;
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        temperature.textContent = targetTemp;
      }
    }
    
    requestAnimationFrame(updateCounter);
  }
  
  if (feelsLike && data.main && data.main.feels_like) feelsLike.textContent = Math.round(data.main.feels_like);
  
  // Update weather icon and description with enhanced effects
  if (weatherIcon && data.weather && data.weather[0]) {
    const iconCode = data.weather[0].icon;
    const customIcon = WEATHER_ICONS_MAP[iconCode] || WEATHER_ICONS_MAP['default'];
    
    // Add fade-in animation to the icon
    weatherIcon.style.opacity = '0';
    weatherIcon.src = `${CUSTOM_ICONS_PATH}${customIcon}`;
    
    // Trigger a smooth fade-in effect
    setTimeout(() => {
      weatherIcon.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      weatherIcon.style.opacity = '1';
      weatherIcon.style.transform = 'scale(1.05)';
      
      setTimeout(() => {
        weatherIcon.style.transform = 'scale(1)';
      }, 300);
    }, 100);
    
    weatherIcon.alt = data.weather[0].description;
  }
  
  if (weatherDescription && data.weather && data.weather[0]) {
    const description = data.weather[0].description;
    
    // Add typing effect for description
    weatherDescription.textContent = '';
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < description.length) {
        weatherDescription.textContent += description.charAt(i);
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);
  }
  
  // Update weather stats with animated counters
  if (humidity && data.main && data.main.humidity) {
    animateCounter(humidity, 0, data.main.humidity, '%');
  }
  
  if (wind && data.wind && data.wind.speed) {
    const direction = getWindDirection(data.wind.deg);
    animateCounter(wind, 0, data.wind.speed.toFixed(1), ` m/s ${direction}`);
  }
  
  if (pressure && data.main && data.main.pressure) {
    animateCounter(pressure, 900, data.main.pressure, ' hPa');
  }
  
  if (visibility && data.visibility) {
    animateCounter(visibility, 0, (data.visibility / 1000).toFixed(1), ' km');
  }
  
  // Apply weather-specific background with enhanced animation
  applyWeatherBackground(data.weather[0].main, data.weather[0].icon);
  
  // Update chatbot data
  if (data.name && data.sys && data.sys.country) {
    updateChatbotLocationData(data.name, data.sys.country);
  }
  
  updateChatbotWeatherData(data);
  
  // Add sunrise and sunset info with enhanced animations
  if (data.sys && data.sys.sunrise && data.sys.sunset) {
    updateSunriseSunset(data.sys.sunrise, data.sys.sunset, data.timezone);
  }
  
  // Hide loading indicator with fade-out effect
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      hideLoading();
      loader.style.opacity = '1';
    }, 300);
  } else {
    hideLoading();
  }
  
  // Add entrance animations to the weather card
  if (weatherCard) {
    weatherCard.style.opacity = '0';
    weatherCard.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      weatherCard.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      weatherCard.style.opacity = '1';
      weatherCard.style.transform = 'translateY(0)';
      
      // Weather stats icons are now included in HTML
      // No need to call updateWeatherStatsWithIcons();
    }, 100);
  }
}

// Function to animate counter
function animateCounter(element, start, end, suffix = '') {
  const duration = 1500; // milliseconds
  const startTime = performance.now();
  const isDecimal = String(end).includes('.');
  
  function updateCounter(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    
    // Ease-out function for smoother animation
    const easeOutQuad = t => t * (2 - t);
    const easedProgress = easeOutQuad(progress);
    
    const currentValue = start + (end - start) * easedProgress;
    element.textContent = isDecimal ? currentValue.toFixed(1) + suffix : Math.floor(currentValue) + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = end + suffix;
    }
  }
  
  requestAnimationFrame(updateCounter);
}

// Function to update sunrise and sunset UI with our new animation
function updateSunriseSunset(sunriseTimestamp, sunsetTimestamp, timezone) {
  // Check if the updateSunPosition function is available (from our sun-animation.js)
  if (window.updateSunPosition) {
    // Use the new sun position animation
    const timeOfDay = window.updateSunPosition(sunriseTimestamp, sunsetTimestamp);
    
    // Adjust UI based on time of day if needed
    if (timeOfDay === 'night') {
      // Additional night styling could be applied here
    }
    
    return; // Exit early since our external script handles the UI
  }
  
  // Fallback to original function if our animation script isn't loaded
  // ... rest of the original updateSunriseSunset function ...
}

// Apply weather-specific background
function applyWeatherBackground(weatherMain, iconCode) {
  // Remove existing weather classes
  const weatherClasses = [
    'weather-clear', 
    'weather-clouds', 
    'weather-rain', 
    'weather-thunderstorm', 
    'weather-snow', 
    'weather-mist',
    'weather-haze',
    'weather-night',
    'weather-fog',
    'weather-dust',
    'weather-smoke',
    'weather-drizzle'
  ];
  
  // Remove classes from body
  weatherClasses.forEach(cls => {
    document.body.classList.remove(cls);
  });
  
  // Remove classes from weather card
  if (weatherCard) {
    weatherClasses.forEach(cls => {
      weatherCard.classList.remove(cls);
    });
  }
  
  // Map API weather conditions to our CSS classes
  let weatherType;
  switch (weatherMain.toLowerCase()) {
    case 'clear':
      weatherType = 'clear';
      break;
    case 'clouds':
      weatherType = 'clouds';
      break;
    case 'rain':
      weatherType = 'rain';
      break;
    case 'drizzle':
      weatherType = 'rain';
      break;
    case 'thunderstorm':
      weatherType = 'thunderstorm';
      break;
    case 'snow':
      weatherType = 'snow';
      break;
    case 'mist':
    case 'fog':
      weatherType = 'mist';
      break;
    case 'haze':
    case 'dust':
    case 'smoke':
    case 'sand':
    case 'ash':
      weatherType = 'haze';
      break;
    case 'squall':
    case 'tornado':
      weatherType = 'storm';
      break;
    default:
      weatherType = 'default';
  }
  
  // Add appropriate weather class to body
  document.body.classList.add(`weather-${weatherType}`);
  
  // Check if it's nighttime (icon ends with 'n')
  if (iconCode && iconCode.endsWith('n')) {
    document.body.classList.add('weather-night');
    if (weatherCard) {
      weatherCard.classList.add('weather-night');
    }
  } else if (weatherCard) {
    weatherCard.classList.add(`weather-${weatherType}`);
  }
  
  // Add dynamic weather background effects
  addWeatherBackgroundEffects(weatherType, iconCode);
}

// Enhanced weather background effects system
function addWeatherBackgroundEffects(weatherType, iconCode) {
  // Remove existing weather background
  removeWeatherBackground();
  
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const currentHour = new Date().getHours();
  const isNightTime = currentHour < 6 || currentHour > 18;
  
  // Create main weather background container
  const weatherBg = document.createElement('div');
  weatherBg.id = 'weather-background';
  weatherBg.className = 'weather-background';
  
  // Debug log for weather type
  console.log('Weather Background Debug:', { weatherType, isDarkMode, isNightTime, iconCode });
  
  // Add appropriate effects based on weather and time
  if (['rain', 'drizzle', 'thunderstorm'].includes(weatherType)) {
    addRainEffect(weatherBg, weatherType);
    addRainClouds(weatherBg);
  } else if (['clouds', 'mist', 'haze', 'fog', 'dust', 'smoke'].includes(weatherType)) {
    addCloudEffect(weatherBg);
  } else if (weatherType === 'snow') {
    addSnowEffect(weatherBg);
    addClouds(weatherBg);
  } else if (weatherType === 'clear') {
    // Check icon code for night detection (more reliable than time)
    const isNightIcon = iconCode && iconCode.endsWith('n');
    if (isDarkMode || isNightIcon || isNightTime) {
      addMoonEffect(weatherBg);
      addStarsEffect(weatherBg);
    } else {
      addSunEffect(weatherBg);
    }
  }
  
  // Always add atmospheric gradient for better sky background
  const isNightIcon = iconCode && iconCode.endsWith('n');
  addAtmosphericGradient(weatherBg, weatherType, isDarkMode, isNightIcon || isNightTime);
  
  document.body.appendChild(weatherBg);
}

function removeWeatherBackground() {
  const existing = document.getElementById('weather-background');
  if (existing) {
    existing.remove();
  }
}

function addRainEffect(container, intensity = 'rain') {
  const rainContainer = document.createElement('div');
  rainContainer.className = `rain-effect ${intensity}-intensity`;
  
  // Create rain drops
  for (let i = 0; i < 100; i++) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.left = Math.random() * 100 + '%';
    drop.style.animationDelay = Math.random() * 2 + 's';
    drop.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
    rainContainer.appendChild(drop);
  }
  
  container.appendChild(rainContainer);
}

function addRainClouds(container) {
  const cloudsContainer = document.createElement('div');
  cloudsContainer.className = 'rain-clouds-effect';
  
  // Create multiple cloud layers
  for (let i = 0; i < 5; i++) {
    const cloud = document.createElement('div');
    cloud.className = `rain-cloud rain-cloud-${i + 1}`;
    cloud.style.left = Math.random() * 120 - 10 + '%';
    cloud.style.animationDelay = Math.random() * 10 + 's';
    cloudsContainer.appendChild(cloud);
  }
  
  container.appendChild(cloudsContainer);
}

function addCloudEffect(container) {
  const cloudsContainer = document.createElement('div');
  cloudsContainer.className = 'clouds-effect';
  
  // Create multiple cloud layers
  for (let i = 0; i < 4; i++) {
    const cloud = document.createElement('div');
    cloud.className = `cloud-bg cloud-bg-${i + 1}`;
    cloud.style.left = Math.random() * 120 - 10 + '%';
    cloud.style.animationDelay = Math.random() * 20 + 's';
    cloudsContainer.appendChild(cloud);
  }
  
  container.appendChild(cloudsContainer);
}

function addSnowEffect(container) {
  const snowContainer = document.createElement('div');
  snowContainer.className = 'snow-effect';
  
  // Create snowflakes
  for (let i = 0; i < 50; i++) {
    const flake = document.createElement('div');
    flake.className = 'snowflake';
    flake.innerHTML = '❄';
    flake.style.left = Math.random() * 100 + '%';
    flake.style.animationDelay = Math.random() * 3 + 's';
    flake.style.animationDuration = (Math.random() * 3 + 4) + 's';
    flake.style.fontSize = (Math.random() * 10 + 10) + 'px';
    snowContainer.appendChild(flake);
  }
  
  container.appendChild(snowContainer);
}

function addMoonEffect(container) {
  const moonContainer = document.createElement('div');
  moonContainer.className = 'moon-effect';
  
  const moon = document.createElement('div');
  moon.className = 'moon';
  moonContainer.appendChild(moon);
  
  container.appendChild(moonContainer);
}

function addStarsEffect(container) {
  const starsContainer = document.createElement('div');
  starsContainer.className = 'stars-effect';
  
  // Create twinkling stars
  for (let i = 0; i < 30; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 60 + '%';
    star.style.animationDelay = Math.random() * 3 + 's';
    starsContainer.appendChild(star);
  }
  
  container.appendChild(starsContainer);
}

function addSunEffect(container) {
  const sunContainer = document.createElement('div');
  sunContainer.className = 'sun-effect';
  
  const sun = document.createElement('div');
  sun.className = 'sun-bg';
  sunContainer.appendChild(sun);
  
  container.appendChild(sunContainer);
}

function addClouds(container) {
  // Add light clouds for snow
  addCloudEffect(container);
}

function addAtmosphericGradient(container, weatherType, isDarkMode, isNightTime) {
  const gradient = document.createElement('div');
  gradient.className = 'atmospheric-gradient';
  
  // Determine gradient class based on weather and time
  let gradientClass = '';
  
  if (weatherType === 'rain' || weatherType === 'thunderstorm' || weatherType === 'drizzle') {
    gradientClass = isDarkMode || isNightTime ? 'rainy-night' : 'rainy-day';
  } else if (weatherType === 'snow') {
    gradientClass = 'snowy';
  } else if (weatherType === 'clouds' || weatherType === 'mist' || weatherType === 'haze' || weatherType === 'fog') {
    gradientClass = isDarkMode || isNightTime ? 'cloudy-night' : 'cloudy-day';
  } else if (weatherType === 'clear') {
    gradientClass = isDarkMode || isNightTime ? 'clear-night' : 'clear-day';
  } else {
    // Default to clear day/night
    gradientClass = isDarkMode || isNightTime ? 'clear-night' : 'clear-day';
  }
  
  gradient.classList.add(gradientClass);
  container.appendChild(gradient);
}

// Update hourly forecast UI
function updateHourlyForecastUI(hourlyData) {
  if (!hourlyCards || !hourlyData || hourlyData.length === 0) return;
  
  // Clear existing cards
  hourlyCards.innerHTML = '';
  
  // Display next 24 hours (24 items)
  const hoursToShow = Math.min(hourlyData.length, 24);
  
  for (let i = 0; i < hoursToShow; i++) {
    const hour = hourlyData[i];
    const hourlyTime = new Date(hour.dt * 1000);
    const temp = Math.round(hour.temp);
    const iconCode = hour.weather[0].icon;
    const desc = hour.weather[0].description;
    const precip = hour.pop * 100; // Probability of precipitation
    
    // Get custom icon
    const customIcon = WEATHER_ICONS_MAP[iconCode] || WEATHER_ICONS_MAP['default'];
    
    const hourlyCard = document.createElement('div');
    hourlyCard.className = 'hourly-card';
    
    hourlyCard.innerHTML = `
      <div class="hourly-time">${hourlyTime.getHours()}:00</div>
      <div class="hourly-icon">
        <img src="${CUSTOM_ICONS_PATH}${customIcon}" alt="${desc}">
      </div>
      <div class="hourly-temp">${temp}°</div>
      <div class="hourly-precip">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v6"></path>
          <path d="M12 22v-6"></path>
          <path d="M4.93 4.93l4.24 4.24"></path>
          <path d="M14.83 14.83l4.24 4.24"></path>
          <path d="M2 12h6"></path>
          <path d="M16 12h6"></path>
          <path d="M4.93 19.07l4.24-4.24"></path>
          <path d="M14.83 9.17l4.24-4.24"></path>
        </svg>
        ${precip.toFixed(0)}%
      </div>
    `;
    
    hourlyCards.appendChild(hourlyCard);
  }
  
  // Show hourly forecast section
  hourlyForecastSection.classList.remove('hidden');
}

// Update daily forecast UI
function updateDailyForecastUI(dailyData) {
  if (!dailyForecastGrid || !dailyData || dailyData.length === 0) return;
  
  // Clear existing cards
  dailyForecastGrid.innerHTML = '';
  
  // Display up to 14 days
  const daysToShow = Math.min(dailyData.length, 14);
  
  for (let i = 0; i < daysToShow; i++) {
    const day = dailyData[i];
    const date = new Date(day.dt * 1000);
    const highTemp = Math.round(day.temp.max);
    const lowTemp = Math.round(day.temp.min);
    const iconCode = day.weather[0].icon;
    const desc = day.weather[0].description;
    
    // Get custom icon
    const customIcon = WEATHER_ICONS_MAP[iconCode] || WEATHER_ICONS_MAP['default'];
    
    const dailyCard = document.createElement('div');
    dailyCard.className = 'daily-card';
    
    // Get day name (today, tomorrow, or day of week)
    let dayName;
    if (i === 0) {
      dayName = 'Today';
    } else if (i === 1) {
      dayName = 'Tomorrow';
    } else {
      dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    // Format date as "May 10"
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    dailyCard.innerHTML = `
      <div class="daily-date">
        <div class="daily-day">${dayName}</div>
        <div class="daily-full-date">${formattedDate}</div>
      </div>
      <div class="daily-icon">
        <img src="${CUSTOM_ICONS_PATH}${customIcon}" alt="${desc}">
      </div>
      <div class="daily-temps">
        <div class="daily-high">${highTemp}°</div>
        <div class="daily-low">${lowTemp}°</div>
      </div>
    `;
    
    dailyForecastGrid.appendChild(dailyCard);
  }
  
  // Show daily forecast section
  dailyForecastSection.classList.remove('hidden');
}

// Update alerts UI
function updateAlertsUI(alertsData) {
  if (!alertsContainer) return;
  
  // Clear existing alerts
  alertsContainer.innerHTML = '';
  
  alertsData.forEach(alert => {
    const alertItem = document.createElement('div');
    alertItem.className = `alert-item alert-${getSeverityClass(alert.event)}`;
    
    // Format start and end times
    const start = new Date(alert.start * 1000).toLocaleString();
    const end = new Date(alert.end * 1000).toLocaleString();
    
    alertItem.innerHTML = `
      <div class="alert-header">
        <div class="alert-title">${alert.event}</div>
        <div class="alert-source">Source: ${alert.sender_name}</div>
      </div>
      <div class="alert-time">
        ${start} - ${end}
      </div>
      <div class="alert-description">
        ${alert.description}
      </div>
    `;
    
    alertsContainer.appendChild(alertItem);
  });
}

// Fetch country flag
async function fetchCountryFlag(countryCode) {
  try {
    if (!countryFlag) return;
    
    // Try to use REST Countries API
    const response = await fetch(`${COUNTRIES_API_URL}${countryCode}`);
    
    if (!response.ok) {
      throw new Error('Country data not found');
    }
    
    const [countryData] = await response.json();
    
    if (countryData && countryData.flags && countryData.flags.png) {
      countryFlag.src = countryData.flags.png;
      countryFlag.alt = `Flag of ${countryData.name.common}`;
      
      // Update country name if available
      if (countryName && countryData.name.common) {
        countryName.textContent = countryData.name.common;
      }
    }
  } catch (error) {
    console.error('Error fetching country flag:', error);
    // Use a fallback flag icon or hide the flag
    countryFlag.style.display = 'none';
  }
}

// Initialize map
function initMap(lat, lon, cityName) {
  if (!document.getElementById('map')) return;
  
  // If map already exists, remove it and recreate
  if (map) {
    map.remove();
  }
  
  // Create new map
  map = L.map('map').setView([lat, lon], 10);
  
  // Add appropriate tile layer
  addMapTileLayer();
  
  // Add a marker for the city
  L.marker([lat, lon])
    .addTo(map)
    .bindPopup(`<b>${cityName}</b>`);
}

// Helper function to get wind direction from degrees
function getWindDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5);
  return directions[index % 16];
}

// Helper function to determine severity class for alerts
function getSeverityClass(eventType) {
  eventType = eventType.toLowerCase();
  
  // Extreme events
  if (eventType.includes('extreme') || 
      eventType.includes('tornado') || 
      eventType.includes('hurricane') || 
      eventType.includes('typhoon')) {
    return 'extreme';
  }
  
  // Severe events
  if (eventType.includes('severe') || 
      eventType.includes('warning') || 
      eventType.includes('thunderstorm') || 
      eventType.includes('flood')) {
    return 'severe';
  }
  
  // Moderate events
  if (eventType.includes('moderate') || 
      eventType.includes('watch') || 
      eventType.includes('advisory')) {
    return 'moderate';
  }
  
  // Default to minor
  return 'minor';
}

// Helper functions for formatting
function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Function to format time with timezone adjustment
function formatTimeWithTimezone(timestamp, timezone) {
  // Adjust for timezone offset
  const date = new Date((timestamp + timezone) * 1000);
  
  // Format hours and minutes
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  
  // Convert to 12-hour format
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert hour '0' to '12'
  
  // Format with leading zeros
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${hours}:${formattedMinutes} ${ampm}`;
}

// Function to enhance weather stats with icons and animations
// This function is no longer needed as we've added icons directly in HTML
function updateWeatherStatsWithIcons() {
  // This function is now empty as we include icons in the HTML
  // We're keeping it to avoid breaking any function calls
  return;
}

// Export functions that need to be accessible from other modules
export {
  fetchWeatherData,
  fetchWeatherDataByCoords,
  updateWeatherUI,
  initMap
}; 