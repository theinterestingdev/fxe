const chatService = require('../services/chatService');
const notificationService = require('../services/notificationService');
const projectService = require('../services/projectService');

// Add rate limiting to prevent loops
const rateLimits = {
  requestCounts: {},
  lastReset: Date.now(),
};

// Reset rate limits every minute
setInterval(() => {
  rateLimits.requestCounts = {};
  rateLimits.lastReset = Date.now();
}, 60000);

/**
 * Check if a request from a user for an event exceeds rate limits
 * @param {string} userId - User ID
 * @param {string} eventName - Socket event name
 * @param {number} limit - Max allowed requests in time window
 * @returns {boolean} - True if rate limited
 */
function isRateLimited(userId, eventName, limit = 20) {
  const key = `${userId}-${eventName}`;
  
  if (!rateLimits.requestCounts[key]) {
    rateLimits.requestCounts[key] = 1;
    return false;
  }
  
  if (rateLimits.requestCounts[key] > limit) {
    console.warn(`Rate limit exceeded for ${userId} on ${eventName}: ${rateLimits.requestCounts[key]} requests`);
    return true;
  }
  
  rateLimits.requestCounts[key]++;
  return false;
}

/**
 * Setup chat-related socket handlers
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket connection
 * @param {Object} users - Connected users map
 */
