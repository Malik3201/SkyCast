// Import configuration
import { OPENWEATHER_API_KEY } from '../../data/config.js';
import { initChat, updateChatbotLocationData, updateChatbotWeatherData } from './chatbot.js';

// Constants
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5/';
const WEATHER_ICON_URL = 'https://openweathermap.org/img/wn/';
const COUNTRIES_API_URL = 'https://restcountries.com/v3.1/alpha/';
const DEFAULT_UNITS = 'metric';

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
  
  // Check if user has saved location
  checkSavedLocation();
  
  // Initialize chatbot
  initChat();
});

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
}

// Toggle mobile menu
function toggleMobileMenu() {
  mainNav.classList.toggle('active');
  mobileMenuToggle.classList.toggle('active');
}

// Check and set theme preference
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

// Toggle theme between light and dark
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('skycastTheme', newTheme);
  
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
  if (!weatherCard) return;
  
  // City and country
  if (cityName) cityName.textContent = data.name;
  if (countryName) countryName.textContent = data.sys.country;
  
  // Update chatbot with location data
  updateChatbotLocationData(data.name, data.sys.country);
  
  // Update chatbot with weather data
  updateChatbotWeatherData(data);
  
  // Local time (calculate from timezone offset)
  const localDateTime = new Date(Date.now() + (data.timezone * 1000));
  if (localTime) {
    localTime.textContent = `Local time: ${localDateTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })}, ${localDateTime.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })}`;
  }
  
  // Temperature
  if (temperature) temperature.textContent = Math.round(data.main.temp);
  if (feelsLike) feelsLike.textContent = Math.round(data.main.feels_like);
  
  // Weather condition
  if (weatherIcon) {
    weatherIcon.src = `${WEATHER_ICON_URL}${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
  }
  if (weatherDescription) weatherDescription.textContent = data.weather[0].description;
  
  // Stats
  if (humidity) humidity.textContent = `${data.main.humidity}%`;
  
  // Wind with direction
  if (wind) {
    const windDirection = getWindDirection(data.wind.deg);
    wind.textContent = `${data.wind.speed.toFixed(1)} m/s ${windDirection}`;
  }
  
  if (pressure) pressure.textContent = `${data.main.pressure} hPa`;
  if (visibility) visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  
  // Show the weather card
  hideLoading();
}

// Update hourly forecast UI
function updateHourlyForecastUI(hourlyData) {
  if (!hourlyCards) {
    console.error("Hourly cards container not found");
    return;
  }
  
  console.log("Updating hourly forecast with data:", hourlyData);
  
  // Clear existing cards
  hourlyCards.innerHTML = '';
  
  if (!hourlyData || hourlyData.length === 0) {
    console.warn("No hourly forecast data available");
    hourlyCards.innerHTML = '<div class="no-data-message">No hourly forecast available</div>';
    return;
  }
  
  // Only show the first 24 hours (or less if not available)
  const hoursToShow = Math.min(hourlyData.length, 24);
  
  for (let i = 0; i < hoursToShow; i++) {
    try {
      const hourData = hourlyData[i];
      if (!hourData) continue; // Skip if data point is missing
      
      const dateTime = new Date(hourData.dt * 1000);
      const temperature = Math.round(hourData.temp);
      
      // Handle potential missing data
      const weatherInfo = hourData.weather && hourData.weather.length > 0 ? 
        hourData.weather[0] : { icon: '01d', description: 'unknown' };
      
      const weatherIcon = weatherInfo.icon || '01d'; // Default icon if missing
      const precipProbability = hourData.pop !== undefined ? hourData.pop * 100 : 0; // Default if missing
      
      const hourCard = document.createElement('div');
      hourCard.className = 'hourly-card';
      
      // Better time formatting
      let timeStr = '';
      
      // Check if it's the current hour
      const now = new Date();
      const isCurrentHour = dateTime.getHours() === now.getHours() && 
                           dateTime.getDate() === now.getDate() &&
                           dateTime.getMonth() === now.getMonth();
      
      if (isCurrentHour) {
        timeStr = 'Now';
      } else {
        timeStr = dateTime.toLocaleTimeString([], { 
          hour: '2-digit', 
          hour12: true 
        });
      }
      
      // Use a droplet icon for precipitation
      hourCard.innerHTML = `
        <div class="hourly-time">${timeStr}</div>
        <img class="hourly-icon" src="${WEATHER_ICON_URL}${weatherIcon}.png" alt="${weatherInfo.description}" onerror="this.src='assets/icons/weather-default.png';">
        <div class="hourly-temp">${temperature}°C</div>
        <div class="hourly-precip">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
          ${precipProbability.toFixed(0)}%
        </div>
      `;
      
      hourlyCards.appendChild(hourCard);
    } catch (error) {
      console.error(`Error rendering hourly card at index ${i}:`, error);
    }
  }
}

// Update daily forecast UI
function updateDailyForecastUI(dailyData) {
  if (!dailyForecastGrid) {
    console.error("Daily forecast container not found");
    return;
  }
  
  console.log("Updating daily forecast with data:", dailyData);
  
  // Clear existing cards
  dailyForecastGrid.innerHTML = '';
  
  if (!dailyData || dailyData.length === 0) {
    console.warn("No daily forecast data available");
    dailyForecastGrid.innerHTML = '<div class="no-data-message">No daily forecast available</div>';
    return;
  }
  
  // Show up to 7 days (OpenWeatherMap provides up to 7 days in free tier)
  const daysToShow = Math.min(dailyData.length, 7);
  
  for (let i = 0; i < daysToShow; i++) {
    try {
      const dayData = dailyData[i];
      if (!dayData || (!dayData.dt && !dayData.temp)) continue; // Skip if essential data missing
      
      const dateTime = new Date(dayData.dt * 1000);
      
      // Handle different data structures between OneCall API and our fallback
      let highTemp, lowTemp, weatherIcon;
      
      if (dayData.temp.day !== undefined) {
        // OneCall API format
        highTemp = Math.round(dayData.temp.max);
        lowTemp = Math.round(dayData.temp.min);
      } else {
        // Our fallback format
        highTemp = Math.round(dayData.temp.max);
        lowTemp = Math.round(dayData.temp.min);
      }
      
      const weatherInfo = dayData.weather && dayData.weather.length > 0 ? 
        dayData.weather[0] : { icon: '01d', description: 'unknown' };
        
      weatherIcon = weatherInfo.icon || '01d'; // Default icon if missing
      
      const dayCard = document.createElement('div');
      dayCard.className = 'daily-card';
      
      // Format day name (Today/Tomorrow or day name)
      let dayName;
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const isToday = dateTime.setHours(0,0,0,0) === today.setHours(0,0,0,0);
      const isTomorrow = dateTime.setHours(0,0,0,0) === tomorrow.setHours(0,0,0,0);
      
      if (isToday) {
        dayName = 'Today';
      } else if (isTomorrow) {
        dayName = 'Tomorrow';
      } else {
        dayName = dateTime.toLocaleDateString('en-US', { weekday: 'long' });
      }
      
      dayCard.innerHTML = `
        <div class="daily-date">
          <div class="daily-day">${dayName}</div>
          <div class="daily-full-date">${dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        </div>
        <img class="daily-icon" src="${WEATHER_ICON_URL}${weatherIcon}.png" alt="${weatherInfo.description}" onerror="this.src='assets/icons/weather-default.png';">
        <div class="daily-temps">
          <div class="daily-high">${highTemp}°</div>
          <div class="daily-low">${lowTemp}°</div>
        </div>
      `;
      
      dailyForecastGrid.appendChild(dayCard);
    } catch (error) {
      console.error(`Error rendering daily card at index ${i}:`, error);
    }
  }
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

// Export functions that need to be accessible from other modules
export {
  fetchWeatherData,
  fetchWeatherDataByCoords,
  updateWeatherUI,
  initMap
}; 