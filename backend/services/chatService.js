const Message = require('../models/messageModel');

/**
 * Get chat history for a specific user
 * @param {String} userId - The user's ID
 * @returns {Object} Formatted chat history
 */
async function getChatHistoryForUser(userId) {
  try {
    console.log(`Getting chat history for user: ${userId}`);
    // Find all messages where the user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    }).sort({ timestamp: 1 });

    console.log(`Found ${messages.length} messages for user ${userId}`);
    
    // Group messages by conversation partner
    const conversations = {};
    
    messages.forEach(message => {
      const partnerId = message.sender === userId ? message.receiver : message.sender;
      if (!conversations[partnerId]) {
        conversations[partnerId] = [];
      }
      conversations[partnerId].push({
        id: message.id,
        sender: message.sender,
        receiver: message.receiver,
        text: message.text,
        timestamp: message.timestamp.toISOString(),
        read: message.read
      });
    });

    
    return {
      conversations: Object.keys(conversations).map(partnerId => ({
        partnerId,
        messages: conversations[partnerId]
      }))
    };
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    return { conversations: [] };
  }
}

/**
 * Get chat history for a specific conversation between two users
 * @param {String} userId - The first user's ID
 * @param {String} partnerId - The second user's ID
 * @returns {Object} Formatted chat history
 */
async function getChatHistoryForConversation(userId, partnerId) {
  try {
    console.log(`Getting conversation history between users: ${userId} and ${partnerId}`);
    
    
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId }
      ]
    }).sort({ timestamp: 1 });

    console.log(`Found ${messages.length} messages in conversation`);
    
    
    const formattedMessages = messages.map(message => ({
      id: message.id,
      sender: message.sender,
      senderName: message.senderName || '',
      senderAvatar: message.senderAvatar || '',
      receiver: message.receiver,
      text: message.text,
      timestamp: message.timestamp.toISOString(),
      read: message.read
    }));

    
    return {
      conversations: [
        {
          partnerId,
          messages: formattedMessages
        }
      ]
    };
  } catch (error) {
    console.error(`Error retrieving conversation history between ${userId} and ${partnerId}:`, error);
    return { conversations: [] };
  }
}

/**
 * Save a new message to the database
 * @param {Object} message - Message object
 * @returns {Object} Saved message
 */
async function saveMessage(message) {
  try {
    const newMessage = new Message({
      id: message.id,
      sender: message.sender,
      senderName: message.senderName || '',
      senderAvatar: message.senderAvatar || '',
      receiver: message.receiver,
      text: message.text,
      timestamp: new Date(message.timestamp || Date.now()),
      read: false
    });
    
    return await newMessage.save();
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

/**
 * Mark a message as read
 * @param {string} messageId - ID of the message to mark as read
 * @returns {Promise<Object>} Updated message object
 */
const markMessageAsRead = async (messageId) => {
  try {
  
    const message = await Message.findOneAndUpdate(
      { $or: [
        { id: messageId },
        { _id: messageId }
      ]},
      { 
        $set: { 
          read: true,
          readAt: new Date().toISOString()
        } 
      },
      { new: true }
    );
    
    if (!message) {
      console.error(`Message not found with ID: ${messageId}`);
      return null;
    }
    
    console.log(`Marked message ${messageId} as read`);
    return message;
  } catch (error) {
    console.error(`Error marking message as read: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getChatHistoryForUser,
  getChatHistoryForConversation,
  saveMessage,
  markMessageAsRead
};