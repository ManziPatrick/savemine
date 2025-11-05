import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
// Production: Use deployed backend URL
// Development: Use local IP address for testing

// IMPORTANT: Update this with your actual deployed backend URL
// Find your backend URL after deploying to Vercel
// Example: https://smartmoney-backend-abc123.vercel.app
const PRODUCTION_API_URL = 'https://mysaving-8y0h0e27b-regisbillys-projects.vercel.app';

// Development URL - Use your computer's IP for local testing
const DEVELOPMENT_API_URL = 'http://192.168.234.11:5000';

// Determine API URL based on build type
const API_URL = __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout for mobile
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to update API URL dynamically (for runtime configuration)
export const updateApiUrl = async (newUrl) => {
  try {
    if (newUrl) {
      await AsyncStorage.setItem('CUSTOM_API_URL', newUrl);
      api.defaults.baseURL = newUrl;
    } else {
      await AsyncStorage.removeItem('CUSTOM_API_URL');
      api.defaults.baseURL = API_URL;
    }
    return true;
  } catch (error) {
    console.error('Error updating API URL:', error);
    return false;
  }
};

// Load custom API URL from storage on app start
AsyncStorage.getItem('CUSTOM_API_URL').then(url => {
  if (url) {
    api.defaults.baseURL = url;
  }
}).catch(() => {
  // Use default if storage read fails
});

// Request interceptor to add auth token automatically
api.interceptors.request.use(
  async (config) => {
    // Check for custom API URL override
    try {
      const customUrl = await AsyncStorage.getItem('CUSTOM_API_URL');
      if (customUrl) {
        config.baseURL = customUrl;
      }
    } catch (error) {
      // Use default baseURL
    }
    
    // Add token from AsyncStorage
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
      // Navigation will be handled by AuthContext
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL, PRODUCTION_API_URL, DEVELOPMENT_API_URL, updateApiUrl };