function setupChatHandlers(io, socket, users) {
  // Track multiple registration attempts
  let hasRegistered = false;
  
  // Register user with their ID
  socket.on('registerUser', async (data) => {
    // Handle both formats - object with details or just userId string
    const userId = typeof data === 'object' ? data.userId : data;
    const userDetails = typeof data === 'object' ? data : null;
    
    if (!userId) {
      console.error('Invalid user ID provided');
      return;
    }

    // Prevent multiple registrations from same socket
    if (hasRegistered) {
      console.log(`User ${userId} already registered on socket ${socket.id}`);
      return;
    }
    
    hasRegistered = true;
    console.log(`User ${userId} registering with socket ID ${socket.id}`);

    // If we have user details, store them for later use in messages and other events
    if (userDetails) {
      // Store user details in memory for use in messages
      try {
        // Also update user details in the database
        const Profile = require('../models/profileSchema');
        const mongoose = require('mongoose');
        
        // Handle string vs ObjectId for userId
        let userIdQuery;
        try {
          // Try to convert to ObjectId if it's a valid format
          if (mongoose.Types.ObjectId.isValid(userId)) {
            userIdQuery = { $or: [
              { userId: mongoose.Types.ObjectId(userId) },
              { userId: userId }
            ]};
          } else {
            userIdQuery = { userId: userId };
          }
        } catch (err) {
          // If conversion fails, use as is
          userIdQuery = { userId: userId };
        }
        
        console.log(`Updating profile for user ${userId} with username ${userDetails.username}`);
        
        // First try to find the user to see if they exist
        const existingProfile = await Profile.findOne(userIdQuery);
        
        if (existingProfile) {
          // Update existing profile
          await Profile.updateOne(
            { _id: existingProfile._id },
            { 
              $set: { 
                username: userDetails.username,
                name: userDetails.name || userDetails.username,
                email: userDetails.email
              }
            }
          );
          console.log(`Updated existing profile for ${userDetails.username}`);
        } else {
          // Create new profile
          const newProfile = new Profile({
            userId: userId,
            username: userDetails.username,
            name: userDetails.name || userDetails.username,
            email: userDetails.email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userDetails.username || userId}`
          });
          await newProfile.save();
          console.log(`Created new profile for ${userDetails.username}`);
        }
      } catch (err) {
        console.error(`Error updating user profile: ${err.message}`);
      }
    }

    // Check if user is already connected with different socket
    const existingSocketId = users[userId];
    if (existingSocketId && existingSocketId !== socket.id) {
      console.log(`User ${userId} already connected with socket ${existingSocketId}, updating to ${socket.id}`);
      
      // Notify the old socket that a new connection has taken over
      try {
        io.to(existingSocketId).emit('connectionReplaced', { 
          message: 'Your session has been opened elsewhere.' 
        });
      } catch (err) {
        console.error(`Failed to notify old socket: ${err.message}`);
      }
    }
    
    // Map user ID to socket ID
    users[userId] = socket.id;
    console.log(`User ${userId} connected with socket ID ${socket.id}`);
    console.log(`Active users: ${Object.keys(users).join(', ')}`);

    // Notify other users that this user is online
    socket.broadcast.emit('userStatusUpdate', { userId, isOnline: true });
    
    // Send user's existing unread notifications
    sendUnreadNotifications(userId, socket);
    
    // Send current online users to the newly connected user
    const onlineUsers = {};
    for (const [uid, sid] of Object.entries(users)) {
      onlineUsers[uid] = true;
    }
    socket.emit('initialOnlineUsers', onlineUsers);
  });

  // Helper function to send unread notifications to user
  async function sendUnreadNotifications(userId, socket) {
    try {
      const unreadNotifications = await notificationService.getUnreadNotifications(userId);
      if (unreadNotifications && unreadNotifications.length > 0) {
        console.log(`Sending ${unreadNotifications.length} unread notifications to user ${userId}`);
        socket.emit('unreadNotifications', unreadNotifications);
      }
    } catch (error) {
      console.error('Error sending unread notifications:', error);
    }
  }

  // Handle notifications
  socket.on('sendNotification', async (notification) => {
    if (!notification || !notification.recipientId || !notification.senderId) {
      console.error('Invalid notification format');
      return;
    }
    
    // Apply rate limiting for notifications
    if (isRateLimited(notification.senderId, 'sendNotification', 10)) {
      console.warn(`Rate limited notification from ${notification.senderId}`);
      return;
    }

    try {
      // Prevent sending notifications to yourself
      if (notification.senderId === notification.recipientId) {
        console.log('Skipping self-notification');
        return;
      }
      
      // Add unique ID to notification
      notification.id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      notification.read = false;
      
      console.log(`Sending notification to user ${notification.recipientId}:`, notification.type);
      
      // Save notification to database
      const savedNotification = await notificationService.saveNotification(notification);
      
      // Find recipient's socket ID
      const recipientSocketId = users[notification.recipientId];
      
      // Send notification only to the intended recipient
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('notification', savedNotification);
      } else {
        console.log(`User ${notification.recipientId} is offline, notification will be delivered later`);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  });

  // Handle request for chat history
  socket.on('getChatHistory', async (data) => {
    try {
      // Check if data is a string (userId) or an object with userId
      let userId;
      let partnerId;
      
      if (typeof data === 'string' || typeof data === 'number') {
        userId = data;
        console.log(`Getting all chat history for user ${userId}`);
      } else if (typeof data === 'object' && data.userId) {
        userId = data.userId;
        partnerId = data.partnerId;
        console.log(`Getting specific chat history between ${userId} and ${partnerId}`);
      } else {
        console.error('Invalid data format for getChatHistory:', data);
        socket.emit('chatHistory', { error: 'Invalid request format', conversations: [] });
        return;
      }
      
      if (!userId) {
        console.error('Invalid user ID provided');
        socket.emit('chatHistory', { error: 'Invalid user ID', conversations: [] });
        return;
      }
      
      // Apply rate limiting
      if (isRateLimited(userId, 'getChatHistory', 5)) {
        console.warn(`Rate limited chat history request from ${userId}`);
        socket.emit('chatHistory', { 
          error: 'Too many requests, please try again later', 
          rateLimited: true,
          conversations: [] 
        });
        return;
      }
      
      let history;
      if (partnerId) {
        // Get history for specific conversation
        history = await chatService.getChatHistoryForConversation(userId, partnerId);
      } else {
        // Get all chat history
        history = await chatService.getChatHistoryForUser(userId);
      }
      
      console.log(`Returning chat history with ${history.conversations.length} conversations`);
      socket.emit('chatHistory', history);
    } catch (error) {
      console.error('Error getting chat history:', error);
      socket.emit('chatHistory', { error: error.message, conversations: [] });
    }
  });

  // Handle private messages
  socket.on('sendPrivateMessage', async (message, callback) => {
    try {
      if (!message || !message.sender || !message.receiver || !message.text) {
        const error = 'Invalid message format';
        console.error(error, message);
        if (callback) callback({ success: false, error });
        return;
      }
      
      // Apply rate limiting for private messages
      if (isRateLimited(message.sender, 'sendPrivateMessage', 15)) {
        console.warn(`Rate limited messages from ${message.sender}`);
        if (callback) callback({ 
          success: false, 
          error: 'Sending too many messages, please slow down',
          rateLimited: true
        });
        return;
      }

      console.log(`Processing private message from ${message.sender} to ${message.receiver}`);
      
      // Add timestamp if not provided
      if (!message.timestamp) {
        message.timestamp = new Date().toISOString();
      }
      
      // Ensure message has an ID if not provided
      if (!message.id) {
        message.id = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
      
      try {
        // Save message to database
        const savedMessage = await chatService.saveMessage(message);
        console.log(`Message saved to database with ID: ${savedMessage.id}`);

        // Find the recipient's socket ID
        const receiverSocketId = users[message.receiver];

        if (receiverSocketId) {
          console.log(`Sending message to online user ${message.receiver} (socket: ${receiverSocketId})`);
          // Send the message to the recipient only
          io.to(receiverSocketId).emit('receivePrivateMessage', savedMessage);
          
          // Create notification for new message but only send if we haven't recently
          if (!isRateLimited(message.sender, `message-notif-${message.receiver}`, 2)) {
            const notification = {
              id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              type: 'message',
              senderId: message.sender,
              senderName: message.senderName || 'A user',
              recipientId: message.receiver,
              messagePreview: message.text.substring(0, 30) + (message.text.length > 30 ? '...' : ''),
              timestamp: new Date().toISOString(),
              read: false
            };
            
            // Save and send notification
            const savedNotification = await notificationService.saveNotification(notification);
            io.to(receiverSocketId).emit('notification', savedNotification);
          }
        } else {
          console.log(`User ${message.receiver} is offline, message will be delivered later`);
          // Save notification for offline user to receive on next login
        }

        // Send the message back to the sender for UI update
        socket.emit('receivePrivateMessage', {
          ...savedMessage.toObject(),
          confirmed: true
        });
        
        // Send success callback if provided
        if (callback) callback({ success: true, messageId: savedMessage.id });
      } catch (dbError) {
        console.error('Database error handling private message:', dbError);
        if (callback) callback({ success: false, error: 'Database error: ' + dbError.message });
      }
    } catch (error) {
      console.error('Error handling private message:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // Handle typing status
  socket.on('typing_status', (data) => {
    if (!data || !data.senderId || !data.recipientId) {
      console.error('Invalid typing status data');
      return;
    }
    
    // Apply rate limiting for typing status updates (more aggressive)
    if (isRateLimited(data.senderId, 'typing_status', 30)) {
      console.warn(`Rate limited typing status from ${data.senderId}`);
      return;
    }
    
    console.log(`Typing status update: ${data.senderId} is ${data.isTyping ? 'typing' : 'not typing'} to ${data.recipientId}`);
    
    // Find recipient's socket ID
    const recipientSocketId = users[data.recipientId];
    
    // Only send to recipient if they're online
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing_status', data);
    }
  });

  // Handle message read receipts (update to support both formats)
  socket.on('markMessageRead', async ({ messageId }, callback) => {
    try {
      if (!messageId) {
        console.error('Invalid message ID provided');
        if (callback) callback({ success: false, error: 'Invalid message ID' });
        return;
      }

      // Update message in database
      const message = await chatService.markMessageAsRead(messageId);

      if (message) {
        // Notify sender that message was read - support both old and new format
        const senderSocketId = users[message.sender] || users[message.senderId];
        if (senderSocketId) {
          // Send both event types for compatibility
          io.to(senderSocketId).emit('messageRead', {
            messageId: message.id || message._id,
            conversationId: message.receiver || message.recipientId,
          });
        }
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, error: 'Message not found' });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // Handle notification read receipts
  socket.on('markNotificationRead', async ({ notificationId }, callback) => {
    try {
      if (!notificationId) {
        console.error('Invalid notification ID provided');
        if (callback) callback({ success: false, error: 'Invalid notification ID' });
        return;
      }

      // Update notification in database
      await notificationService.markNotificationAsRead(notificationId);
      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);

    // Find the user ID associated with this socket
    let disconnectedUserId = null;
    for (const [userId, socketId] of Object.entries(users)) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        delete users[userId];
        console.log(`User ${userId} disconnected`);
        break;
      }
    }

    // Notify other users about the status change
    if (disconnectedUserId) {
      io.emit('userStatusUpdate', {
        userId: disconnectedUserId,
        isOnline: false,
      });
    }
  });

  // Handle post likes
  socket.on('likePost', async (data) => {
    if (!data || !data.postId || !data.userId) {
      console.error('Invalid like format');
      return;
    }

    try {
      // Update like count in database
      const result = await projectService.likeProject(data.postId, data.userId);
      
      if (result.success) {
        // Broadcast like update to all connected users
        io.emit('postLiked', {
          postId: data.postId,
          likesCount: result.likesCount,
          likedBy: data.userId
        });
      }
    } catch (error) {
      console.error('Error handling post like:', error);
    }
  });

  // Handle comments
  socket.on('addComment', async (data) => {
    if (!data || !data.postId || !data.comment) {
      console.error('Invalid comment format');
      return;
    }

    try {
      // Save comment to database
      const result = await projectService.addComment(data.postId, data.comment);
      
      if (result.success) {
        // Broadcast comment to all connected users
        io.emit('newComment', {
          postId: data.postId,
          comment: data.comment
        });
      }
    } catch (error) {
      console.error('Error handling comment:', error);
    }
  });
  
  // Handle ping from client
  socket.on('ping', () => {
    socket.emit('pong');
  });
  
  // Handle getUsersList request
  socket.on('getUsersList', async () => {
    try {
      console.log('Fetching users list for socket request');
      
      // Get user profiles from the database
      const userProfiles = await require('../services/profileService').getAllProfiles();
      
      // Format users with consistent field names - prioritize username field
      const formattedUsers = userProfiles.map(profile => {
        // Ensure profile has all expected fields
        if (!profile) return null;
        
        // Extract userId - handle both string and ObjectId formats
        const profileId = profile._id?.toString() || profile.userId?.toString();
        if (!profileId) return null;
        
        console.log(`Processing profile: ${profileId}, username: ${profile.username || 'none'}, email: ${profile.email || 'none'}`);
        
        // Create a consistent username, strongly preferring stored username
        const username = profile.username || 
                         profile.name || 
                         (profile.email ? profile.email.split('@')[0] : null) ||
                         `User-${profileId.substring(0, 5)}`;
        
        return {
          _id: profileId,
          userId: profileId,
          username: username,  // Prioritize stored username
          name: profile.name || username,
          email: profile.email || '',
          avatar: profile.avatar || profile.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          profileImage: profile.avatar || profile.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        };
      }).filter(user => user !== null); // Remove any null entries
      
      console.log(`Sending ${formattedUsers.length} user profiles to client`);
      socket.emit('usersList', formattedUsers);
    } catch (error) {
      console.error('Error fetching users list:', error);
      socket.emit('usersList', []);
    }
  });
  
  // Handle direct message requests
  socket.on('get_direct_messages', async (data, callback) => {
    try {
      if (!data || !data.senderId || !data.recipientId) {
        console.error('Invalid request format for get_direct_messages:', data);
        if (callback) callback({ success: false, error: 'Invalid request format', messages: [] });
        return;
      }
      
      console.log(`Getting direct messages between ${data.senderId} and ${data.recipientId}`);
      
      // Get messages between these two users using existing service
      const history = await chatService.getChatHistoryForConversation(data.senderId, data.recipientId);
      
      // Format messages array for DirectChat component
      const formattedMessages = history.conversations.length > 0 
        ? history.conversations[0].messages.map(msg => ({
            id: msg.id,
            senderId: msg.sender,
            recipientId: msg.receiver,
            content: msg.text,
            timestamp: msg.timestamp
          }))
        : [];
      
      console.log(`Returning ${formattedMessages.length} direct messages`);
      if (callback) callback({ success: true, messages: formattedMessages });
    } catch (error) {
      console.error('Error getting direct messages:', error);
      if (callback) callback({ success: false, error: error.message, messages: [] });
    }
  });
  
  // Handle sending direct messages
  socket.on('send_direct_message', async (message, callback) => {
    try {
      if (!message || !message.senderId || !message.recipientId || !message.content) {
        const error = 'Invalid message format';
        console.error(error, message);
        if (callback) callback({ success: false, error });
        return;
      }
      
      // Apply rate limiting
      if (isRateLimited(message.senderId, 'send_direct_message', 15)) {
        console.warn(`Rate limited direct messages from ${message.senderId}`);
        if (callback) callback({ 
          success: false, 
          error: 'Sending too many messages, please slow down',
          rateLimited: true
        });
        return;
      }
      
      console.log(`Processing direct message from ${message.senderId} to ${message.recipientId}`);
      
      // Convert to internal message format
      const internalMessage = {
        id: message.id || `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sender: message.senderId,
        receiver: message.recipientId,
        text: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
      };
      
      // Save message using existing service
      const savedMessage = await chatService.saveMessage(internalMessage);
      console.log(`Direct message saved with ID: ${savedMessage.id}`);
      
      // Format for DirectChat component
      const formattedMessage = {
        id: savedMessage.id,
        senderId: savedMessage.sender,
        recipientId: savedMessage.receiver,
        content: savedMessage.text,
        timestamp: savedMessage.timestamp
      };
      
      // Send to recipient if online
      const recipientSocketId = users[message.recipientId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('direct_message', formattedMessage);
      }
      
      // Send back to sender for confirmation
      socket.emit('direct_message', formattedMessage);
      
      // Success callback
      if (callback) callback({ success: true, messageId: savedMessage.id });
    } catch (error) {
      console.error('Error handling direct message:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });
  // Handle socket disconnect for real-time status
  socket.on('disconnect', () => {
    // Find the userId for this socket
    const disconnectedUserId = Object.keys(users).find(
      (uid) => users[uid] === socket.id
    );
    if (disconnectedUserId) {
      // Remove from users map
      delete users[disconnectedUserId];
      console.log(`User ${disconnectedUserId} disconnected (socket ${socket.id})`);
      // Notify all clients that this user went offline
      socket.broadcast.emit('userStatusUpdate', { userId: disconnectedUserId, isOnline: false });
      // Optionally, send the new online users list to all clients
      const onlineUsers = Object.keys(users);
      io.emit('online_users', onlineUsers);
    }
  });
}

module.exports = setupChatHandlers;