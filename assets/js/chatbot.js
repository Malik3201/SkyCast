// Import configuration
import { GEMINI_API_KEY } from '../../data/config.js';

// Constants
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// DOM Elements
const chatButton = document.getElementById('chat-button');
const chatModal = document.getElementById('chat-modal');
const chatModalClose = document.getElementById('chat-modal-close');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

// Current weather and location data
let currentWeatherData = null;
let currentLocation = {
  city: null,
  country: null
};

// Initialize chat
export function initChat() {
  // Set up event listeners
  setupChatEventListeners();
  
  // Check for saved weather data
  checkSavedWeatherData();
  
  // Add welcome message with theme-aware customization
  setTimeout(() => {
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    const greeting = isDarkTheme ? 
      "👋 Hello! I'm SkyBot. I notice you're using dark mode - easy on the eyes! Ask me anything about weather conditions, forecasts, or climate information." :
      "👋 Hello! I'm SkyBot, your weather assistant. Ask me anything about weather conditions, forecasts, or climate information!";
    
    // Replace the default greeting with our dynamic one
    if (chatMessages && chatMessages.firstElementChild) {
      chatMessages.firstElementChild.querySelector('.chat-message-content').textContent = greeting;
    }
  }, 500);
}

// Set up chat event listeners
function setupChatEventListeners() {
  if (chatButton) {
    chatButton.addEventListener('click', toggleChatModal);
  }
  
  if (chatModalClose) {
    chatModalClose.addEventListener('click', toggleChatModal);
  }
  
  if (chatSend) {
    chatSend.addEventListener('click', handleChatSend);
  }
  
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleChatSend();
      }
    });
    
    // Add focus animation
    chatInput.addEventListener('focus', () => {
      document.querySelector('.chat-input-container')?.classList.add('focused');
    });
    
    chatInput.addEventListener('blur', () => {
      document.querySelector('.chat-input-container')?.classList.remove('focused');
    });
  }
  
  // Close modal when clicking outside or pressing ESC
  document.addEventListener('click', (e) => {
    if (chatModal && chatModal.classList.contains('open') && 
        !chatModal.contains(e.target) && 
        e.target !== chatButton) {
      chatModal.classList.remove('open');
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatModal && chatModal.classList.contains('open')) {
      chatModal.classList.remove('open');
    }
  });
  
  // Handle window resize for responsive behavior
  window.addEventListener('resize', adjustChatModalSize);
}

// Adjust chat modal size based on window size
function adjustChatModalSize() {
  if (!chatModal) return;
  
  if (window.innerWidth <= 576) {
    // Mobile view
    chatModal.style.width = 'calc(100% - 2rem)';
    chatModal.style.maxWidth = 'none';
    chatModal.style.height = '60vh';
    chatModal.style.bottom = '1rem';
  } else if (window.innerWidth <= 768) {
    // Tablet view
    chatModal.style.width = 'calc(100% - 2rem)';
    chatModal.style.maxWidth = '350px';
    chatModal.style.height = '450px';
    chatModal.style.bottom = '4rem';
  } else {
    // Desktop view
    chatModal.style.width = '350px';
    chatModal.style.maxWidth = '350px';
    chatModal.style.height = '450px';
    chatModal.style.bottom = '5rem';
  }
}

// Toggle chat modal
function toggleChatModal() {
  // Check if we're on the index page
  const isIndexPage = window.location.pathname.endsWith('index.html') || 
                     window.location.pathname.endsWith('/');
  
  if (isIndexPage && (!chatInput || !chatInput.value.trim())) {
    // Redirect to assistant page if no input
    window.location.href = 'assistant.html';
    return;
  }
  
  if (chatModal) {
    chatModal.classList.toggle('open');
    
    // Adjust modal size when opening
    if (chatModal.classList.contains('open')) {
      adjustChatModalSize();
      setTimeout(() => {
        if (chatInput) chatInput.focus();
        scrollChatToBottom();
      }, 300);
    }
  }
}

