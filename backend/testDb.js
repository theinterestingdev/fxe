// Test script to verify database connection and projects
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

// Check projects in the database
const checkProjects = async () => {
  try {
    const projects = await Project.find().lean();
    console.log(`Found ${projects.length} projects`);
    
    if (projects.length > 0) {
      console.log('Sample project:', projects[0]);
      
      // Check if videos are properly linked
      const videosCount = projects.filter(p => p.videoLink).length;
      console.log(`Projects with videos: ${videosCount}`);
      
      if (videosCount > 0) {
        const sample = projects.find(p => p.videoLink);
        console.log('Sample video project:', {
          id: sample._id,
          title: sample.title,
          videoLink: sample.videoLink,
          thumbnailUrl: sample.thumbnailUrl,
          screenshots: sample.screenshots
        });
      }
    }
    
    // Check profiles for user data
    const profiles = await Profile.find().lean();
    console.log(`Found ${profiles.length} user profiles`);
    
    // Check for potential issues
    const missingUsernames = projects.filter(p => !p.username).length;
    console.log(`Projects missing username: ${missingUsernames}`);
    
    return projects;
  } catch (err) {
    console.error('Error checking projects:', err);
    return [];
  }
};

// Run the test
const runTest = async () => {
  const connected = await connectDB();
  if (connected) {
    const projects = await checkProjects();
    console.log('Database test completed');
  }
  process.exit(0);
};

runTest(); 