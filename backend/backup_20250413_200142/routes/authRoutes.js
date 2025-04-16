const express = require('express');
const {
  register,
  login,
  verifyOTP,
  verifyLoginOTP,
  logout,
  checkAuth,
} = require('../controllers/authController'); // Import all auth controller functions

const router = express.Router();

// Auth Routes
router.post('/register', register); // Register a new user
router.post('/login', login); // Send OTP for login
router.post('/verify-otp', verifyOTP); // Verify OTP for registration
router.post('/verify-login-otp', verifyLoginOTP); // Verify OTP for login
router.post('/logout', logout); // Logout user
router.get('/check-auth', checkAuth); // Check authentication status

module.exports = router;
