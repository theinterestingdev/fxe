#!/bin/bash

# Username Fix Deployment Script
# This script automatically applies all necessary fixes for the username issues

set -e # Exit on error

echo "=== Username Fix Deployment Script ==="
echo "Starting automatic fix deployment..."

# Navigate to project root
cd $(dirname $0)/..
ROOT_DIR=$(pwd)
echo "Project root: $ROOT_DIR"

# 1. Make sure all dependencies are installed
echo "Installing dependencies..."
npm install

# 2. Backup current files
echo "Creating backup of current files..."
BACKUP_DIR="$ROOT_DIR/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r $ROOT_DIR/models $BACKUP_DIR/
cp -r $ROOT_DIR/socketHandlers $BACKUP_DIR/
cp -r $ROOT_DIR/services $BACKUP_DIR/
cp -r $ROOT_DIR/routes $BACKUP_DIR/
echo "Backup created at $BACKUP_DIR"

# 3. Check and update the profileSchema.js file
echo "Updating profileSchema.js..."
if ! grep -q "username:" $ROOT_DIR/models/profileSchema.js; then
  # Username field doesn't exist, add it
  sed -i '/expertiseLevel/i \ \ username: { type: String },' $ROOT_DIR/models/profileSchema.js
  echo "Added username field to profileSchema"
fi

if ! grep -q "email:" $ROOT_DIR/models/profileSchema.js; then
  # Email field doesn't exist, add it
  sed -i '/expertiseLevel/i \ \ email: { type: String },' $ROOT_DIR/models/profileSchema.js
  echo "Added email field to profileSchema"
fi

if ! grep -q "avatar:" $ROOT_DIR/models/profileSchema.js; then
  # Avatar field doesn't exist, add it
  sed -i '/expertiseLevel/i \ \ avatar: { type: String },' $ROOT_DIR/models/profileSchema.js
  echo "Added avatar field to profileSchema"
fi

if ! grep -q "timestamps:" $ROOT_DIR/models/profileSchema.js; then
  # Add timestamps option
  sed -i 's/})$/}, { timestamps: true })/' $ROOT_DIR/models/profileSchema.js
  echo "Added timestamps to profileSchema"
fi

# 4. Create profileService.js if it doesn't exist
if [ ! -f "$ROOT_DIR/services/profileService.js" ]; then
  echo "Creating profileService.js..."
  mkdir -p $ROOT_DIR/services
  cat > $ROOT_DIR/services/profileService.js << 'EOL'
const Profile = require('../models/profileSchema');
const mongoose = require('mongoose');

/**
 * Get all user profiles
 * @returns {Promise<Array>} Array of profile objects
 */
const getAllProfiles = async () => {
  try {
    console.log('Fetching all profiles from database');
    const profiles = await Profile.find({}, '-__v')
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();
    
    console.log(`Found ${profiles.length} profiles in database`);
    
    // Add debug info
    profiles.forEach(profile => {
      const id = profile._id?.toString() || profile.userId?.toString();
      console.log(`Profile: ${id}, username: ${profile.username || 'none'}, email: ${profile.email || 'none'}`);
    });
    
    return profiles;
  } catch (error) {
    console.error('Error in getAllProfiles service:', error);
    throw error;
  }
};

/**
 * Get a user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Profile object
 */
const getProfileById = async (userId) => {
  try {
    // Handle both string and ObjectId formats
    let query;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      // Try both ObjectId and string formats
      query = { 
        $or: [
          { userId: mongoose.Types.ObjectId(userId) },
          { userId: userId }
        ]
      };
    } else {
      query = { userId: userId };
    }
    
    const profile = await Profile.findOne(query, '-__v').lean();
    return profile;
  } catch (error) {
    console.error(`Error in getProfileById service for user ${userId}:`, error);
    throw error;
  }
};

module.exports = {
  getAllProfiles,
  getProfileById
};
EOL
  echo "Created profileService.js"
fi

# 5. Run the username fix script
echo "Running username fix script..."
node $ROOT_DIR/scripts/fixUsernames.js

# 6. Restart the server
echo "Restarting the server..."
# Check if pm2 is installed
if command -v pm2 &> /dev/null; then
  pm2 restart all
else
  echo "PM2 not installed. Please restart the server manually."
fi

echo "=== Fix deployment completed! ==="
echo "The username issues should now be resolved."
echo "If issues persist, please check the server logs." 