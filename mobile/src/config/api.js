import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get your computer's IP address:
// Windows: ipconfig -> IPv4 Address  
// Mac/Linux: ifconfig or ip addr
// Use your computer's IP, not localhost, for mobile devices

// For development, replace with your computer's IP address
// Example: 'http://192.168.1.100:5000'
const API_URL = __DEV__ 
  ? 'http://192.168.234.11:5000' // Replace with YOUR computer's IP address
  : 'https://your-production-api.com'; // For production (Vercel backend URL)

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout for mobile
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token automatically
api.interceptors.request.use(
  async (config) => {
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
export { API_URL };
