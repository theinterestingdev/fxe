import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// API URL for backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create the Chat Context
const ChatContext = createContext({
  isConnected: false,
  onlineUsers: [],
  allUsers: [],
  conversations: {},
  activeConversation: null,
  messages: [],
  typingUsers: {},
  sendMessage: () => {},
  setActiveConversation: () => {},
  setTypingStatus: () => {}
});

// Chat context provider
export const ChatProvider = ({ children }) => {
  // Auth context
  const { userId, username, isLoggedIn } = useAuth();
  
  // Socket state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Chat state
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [conversations, setConversations] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [notifications, setNotifications] = useState([]);
  
  // Track if we've already registered
  const hasRegistered = useRef(false);

  // Connect to socket server and register user
  useEffect(() => {
    if (!isLoggedIn || !userId) {
      console.log('ChatContext: Not logged in or missing userId, not connecting');
      return;
    }
    
    console.log(`ChatContext: Connecting to socket server with userId ${userId}`);
    
    // Create new socket connection
    const newSocket = io(API_URL, {
      withCredentials: true,
    });
    
    newSocket.on('connect', () => {
      console.log('ChatContext: Connected to socket.io server, socket id:', newSocket.id);
      
      // Register user with socket server
      const userInfo = {
        userId,
        username: username || `User-${userId.substring(0, 5)}`
      };
      
      console.log('ChatContext: Registering user with socket server:', userInfo);
      newSocket.emit('register_user', userInfo);
      
      setIsConnected(true);
      setSocket(newSocket);
      
      // Request list of all users
      newSocket.emit('get_users', null, (response) => {
        if (response && response.success) {
          console.log('ChatContext: Received users list:', response.users.length);
          setAllUsers(response.users || []);
          setOnlineUsers(response.users.filter(user => user.isOnline).map(user => user.userId) || []);
        }
      });
      
      // Load conversation previews
      newSocket.emit('get_conversation_previews', null, (response) => {
        if (response && response.success) {
          console.log('ChatContext: Received conversation previews:', response.conversations);
          
          // Transform conversations data to include last message preview
          const conversationsWithPreviews = {};
          
          response.conversations.forEach(convo => {
            conversationsWithPreviews[convo.userId] = {
              userId: convo.userId,
              username: convo.username,
              lastMessage: convo.lastMessage,
              lastMessageTime: convo.lastMessageTime,
              unreadCount: convo.unreadCount || 0
            };
          });
          
          setConversations(conversationsWithPreviews);
        }
      });
      
      hasRegistered.current = true;
    });
    
    newSocket.on('disconnect', () => {
      console.log('ChatContext: Disconnected from socket server');
      setIsConnected(false);
    });
    
    return () => {
      console.log('ChatContext: Cleaning up socket connection');
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isLoggedIn, userId, username]);
  
  // Setup socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // User status updates
    const handleUsersStatus = (users) => {
      setAllUsers(users);
      setOnlineUsers(users.filter(user => user.isOnline).map(user => user.userId));
    };
    
    // Single user status change
    const handleUserStatusChange = (userData) => {
      console.log('ChatContext: User status changed:', userData);
      
      // Update online users list
      if (userData.isOnline) {
        setOnlineUsers(prev => {
          if (prev.includes(userData.userId)) return prev;
          return [...prev, userData.userId];
        });
      } else {
        setOnlineUsers(prev => prev.filter(id => id !== userData.userId));
      }
      
      // Update all users list
      setAllUsers(prev => {
        const userIndex = prev.findIndex(user => user.userId === userData.userId);
        
        if (userIndex === -1) return [...prev, userData];
        
        const updatedUsers = [...prev];
        updatedUsers[userIndex] = {
          ...updatedUsers[userIndex],
          ...userData
        };
        
        return updatedUsers;
      });
    };
    
    // Handle new messages
    const handleNewMessage = (message) => {
      console.log('ChatContext: New message received', message);
      
      if (!message || !message.id) {
        console.error('Invalid message received:', message);
        return;
      }
      
      // Determine the other party in the conversation
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      console.log(`Message between ${userId} and ${otherUserId}`);
      
      // Add to messages if conversation is active
      if (activeConversation === message.senderId || activeConversation === message.receiverId) {
        console.log('Adding message to active conversation');
        setMessages(prev => {
          // Check if we already have this message to avoid duplicates
          if (prev.some(msg => msg.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
        
        // Mark message as read if it was sent to us and we're viewing the conversation
        if (message.receiverId === userId && message.senderId === activeConversation) {
          markMessagesAsRead([message.id]);
        }
      } else {
        console.log('Message not for active conversation');
        
        // Create notification for new message if it was sent to us
        if (message.receiverId === userId) {
          // Find sender's username
          const sender = allUsers.find(user => user.userId === message.senderId);
          const senderName = sender?.username || message.senderName || `User-${message.senderId.substring(0, 5)}`;
          
          // Create new notification
          const newNotification = {
            id: `msg-${Date.now()}`,
            type: 'message',
            senderId: message.senderId,
            senderName: senderName,
            text: message.content,
            timestamp: message.timestamp || new Date().toISOString(),
            read: false
          };
          
          // Add to notifications
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`New message from ${senderName}`, {
              body: message.content,
              icon: '/favicon.ico'
            });
          }
        }
      }
      
      // Update conversation list with latest message
      setConversations(prev => {
        // Only increment unread count if we received the message and conversation isn't active
        const isMessageForMe = message.receiverId === userId;
        const shouldIncrement = isMessageForMe && activeConversation !== message.senderId;
        
        const existingConvo = prev[otherUserId] || {};
        const newUnreadCount = shouldIncrement ? (existingConvo.unreadCount || 0) + 1 : (existingConvo.unreadCount || 0);
        
        console.log(`Updating conversation with ${otherUserId}, unread: ${newUnreadCount}`);
        
        return {
          ...prev,
          [otherUserId]: {
            userId: otherUserId,
            username: message.senderName || existingConvo.username || `User-${otherUserId.substring(0, 5)}`,
            lastMessage: message.content, // Renamed from latestMessage for consistency
            lastMessageTime: message.timestamp, // Renamed from timestamp for clarity
            unreadCount: newUnreadCount
          }
        };
      });
    };
    
    // Handle typing status
    const handleTypingStatus = (data) => {
      const { userId: typingUserId, isTyping } = data;
      
      setTypingUsers(prev => ({
        ...prev,
        [typingUserId]: isTyping
      }));
      
      // Clear typing status after 3 seconds if no updates
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [typingUserId]: false
          }));
        }, 3000);
      }
    };
    
    // Handle message read receipts
    const handleMessageRead = (data) => {
      const { conversationId, messageIds } = data;
      
      // Update read status for these messages
      setMessages(prev => prev.map(msg => {
        if (messageIds.includes(msg.id)) {
          return { ...msg, read: true };
        }
        return msg;
      }));
    };
    
    // Register event handlers
    socket.on('users_status', handleUsersStatus);
    socket.on('user_status_change', handleUserStatusChange);
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTypingStatus);
    socket.on('messages_read', handleMessageRead);
    
    // Cleanup event handlers
    return () => {
      socket.off('users_status', handleUsersStatus);
      socket.off('user_status_change', handleUserStatusChange);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTypingStatus);
      socket.off('messages_read', handleMessageRead);
      console.log('ChatContext: Cleaned up event listeners');
    };
  }, [socket, isConnected, userId, activeConversation]);
  
  // Load messages when a conversation is selected
  useEffect(() => {
    setMessages([]);
    
    if (!socket || !isConnected || !activeConversation || !userId) return;
    
    console.log(`ChatContext: Loading messages for conversation with ${activeConversation}`);
    
    // Fetch chat history for this conversation
    socket.emit('get_chat_history', { userId: activeConversation }, (response) => {
      console.log('Received chat history:', response);
      
      if (response.success) {
        setMessages(response.messages || []);
        
        // Find unread messages in this conversation
        const unreadMessages = (response.messages || [])
          .filter(msg => !msg.read && msg.senderId === activeConversation)
          .map(msg => msg.id);
          
        if (unreadMessages.length > 0) {
          markMessagesAsRead(unreadMessages);
        }
        
        // Reset unread count for this conversation
        setConversations(prev => {
          if (!prev[activeConversation]) return prev;
          
          return {
            ...prev,
            [activeConversation]: {
              ...prev[activeConversation],
              unreadCount: 0
            }
          };
        });
      } else {
        console.error('Failed to load chat history:', response.error);
      }
    });
  }, [socket, isConnected, userId, activeConversation]);
  
  // Send a message to another user
  const sendMessage = (content) => {
    if (!socket || !isConnected || !activeConversation || !content.trim()) return;
    
    console.log('Sending message to:', activeConversation);
    
    socket.emit('send_message', {
      receiverId: activeConversation,
      content: content.trim()
    });
    
    // Clear typing status
    setTypingStatus(false);
  };

  // Mark messages as read
  const markMessagesAsRead = (messageIds) => {
    if (!socket || !isConnected || !messageIds.length) return;
    
    socket.emit('mark_read', { messageIds });
  };

  // Send typing status
  const setTypingStatus = (isTyping) => {
    if (!socket || !isConnected || !activeConversation) return;
    
    socket.emit('typing', {
      receiverId: activeConversation,
      isTyping
    });
  };

  return (
    <ChatContext.Provider value={{
      isConnected,
      allUsers,
      onlineUsers,
      conversations,
      activeConversation,
      setActiveConversation,
      messages,
      sendMessage,
      typingUsers,
      setTypingStatus,
      notifications,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = () => useContext(ChatContext);