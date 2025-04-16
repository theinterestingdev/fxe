const express = require('express');
const {
  createOrUpdateProfile,
  getProfile,
  checkProfileExists,
} = require('../controllers/profileController'); // Import profile controller functions
const authMiddleware = require('../middleware/authMiddleware'); // Middleware to verify JWT
const Profile = require('../models/profileSchema'); // Import Profile model

const router = express.Router();

// Profile Routes
router.post('/', authMiddleware, createOrUpdateProfile); // Create or update profile
router.get('/', authMiddleware, getProfile); // Get profile
router.get('/check', authMiddleware, checkProfileExists); // Check if profile exists

// Add a new route to get all profiles
router.get('/all', async (req, res) => {
  try {
    const profiles = await Profile.find({}, '-__v')
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();
    
    res.status(200).json(profiles);
  } catch (error) {
    console.error('Error fetching all profiles:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a route to fix specific usernames
router.post('/fix-username/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email } = req.body;
    
    if (!userId || !username) {
      return res.status(400).json({ message: 'userId and username are required' });
    }
    
    console.log(`Attempting to fix username for user ${userId} to ${username}`);
    
    // Try different ways to find the user
    const mongoose = require('mongoose');
    let profile;
    
    // Try with string userId
    profile = await Profile.findOne({ userId: userId });
    
    // Try with ObjectId if valid format
    if (!profile && mongoose.Types.ObjectId.isValid(userId)) {
      profile = await Profile.findOne({ userId: mongoose.Types.ObjectId(userId) });
    }
    
    // Try with _id
    if (!profile && mongoose.Types.ObjectId.isValid(userId)) {
      profile = await Profile.findOne({ _id: mongoose.Types.ObjectId(userId) });
    }
    
    if (profile) {
      // Update the profile
      profile.username = username;
      if (email) profile.email = email;
      await profile.save();
      res.status(200).json({ message: 'Username updated successfully', profile });
    } else {
      // Create new profile
      const newProfile = new Profile({
        userId,
        username,
        email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      });
      await newProfile.save();
      res.status(201).json({ message: 'New profile created with username', profile: newProfile });
    }
  } catch (error) {
    console.error('Error fixing username:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
