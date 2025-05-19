const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Explicitly define _id to ensure we don't have conflicts
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  senderId: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  receiverId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  // Disable virtual id getter to prevent any 'id' field
  id: false
});

// Index for efficient querying of conversations
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ receiverId: 1, senderId: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