// Handle chat send
function handleChatSend() {
  if (!chatInput || !chatInput.value.trim()) return;
  
  const userMessage = chatInput.value.trim();
  
  // Check if we're on the index page
  const isIndexPage = window.location.pathname.endsWith('index.html') || 
                      window.location.pathname.endsWith('/');
  
  if (isIndexPage) {
    // Save the message to localStorage so it can be picked up by assistant.html
    localStorage.setItem('skycastPendingQuery', userMessage);
    
    // Redirect to assistant.html
    window.location.href = `assistant.html?query=${encodeURIComponent(userMessage)}`;
    return;
  }
  
  // Add user message to chat
  addChatMessage(userMessage, 'user');
  
  // Clear input
  chatInput.value = '';
  
  // Show loading indicator
  showChatLoading();
  
  // Process message and get response
  processChatMessage(userMessage);
}

// Process chat message
async function processChatMessage(message) {
  try {
    // Prepare prompt with weather context if available
    let prompt = message;
    
    if (currentLocation.city && currentLocation.country) {
      // Add theme information to context
      const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
      
      // Enhance the prompt with location and theme context
      prompt = `${message}\n\nContext: The user is viewing weather for ${currentLocation.city}, ${currentLocation.country}. The user is using ${isDarkTheme ? 'dark' : 'light'} mode.`;
    }
    
    // Call Gemini API
    const response = await callGeminiAPI(prompt);
    
    // Remove loading indicator
    removeChatLoading();
    
    // Add bot response to chat
    addChatMessage(response, 'bot');
  } catch (error) {
    console.error('Error processing chat message:', error);
    
    // Remove loading indicator
    removeChatLoading();
    
    // Add error message
    addChatMessage('Sorry, I encountered an error. Please try again later.', 'bot');
  }
}

// Call Gemini API
async function callGeminiAPI(prompt) {
  try {
    // Fix API endpoint and structure to correctly use API key
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Gemini API response:", data); // For debugging
    
    // Extract response text with better error handling
    if (data && data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text || "Sorry, I couldn't generate a response.";
      }
    }
    
    return "I'm sorry, I couldn't generate a meaningful response at the moment. Please try again.";
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return "Sorry, there was an error connecting to my brain. Please try again later.";
  }
}

// Add message to chat
function addChatMessage(message, type) {
  if (!chatMessages) return;
  
  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = `chat-message ${type}`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'chat-message-content';
  messageContent.textContent = message;
  
  messageElement.appendChild(messageContent);
  chatMessages.appendChild(messageElement);
  
  // Scroll to bottom
  scrollChatToBottom();
}

// Show chat loading indicator
function showChatLoading() {
  if (!chatMessages) return;
  
  const loadingElement = document.createElement('div');
  loadingElement.className = 'chat-loading';
  loadingElement.id = 'chat-loading';
  
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'chat-loading-dot';
    loadingElement.appendChild(dot);
  }
  
  chatMessages.appendChild(loadingElement);
  
  // Scroll to bottom
  scrollChatToBottom();
}

// Remove chat loading indicator
function removeChatLoading() {
  const loadingElement = document.getElementById('chat-loading');
  if (loadingElement) {
    loadingElement.remove();
  }
}

// Scroll chat to bottom
function scrollChatToBottom() {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Check for saved weather data
function checkSavedWeatherData() {
  const savedLocation = localStorage.getItem('weatherAppLocation');
  
  if (savedLocation) {
    const locationData = JSON.parse(savedLocation);
    if (locationData.name) {
      currentLocation.city = locationData.name;
    }
    if (locationData.country) {
      currentLocation.country = locationData.country;
    }
  }
}

// Update location data (to be called from main.js when weather is updated)
export function updateChatbotLocationData(city, country) {
  currentLocation.city = city;
  currentLocation.country = country;
}

// Update weather data (to be called from main.js when weather is updated)
export function updateChatbotWeatherData(data) {
  currentWeatherData = data;
} 