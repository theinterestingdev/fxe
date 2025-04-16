// Script to update existing projects with missing data
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
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Update projects with missing data
const updateProjects = async () => {
  try {
    // Get all projects
    const projects = await Project.find();
    console.log(`Found ${projects.length} projects to check`);
    
    // Get all user profiles for reference
    const profiles = await Profile.find().lean();
    const profileMap = profiles.reduce((map, profile) => {
      map[profile.userId] = profile;
      return map;
    }, {});
    
    let updatedCount = 0;
    
    // Update each project
    for (const project of projects) {
      let isUpdated = false;
      
      // Add username if missing
      if (!project.username) {
        // Try to find user profile
        const profile = profileMap[project.userId];
        if (profile) {
          project.username = profile.name || profile.username || 'user';
          isUpdated = true;
          console.log(`Added username "${project.username}" to project ${project._id}`);
        } else {
          // Default username if no profile found
          project.username = 'user';
          isUpdated = true;
          console.log(`Added default username to project ${project._id}`);
        }
      }
      
      // Generate thumbnailUrl if missing but videoLink exists
      if (project.videoLink && !project.thumbnailUrl) {
        // Just setting a basic thumbnail for now - in a real app you'd generate one
        project.thumbnailUrl = 'https://via.placeholder.com/600x400?text=Video+Thumbnail';
        isUpdated = true;
        console.log(`Added placeholder thumbnail to project ${project._id}`);
      }
      
      // Save if changes were made
      if (isUpdated) {
        await project.save();
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} projects`);
  } catch (err) {
    console.error('Error updating projects:', err);
  }
};

// Run the update
const runUpdate = async () => {
  const connected = await connectDB();
  if (connected) {
    await updateProjects();
    console.log('Project update completed');
  }
  process.exit(0);
};

runUpdate(); 