/**
 * Username Fix Script
 * 
 * This script fixes username issues by:
 * 1. Adding missing username fields to existing profiles
 * 2. Creating profiles for users that don't have them
 * 3. Ensuring correct username format in all user records
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/freelance-exchange')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import models
const Profile = require('../models/profileSchema');
const User = mongoose.model('User', new mongoose.Schema({
  email: String,
  username: String,
  name: String
}), 'users'); // Assuming your user collection is named 'users'

async function fixUsernames() {
  try {
    console.log('Starting username fix script...');
    
    // 1. Get all users from the users collection
    const users = await User.find({});
    console.log(`Found ${users.length} users in the database`);
    
    // 2. Process each user
    for (const user of users) {
      const userId = user._id;
      const email = user.email;
      
      if (!email) {
        console.log(`User ${userId} has no email, skipping`);
        continue;
      }
      
      // Extract username from email (before the @ symbol)
      const username = email.split('@')[0];
      console.log(`Processing user ${email} (${username})`);
      
      // 3. Check if user has a profile
      let profile = await Profile.findOne({ 
        $or: [
          { userId: userId },
          { userId: userId.toString() }
        ]
      });
      
      if (profile) {
        console.log(`Found existing profile for ${email}, updating username`);
        
        // Update the profile with the username
        profile.username = username;
        profile.name = profile.name || username;
        profile.email = email;
        
        // If no avatar, add one
        if (!profile.avatar) {
          profile.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
        }
        
        await profile.save();
        console.log(`Updated profile for ${email}`);
      } else {
        console.log(`No profile found for ${email}, creating one`);
        
        // Create a new profile
        profile = new Profile({
          userId: userId,
          username: username,
          name: username,
          email: email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          skills: [],
          expertiseLevel: 'Beginner',
          portfolio: [],
          bio: '',
          verified: false
        });
        
        await profile.save();
        console.log(`Created new profile for ${email}`);
      }
    }
    
    console.log('Username fix script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error in fixUsernames script:', error);
    process.exit(1);
  }
}

// Run the function
fixUsernames(); 