import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProjects } from '../api/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useChat } from './WebSocketContext';
import { Heart, MessageCircle, Share2, Bookmark, Send, X, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import useVideoOptimizer from '../hooks/useVideoOptimizer';
import socketDebounce from '../utils/socketDebounce';
import { ChatProvider } from './WebSocketContext';
import ChatInterface from './ChatInterface';
const { debouncedEmit } = socketDebounce;

const Community = () => {
  const { userEmail, userId } = useAuth();
  const { socket, isConnected, connectionError } = useSocket();
  const { notifications: chatNotifications, conversations } = useChat();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  // Messages now handled by ChatInterface
  const [messages, setMessages] = useState({});
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showSocketError, setShowSocketError] = useState(false);
  const storiesScrollRef = useRef(null);
  const feedRef = useRef(null);
  const commentRef = useRef(null);
  const chatRef = useRef(null);
  const notificationsRef = useRef(null);
  const [userProfiles, setUserProfiles] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  
  // Add this with the other refs at the top of the component
  const prevConnectedRef = useRef(false);

  // Use our new hook
  const { preloadVideo, preloadInitialVideos } = useVideoOptimizer();
  
  // Add video optimization state
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoLoadStatus, setVideoLoadStatus] = useState({});

  // At the beginning of the component, add these lines with other refs
  const messagesContainerRef = useRef(null);
  const commentsContainerRef = useRef(null);
  const chatMessagesRef = useRef(null);

  // Add this function near the top of the component after state declarations
  const sendBrowserNotification = useCallback((title, body, icon = '/favicon.ico') => {
    try {
      // Only run on client side
      if (typeof window === 'undefined' || typeof Notification === 'undefined') {
        return;
      }
      
      // Check if we have permission
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon });
      } else if (Notification.permission !== 'denied') {
        // Request permission if not denied
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body, icon });
          }
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, []);

  // Calculate total unread notifications
  const unreadNotificationsCount = useMemo(() => {
    // Count regular notifications
    const notifCount = notifications.filter(n => !n.read).length;
    
    // Count unread messages from all conversations
    const unreadMessageCount = Object.values(conversations || {}).reduce(
      (total, convo) => total + (convo.unreadCount || 0), 0
    );
    
    return notifCount + unreadMessageCount;
  }, [notifications, conversations]);

  // Move fetchPostsData outside of useEffect and wrap in useCallback
  const fetchPostsData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProjects();
      console.log("Fetched projects data:", data); // Debug log
      
      // Transform projects into posts format with proper error handling
      const formattedPosts = data.map(project => {
        // Extract user info more safely with proper username priority
        const username = 
          project.username || 
          (project.userId && typeof project.userId === 'object' && project.userId.name) ||
          (project.userId && typeof project.userId === 'object' && project.userId.email?.split('@')[0]) || 
          (typeof project.userId === 'string' && project.userId.includes('@') ? project.userId.split('@')[0] : project.userId) || 
          'user';
        
        // Log username determination for debugging
        console.log(`Project ${project._id}: username=${username}, source=${
          project.username ? 'project.username' :
          (project.userId && typeof project.userId === 'object' && project.userId.name) ? 'userId.name' :
          (project.userId && typeof project.userId === 'object' && project.userId.email) ? 'userId.email' :
          (typeof project.userId === 'string' && project.userId.includes('@')) ? 'userId as email' :
          'fallback'
        }`);
        
        return {
          id: project._id,
          userId: typeof project.userId === 'object' ? project.userId._id : project.userId,
          username,
          title: project.title || 'Untitled Project',
          description: project.description || 'No description provided',
          // Check for video link first, then screenshots, then fallback to other image sources
          videoLink: project.videoLink || null,
          imageUrl: Array.isArray(project.screenshots) && project.screenshots.length > 0 
                  ? project.screenshots[0] 
                  : (project.imageUrl || project.thumbnailUrl || 'https://via.placeholder.com/600x800'),
          likes: project.likes || 0,
          liked: project.likedBy?.includes(userId) || false,
          timestamp: project.createdAt || new Date().toISOString(),
          comments: project.comments || [],
          userAvatar: project.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        };
      });
      
      console.log("Formatted posts:", formattedPosts); // Debug log
      
      // Sort posts by timestamp (newest first)
      formattedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setPosts(formattedPosts);
      
      // Initialize comments state
      const initialComments = {};
      formattedPosts.forEach(post => {
        initialComments[post.id] = post.comments || [];
      });
      setComments(initialComments);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch posts (projects) data
  useEffect(() => {
    fetchPostsData();
  }, [userId, fetchPostsData]);

  // Socket connection for real-time notifications and messages
  useEffect(() => {
    if (!socket) {
      console.log('No socket connection available');
      return;
    }

    console.log('Setting up socket listeners for chat');

    // Listen for socket connection events for debugging
    const onConnect = () => {
      console.log('Socket connected successfully');
      
      // Register the user immediately upon connection
      socket.emit('registerUser', userId);
      
      // Request chat history once connected
      socket.emit('getChatHistory', userId);
    };
    
    const onDisconnect = () => {
      console.log('Socket disconnected');
    };
    
    const onError = (error) => {
      console.error('Socket error:', error);
    };
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);

    // If already connected, register and get chat history
    if (socket.connected) {
      console.log('Socket already connected, registering user');
      socket.emit('registerUser', userId);
      socket.emit('getChatHistory', userId);
    }

    // Listen for notifications
    socket.on('notification', (notification) => {
      console.log('Received notification:', notification);
      // Only add notification if it's meant for this user
      if (notification.recipientId === userId) {
        setNotifications(prev => [notification, ...prev]);
      }
    });

    // Listen for private messages
    socket.on('receivePrivateMessage', (message) => {
      console.log('Received private message:', message);
      
      if (!message || !message.id) {
        console.error('Received invalid message format:', message);
        return;
      }
      
      // Only handle messages for this user (as sender or receiver)
      if (message.receiver === userId || message.sender === userId) {
        const partnerId = message.sender === userId ? message.receiver : message.sender;
        
        setMessages(prev => {
          const existingMessages = prev[partnerId] || [];
          
          // Check if message is already in the array to prevent duplicates
          const existingIndex = existingMessages.findIndex(msg => msg.id === message.id);
          
          if (existingIndex >= 0) {
            // If message exists, update it (e.g., with confirmed status)
            const updatedMessages = [...existingMessages];
            
            // If this is a confirmation of our own message
            if (message.sender === userId) {
              updatedMessages[existingIndex] = {
                ...updatedMessages[existingIndex],
                confirmed: true
              };
            } else {
              // For received messages, update with any new fields from server
              updatedMessages[existingIndex] = {
                ...updatedMessages[existingIndex],
                ...message
              };
              
              // If we're actively chatting with this user, mark message as read
              if (activeChatUser === message.sender && socket) {
                socket.emit('markMessageRead', { messageId: message.id });
              }
            }
            
            return {
              ...prev,
              [partnerId]: updatedMessages
            };
          }
          
          // If it's a new message
          const newMessage = {
            ...message,
            // If we're the sender, it's from server so mark as confirmed
            confirmed: message.sender === userId
          };
          
          // If we're actively chatting with this user, mark message as read
          if (activeChatUser === message.sender && socket) {
            socket.emit('markMessageRead', { messageId: message.id });
            newMessage.read = true;
          }
          
          return {
            ...prev,
            [partnerId]: [...existingMessages, newMessage]
          };
        });
        
        // Auto-scroll messages container if active chat matches this message
        if (activeChatUser === (message.sender === userId ? message.receiver : message.sender)) {
          setTimeout(() => {
            if (chatMessagesRef.current) {
              chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            }
          }, 100);
        }
        
        // If this is a new message from another user and we're not currently chatting with them,
        // add a notification
        if (message.sender !== userId && activeChatUser !== message.sender) {
          if (document && !document.hasFocus()) {
            const senderName = userProfiles.find(profile => profile.userId === message.sender)?.name || 
                                posts.find(post => post.userId === message.sender)?.username || 
                                'Someone';
            
            sendBrowserNotification('New Message', `${senderName}: ${message.text}`);
          }
        }
      }
    });

    // Listen for post likes updates
    socket.on('postLiked', (data) => {
      setPosts(prev => prev.map(post => 
        post.id === data.postId 
          ? { ...post, likes: data.likesCount, liked: post.userId === userId ? true : post.liked } 
          : post
      ));
    });

    // Listen for new comments
    socket.on('newComment', (data) => {
      if (data.postId) {
        setComments(prev => ({
          ...prev,
          [data.postId]: [...(prev[data.postId] || []), data.comment]
        }));
      }
    });

    socket.on('unreadNotifications', (unreadNotifications) => {
      setNotifications(prev => [...unreadNotifications, ...prev]);
    });

    // Listen for user status updates
    socket.on('userStatusUpdate', (data) => {
      setOnlineUsers(prev => ({
        ...prev,
        [data.userId]: data.isOnline
      }));
    });
    
    // Get initial online users when connecting
    socket.on('initialOnlineUsers', (users) => {
      setOnlineUsers(users);
    });

    // Listen for chat history response
    socket.on('chatHistory', (history) => {
      console.log('Received chat history:', history);
      const chatMessages = {};
      
      // Organize messages by conversation partner
      if (history && history.conversations) {
        history.conversations.forEach(conversation => {
          chatMessages[conversation.partnerId] = conversation.messages;
        });
      }
      
      setMessages(chatMessages);
    });

    // Listen for message read receipts
    socket.on('messageRead', (data) => {
      if (!data || !data.messageId) return;
      
      console.log('Message marked as read:', data);
      
      setMessages(prev => {
        // Find the conversation that contains this message
        let updatedMessages = {...prev};
        let updated = false;
        
        Object.keys(prev).forEach(partnerId => {
          const msgIndex = prev[partnerId].findIndex(msg => msg.id === data.messageId);
          if (msgIndex !== -1) {
            // Create a new array with the message marked as read
            const updatedConversation = [...prev[partnerId]];
            updatedConversation[msgIndex] = {
              ...updatedConversation[msgIndex],
              read: true
            };
            
            updatedMessages[partnerId] = updatedConversation;
            updated = true;
          }
        });
        
        return updated ? updatedMessages : prev;
      });
    });

    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
      socket.off('notification');
      socket.off('receivePrivateMessage');
      socket.off('messageRead');
      socket.off('postLiked');
      socket.off('newComment');
      socket.off('unreadNotifications');
      socket.off('userStatusUpdate');
      socket.off('initialOnlineUsers');
      socket.off('chatHistory');
    };
  }, [socket, userId, activeChatUser]);

  // Add a function to mark messages as read when active chat changes
  useEffect(() => {
    if (!socket || !activeChatUser || !isConnected) return;
    
    // When a chat becomes active, mark all messages from this user as read
    const unreadMessages = messages[activeChatUser]?.filter(
      msg => msg.sender === activeChatUser && !msg.read
    ) || [];
    
    if (unreadMessages.length > 0) {
      console.log(`Marking ${unreadMessages.length} messages as read from ${activeChatUser}`);
      
      // Update local state first
      setMessages(prev => {
        const updatedMessages = [...(prev[activeChatUser] || [])];
        updatedMessages.forEach((msg, index) => {
          if (msg.sender === activeChatUser && !msg.read) {
            updatedMessages[index] = { ...msg, read: true };
          }
        });
        
        return {
          ...prev,
          [activeChatUser]: updatedMessages
        };
      });
      
      // Then notify the server
      unreadMessages.forEach(msg => {
        socket.emit('markMessageRead', { messageId: msg.id });
      });
    }
  }, [activeChatUser, socket, isConnected, messages]);

  // Handle clicks outside of menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (commentRef.current && !commentRef.current.contains(event.target) && !event.target.closest('.comment-button')) {
        setActiveCommentPost(null);
      }
      if (chatRef.current && !chatRef.current.contains(event.target) && !event.target.closest('.message-button')) {
        setActiveChatUser(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll stories horizontally
  const scrollStories = (direction) => {
    if (!storiesScrollRef.current) return;
    
    const scrollAmount = direction === 'left' ? -200 : 200;
    storiesScrollRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  // Like a post
  const likePost = (postId) => {
    // Update UI immediately for better UX
    const alreadyLiked = posts.find(p => p.id === postId)?.liked;
    if (alreadyLiked) return; // Prevent multiple likes from same user
    
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1, liked: true } : post
    ));
    
    // Send like to server via socket
    if (socket) {
      socket.emit('likePost', {
        postId,
        userId,
        likedBy: userId
      });
      
      // Only send notification if this is not your own post
      const post = posts.find(p => p.id === postId);
      if (post && post.userId !== userId) {
        // Send like notification through socket
        socket.emit('sendNotification', {
          type: 'like',
          senderId: userId,
          senderName: userEmail?.split('@')[0] || 'A user',
          recipientId: post.userId,
          postId: postId,
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  // Add comment to a post
  const addComment = (postId) => {
    if (!newComment.trim()) return;
    
    // Get the current user's profile from user profiles if available
    const currentUserProfile = userProfiles.find(profile => profile.userId === userId);
    
    const comment = {
      id: `comment-${Date.now()}`,
      userId,
      username: currentUserProfile?.name || userEmail?.split('@')[0] || 'User',
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
      userAvatar: currentUserProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail?.split('@')[0] || userId}`
    };
    
    // Update local state immediately
    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), comment]
    }));
    
    // Clear input
    setNewComment('');
    
    // Send to server via socket
    if (socket) {
      socket.emit('addComment', {
        postId,
        comment
      });
      
      // Send notification if this is not your own post
      const post = posts.find(p => p.id === postId);
      if (post && post.userId !== userId) {
        socket.emit('sendNotification', {
          type: 'comment',
          senderId: userId,
          senderName: comment.username,
          recipientId: post.userId,
          postId,
          commentText: newComment.trim().substring(0, 30) + (newComment.trim().length > 30 ? '...' : ''),
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  // Add a useEffect to handle connection error display
  useEffect(() => {
    if (connectionError) {
      console.error('Socket connection error in Community:', connectionError);
      setShowSocketError(true);
      
      // Auto-hide the error after 5 seconds
      const timer = setTimeout(() => {
        setShowSocketError(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionError]);

  // Add reconnection and chat recovery logic
  useEffect(() => {
    // Track previous connection state to detect reconnections
    if (isConnected && !prevConnectedRef.current && socket) {
      console.log('Reconnected to socket, recovering chat state...');
      
      // Re-register user
      socket.emit('registerUser', userId);
      
      // Request chat history after reconnection
      if (activeChatUser) {
        console.log('Requesting chat history for active conversation after reconnection');
        socket.emit('getChatHistory', {
          userId: userId,
          partnerId: activeChatUser
        });
      } else {
        // Get all chat history
        socket.emit('getChatHistory', userId);
      }
      
      // Show reconnection notification in DOM instead of directly creating elements
      setShowSocketError(false);
      const successMessage = 'Connection restored';
      console.log(successMessage);
      
      // Create a notification through state update instead of DOM manipulation
      setNotifications(prev => [{
        id: `system-${Date.now()}`,
        type: 'system',
        senderName: 'System',
        text: successMessage,
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev]);
    }
    
    // Update previous connection state
    prevConnectedRef.current = isConnected;
    
    // Setup periodic connection check
    const checkConnectionInterval = setInterval(() => {
      if (socket && !socket.connected && !socket.connecting) {
        console.log('Detected disconnected socket, attempting reconnection...');
        try {
          socket.connect();
        } catch (err) {
          console.error('Failed to reconnect:', err);
        }
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(checkConnectionInterval);
    };
  }, [isConnected, socket, userId, activeChatUser, setNotifications]);

  // Add reconnection and chat recovery logic
  useEffect(() => {
    // Track previous connection state to detect reconnections
    if (isConnected && !prevConnectedRef.current && socket) {
      console.log('Reconnected to socket, recovering chat state...');
      
      // Re-register user
      socket.emit('registerUser', userId);
      
      // Request chat history after reconnection
      if (activeChatUser) {
        console.log('Requesting chat history for active conversation after reconnection');
        socket.emit('getChatHistory', {
          userId: userId,
          partnerId: activeChatUser
        });
      } else {
        // Get all chat history
        socket.emit('getChatHistory', userId);
      }
    }
    
    // Update previous connection state
    prevConnectedRef.current = isConnected;
    
    return () => {};
  }, [isConnected, socket, userId, activeChatUser]);
  
  // Mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  // Add a placeholder sendMessage function for compatibility with existing code
  const sendMessage = () => {
    // This is just a placeholder for compatibility with existing code
    // Actual message sending is now handled by ChatInterface
    console.log('Message sending is now handled by ChatInterface component');
  };

  // Add useEffect to handle chat notifications
  useEffect(() => {
    if (chatNotifications && chatNotifications.length > 0) {
      // Merge chat notifications with existing notifications
      const newChatNotifications = chatNotifications.filter(
        chatNotif => !notifications.some(n => n.id === chatNotif.id)
      );
      
      if (newChatNotifications.length > 0) {
        setNotifications(prev => {
          // Combine and sort by timestamp, newest first
          const combined = [...prev, ...newChatNotifications];
          return combined.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });
      }
    }
  }, [chatNotifications]);

  // Add this new function to fetch user profiles - wrap in useCallback
  const fetchUserProfiles = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/profile/all', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      // Sort by most recent activity
      data.sort((a, b) => new Date(b.lastActive || b.updatedAt || 0) - new Date(a.lastActive || a.updatedAt || 0));
      setUserProfiles(data);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  }, []);

  // Call this in useEffect
  useEffect(() => {
    fetchUserProfiles();
  }, [fetchUserProfiles]);

  // Add this function to refresh the data
  const refreshData = () => {
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  // Function to preload videos for better performance
  const preloadVideos = useCallback(() => {
    if (!posts || posts.length === 0) return;
    
    // Get first 3 videos to preload
    const videosToPreload = posts
      .filter(post => post.videoLink)
      .slice(0, 3);
    
    console.log(`Preloading ${videosToPreload.length} videos`);
    
    // Create link elements for preloading
    videosToPreload.forEach(post => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = post.videoLink;
      link.as = 'video';
      document.head.appendChild(link);
      console.log(`Preloaded: ${post.videoLink}`);
    });
  }, [posts]);
  
  // Call preload function when posts are loaded
  useEffect(() => {
    if (!loading && posts.length > 0) {
      preloadVideos();
    }
  }, [loading, posts, preloadVideos]);

  // Modify the useEffect to use the refreshKey
  useEffect(() => {
    fetchPostsData();
    fetchUserProfiles();
  }, [userId, refreshKey, fetchPostsData, fetchUserProfiles]);

  // Simplify the useEffect for video autoplay
  useEffect(() => {
    if (!loading && posts.length > 0) {
      // Simple autoplay initialization - browsers now require muted for autoplay
      const videos = document.querySelectorAll('video');
      
      videos.forEach(video => {
        // Ensure video is muted (required for autoplay)
        video.muted = true;
        
        // Try to play the video
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Autoplay was prevented:', error);
            
            // Add event listener for first user interaction to play videos
            const playVideosOnInteraction = () => {
              videos.forEach(v => {
                v.muted = true;
                v.play().catch(err => console.log('Still prevented:', err));
              });
              document.removeEventListener('click', playVideosOnInteraction);
              document.removeEventListener('touchstart', playVideosOnInteraction);
            };
            
            document.addEventListener('click', playVideosOnInteraction, { once: true });
            document.addEventListener('touchstart', playVideosOnInteraction, { once: true });
          });
        }
      });
      
      // Set up intersection observer to play videos when they become visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const video = entry.target;
            video.muted = true;
            video.play().catch(err => console.log('Observer play prevented:', err));
            setPlayingVideo(video.id.replace('video-', ''));
          } else {
            const video = entry.target;
            video.pause();
            setPlayingVideo(null);
          }
        });
      }, { threshold: 0.5 });
      
      // Observe all videos
      videos.forEach(video => {
        observer.observe(video);
      });
      
      return () => {
        videos.forEach(video => {
          observer.unobserve(video);
        });
      };
    }
  }, [loading, posts]);

  // Add this useEffect for preloading videos
  useEffect(() => {
    if (!loading && posts.length > 0) {
      // Preload the first few videos for better user experience
      preloadInitialVideos(posts, 3);
    }
  }, [loading, posts, preloadInitialVideos]);

  // Update the scroll handler to preload next videos
  useEffect(() => {
    const handleScroll = () => {
      if (!window.scrollThrottleTimeout) {
        window.scrollThrottleTimeout = setTimeout(() => {
          const videos = document.querySelectorAll('video[id^="video-"]');
          
          // Find the current visible video
          let currentVisibleVideo = null;
          
          videos.forEach(video => {
            const rect = video.getBoundingClientRect();
            const isFullyVisible = (
              rect.top >= 0 &&
              rect.bottom <= window.innerHeight
            );
            
            const isPartiallyVisible = (
              rect.top < window.innerHeight &&
              rect.bottom > 0
            );
            
            if (isFullyVisible) {
              if (video.paused) {
                console.log(`Playing fully visible video: ${video.id}`);
                video.play().catch(err => console.log('Autoplay error:', err));
                
                // Find this video in the posts array
                const postId = video.id.replace('video-', '');
                currentVisibleVideo = posts.find(p => p.id === postId);
                
                setPlayingVideo(postId);
              }
            } else if (!isPartiallyVisible && !video.paused) {
              console.log(`Pausing out-of-view video: ${video.id}`);
              video.pause();
            }
          });
          
          // If we found a visible video, preload the next video
          if (currentVisibleVideo) {
            const currentIndex = posts.findIndex(p => p.id === currentVisibleVideo.id);
            const nextPosts = posts.slice(currentIndex + 1);
            const nextVideoPost = nextPosts.find(p => p.videoLink);
            
            if (nextVideoPost && nextVideoPost.videoLink) {
              console.log(`Preloading next video: ${nextVideoPost.id}`);
              preloadVideo(nextVideoPost.videoLink);
            }
          }
          
          window.scrollThrottleTimeout = null;
        }, 200);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (window.scrollThrottleTimeout) {
        clearTimeout(window.scrollThrottleTimeout);
      }
    };
  }, [posts, preloadVideo]);

  // Add a useEffect to request notification permissions when the component loads
  useEffect(() => {
    // Only request notification permission if we're on a browser that supports it
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      // Just check if Notification API is available, don't request yet
      console.log('Notification API is available');
    }
    
    // This is for cleanup - we'll disable any active setTimeouts when unmounting
    return () => {
      // Nothing to clean up here
    };
  }, []);

  // Updated openChatWithUser function to work with ChatInterface
  const openChatWithUser = (userId) => {
    if (!userId) {
      console.error('Cannot open chat: no user ID provided');
      return;
    }
    
    console.log(`Opening chat with user: ${userId}`);
    
    // Simply set the active chat user to show the ChatInterface modal
    // ChatInterface will handle the actual chat logic through WebSocketContext
    setActiveChatUser(userId);
    
    // Log for debugging
    console.log('Chat opened with user:', userId);
  };

  // Add this helper function near the top of the file, with other utility functions
  const isElementInViewport = (el) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= -rect.height * 0.5 &&
      rect.top <= window.innerHeight * 1.5
    );
  };

  // Add a useEffect to ensure videos are properly loaded when component is ready
  useEffect(() => {
    if (!loading && posts.length > 0) {
      // Short timeout to ensure DOM is fully rendered
      const timeout = setTimeout(() => {
        const videos = document.querySelectorAll('video[id^="video-"]');
        
        videos.forEach(video => {
          if (isElementInViewport(video)) {
            video.muted = true; // Ensure muted for autoplay
            video.play().catch(err => console.log('Initial play error:', err));
          }
        });
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [loading, posts]);

  // Add this function near the top with other utility functions
  const initializeVideos = () => {
    if (document) {
      setTimeout(() => {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          // Force video reinit
          const currentSrc = video.src;
          video.src = '';
          video.load();
          video.src = currentSrc;
          video.load();
          
          // Try to play when metadata is loaded
          video.onloadedmetadata = () => {
            video.muted = true;
            video.play().catch(err => console.log('Video init error:', err));
          };
        });
      }, 1000);
    }
  };

  // Update the useEffect for initializing videos
  useEffect(() => {
    if (!loading && posts.length > 0) {
      // Initialize videos after content is loaded
      initializeVideos();
    }
  }, [loading, posts]);

  // Fix the way we handle comments display by separating from conditional rendering
  const renderCommentDialog = () => {
    const post = posts.find(p => p.id === activeCommentPost);
    if (!post) return null;
    
    return (
      <div 
        ref={commentRef}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setActiveCommentPost(null);
          }
        }}
      >
        <div className="bg-gray-800 rounded-lg overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row">
          {/* Left side - image or video */}
          <div className="w-full md:w-3/5 bg-black flex items-center justify-center">
            {post.videoLink ? (
              <div className="w-full h-auto min-h-[40vh] md:min-h-[60vh] relative">
                <video 
                  id={`modal-video-${post.id}`}
                  src={post.videoLink}
                  className="w-full h-full object-contain"
                  poster={post.imageUrl || "https://via.placeholder.com/600x600"}
                  controls
                  playsInline
                  muted
                  loop
                  autoPlay
                  onLoadedMetadata={(e) => {
                    e.target.muted = true;
                    e.target.play().catch(err => console.log('Modal play error:', err));
                  }}
                />
              </div>
            ) : (
              <img 
                src={post.imageUrl} 
                alt={post.title}
                className="w-full h-auto max-h-[40vh] md:max-h-[80vh] object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/600x600";
                }}
              />
            )}
          </div>
          
          {/* Right side - comments */}
          <div className="w-full md:w-2/5 flex flex-col">
            {/* Header */}
            <div className="flex items-center p-3 sm:p-4 border-b border-gray-700">
              <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden">
                <img 
                  src={post.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`}
                  alt={post.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback";
                  }}
                />
              </div>
              <div className="ml-3">
                <p className="font-medium">{post.username || 'User'}</p>
                <p className="text-xs text-gray-400">{formatDate(post.timestamp)}</p>
              </div>
              <button 
                className="ml-auto text-gray-400"
                onClick={() => setActiveCommentPost(null)}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Comments list */}
            <div className="flex-grow overflow-y-auto p-3 sm:p-4 max-h-[30vh] md:max-h-none">
              {/* Caption as first comment */}
              <div className="flex mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                  <img 
                    src={post.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`}
                    alt={post.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback";
                    }}
                  />
                </div>
                <div className="ml-3">
                  <p>
                    <span className="font-medium mr-2">{post.username || 'User'}</span>
                    <span className="text-gray-300">{post.description}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(post.timestamp)}</p>
                </div>
              </div>
              
              {/* Actual comments */}
              {comments[post.id]?.map(comment => (
                <div key={comment.id} className="flex mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                    <img 
                      src={comment.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username || comment.userId || 'user'}`}
                      alt={comment.username || 'User'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback";
                      }}
                    />
                  </div>
                  <div className="ml-3">
                    <p>
                      <span className="font-medium mr-2">{comment.username || 'User'}</span>
                      <span className="text-gray-300">{comment.text}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(comment.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Comment input */}
            <div className="flex items-center mt-3 border-t border-gray-700 pt-3">
              <input
                type="text"
                placeholder="Add a comment..."
                className="bg-transparent flex-grow text-sm focus:outline-none"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
              />
              <button 
                className="text-cyan-500 font-medium text-sm ml-2"
                onClick={() => addComment(post.id)}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center items-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // Replace the mock stories section with real user profiles
  // Create stories from real users instead of mock data
  const stories = userProfiles.length > 0 
    ? userProfiles.slice(0, 15).map(profile => ({
        id: profile.userId || profile._id,
        username: profile.name || profile.username || 'user',
        avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name || profile.username || profile.userId}`,
        seen: false // You could add a 'seen' property to your backend model
      }))
    : Array.from({ length: 8 }).map((_, i) => ({
        id: `story-${i}`,
        username: `user${i + 1}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
        seen: i < 3
      }));

  return (
    <div className="min-h-screen pt-16 pb-16 bg-gray-900 text-white overflow-x-hidden">
      {/* Socket connection error notification */}
      {showSocketError && (
        <div className="fixed top-20 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse">
          <p className="font-bold">Connection Error</p>
          <p className="text-sm">{connectionError}</p>
          <button 
            onClick={() => setShowSocketError(false)}
            className="absolute top-1 right-1 text-white hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="max-w-xl mx-auto px-2 sm:px-4">
        {/* Stories section with navigation */}
        <div className="relative mb-6 bg-gray-800 rounded-lg p-3 sm:p-4">
          <div className="flex overflow-x-auto scrollbar-hide py-2 px-1" ref={storiesScrollRef}>
            {stories.map((story, i) => (
              <div key={story.id} className="flex-shrink-0 mr-3">
                <div className={`w-16 h-16 rounded-full p-[2px] ${story.seen ? 'bg-gray-600' : 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400'}`}>
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                    <img 
                      src={story.avatar} 
                      alt={story.username} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/40";
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-center mt-1 truncate w-16">{story.username}</p>
              </div>
            ))}
          </div>
          
          {/* Navigation buttons */}
          <button 
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-1 rounded-full hidden sm:flex items-center justify-center z-10"
            onClick={() => scrollStories('left')}
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-1 rounded-full hidden sm:flex items-center justify-center z-10"
            onClick={() => scrollStories('right')}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        {/* Posts feed */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Projects Feed</h2>
          <button 
            onClick={refreshData}
            disabled={loading}
            className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm">{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
        <div className="space-y-6" ref={feedRef}>
          {posts.map(post => (
            <motion.div 
              key={`post-${post.id}-${refreshKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-md"
            >
              {/* Post header */}
              <div className="flex items-center p-3 sm:p-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 overflow-hidden">
                  <img 
                    src={post.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username || 'user'}`}
                    alt={post.username || 'User'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback";
                    }}
                  />
                </div>
                <div className="ml-3 flex items-center">
                  <div className="flex items-center">
                    <p className="font-medium text-sm sm:text-base">
                      {post.username || (typeof post.userId === 'object' && post.userId.name) || 'User'}
                    </p>
                    {post.userId !== userId && onlineUsers[post.userId] && (
                      <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 ml-2">{formatDate(post.timestamp)}</p>
                  {post.userId !== userId && (
                    <button 
                      className="ml-2 text-cyan-400 hover:text-cyan-300 focus:outline-none message-button"
                      onClick={() => openChatWithUser(post.userId)}
                      aria-label="Message user"
                    >
                      <MessageCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Post image */}
              <div className="bg-gray-700 relative" style={{ minHeight: '300px', maxHeight: '500px' }}>
                {post.videoLink && (
                  <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: '300px' }}>
                    <video
                      id={`video-${post.id}`}
                      src={post.videoLink}
                      className="w-full h-full rounded-md object-contain bg-black" 
                      preload="auto" 
                      playsInline
                      controls
                      loop
                      muted
                      autoPlay
                      poster={post.thumbnailUrl || post.imageUrl}
                      onLoadStart={() => {
                        console.log(`Video ${post.id} load started`);
                        setVideoLoadStatus(prev => ({...prev, [post.id]: 'loading'}));
                      }}
                      onLoadedData={() => {
                        console.log(`Video ${post.id} loaded data`);
                        setVideoLoadStatus(prev => ({...prev, [post.id]: 'loaded'}));
                        
                        // Try to play video as soon as it's loaded
                        if (isElementInViewport(document.getElementById(`video-${post.id}`))) {
                          document.getElementById(`video-${post.id}`)?.play()
                            .catch(err => console.log('Play error on load:', err));
                        }
                      }}
                      onCanPlay={() => {
                        console.log(`Video ${post.id} can play now`);
                        if (isElementInViewport(document.getElementById(`video-${post.id}`)) && playingVideo === post.id) {
                          document.getElementById(`video-${post.id}`).play()
                            .catch(err => console.log('Play error:', err));
                        }
                      }}
                      onPlay={() => {
                        console.log(`Video ${post.id} playing`);
                        setPlayingVideo(post.id);
                        // Preload next video when current one starts playing
                        const currentIndex = posts.findIndex(p => p.id === post.id);
                        const nextPost = posts[currentIndex + 1];
                        if (nextPost?.videoLink) {
                          preloadVideo(nextPost.videoLink);
                        }
                      }}
                      onPause={() => {
                        console.log(`Video ${post.id} paused`);
                        if (playingVideo === post.id) {
                          setPlayingVideo(null);
                        }
                      }}
                      onError={(e) => {
                        console.error(`Video ${post.id} error:`, e.target.error);
                        setVideoLoadStatus(prev => ({...prev, [post.id]: 'error'}));
                      }}
                    />
                    
                    {/* Video controls overlay */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center cursor-pointer transition-all opacity-0 hover:opacity-100 bg-transparent"
                      onClick={(e) => {
                        const video = document.getElementById(`video-${post.id}`);
                        if (video) {
                          if (video.paused) {
                            video.play().catch(err => console.log('Play error:', err));
                            setPlayingVideo(post.id);
                          } else {
                            video.pause();
                            setPlayingVideo(null);
                          }
                        }
                        e.stopPropagation();
                      }}
                    >
                      {playingVideo !== post.id && (
                        <div className="bg-black bg-opacity-50 rounded-full p-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Video loading indicator */}
                      {videoLoadStatus[post.id] === 'loading' && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Loading video...
                        </div>
                      )}
                      
                      {/* Mute/unmute button */}
                      <button 
                        className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsVideoMuted(!isVideoMuted);
                          const videos = document.querySelectorAll('video');
                          videos.forEach(v => {
                            v.muted = !isVideoMuted;
                          });
                        }}
                      >
                        {isVideoMuted ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                            <line x1="23" y1="9" x2="17" y2="15"></line>
                            <line x1="17" y1="9" x2="23" y2="15"></line>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="p-3 sm:p-4">
                <div className="flex justify-between mb-2">
                  <div className="flex space-x-3 sm:space-x-4">
                    <button 
                      onClick={() => likePost(post.id)}
                      className="focus:outline-none"
                      aria-label="Like post"
                    >
                      <Heart className={`h-5 w-5 sm:h-6 sm:w-6 ${post.liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                    <button 
                      className="focus:outline-none comment-button"
                      onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                      aria-label="Show comments"
                    >
                      <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                    <button 
                      className="focus:outline-none"
                      aria-label="Share post"
                    >
                      <Share2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  </div>
                  <button 
                    className="focus:outline-none"
                    aria-label="Save post"
                  >
                    <Bookmark className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
                
                {/* Likes count */}
                <p className="font-medium text-sm sm:text-base mb-1">{post.likes} likes</p>
                
                {/* Caption */}
                <div className="mb-2">
                  <span className="font-medium text-sm sm:text-base mr-2">{post.username || 'User'}</span>
                  <span className="text-sm text-gray-300">{post.description}</span>
                </div>
                
                {/* Comments preview */}
                {comments[post.id]?.length > 0 && (
                  <button 
                    className="text-gray-400 text-xs sm:text-sm mb-2"
                    onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                  >
                    View all {comments[post.id].length} comments
                  </button>
                )}
                
                {/* Comment input */}
                <div className="flex items-center mt-3 border-t border-gray-700 pt-3">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="bg-transparent flex-grow text-sm focus:outline-none"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                  />
                  <button 
                    className="text-cyan-500 font-medium text-sm ml-2"
                    onClick={() => addComment(post.id)}
                  >
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Loading placeholder at end of feed for infinite scroll effect */}
          <div className="py-8 flex justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat dialog - fixed position */}
      {activeChatUser && (
        <div 
          ref={chatRef}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveChatUser(null);
            }
          }}
        >
          <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-3 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Messages</h3>
              <button 
                onClick={() => setActiveChatUser(null)}
                className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatProvider>
                <ChatInterface initialUserId={activeChatUser} />
              </ChatProvider>
            </div>
          </div>
        </div>
      )}
      
      {/* Notifications popover */}
      <div className="fixed top-16 right-4 z-50">
        {/* Notification toggle button with badge */}
        <button
          className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center relative mb-2"
          onClick={() => setShowNotifications(prev => !prev)}
          aria-label="Toggle notifications"
        >
          <Bell size={20} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
            </span>
          )}
        </button>
        
        {showNotifications && (
          <div 
            ref={notificationsRef}
            className="w-80 bg-gray-800 rounded-lg shadow-lg overflow-hidden mt-2"
          >
            <div className="p-3 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-medium">Notifications</h3>
              <button 
                className="text-xs text-cyan-500"
                onClick={() => {
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                }}
              >
                Mark all as read
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-gray-400 text-center">No notifications</p>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-3 border-b border-gray-700 flex items-start cursor-pointer hover:bg-gray-700 ${
                      notification.read ? 'opacity-75' : ''
                    }`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0">
                      {notification.type === 'system' ? (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        </div>
                      ) : null}
                    </div>
                    <div className="ml-3 flex-grow">
                      <p className="text-sm">
                        <span className="font-medium">{notification.senderName}</span>
                        {notification.type === 'like' && ' liked your post'}
                        {notification.type === 'comment' && ' commented on your post'}
                        {notification.type === 'system' && notification.text ? `: ${notification.text}` : ''}
                      </p>
                      {notification.type === 'comment' && (
                        <p className="text-xs text-gray-400 mt-1">{notification.commentText}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{formatDate(notification.timestamp)}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Comments dialog */}
      {activeCommentPost && renderCommentDialog()}
    </div>
  );
};

export default Community;