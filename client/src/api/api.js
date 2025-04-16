import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Base URL for your API

// Create an axios instance with default configurations
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This ensures cookies are sent with every request
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth-related API calls
export const register = async (email, password) => {
  const response = await api.post('/auth/register', { email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const verifyOTP = async (email, otp) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
};

export const verifyLoginOTP = async (email, otp) => {
  const response = await api.post('/auth/verify-login-otp', { email, otp });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout', {});
  return response.data;
};

export const checkAuth = async () => {
  const response = await api.get('/auth/check-auth');
  return response.data;
};

// Profile-related API calls
export const createOrUpdateProfile = async (profileData) => {
  const response = await api.post('/profile', profileData);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const checkProfileExists = async () => {
  const response = await api.get('/profile/check');
  return response.data;
};

// Admin-related API calls
// api.js
export const adminLogin = async (otp) => {
  const response = await api.post('/admin/login', { otp });
  return response.data;
};


export const fetchUnverifiedProfiles = async () => {
  const response = await api.get('/admin/unverified-profiles');
  return response.data;
};

export const verifyProfile = async (userId) => {
  const response = await api.put(`/admin/verify-profile/${userId}`);
  return response.data;
};


// api.js
export const uploadProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};  

// Add a simple client-side cache
const cache = {
  projects: null,
  timestamp: null,
  expiresIn: 60000 // 1 minute
};

// Add tracking to detect loops
let projectRequestCounter = 0;
let lastRequestTime = 0;
const resetRequestCounter = () => {
  projectRequestCounter = 0;
  lastRequestTime = 0;
};

// Reset counter every 5 minutes
setInterval(resetRequestCounter, 300000);

export const fetchProjects = async () => {
  try {
    // Simple anti-loop protection
    const now = Date.now();
    if (lastRequestTime === 0) {
      lastRequestTime = now;
    }
    
    projectRequestCounter++;
    
    // If too many requests in a short period, use cache or throttle
    if (projectRequestCounter > 5 && (now - lastRequestTime < 5000)) {
      console.warn(`Multiple fetchProjects calls detected (${projectRequestCounter} in ${now - lastRequestTime}ms)`);
      
      // If we have a cache, use it
      if (cache.projects && cache.timestamp && (now - cache.timestamp < cache.expiresIn)) {
        console.log("Using cached projects due to high request frequency");
        return cache.projects;
      }
      
      // Throttle by adding a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Update time tracking
    lastRequestTime = now;
    
    // Use cached data if available and not expired
    if (cache.projects && cache.timestamp && (now - cache.timestamp < cache.expiresIn)) {
      console.log("Using cached projects");
      return cache.projects;
    }
    
    // Add timeout to API request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await api.get('/projects', { signal: controller.signal });
    clearTimeout(timeoutId);
    
    // Cache the result
    cache.projects = response.data;
    cache.timestamp = now;
    
    return response.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    
    // If we have a cache, use it as fallback
    if (cache.projects) {
      console.log("Using cached projects due to fetch error");
      return cache.projects;
    }
    
    // Otherwise return empty array
    return [];
  }
};