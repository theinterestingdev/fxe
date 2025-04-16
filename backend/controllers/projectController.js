// controllers/projectController.js
const Project = require('../models/projectModel');
const Profile = require('../models/profileSchema');

// Add a simple cache to avoid excessive database queries
const cache = {
  projects: null,
  timestamp: null,
  expiresIn: 60000 // 1 minute cache
};

// Upload a project
const uploadProject = async (req, res) => {
  const { title, description, screenshots, liveLink, videoLink } = req.body;
  const userId = req.user.userId; // Extracted from JWT

  try {
    // Get user profile for username
    const profile = await Profile.findOne({ userId }).lean();
    const username = profile ? (profile.name || profile.username) : 'user';
    
    const project = new Project({
      userId,
      username,
      title,
      description,
      screenshots: Array.isArray(screenshots) ? screenshots : [],
      liveLink,
      videoLink,
    });

    console.log("Saving project:", project); // Debug log
    await project.save();
    
    // Invalidate cache when a new project is added
    cache.projects = null;
    cache.timestamp = null;
    
    res.status(201).json({ message: 'Project uploaded successfully', project });
  } catch (err) {
    console.error("Error in uploadProject:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Track requests to detect loops
const requestTracker = {
  counts: {},
  reset: function() {
    this.counts = {};
  },
  track: function(ip) {
    if (!this.counts[ip]) {
      this.counts[ip] = { count: 1, firstRequest: Date.now() };
      return false;
    }
    
    const tracker = this.counts[ip];
    tracker.count++;
    
    // If more than 10 requests in 10 seconds, could be a loop
    if (tracker.count > 10 && (Date.now() - tracker.firstRequest) < 10000) {
      console.warn(`Potential request loop detected from IP: ${ip}, ${tracker.count} requests in ${Date.now() - tracker.firstRequest}ms`);
      return true;
    }
    
    // Reset counter after 30 seconds
    if (Date.now() - tracker.firstRequest > 30000) {
      this.counts[ip] = { count: 1, firstRequest: Date.now() };
    }
    
    return false;
  }
};

// Reset tracker every 5 minutes
setInterval(() => requestTracker.reset(), 300000);

// Get all projects with user details
const getProjects = async (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Check for rapid requests (potential loop)
    if (requestTracker.track(clientIp)) {
      console.warn(`Rate limiting projects request from IP: ${clientIp}`);
      return res.status(429).json({ 
        message: 'Too many requests', 
        error: 'Rate limit exceeded',
        retryAfter: 10 // seconds
      });
    }
    
    // Return cached result if available and not expired
    if (cache.projects && cache.timestamp && (Date.now() - cache.timestamp < cache.expiresIn)) {
      console.log(`Returning cached projects (${cache.projects.length})`);
      return res.status(200).json(cache.projects);
    }
    
    // Fetch all projects
    const projects = await Project.find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean(); // Convert to plain JavaScript objects for better performance

    // Get unique user IDs from projects
    const userIds = [...new Set(projects.map(project => project.userId))];

    // Fetch user profiles in a single query
    const profiles = await Profile.find({ userId: { $in: userIds } }).lean();
    
    // Create a map for quick profile lookup
    const profileMap = profiles.reduce((map, profile) => {
      map[profile.userId] = profile;
      return map;
    }, {});

    // Enrich projects with user data - removed excessive logging
    const enrichedProjects = projects.map(project => {
      const profile = profileMap[project.userId] || {};
      
      // Prioritize username assignment
      const username = project.username || profile.name || profile.username || (
        project.userId && project.userId.includes('@') ? project.userId.split('@')[0] : 'user'
      );
      
      return {
        ...project,
        username,
        userAvatar: profile.avatar || '',
        userRole: profile.role || '',
      };
    });

    console.log(`Sending ${enrichedProjects.length} projects to client ${clientIp}`);
    
    // Update cache
    cache.projects = enrichedProjects;
    cache.timestamp = Date.now();
    
    res.status(200).json(enrichedProjects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { uploadProject, getProjects };