import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Base URL for your API

// Create an axios instance with default configurations
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This ensures cookies are sent with every request
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
  const response = await api.post('/profile', profileData); // No change needed
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/profile'); // No change needed
  return response.data;
};

export const checkProfileExists = async () => {
  const response = await api.get('/profile/check'); // ✅ Updated to match `profileRoutes.js`
  return response.data;
};
