const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // Reference to the User
  name: { type: String },
  username: { type: String },
  email: { type: String },
  avatar: { type: String },
  profileImage: { type: String },
  skills: [{ type: String }], 
  expertiseLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'] },
  portfolio: [{ type: String }], 
  bio: { type: String }, 
  verified: { type: Boolean, default: false },
}, { 
  timestamps: true // Add createdAt and updatedAt fields
});

module.exports = mongoose.model('Profile', profileSchema); 