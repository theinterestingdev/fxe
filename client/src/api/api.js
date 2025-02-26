import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth'; // Replace with your backend URL

// Register a new user
export const register = async (email, password) => {
  const response = await axios.post(`${API_URL}/register`, { email, password });
  return response.data;
};

// Send OTP for login
export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  return response.data;
};

// Verify OTP for registration
export const verifyOTP = async (email, otp) => {
  const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
  return response.data;
};

// Verify OTP for login
export const verifyLoginOTP = async (email, otp) => {
  const response = await axios.post(`${API_URL}/verify-login-otp`, { email, otp });
  return response.data;
};