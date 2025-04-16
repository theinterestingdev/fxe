import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { checkProfileExists } from "../api/api";
import { motion } from "framer-motion";
import { 
  Bell, MessageCircle, User, X, BarChart2, Briefcase, Users, 
  Code, PenTool, FileText, TrendingUp, Settings, Award,
  Calendar, CheckCircle, Shield, ArrowLeft
} from "lucide-react";
import DirectChat from "./DirectChat";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userEmail, userId, isLoading, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [userProfiles, setUserProfiles] = useState([]);
  const [chats, setChats] = useState([]);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});

  // Derive username only after userEmail is available
  const username = userEmail ? userEmail.split("@")[0] : "User";

  // Add this new state for recent activities
  const [recentActivities, setRecentActivities] = useState([
    {
      id: 'default-1',
      type: 'project',
      title: 'New Project Request',
      description: 'Mobile App Redesign from TechStream Inc.',
      time: new Date(Date.now() - 30 * 60000), // 30 minutes ago
      icon: <Briefcase size={18} className="text-blue-400" />,
      iconBg: 'bg-blue-500/20',
      textColor: 'text-blue-300'
    },
    {
      id: 'default-2',
      type: 'completion',
      title: 'Project Completed',
      description: 'E-commerce Website for Fashion Boutique',
      time: new Date(Date.now() - 24 * 60 * 60000), // yesterday
      icon: <CheckCircle size={18} className="text-green-400" />,
      iconBg: 'bg-green-500/20',
      textColor: 'text-green-300'
    }
  ]);

  
  const fetchUserProfiles = useCallback(async () => {
    try {
      console.log('Dashboard: Fetching user profiles');
      
      
      let response;
      let data = [];
      
      
      try {
        response = await fetch('http://localhost:5000/api/profile/all', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          data = await response.json();
          console.log('Dashboard: Fetched profiles from profile API:', data.length);
        }
      } catch (error) {
        console.log('Dashboard: First profile fetch attempt failed:', error.message);
      }
      
      
      if (data.length === 0) {
        try {
          response = await fetch('http://localhost:5000/api/users', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            data = await response.json();
            console.log('Dashboard: Fetched profiles from users API:', data.length);
          }
        } catch (error) {
          console.log('Dashboard: Second profile fetch attempt failed:', error.message);
        }
      }
      
      
      if (data.length === 0 && socket && socket.connected) {
        console.log('Dashboard: Requesting user list from socket');
        socket.emit('getUsersList');
        return;
      }
      
      
      if (data.length > 0) {
        console.log('Dashboard: Processing fetched user data:', data);
        
        
        const otherUsers = data
          .filter(profile => {
            const profileId = profile.userId || profile._id;
            return profileId !== userId;
          })
          .map(profile => {
            const profileId = profile.userId || profile._id;
    return {
              id: profileId,
              name: profile.name || profile.username || (profile.email ? profile.email.split('@')[0] : `User-${profileId.substring(0, 5)}`),
              avatar: profile.avatar || profile.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name || profileId}`,
              lastMessage: '',
              timestamp: new Date(),
              unread: 0
    };
  });

        console.log('Dashboard: Processed user profiles:', otherUsers.length);
        setUserProfiles(data);
        setChats(otherUsers);
        
        
        if (socket && socket.connected) {
          socket.emit('getChatHistory', userId);
        }
      } else {
        console.warn('Dashboard: No user profiles found through API endpoints');
        
        if (socket && socket.connected) {
          socket.emit('getUsersList');
        }
      }
    } catch (error) {
      console.error('Dashboard: Error in fetchUserProfiles:', error);
      setError('Failed to load contacts. Please try again later.');
      
      
      if (socket && socket.connected) {
        socket.emit('getUsersList');
      }
    }
  }, [userId, socket]);

  
  useEffect(() => {
    if (!socket) return;

    console.log('Dashboard: Setting up socket event listeners');
    
    
    if (socket.connected) {
      console.log('Dashboard: Socket already connected, fetching data');
      fetchUserProfiles();
    }
    
    
    const handleConnect = () => {
      console.log('Dashboard: Socket connected');
      socket.emit('registerUser', {
        userId,
        username: userEmail ? userEmail.split('@')[0] : `User-${userId.substring(0, 5)}`,
        name: username || userEmail?.split('@')[0],
        email: userEmail
      });
      fetchUserProfiles();

      
      socket.emit('getNotifications', userId);
    };
    
    const handleUserStatus = (data) => {
      if (data.userId && data.isOnline !== undefined) {
        setOnlineUsers(prev => ({
          ...prev,
          [data.userId]: data.isOnline
        }));
      }
    };

    const handleInitialUsers = (users) => {
      setOnlineUsers(users);
    };
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', () => console.log('Dashboard: Socket disconnected'));
    socket.on('userStatusUpdate', handleUserStatus);
    socket.on('initialOnlineUsers', handleInitialUsers);

    
    socket.on('notification', (notification) => {
      if (notification.recipientId === userId || notification.recipient === userId) {
        console.log('Dashboard: Received notification:', notification);
        
        const formattedNotification = {
          id: notification.id || notification._id || Date.now().toString(),
          from: notification.from || notification.senderName || 'System',
          content: notification.content || notification.message || notification.text || 'New notification',
          timestamp: notification.timestamp || notification.createdAt || new Date(),
          type: notification.type || 'general',
          read: notification.read || false,
          senderId: notification.senderId || notification.sender || null
        };
        
        setNotifications(prev => [formattedNotification, ...prev.filter(n => n.id !== formattedNotification.id)]);
        if (!formattedNotification.read) {
          setUnreadNotifications(prev => prev + 1);
        }
        
        
        if (!formattedNotification.read) {
          const newActivity = {
            id: `activity-${formattedNotification.id}`,
            type: formattedNotification.type === 'message' ? 'message' : 'notification',
            title: formattedNotification.type === 'message' ? 'New Message' : formattedNotification.from,
            description: formattedNotification.content,
            time: new Date(formattedNotification.timestamp),
            icon: formattedNotification.type === 'message' 
              ? <MessageCircle size={18} className="text-orange-400" />
              : <Bell size={18} className="text-blue-400" />,
            iconBg: formattedNotification.type === 'message' ? 'bg-orange-500/20' : 'bg-blue-500/20',
            textColor: formattedNotification.type === 'message' ? 'text-orange-300' : 'text-blue-300'
          };
          
          setRecentActivities(prev => [newActivity, ...prev.slice(0, 4)]); // Keep last 5 activities
        }
      }
    });

    
    socket.on('notifications', (notifications) => {
      if (notifications && Array.isArray(notifications)) {
        console.log('Dashboard: Received notifications list:', notifications);
        
        const formattedNotifications = notifications.map(notification => ({
          id: notification.id || notification._id || Date.now().toString(),
          from: notification.from || notification.senderName || 'System',
          content: notification.content || notification.message || notification.text || 'New notification',
          timestamp: notification.timestamp || notification.createdAt || new Date(),
          type: notification.type || 'general',
          read: notification.read || false,
          senderId: notification.senderId || notification.sender || null
        }));
        
        setNotifications(formattedNotifications);
        setUnreadNotifications(formattedNotifications.filter(n => !n.read).length);
      }
    });

    
    socket.on('usersList', (users) => {
      console.log('Dashboard: Received usersList from socket:', users);
      
      
      const filteredUsers = users
        .filter(user => user._id !== userId)
        .map(user => ({
          id: user._id,
          name: user.username || user.name || (user.email ? user.email.split('@')[0] : `User-${user._id.substring(0, 5)}`),
          username: user.username || '',
          avatar: user.profileImage || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user._id}`,
          lastMessage: '',
          timestamp: new Date(),
          unread: 0
        }));
      
      console.log('Dashboard: Processed users from socket:', filteredUsers.length);
      
      
      if (chats.length === 0) {
        setChats(filteredUsers);
      }
    });

    
    socket.on('chatHistory', (history) => {
      console.log('Dashboard: Received chat history:', history);
      
      if (!history || !history.conversations) return;
      
      
      setChats(prevChats => {
        const updatedChats = [...prevChats];
        
        
        history.conversations.forEach(conversation => {
          const partnerId = conversation.partnerId;
          if (!partnerId) return;
          
        
          const chatIndex = updatedChats.findIndex(c => c.id === partnerId);
          
          if (chatIndex >= 0) {
            
            const messages = conversation.messages || [];
            if (messages.length > 0) {
              const lastMsg = messages[messages.length - 1];
              updatedChats[chatIndex] = {
                ...updatedChats[chatIndex],
                lastMessage: lastMsg.text || '',
                timestamp: new Date(lastMsg.timestamp),
                
                unread: messages.filter(m => 
                  m.receiver === userId && 
                  m.sender === partnerId && 
                  !m.read
                ).length
              };
            }
          } else {
            // Chat doesn't exist, try to create it with basic info
            const partnerProfile = userProfiles.find(p => p.id === partnerId);
            if (partnerProfile) {
              const messages = conversation.messages || [];
              const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
              updatedChats.push({
                id: partnerId,
                name: partnerProfile.name || 
                      partnerProfile.username || 
                      (partnerProfile.email ? partnerProfile.email.split('@')[0] : 'User'),
                avatar: partnerProfile.avatar || 
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerProfile.name || partnerId}`,
                lastMessage: lastMsg ? lastMsg.text : '',
                timestamp: lastMsg ? new Date(lastMsg.timestamp) : new Date(),
                unread: messages.filter(m => 
                  m.receiver === userId && 
                  m.sender === partnerId && 
                  !m.read
                ).length
              });
            }
          }
        });
        
        // Recalculate total unread messages
        const totalUnread = updatedChats.reduce((total, chat) => total + chat.unread, 0);
        setUnreadMessages(totalUnread);
        
        return updatedChats;
      });
    });

    // Listen for private messages
    socket.on('receivePrivateMessage', (message) => {
      console.log('Dashboard: Received private message:', message);
      
      // Only process if we're the sender or receiver
      if (message.receiver === userId || message.sender === userId) {
        // Get the partner ID (the other person in the conversation)
        const partnerId = message.sender === userId ? message.receiver : message.sender;
        
        // Update the chat list
        setChats(prevChats => {
          // Find the chat
          const chatIndex = prevChats.findIndex(c => c.id === partnerId);
          
          // Deep copy for immutability
          const updatedChats = [...prevChats];
          
          if (chatIndex >= 0) {
            // Chat exists, update it
            const isUnread = message.receiver === userId && !message.read;
            updatedChats[chatIndex] = {
              ...updatedChats[chatIndex],
              lastMessage: message.text,
              timestamp: new Date(message.timestamp),
              // Only increment unread if we're the receiver and message isn't read
              unread: isUnread ? updatedChats[chatIndex].unread + 1 : updatedChats[chatIndex].unread
            };
            
            // Add to recent activities if we're the receiver and it's unread
            if (isUnread) {
              const senderProfile = userProfiles.find(p => p.id === partnerId);
              const senderName = senderProfile?.name || 
                    senderProfile?.username || 
                    (senderProfile?.email ? senderProfile.email.split('@')[0] : 'User');
                    
              const newActivity = {
                id: `activity-msg-${Date.now()}`,
                type: 'message',
                title: `New Message from ${senderName}`,
                description: message.text,
                time: new Date(message.timestamp),
                icon: <MessageCircle size={18} className="text-orange-400" />,
                iconBg: 'bg-orange-500/20',
                textColor: 'text-orange-300'
              };
              
              setRecentActivities(prev => [newActivity, ...prev.slice(0, 4)]); // Keep last 5 activities
            }
          } else {
            // Chat doesn't exist, create it
            const partnerProfile = userProfiles.find(p => p.id === partnerId);
            if (partnerProfile) {
              updatedChats.push({
                id: partnerId,
                name: partnerProfile.name || 
                      partnerProfile.username || 
                      (partnerProfile.email ? partnerProfile.email.split('@')[0] : 'User'),
                avatar: partnerProfile.avatar || 
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerProfile.name || partnerId}`,
                lastMessage: message.text,
                timestamp: new Date(message.timestamp),
                unread: message.receiver === userId && !message.read ? 1 : 0
              });
            }
          }
          
          // Recalculate total unread
          const totalUnread = updatedChats.reduce((total, chat) => total + chat.unread, 0);
          setUnreadMessages(totalUnread);
          
          return updatedChats;
        });
      }
    });

    // Also listen for direct_message events
    socket.on('direct_message', (message) => {
      console.log('Dashboard: Received direct_message:', message);
      
      // Only process if we're the sender or receiver
      if (message.recipientId === userId || message.senderId === userId) {
        // Get the partner ID (the other person in the conversation)
        const partnerId = message.senderId === userId ? message.recipientId : message.senderId;
        
        // Update the chat list
        setChats(prevChats => {
          // Find the chat
          const chatIndex = prevChats.findIndex(c => c.id === partnerId);
          
          // Deep copy for immutability
          const updatedChats = [...prevChats];
          
          if (chatIndex >= 0) {
            // Chat exists, update it
            const isUnread = message.recipientId === userId;
            updatedChats[chatIndex] = {
              ...updatedChats[chatIndex],
              lastMessage: message.content,
              timestamp: new Date(message.timestamp),
              // Only increment unread if we're the receiver
              unread: isUnread ? updatedChats[chatIndex].unread + 1 : updatedChats[chatIndex].unread
            };
            
            // Add to recent activities if we're the receiver
            if (isUnread) {
              const senderProfile = userProfiles.find(p => p.id === partnerId);
              const senderName = senderProfile?.name || 
                    senderProfile?.username || 
                    (senderProfile?.email ? senderProfile.email.split('@')[0] : 'User');
                    
              const newActivity = {
                id: `activity-dm-${Date.now()}`,
                type: 'message',
                title: `New Message from ${senderName}`,
                description: message.content,
                time: new Date(message.timestamp),
                icon: <MessageCircle size={18} className="text-orange-400" />,
                iconBg: 'bg-orange-500/20',
                textColor: 'text-orange-300'
              };
              
              setRecentActivities(prev => [newActivity, ...prev.slice(0, 4)]); // Keep last 5 activities
            }
          } else {
            // Chat doesn't exist, create it
            const partnerProfile = userProfiles.find(p => p.id === partnerId);
            if (partnerProfile) {
              updatedChats.push({
                id: partnerId,
                name: partnerProfile.name || 
                      partnerProfile.username || 
                      (partnerProfile.email ? partnerProfile.email.split('@')[0] : 'User'),
                avatar: partnerProfile.avatar || 
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerProfile.name || partnerId}`,
                lastMessage: message.content,
                timestamp: new Date(message.timestamp),
                unread: message.recipientId === userId ? 1 : 0
              });
            }
          }
          
          // Recalculate total unread
          const totalUnread = updatedChats.reduce((total, chat) => total + chat.unread, 0);
          setUnreadMessages(totalUnread);
          
          return updatedChats;
        });
      }
    });

    return () => {
      console.log('Dashboard: Cleaning up socket listeners');
      socket.off('connect', handleConnect);
      socket.off('userStatusUpdate', handleUserStatus);
      socket.off('initialOnlineUsers', handleInitialUsers);
      socket.off('notification');
      socket.off('notifications');
      socket.off('usersList');
      socket.off('receivePrivateMessage');
      socket.off('direct_message');
      socket.off('chatHistory');
    };
  }, [socket, userId, userProfiles, fetchUserProfiles]);

  // Fetch user profiles when component mounts
  useEffect(() => {
    if (userId) {
      fetchUserProfiles();
    }
  }, [userId, fetchUserProfiles]);

  // Mark all messages as read when clicking on a chat
  useEffect(() => {
    if (selectedChat) {
      console.log(`Dashboard: Selected chat ${selectedChat}, marking messages as read`);
    
    // Update local state
      setChats(prevChats => {
        const updatedChats = prevChats.map(chat => 
          chat.id === selectedChat ? {...chat, unread: 0} : chat
        );
        
        // Recalculate unread counts
        const updatedUnreadCount = updatedChats.reduce((total, chat) => total + chat.unread, 0);
        setUnreadMessages(updatedUnreadCount);
        
        return updatedChats;
      });
    }
  }, [selectedChat]);

  // Function to format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffMs = now - messageDate;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHrs = Math.round(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    
    return messageDate.toLocaleDateString();
  };
  
  // Mark notification as read
  const markNotificationAsRead = (notification) => {
    // Mark notification as read locally
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    );
    
    // Update unread count
    setUnreadNotifications(prev => Math.max(0, prev - 1));
    
    // Send read status to server if socket is connected
    if (socket) {
      socket.emit('markNotificationRead', { notificationId: notification.id });
    }
    
    // Navigate based on notification type
    if (notification.type === "message") {
      const chatId = notification.senderId;
      if (chatId) {
        setSelectedChat(chatId);
        setShowNotifications(false);
        setShowMessages(true);
      }
    }
  };
  
  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    // Mark all as read locally
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadNotifications(0);
    
    // Send to server if socket is connected
    if (socket) {
      socket.emit('markAllNotificationsAsRead', { userId });
    }
  };

  useEffect(() => {
    const checkProfile = async () => {
      try {
        // Wait for AuthProvider to finish loading
        if (isLoading) return;

        // Redirect if not logged in
        if (!isLoggedIn) {
          navigate("/signin");
          return;
        }

        // Check if profile exists
        const profileResponse = await checkProfileExists();
        if (!profileResponse.exists) {
          navigate("/profile-setup");
        } else {
          setLoading(false); // Profile exists, stop loading
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        navigate("/signin");
      }
    };

    checkProfile();
  }, [isLoggedIn, isLoading, navigate]);

  
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-light">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Find the selected chat details
  const selectedChatDetails = chats.find(chat => chat.id === selectedChat);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden">
      <div className="container mx-auto px-4 py-8">
        {/* Messages Panel */}
        <motion.div
          className={`${selectedChat ? 'h-[600px]' : 'h-[400px]'} bg-gray-800/50 backdrop-blur-sm rounded-xl mb-8 shadow-lg overflow-hidden border border-gray-700/50`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="h-full flex flex-col">
            <div className="bg-gray-800/80 p-4 border-b border-gray-700/50 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-blue-300 flex items-center">
                <MessageCircle size={20} className="mr-2" />
                Messages
              </h3>
              {selectedChat && (
                <button
                  onClick={() => setSelectedChat(null)}
                  className="flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={18} className="mr-1" />
                  Back
                </button>
              )}
            </div>
            {!selectedChat ? (
              // Chat list view
              <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
                {chats.length > 0 ? (
                  chats.map(chat => (
                    <div 
                      key={chat.id} 
                      className={`flex items-center p-3 border-b border-gray-700/30 hover:bg-gray-700/50 cursor-pointer transition-colors ${chat.unread > 0 ? 'bg-gray-700/30' : ''}`}
                      onClick={() => setSelectedChat(chat.id)}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3 shadow-md">
                        <img 
                          src={chat.avatar} 
                          alt={chat.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-blue-300 truncate">{chat.name}</h4>
                          <span className="text-xs text-gray-400">{formatTime(chat.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-300 truncate">
                          {chat.lastMessage || 'Start a conversation'}
                        </p>
                      </div>
                      {chat.unread > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    <MessageCircle size={24} className="mx-auto mb-2 text-gray-500" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start chatting with users from the Community page</p>
                  </div>
                )}
                
                {error && (
                  <div className="p-4 text-center text-red-400 bg-red-500/10 border-t border-red-500/20">
                    <p>{error}</p>
                    <button 
                      onClick={fetchUserProfiles}
                      className="mt-2 text-sm text-red-300 hover:text-red-200"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Chat conversation view with DirectChat component
              <div className="h-full flex flex-col">
                <DirectChat 
                  socket={socket}
                  userId={userId}
                  recipientId={selectedChat}
                  recipientName={selectedChatDetails?.name || 'User'}
                  recipientAvatar={selectedChatDetails?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChatDetails?.name || selectedChat}`}
                  isOnline={onlineUsers[selectedChat] || false}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats overview */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 backdrop-blur-sm rounded-xl p-5 border border-blue-500/30 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Active Projects</p>
                <h4 className="text-2xl md:text-3xl font-bold text-white mt-1">12</h4>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Briefcase size={22} className="text-blue-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-xs text-blue-300">
              <TrendingUp size={14} className="mr-1" />
              <span>18% increase this month</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-500/10 backdrop-blur-sm rounded-xl p-5 border border-purple-500/30 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <h4 className="text-2xl md:text-3xl font-bold text-white mt-1">$24,850</h4>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <TrendingUp size={22} className="text-purple-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-xs text-purple-300">
              <Calendar size={14} className="mr-1" />
              <span>Updated today at 2:45 PM</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-green-500/10 backdrop-blur-sm rounded-xl p-5 border border-green-500/30 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Client Reviews</p>
                <h4 className="text-2xl md:text-3xl font-bold text-white mt-1">4.9/5</h4>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle size={22} className="text-green-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-xs text-green-300">
              <span>Based on 47 reviews</span>
            </div>
          </div>
        </motion.div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column - Quick actions and skills */}
          <div className="lg:col-span-4">
            {/* Quick Actions */}
            <motion.div
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50 mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-blue-300 flex items-center">
                <BarChart2 size={20} className="mr-2" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 gap-3">
              {/* Profile Card */}
              <div
                  className="bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm rounded-xl p-5 cursor-pointer hover:bg-gray-700/60 hover:shadow-xl transition-all duration-300 border border-gray-700/30 group"
                onClick={() => navigate("/profile")}
              >
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-500/20 mr-4 flex-shrink-0">
                      <User size={24} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold group-hover:text-blue-300 transition-colors">Profile</h3>
                      <p className="text-sm text-gray-300 mt-1">
                        Update your profile
                      </p>
                    </div>
                  </div>
              </div>

              {/* Projects Card */}
              <div
                  className="bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm rounded-xl p-5 cursor-pointer hover:bg-gray-700/60 hover:shadow-xl transition-all duration-300 border border-gray-700/30 group"
                onClick={() => navigate("/projects")}
              >
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-purple-500/20 mr-4 flex-shrink-0">
                      <Briefcase size={24} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold group-hover:text-purple-300 transition-colors">Projects</h3>
                      <p className="text-sm text-gray-300 mt-1">
                        Manage your projects
                      </p>
                    </div>
                  </div>
              </div>

                {/* Messages Card */}
              <div
                  className="bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm rounded-xl p-5 cursor-pointer hover:bg-gray-700/60 hover:shadow-xl transition-all duration-300 border border-gray-700/30 group"
                onClick={() => {
                  setShowMessages(true);
                  setShowNotifications(false);
                }}
              >
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-green-500/20 mr-4 flex-shrink-0">
                      <MessageCircle size={24} className="text-green-400 group-hover:text-green-300 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold group-hover:text-green-300 transition-colors">Messages</h3>
                      <p className="text-sm text-gray-300 mt-1">
                        Chat with clients
                      </p>
                    </div>
                {unreadMessages > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                    {unreadMessages}
                  </span>
                )}
                  </div>
              </div>

              {/* Community Card */}
              <div
                  className="bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm rounded-xl p-5 cursor-pointer hover:bg-gray-700/60 hover:shadow-xl transition-all duration-300 border border-gray-700/30 group"
                onClick={() => navigate("/community")}
              >
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-orange-500/20 mr-4 flex-shrink-0">
                      <Users size={24} className="text-orange-400 group-hover:text-orange-300 transition-colors" />
              </div>
                    <div>
                      <h3 className="text-lg font-bold group-hover:text-orange-300 transition-colors">Community</h3>
                      <p className="text-sm text-gray-300 mt-1">
                        Connect with others
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Skills Section */}
            <motion.div
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center text-blue-300">
                <Award size={20} className="mr-2" />
                Your Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center shadow-lg">
                  <Code size={14} className="mr-1" />
                  Web Development
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-1 rounded-full text-sm flex items-center shadow-lg">
                  <PenTool size={14} className="mr-1" />
                  Graphic Design
                </div>
                <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center shadow-lg">
                  <FileText size={14} className="mr-1" />
                  Content Writing
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right column - Activity and projects */}
          <div className="lg:col-span-8">
            {/* Recent Activity */}
            <motion.div
              className="mb-6 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h3 className="text-xl font-semibold mb-5 flex items-center text-blue-300">
                <TrendingUp size={20} className="mr-2" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map(activity => (
                    <div key={activity.id} className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700/30 shadow-md">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full ${activity.iconBg} flex items-center justify-center mr-3 flex-shrink-0`}>
                          {activity.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex justify-between">
                            <p className={`font-medium ${activity.textColor}`}>{activity.title}</p>
                            <p className="text-xs text-gray-500">{formatTime(activity.time)}</p>
                          </div>
                          <p className="text-gray-400 text-sm mt-1">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    No recent activity to display
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recommended Projects */}
            <motion.div
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-semibold flex items-center text-blue-300">
                  <Settings size={20} className="mr-2" />
                  Recommended Projects
                </h3>
                <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  View all
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-gradient-to-br from-gray-800 to-gray-700/70 rounded-xl p-5 border border-gray-700/30 shadow-lg group hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-blue-300 group-hover:text-blue-200 transition-colors">Mobile App Development</h4>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs flex-shrink-0 ml-2">Premium</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">Design and develop a cross-platform mobile app for a fitness tracking service with real-time analytics.</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-blue-400">$8,500</span>
                    <button className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg text-sm shadow-lg transition-all duration-300">
                      View Details
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-700/70 rounded-xl p-5 border border-gray-700/30 shadow-lg group hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-purple-300 group-hover:text-purple-200 transition-colors">UI/UX Design System</h4>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs flex-shrink-0 ml-2">Featured</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">Create a comprehensive design system for a fintech company including component library and style guidelines.</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-purple-400">$4,200</span>
                    <button className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg text-sm shadow-lg transition-all duration-300">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-blue-300 flex items-center">
                <Bell size={20} className="mr-2" />
                Notifications
              </h3>
              <div className="flex items-center space-x-3">
                {unreadNotifications > 0 && (
                  <button 
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-gray-400 hover:text-blue-300 transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors ${!notification.read ? 'bg-gray-700/20' : ''}`}
                    onClick={() => markNotificationAsRead(notification)}
                  >
                    <div className="flex items-start">
                      <div className={`w-10 h-10 rounded-full ${notification.type === 'message' ? 'bg-orange-500/20' : 'bg-blue-500/20'} flex items-center justify-center mr-3 flex-shrink-0`}>
                        {notification.type === 'message' ? 
                          <MessageCircle size={18} className="text-orange-400" /> : 
                          <Bell size={18} className="text-blue-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <h4 className={`font-medium ${notification.type === 'message' ? 'text-orange-300' : 'text-blue-300'}`}>
                            {notification.from}
                          </h4>
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">
                          {notification.content}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-red-500 rounded-full ml-2 mt-2"></span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-400">
                  <Bell size={24} className="mx-auto mb-2 text-gray-500" />
                  <p>No notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Updated Messages Panel - floating panel for direct messages */}
      {showMessages && !selectedChat && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-blue-300 flex items-center">
                <MessageCircle size={20} className="mr-2" />
                Messages
              </h3>
              <button 
                onClick={() => setShowMessages(false)}
                className="p-1 hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {chats.length > 0 ? (
                chats.map(chat => (
                  <div 
                    key={chat.id} 
                    className={`flex items-center p-3 border-b border-gray-700/30 hover:bg-gray-700/50 cursor-pointer transition-colors ${chat.unread > 0 ? 'bg-gray-700/30' : ''}`}
                    onClick={() => {
                      setSelectedChat(chat.id);
                      setShowMessages(true);
                    }}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3 shadow-md">
                      <img 
                        src={chat.avatar} 
                        alt={chat.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-blue-300 truncate">{chat.name}</h4>
                        <span className="text-xs text-gray-400">{formatTime(chat.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-300 truncate">
                        {chat.lastMessage || 'Start a conversation'}
                      </p>
                    </div>
                    {chat.unread > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-400">
                  <MessageCircle size={24} className="mx-auto mb-2 text-gray-500" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Start chatting with users from the Community page</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <motion.div
        className="text-center text-gray-400 mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <p className="text-sm">© 2025 Freelance Skill Exchange. All rights reserved.</p>
      </motion.div>
    </div>
  );
};

export default Dashboard;