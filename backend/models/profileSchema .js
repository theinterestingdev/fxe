const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // Reference to the User
  skills: [{ type: String }], // Array of skills
  expertiseLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'] },
  portfolio: [{ type: String }], // Array of file URLs (Cloudinary)
  bio: { type: String }, // Optional bio
  verified: { type: Boolean, default: false }, // Profile verification status
});

module.exports = mongoose.model('Profile', profileSchema);