const express = require('express');
const {
  createOrUpdateProfile,
  getProfile,
  checkProfileExists,
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware'); 
const Profile = require('../models/profileSchema'); 

const router = express.Router();


router.post('/', authMiddleware, createOrUpdateProfile); 
router.get('/', authMiddleware, getProfile); 
router.get('/check', authMiddleware, checkProfileExists);


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


router.post('/fix-username/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email } = req.body;
    
    if (!userId || !username) {
      return res.status(400).json({ message: 'userId and username are required' });
    }
    
    console.log(`Attempting to fix username for user ${userId} to ${username}`);
    
    
    const mongoose = require('mongoose');
    let profile;
    
    
    profile = await Profile.findOne({ userId: userId });
    
    
    if (!profile && mongoose.Types.ObjectId.isValid(userId)) {
      profile = await Profile.findOne({ userId: mongoose.Types.ObjectId(userId) });
    }
    
    
    if (!profile && mongoose.Types.ObjectId.isValid(userId)) {
      profile = await Profile.findOne({ _id: mongoose.Types.ObjectId(userId) });
    }
    
    if (profile) {
      
      profile.username = username;
      if (email) profile.email = email;
      await profile.save();
      res.status(200).json({ message: 'Username updated successfully', profile });
    } else {
      
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
