// Script to update existing projects with usernames from profiles
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Project = require('./models/projectModel');
const Profile = require('./models/profileSchema');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const dbUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/skill_exchange';
    console.log(`Connecting to MongoDB: ${dbUri}`);
    await mongoose.connect(dbUri);
    console.log('MongoDB Connected...');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Update projects with better usernames
const updateUsernames = async () => {
  try {
    // Get all projects
    const projects = await Project.find();
    console.log(`Found ${projects.length} projects to check`);
    
    // Get all user profiles for reference
    const profiles = await Profile.find().lean();
    console.log(`Found ${profiles.length} user profiles`);
    
    const profileMap = profiles.reduce((map, profile) => {
      map[profile.userId] = profile;
      return map;
    }, {});
    
    let updatedCount = 0;
    
    // Update each project
    for (const project of projects) {
      let isUpdated = false;
      
      // Get corresponding profile
      const profile = profileMap[project.userId];
      console.log(`Checking project ${project._id} by user ${project.userId}`);
      console.log(`  Current username: "${project.username || 'none'}"`);
      
      if (profile) {
        console.log(`  Found profile with name: "${profile.name || 'none'}", username: "${profile.username || 'none'}"`);
        
        // Set username from profile if better than current
        const newUsername = profile.name || profile.username;
        if (newUsername && (!project.username || project.username === 'user')) {
          project.username = newUsername;
          isUpdated = true;
          console.log(`  Updated username to: "${newUsername}"`);
        }
      } else {
        console.log(`  No profile found`);
        
        // If user ID looks like an email and no username is set
        if (project.userId && typeof project.userId === 'string' && project.userId.includes('@') && 
            (!project.username || project.username === 'user')) {
          const newUsername = project.userId.split('@')[0];
          project.username = newUsername;
          isUpdated = true;
          console.log(`  Updated username to: "${newUsername}" from email`);
        } else if (!project.username || project.username === 'user') {
          // For email addresses in format "someone@example.com" stored as ObjectID
          if (typeof project.userId === 'string' && project.userId.length > 8) {
            const lastPart = project.userId.substring(0, 8);
            project.username = `user_${lastPart}`;
            isUpdated = true;
            console.log(`  Updated username to fallback: "${project.username}"`);
          }
        }
      }
      
      // Save if changes were made
      if (isUpdated) {
        await project.save();
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} projects with better usernames`);
  } catch (err) {
    console.error('Error updating projects:', err);
  }
};

// Run the update
const runUpdate = async () => {
  const connected = await connectDB();
  if (connected) {
    await updateUsernames();
    console.log('Username update completed');
  }
  process.exit(0);
};

runUpdate(); 