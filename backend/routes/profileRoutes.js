const express = require('express');
const {
  createOrUpdateProfile,
  getProfile,
  checkProfileExists,
} = require('../controllers/profileController'); // Import profile controller functions
const authMiddleware = require('../middleware/authMiddleware'); // Middleware to verify JWT

const router = express.Router();

// Profile Routes
router.post('/', authMiddleware, createOrUpdateProfile); // Create or update profile
router.get('/', authMiddleware, getProfile); // Get profile
router.get('/check', authMiddleware, checkProfileExists); // Check if profile exists

module.exports = router;
