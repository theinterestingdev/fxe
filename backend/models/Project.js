// models/projectSchema.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user who uploaded the project
  title: { type: String, required: true },
  description: { type: String, required: true },
  screenshots: [{ type: String }], 
  liveLink: { type: String },
  videoLink: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);