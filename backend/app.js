const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const projectRoutes = require('./routes/projectRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const connectDB = require('./config/db');
const Message = require('./models/Message');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000, // Increased timeout for better connection stability
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notifications', notificationRoutes);

// Connect to MongoDB
connectDB();

// Track connected users and their socket IDs
const connectedUsers = {};

// Helper function to get all users with online status
async function getAllUsers() {
  try {
    const User = require('./models/User');
    const registeredUsers = await User.find({}, '_id email username');
    
    // Map users and add online status from our connected users map
    return registeredUsers.map(user => {
      const userId = user._id.toString();
      const isConnected = connectedUsers[userId];
      
      return {
        userId: userId,
        username: user.username || `User-${userId.substring(0, 5)}`,
        email: user.email,
        isOnline: Boolean(isConnected),
        lastSeen: isConnected ? isConnected.lastSeen : null
      };
    });
  } catch (err) {
    console.error('Error fetching all users:', err);
    return [];
  }
};

// Socket.io Server for Chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // User registration/authentication
  socket.on('register_user', async (userData) => {
    const { userId, username } = userData;
    if (!userId) return;
    
    try {
      // Get user from database to ensure we have consistent data
      const User = require('./models/User');
      const user = await User.findById(userId);
      
      if (!user) {
        console.log(`User ${userId} not found in database`);
        return socket.emit('error', { message: 'User not found' });
      }
      
      const displayName = user.username || username || `User-${userId.substring(0, 5)}`;
      
      console.log(`User ${displayName} (${userId}) registered with socket ${socket.id}`);
      
      // Update user online status in database
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date()
      });
      
      // Store user data on socket for easy access
      socket.userId = userId;
      socket.username = displayName;
      
      // Add user to connected users map
      connectedUsers[userId] = {
        socketId: socket.id,
        username: displayName,
        isOnline: true,
        lastSeen: new Date()
      };
      
      // Broadcast user's online status to all clients
      io.emit('user_status_change', {
        userId: userId,
        username: displayName,
        isOnline: true,
        lastSeen: new Date()
      });
      
      // Send the entire user list to the newly connected user
      socket.emit('get_users_response', await getAllUsers());
    } catch (err) {
      console.error('Error registering user:', err);
      socket.emit('error', { message: 'Error registering with chat server' });
    }
  });
  
  // Handle new chat messages
  socket.on('send_message', async (messageData) => {
    console.log('Received send_message with data:', messageData);
    const { receiverId, content } = messageData;
    
    if (!socket.userId) {
      console.error('Message rejected: No socket.userId set');
      return socket.emit('error', { message: 'You must be authenticated to send messages' });
    }
    
    if (!receiverId) {
      console.error('Message rejected: No receiverId specified');
      return socket.emit('error', { message: 'No recipient specified' });
    }
    
    if (!content || !content.trim()) {
      console.error('Message rejected: Empty content');
      return socket.emit('error', { message: 'Message cannot be empty' });
    }
    
    try {
      console.log(`Sending message from ${socket.userId} (${socket.username}) to ${receiverId}`);
      
      // Create a new message in the database
      const newMessage = new Message({
        senderId: socket.userId,
        senderName: socket.username || 'Unknown User',
        receiverId,
        content: content.trim(),
        timestamp: new Date(),
        read: false
      });
      
      // Save to database
      const savedMessage = await newMessage.save();
      console.log('Message saved to database with ID:', savedMessage._id);
      
      // Format for sending over socket
      const messageForClient = {
        id: savedMessage._id.toString(),
        senderId: savedMessage.senderId,
        senderName: savedMessage.senderName,
        receiverId: savedMessage.receiverId,
        content: savedMessage.content,
        timestamp: savedMessage.timestamp.toISOString(),
        read: savedMessage.read
      };
      
      // Send to sender for immediate display
      console.log('Emitting new_message to sender:', socket.id);
      socket.emit('new_message', messageForClient);
      
      // Send to recipient if online
      const recipientSocket = connectedUsers[receiverId]?.socketId;
      if (recipientSocket) {
        console.log('Recipient is online, emitting to socket:', recipientSocket);
        io.to(recipientSocket).emit('new_message', messageForClient);
      } else {
        console.log('Recipient is offline, message will be delivered when they connect');
      }
      
      console.log(`Message saved and sent from ${socket.username} to ${receiverId}`);
      
      // Send confirmation to sender
      socket.emit('message_sent', { 
        id: savedMessage._id.toString(),
        receiverId,
        timestamp: savedMessage.timestamp.toISOString() 
      });
      
    } catch (err) {
      console.error('Error saving or sending message:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data;
    
    if (!socket.userId || !receiverId) return;
    
    const recipientSocket = connectedUsers[receiverId]?.socketId;
    if (recipientSocket) {
      io.to(recipientSocket).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping
      });
    }
  });
  
  // Get chat history with a specific user
  socket.on('get_chat_history', async ({ userId: otherUserId }, callback) => {
    console.log(`Getting chat history between ${socket.userId} and ${otherUserId}`);
    
    if (!socket.userId) {
      console.error('Chat history request rejected: No socket.userId set');
      return callback({ success: false, error: 'You must be authenticated', messages: [] });
    }
    
    if (!otherUserId) {
      console.error('Chat history request rejected: No otherUserId specified');
      return callback({ success: false, error: 'No conversation partner specified', messages: [] });
    }
    
    try {
      // Find messages between the current user and the other user
      const messages = await Message.find({
        $or: [
          { senderId: socket.userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: socket.userId }
        ]
      }).sort({ timestamp: 1 });
      
      console.log(`Found ${messages.length} messages between ${socket.userId} and ${otherUserId}`);
      
      // Mark messages as read
      const unreadMessages = messages.filter(msg => 
        msg.receiverId === socket.userId && !msg.read
      );
      
      if (unreadMessages.length > 0) {
        console.log(`Marking ${unreadMessages.length} messages as read`);
        await Message.updateMany(
          { 
            _id: { $in: unreadMessages.map(msg => msg._id) },
            receiverId: socket.userId,
            read: false
          },
          { $set: { read: true } }
        );
      }
      
      // Format messages for client
      const formattedMessages = messages.map(msg => ({
        id: msg._id.toString(),
        senderId: msg.senderId,
        senderName: msg.senderName,
        receiverId: msg.receiverId,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        read: msg.read || msg.receiverId === socket.userId // Mark as read if current user is the receiver
      }));
      
      callback({
        success: true,
        messages: formattedMessages
      });
      
      // If any messages were marked as read, notify the sender
      if (unreadMessages.length > 0) {
        const senderId = otherUserId;
        const senderSocketId = connectedUsers[senderId]?.socketId;
        
        if (senderSocketId) {
          console.log(`Notifying sender ${senderId} that messages were read`);
          io.to(senderSocketId).emit('messages_read', {
            conversationId: socket.userId,
            messageIds: unreadMessages.map(msg => msg._id.toString())
          });
        }
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
      callback({ success: false, error: 'Failed to load conversation history', messages: [] });
    }
  });
  
  // Get message history for a conversation
  socket.on('get_messages', async ({ userId, otherUserId }, callback) => {
    if (!userId || !otherUserId) {
      return callback({ success: false, error: 'Invalid user IDs' });
    }
    
    try {
      // Find messages between these two users from the database
      const messages = await Message.find({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      }).sort({ timestamp: 1 });
      
      // Format messages for the client
      const formattedMessages = messages.map(msg => ({
        id: msg._id.toString(),
        senderId: msg.senderId,
        senderName: msg.senderName,
        receiverId: msg.receiverId,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        read: msg.read
      }));
      
      callback({ success: true, messages: formattedMessages });
    } catch (err) {
      console.error('Error fetching messages:', err);
      callback({ success: false, error: 'Failed to load messages' });
    }
  });
  
  // Mark messages as read
  socket.on('mark_read', async ({ messageIds }) => {
    if (!Array.isArray(messageIds) || !socket.userId) return;
    
    try {
      // Update messages in database
      const result = await Message.updateMany(
        { 
          _id: { $in: messageIds },
          receiverId: socket.userId,
          read: false
        },
        { read: true }
      );
      
      console.log(`Marked ${result.modifiedCount} messages as read`);
      
      // Find the updated messages to get their senders
      const updatedMessages = await Message.find({ _id: { $in: messageIds } });
      
      // Notify senders their messages were read
      for (const message of updatedMessages) {
        const senderSocket = connectedUsers[message.senderId]?.socketId;
        if (senderSocket) {
          io.to(senderSocket).emit('message_read', { messageId: message._id.toString() });
        }
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  });
  
  // Get all users
  socket.on('get_users', async (_, callback) => {
    try {
      const usersList = await getAllUsers();
      callback({ success: true, users: usersList });
    } catch (err) {
      console.error('Error fetching users:', err);
      callback({ success: false, error: 'Failed to fetch users' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.userId) {
      if (connectedUsers[socket.userId]) {
        connectedUsers[socket.userId].isOnline = false;
        connectedUsers[socket.userId].lastSeen = new Date();
      }
      
      // Broadcast user status update
      io.emit('user_status_change', {
        userId: socket.userId,
        isOnline: false,
        lastSeen: new Date()
      });
      
      console.log(`User ${socket.username} (${socket.userId}) disconnected`);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };