
const express = require('express');
const { uploadProject, getProjects } = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
const Project = require('../models/projectModel');

const router = express.Router();


router.post('/', authMiddleware, uploadProject);


router.get('/', getProjects);

router.get('/debug', async (req, res) => {
  try {
    const projects = await Project.find().lean();
    console.log('DEBUG - Raw projects:', projects);
    res.status(200).json({
      count: projects.length,
      projects
    });
  } catch (err) {
    console.error('Error in debug route:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;