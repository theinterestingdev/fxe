const Project = require('../models/projectModel');

/**
 * Add a like to a project
 * @param {String} projectId - Project ID
 * @param {String} userId - User ID who liked the project
 * @returns {Object} Result with success status and likes count
 */
async function likeProject(projectId, userId) {
  try {
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    // Check if user has already liked the project
    if (project.likedBy && project.likedBy.includes(userId)) {
      return { 
        success: true, 
        message: 'User already liked this project',
        likesCount: project.likes
      };
    }

    // Add user to likedBy array and increment likes count
    project.likedBy = project.likedBy || [];
    project.likedBy.push(userId);
    project.likes = (project.likes || 0) + 1;
    
    await project.save();
    
    return { 
      success: true, 
      message: 'Project liked successfully',
      likesCount: project.likes
    };
  } catch (error) {
    console.error('Error liking project:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Add a comment to a project
 * @param {String} projectId - Project ID
 * @param {Object} comment - Comment object with userId, username, text, and timestamp
 * @returns {Object} Result with success status
 */
async function addComment(projectId, comment) {
  try {
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    // Add comment to project
    project.comments = project.comments || [];
    project.comments.push(comment);
    
    await project.save();
    
    return { 
      success: true, 
      message: 'Comment added successfully',
      comment
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Get all projects
 * @returns {Array} List of projects
 */
async function getAllProjects() {
  try {
    return await Project.find().sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error getting projects:', error);
    return [];
  }
}

/**
 * Get project by ID
 * @param {String} projectId - Project ID
 * @returns {Object} Project object
 */
async function getProjectById(projectId) {
  try {
    return await Project.findById(projectId);
  } catch (error) {
    console.error('Error getting project:', error);
    return null;
  }
}

module.exports = {
  likeProject,
  addComment,
  getAllProjects,
  getProjectById
}; 