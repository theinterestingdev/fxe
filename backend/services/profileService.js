const Profile = require('../models/profileSchema');

/**
 * Get all user profiles
 * @returns {Promise<Array>} Array of profile objects
 */
const getAllProfiles = async () => {
  try {
    const profiles = await Profile.find({}, '-__v')
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();
    
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
    const profile = await Profile.findOne({ userId }, '-__v').lean();
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