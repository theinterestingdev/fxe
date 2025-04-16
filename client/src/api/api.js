import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; 


const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


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


const cache = {
  projects: null,
  timestamp: null,
  expiresIn: 60000 // 1 minute
};


let projectRequestCounter = 0;
let lastRequestTime = 0;
const resetRequestCounter = () => {
  projectRequestCounter = 0;
  lastRequestTime = 0;
};


setInterval(resetRequestCounter, 300000);

export const fetchProjects = async () => {
  try {
    
    const now = Date.now();
    if (lastRequestTime === 0) {
      lastRequestTime = now;
    }
    
    projectRequestCounter++;
    
    
    if (projectRequestCounter > 5 && (now - lastRequestTime < 5000)) {
      console.warn(`Multiple fetchProjects calls detected (${projectRequestCounter} in ${now - lastRequestTime}ms)`);
      
      
      if (cache.projects && cache.timestamp && (now - cache.timestamp < cache.expiresIn)) {
        console.log("Using cached projects due to high request frequency");
        return cache.projects;
      }
      
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    
    lastRequestTime = now;
    
    
    if (cache.projects && cache.timestamp && (now - cache.timestamp < cache.expiresIn)) {
      console.log("Using cached projects");
      return cache.projects;
    }
    
  
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await api.get('/projects', { signal: controller.signal });
    clearTimeout(timeoutId);
    
    
    cache.projects = response.data;
    cache.timestamp = now;
    
    return response.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    
    
    if (cache.projects) {
      console.log("Using cached projects due to fetch error");
      return cache.projects;
    }
    
    
    return [];
  }
};