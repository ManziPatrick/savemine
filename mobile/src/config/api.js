import axios from 'axios';

// Update this to your backend URL
const API_URL = __DEV__ 
  ? 'http://localhost:5000' // For development
  : 'https://your-production-api.com'; // For production

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Token will be added by auth context
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
  (error) => {
    if (error.response?.status === 401) {
      // Handle logout - will be handled by auth context
    }
    return Promise.reject(error);
  }
);

export default api;

