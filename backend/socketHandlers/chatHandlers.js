const chatService = require('../services/chatService');
const notificationService = require('../services/notificationService');
const projectService = require('../services/projectService');


const rateLimits = {
  requestCounts: {},
  lastReset: Date.now(),
};


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
  
  let hasRegistered = false;
  
  
  socket.on('registerUser', async (data) => {
    
    const userId = typeof data === 'object' ? data.userId : data;
    const userDetails = typeof data === 'object' ? data : null;
    
    if (!userId) {
      console.error('Invalid user ID provided');
      return;
    }

    
    if (hasRegistered) {
      console.log(`User ${userId} already registered on socket ${socket.id}`);
      return;
    }
    
    hasRegistered = true;
    console.log(`User ${userId} registering with socket ID ${socket.id}`);

    
    if (userDetails) {
      
      try {
        
        const Profile = require('../models/profileSchema');
        const mongoose = require('mongoose');
        
        
        let userIdQuery;
        try {
          
          if (mongoose.Types.ObjectId.isValid(userId)) {
            userIdQuery = { $or: [
              { userId: mongoose.Types.ObjectId(userId) },
              { userId: userId }
            ]};
          } else {
            userIdQuery = { userId: userId };
          }
        } catch (err) {
          
          userIdQuery = { userId: userId };
        }
        
        console.log(`Updating profile for user ${userId} with username ${userDetails.username}`);
        
        
        const existingProfile = await Profile.findOne(userIdQuery);
        
        if (existingProfile) {
          
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

    
    const existingSocketId = users[userId];
    if (existingSocketId && existingSocketId !== socket.id) {
      console.log(`User ${userId} already connected with socket ${existingSocketId}, updating to ${socket.id}`);
      
      
      try {
        io.to(existingSocketId).emit('connectionReplaced', { 
          message: 'Your session has been opened elsewhere.' 
        });
      } catch (err) {
        console.error(`Failed to notify old socket: ${err.message}`);
      }
    }
    
    
    users[userId] = socket.id;
    console.log(`User ${userId} connected with socket ID ${socket.id}`);
    console.log(`Active users: ${Object.keys(users).join(', ')}`);

    
    socket.broadcast.emit('userStatusUpdate', { userId, isOnline: true });
    
    
    sendUnreadNotifications(userId, socket);
    
    
    const onlineUsers = {};
    for (const [uid, sid] of Object.entries(users)) {
      onlineUsers[uid] = true;
    }
    socket.emit('initialOnlineUsers', onlineUsers);
  });

  
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

  
  socket.on('sendNotification', async (notification) => {
    if (!notification || !notification.recipientId || !notification.senderId) {
      console.error('Invalid notification format');
      return;
    }
    
    
    if (isRateLimited(notification.senderId, 'sendNotification', 10)) {
      console.warn(`Rate limited notification from ${notification.senderId}`);
      return;
    }

    try {
      
      if (notification.senderId === notification.recipientId) {
        console.log('Skipping self-notification');
        return;
      }
      
      
      notification.id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      notification.read = false;
      
      console.log(`Sending notification to user ${notification.recipientId}:`, notification.type);
      
      
      const savedNotification = await notificationService.saveNotification(notification);
      
      
      const recipientSocketId = users[notification.recipientId];

      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('notification', savedNotification);
      } else {
        console.log(`User ${notification.recipientId} is offline, notification will be delivered later`);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  });

  
  socket.on('getChatHistory', async (data) => {
    try {
      
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
        
        history = await chatService.getChatHistoryForConversation(userId, partnerId);
      } else {
        
        history = await chatService.getChatHistoryForUser(userId);
      }
      
      console.log(`Returning chat history with ${history.conversations.length} conversations`);
      socket.emit('chatHistory', history);
    } catch (error) {
      console.error('Error getting chat history:', error);
      socket.emit('chatHistory', { error: error.message, conversations: [] });
    }
  });

  
  socket.on('sendPrivateMessage', async (message, callback) => {
    try {
      if (!message || !message.sender || !message.receiver || !message.text) {
        const error = 'Invalid message format';
        console.error(error, message);
        if (callback) callback({ success: false, error });
        return;
      }
      
    
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
      
      
      if (!message.timestamp) {
        message.timestamp = new Date().toISOString();
      }
      
      
      if (!message.id) {
        message.id = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
      
      try {
        
        const savedMessage = await chatService.saveMessage(message);
        console.log(`Message saved to database with ID: ${savedMessage.id}`);

        
        const receiverSocketId = users[message.receiver];

        if (receiverSocketId) {
          console.log(`Sending message to online user ${message.receiver} (socket: ${receiverSocketId})`);
          
          io.to(receiverSocketId).emit('receivePrivateMessage', savedMessage);
          
          
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
            
            
            const savedNotification = await notificationService.saveNotification(notification);
            io.to(receiverSocketId).emit('notification', savedNotification);
          }
        } else {
          console.log(`User ${message.receiver} is offline, message will be delivered later`);
          
        }

        
        socket.emit('receivePrivateMessage', {
          ...savedMessage.toObject(),
          confirmed: true
        });
        
        
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

  
  socket.on('typing_status', (data) => {
    if (!data || !data.senderId || !data.recipientId) {
      console.error('Invalid typing status data');
      return;
    }
    
    
    if (isRateLimited(data.senderId, 'typing_status', 30)) {
      console.warn(`Rate limited typing status from ${data.senderId}`);
      return;
    }
    
    console.log(`Typing status update: ${data.senderId} is ${data.isTyping ? 'typing' : 'not typing'} to ${data.recipientId}`);
    
    
    const recipientSocketId = users[data.recipientId];
    
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing_status', data);
    }
  });


  socket.on('markMessageRead', async ({ messageId }, callback) => {
    try {
      if (!messageId) {
        console.error('Invalid message ID provided');
        if (callback) callback({ success: false, error: 'Invalid message ID' });
        return;
      }

      
      const message = await chatService.markMessageAsRead(messageId);

      if (message) {
        
        const senderSocketId = users[message.sender] || users[message.senderId];
        if (senderSocketId) {
          
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

  
  socket.on('markNotificationRead', async ({ notificationId }, callback) => {
    try {
      if (!notificationId) {
        console.error('Invalid notification ID provided');
        if (callback) callback({ success: false, error: 'Invalid notification ID' });
        return;
      }

      
      await notificationService.markNotificationAsRead(notificationId);
      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);


    let disconnectedUserId = null;
    for (const [userId, socketId] of Object.entries(users)) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        delete users[userId];
        console.log(`User ${userId} disconnected`);
        break;
      }
    }

    
    if (disconnectedUserId) {
      io.emit('userStatusUpdate', {
        userId: disconnectedUserId,
        isOnline: false,
      });
    }
  });

  
  socket.on('likePost', async (data) => {
    if (!data || !data.postId || !data.userId) {
      console.error('Invalid like format');
      return;
    }

    try {
  
      const result = await projectService.likeProject(data.postId, data.userId);
      
      if (result.success) {
        
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

  
  socket.on('addComment', async (data) => {
    if (!data || !data.postId || !data.comment) {
      console.error('Invalid comment format');
      return;
    }

    try {
      
      const result = await projectService.addComment(data.postId, data.comment);
      
      if (result.success) {
        
        io.emit('newComment', {
          postId: data.postId,
          comment: data.comment
        });
      }
    } catch (error) {
      console.error('Error handling comment:', error);
    }
  });
  
  
  socket.on('ping', () => {
    socket.emit('pong');
  });
  
  
  socket.on('getUsersList', async () => {
    try {
      console.log('Fetching users list for socket request');
      
      
      const userProfiles = await require('../services/profileService').getAllProfiles();
      
      
      const formattedUsers = userProfiles.map(profile => {
        
        if (!profile) return null;
        
        
        const profileId = profile._id?.toString() || profile.userId?.toString();
        if (!profileId) return null;
        
        console.log(`Processing profile: ${profileId}, username: ${profile.username || 'none'}, email: ${profile.email || 'none'}`);
        
        
        const username = profile.username || 
                         profile.name || 
                         (profile.email ? profile.email.split('@')[0] : null) ||
                         `User-${profileId.substring(0, 5)}`;
        
        return {
          _id: profileId,
          userId: profileId,
          username: username,  
          name: profile.name || username,
          email: profile.email || '',
          avatar: profile.avatar || profile.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          profileImage: profile.avatar || profile.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        };
      }).filter(user => user !== null); 
      
      console.log(`Sending ${formattedUsers.length} user profiles to client`);
      socket.emit('usersList', formattedUsers);
    } catch (error) {
      console.error('Error fetching users list:', error);
      socket.emit('usersList', []);
    }
  });
  
  
  socket.on('get_direct_messages', async (data, callback) => {
    try {
      if (!data || !data.senderId || !data.recipientId) {
        console.error('Invalid request format for get_direct_messages:', data);
        if (callback) callback({ success: false, error: 'Invalid request format', messages: [] });
        return;
      }
      
      console.log(`Getting direct messages between ${data.senderId} and ${data.recipientId}`);
      
      
      const history = await chatService.getChatHistoryForConversation(data.senderId, data.recipientId);
      
      
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
  
  
  socket.on('send_direct_message', async (message, callback) => {
    try {
      if (!message || !message.senderId || !message.recipientId || !message.content) {
        const error = 'Invalid message format';
        console.error(error, message);
        if (callback) callback({ success: false, error });
        return;
      }
      
      
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
      
      
      const internalMessage = {
        id: message.id || `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sender: message.senderId,
        receiver: message.recipientId,
        text: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
      };
      
      
      const savedMessage = await chatService.saveMessage(internalMessage);
      console.log(`Direct message saved with ID: ${savedMessage.id}`);
      
      
       const formattedMessage = {
        id: savedMessage.id,
        senderId: savedMessage.sender,
        recipientId: savedMessage.receiver,
        content: savedMessage.text,
        timestamp: savedMessage.timestamp
      };
      
      
      const recipientSocketId = users[message.recipientId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('direct_message', formattedMessage);
      }
      
      
      socket.emit('direct_message', formattedMessage);
      
      
      if (callback) callback({ success: true, messageId: savedMessage.id });
    } catch (error) {
      console.error('Error handling direct message:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });
}

module.exports = setupChatHandlers;