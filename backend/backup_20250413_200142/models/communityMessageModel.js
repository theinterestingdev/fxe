const mongoose = require('mongoose');

const communityMessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const CommunityMessage = mongoose.model('CommunityMessage', communityMessageSchema);
module.exports = CommunityMessage;