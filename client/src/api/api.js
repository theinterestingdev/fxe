// In your api.js file, add withCredentials: true to ALL requests
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

// Create an axios instance with default configurations
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true  // This is the critical line
});

// Register a new user
export const register = async (email, password) => {
  const response = await api.post('/register', { email, password });
  return response.data;
};

// Send OTP for login
export const login = async (email, password) => {
  const response = await api.post('/login', { email, password });
  return response.data;
};

// Verify OTP for registration
export const verifyOTP = async (email, otp) => {
  const response = await api.post('/verify-otp', { email, otp });
  return response.data;
};

// Verify OTP for login
export const verifyLoginOTP = async (email, otp) => {
  const response = await api.post('/verify-login-otp', { email, otp });
  return response.data;
};

// Logout user
export const logout = async () => {
  const response = await api.post('/logout', {});
  return response.data;
};

// Check authentication status
export const checkAuth = async () => {
  const response = await api.get('/check-auth');
  return response.data;
};