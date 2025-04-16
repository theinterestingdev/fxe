# Username Fix Deployment Script for Windows
# This script automatically applies all necessary fixes for the username issues

Write-Host "=== Username Fix Deployment Script ===" -ForegroundColor Cyan
Write-Host "Starting automatic fix deployment..." -ForegroundColor Cyan

# Navigate to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT_DIR = (Get-Item $scriptPath).Parent.FullName
Write-Host "Project root: $ROOT_DIR" -ForegroundColor Green

# 1. Make sure all dependencies are installed
Write-Host "Installing dependencies..." -ForegroundColor Cyan
Set-Location $ROOT_DIR
npm install

# 2. Backup current files
Write-Host "Creating backup of current files..." -ForegroundColor Cyan
$BACKUP_DIR = "$ROOT_DIR\backup_$(Get-Date -Format "yyyyMMdd_HHmmss")"
New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null

if (Test-Path "$ROOT_DIR\models") {
    Copy-Item -Path "$ROOT_DIR\models" -Destination "$BACKUP_DIR\models" -Recurse
}
if (Test-Path "$ROOT_DIR\socketHandlers") {
    Copy-Item -Path "$ROOT_DIR\socketHandlers" -Destination "$BACKUP_DIR\socketHandlers" -Recurse
}
if (Test-Path "$ROOT_DIR\services") {
    Copy-Item -Path "$ROOT_DIR\services" -Destination "$BACKUP_DIR\services" -Recurse
}
if (Test-Path "$ROOT_DIR\routes") {
    Copy-Item -Path "$ROOT_DIR\routes" -Destination "$BACKUP_DIR\routes" -Recurse
}
Write-Host "Backup created at $BACKUP_DIR" -ForegroundColor Green

# 3. Update the profileSchema.js file
Write-Host "Updating profileSchema.js..." -ForegroundColor Cyan
$profileSchemaPath = "$ROOT_DIR\models\profileSchema.js"

if (Test-Path $profileSchemaPath) {
    $profileSchema = Get-Content $profileSchemaPath -Raw
    
    # Check if the file has username, email, and avatar fields
    $hasUsername = $profileSchema -match "username:\s*{"
    $hasEmail = $profileSchema -match "email:\s*{"
    $hasAvatar = $profileSchema -match "avatar:\s*{"
    $hasTimestamps = $profileSchema -match "timestamps:"
    
    # Add missing fields
    if (-not $hasUsername) {
        $profileSchema = $profileSchema -replace '(expertiseLevel:.*?},)', "`$1`r`n  username: { type: String },"
        Write-Host "Added username field to profileSchema" -ForegroundColor Green
    }
    
    if (-not $hasEmail) {
        $profileSchema = $profileSchema -replace '(expertiseLevel:.*?},)', "`$1`r`n  email: { type: String },"
        Write-Host "Added email field to profileSchema" -ForegroundColor Green
    }
    
    if (-not $hasAvatar) {
        $profileSchema = $profileSchema -replace '(expertiseLevel:.*?},)', "`$1`r`n  avatar: { type: String },"
        Write-Host "Added avatar field to profileSchema" -ForegroundColor Green
    }
    
    if (-not $hasTimestamps) {
        $profileSchema = $profileSchema -replace '}\);$', '}, { timestamps: true });'
        Write-Host "Added timestamps to profileSchema" -ForegroundColor Green
    }
    
    # Save the updated file
    $profileSchema | Set-Content $profileSchemaPath
}

# 4. Create profileService.js if it doesn't exist
$profileServicePath = "$ROOT_DIR\services\profileService.js"
if (-not (Test-Path $profileServicePath)) {
    Write-Host "Creating profileService.js..." -ForegroundColor Cyan
    
    # Make sure the directory exists
    New-Item -ItemType Directory -Path "$ROOT_DIR\services" -Force | Out-Null
    
    $profileServiceContent = @'
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
'@

    $profileServiceContent | Set-Content $profileServicePath
    Write-Host "Created profileService.js" -ForegroundColor Green
}

# 5. Update socket handlers to handle getUsersList event
$chatHandlersPath = "$ROOT_DIR\socketHandlers\chatHandlers.js"
if (Test-Path $chatHandlersPath) {
    Write-Host "Updating socketHandlers/chatHandlers.js..." -ForegroundColor Cyan
    $chatHandlers = Get-Content $chatHandlersPath -Raw
    
    # Check if getUsersList handler already exists
    $hasGetUsersList = $chatHandlers -match "socket\.on\('getUsersList'"
    
    if (-not $hasGetUsersList) {
        # Find a good position to add the handler - after "ping" handler
        $chatHandlers = $chatHandlers -replace "(socket\.on\('ping'.*?\}\);)", @"
`$1

  // Handle getUsersList request
  socket.on('getUsersList', async () => {
    try {
      console.log('Fetching users list for socket request');
      
      // Get user profiles from the database
      const userProfiles = await require('../services/profileService').getAllProfiles();
      
      // Format users with consistent field names - prioritize username field
      const formattedUsers = userProfiles.map(profile => {
        // Ensure profile has all expected fields
        if (!profile) return null;
        
        // Extract userId - handle both string and ObjectId formats
        const profileId = profile._id?.toString() || profile.userId?.toString();
        if (!profileId) return null;
        
        console.log(`Processing profile: ${profileId}, username: ${profile.username || 'none'}, email: ${profile.email || 'none'}`);
        
        // Create a consistent username, strongly preferring stored username
        const username = profile.username || 
                         profile.name || 
                         (profile.email ? profile.email.split('@')[0] : null) ||
                         `User-${profileId.substring(0, 5)}`;
        
        return {
          _id: profileId,
          userId: profileId,
          username: username,  // Prioritize stored username
          name: profile.name || username,
          email: profile.email || '',
          avatar: profile.avatar || profile.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          profileImage: profile.avatar || profile.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        };
      }).filter(user => user !== null); // Remove any null entries
      
      console.log(`Sending ${formattedUsers.length} user profiles to client`);
      socket.emit('usersList', formattedUsers);
    } catch (error) {
      console.error('Error fetching users list:', error);
      socket.emit('usersList', []);
    }
  });
"@
        $chatHandlers | Set-Content $chatHandlersPath
        Write-Host "Added getUsersList handler to chatHandlers.js" -ForegroundColor Green
    }
}

# 6. Run the username fix script
Write-Host "Running username fix script..." -ForegroundColor Cyan
node "$ROOT_DIR\scripts\fixUsernames.js"

# 7. Give instructions for restarting the server
Write-Host "=== Fix deployment completed! ===" -ForegroundColor Green
Write-Host "The username issues should now be resolved." -ForegroundColor Green
Write-Host "Please restart your server now with the following command:" -ForegroundColor Yellow
Write-Host "cd $ROOT_DIR && npm start" -ForegroundColor Yellow 