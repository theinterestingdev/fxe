// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Profile = require('../models/profileSchema');
const jwt = require('jsonwebtoken');

// Fetch all unverified profiles
router.get('/unverified-profiles', async (req, res) => {
  try {
    const profiles = await Profile.find({ verified: false }).populate('userId', 'email');
    res.status(200).json({ profiles });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
    const { otp } = req.body;
  
    if (otp === process.env.ADMIN_OTP) {
      // Generate a token for admin access
      const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ message: 'Admin login successful', token });
    } else {
      res.status(401).json({ message: 'Invalid OTP' });
    }
  });
// Verify a profile
router.put('/verify-profile/:userId', async (req, res) => {
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
});

module.exports = router;