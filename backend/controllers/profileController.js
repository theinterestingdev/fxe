const Profile = require('../models/profileSchema');
const User = require('../models/User');

// Create or update profile
// controllers/profileController.js
const createOrUpdateProfile = async (req, res) => {
  const { skills, expertiseLevel, portfolio, bio } = req.body;
  const userId = req.user.userId; 

  try {
    let profile = await Profile.findOne({ userId });

    if (!profile) {
      // Create a new profile
      profile = new Profile({ userId, skills, expertiseLevel, portfolio, bio });
    } else {
      // Update existing profile
      profile.skills = skills;
      profile.expertiseLevel = expertiseLevel;
      profile.portfolio = portfolio;
      profile.bio = bio;
      profile.verified = false; // Mark profile as unverified after update
    }

    await profile.save();
    res.status(200).json({ message: 'Profile saved successfully', profile });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get profile
const getProfile = async (req, res) => {
  const userId = req.user.userId; // Extracted from JWT

  try {
    const profile = await Profile.findOne({ userId }).populate('userId', 'email');
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json({ profile });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Check if profile exists
const checkProfileExists = async (req, res) => {
  const userId = req.user.userId; // Extracted from JWT

  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(200).json({ exists: false });
    }
    res.status(200).json({ exists: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin verify profile
const verifyProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.verified = true;
    await profile.save();

    res.status(200).json({ message: 'Profile verified successfully', profile });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createOrUpdateProfile, getProfile, checkProfileExists, verifyProfile };