const Profile = require('../models/profileSchema ');
const User = require('../models/User');

// Create or update profile
const createOrUpdateProfile = async (req, res) => {
  const { skills, expertiseLevel, portfolio, bio } = req.body;
  const userId = req.user.userId; // Extracted from JWT

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if a profile already exists
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
    const profile = await Profile.findOne({ userId }).populate('userId', 'email'); // Populate user details if needed
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json({ profile });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Check if profile exists
// Check if profile exists
const checkProfileExists = async (req, res) => {
    const userId = req.user.userId; // Extracted from JWT
  
    try {
      const profile = await Profile.findOne({ userId });
      if (!profile) {
        return res.status(200).json({ exists: false }); // ✅ Changed 'hasProfile' to 'exists'
      }
      res.status(200).json({ exists: true }); // ✅ Consistency with frontend
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };
  

module.exports = { createOrUpdateProfile, getProfile, checkProfileExists };