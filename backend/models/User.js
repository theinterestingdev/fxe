const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    trim: true,
    default: function() {
      // Generate a username based on email if not provided
      if (this.email) {
        return this.email.split('@')[0];
      }
      return `User-${this._id.toString().substring(0, 5)}`;
    }
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Index for efficient user searches
UserSchema.index({ email: 1, username: 1 });

module.exports = mongoose.model('User', UserSchema);
