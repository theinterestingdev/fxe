import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fetchProjects } from '../api/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { Heart, MessageCircle, Share2, Bookmark, Send, X } from 'lucide-react';
import { debouncedEmit } from '../utils/socketDebounce';


const FixedCommunity = () => {
  const { userEmail, userId } = useAuth();
  const { socket, isConnected, connectionError } = useSocket();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [messages, setMessages] = useState({});
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [userProfiles, setUserProfiles] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  
  
  const [showSocketError, setShowSocketError] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  
  
  const commentRef = useRef(null);
  const chatRef = useRef(null);
  const notificationsRef = useRef(null);
  
  
  const fetchingRef = useRef(false);
  const fetchAttemptRef = useRef(0);

  
  const safelyFetchData = useCallback(async () => {
    if (fetchingRef.current) {
      console.log("Already fetching data, ignoring request");
      return;
    }

    if (fetchAttemptRef.current > 10) {
      console.error("Too many fetch attempts, stopping");
      setFetchError(true);
      return;
    }

    try {
      fetchingRef.current = true;
      fetchAttemptRef.current++;
      
      console.log("Fetching projects data...");
      setLoading(true);
      
      const data = await fetchProjects();
      
      if (!data || !Array.isArray(data)) {
        console.error("Invalid data returned from API:", data);
        setPosts([]);
        return;
      }
      
      console.log(`Fetched ${data.length} projects`);
      
  
      const formattedPosts = data.map(project => ({
        id: project._id,
        userId: typeof project.userId === 'object' ? project.userId._id : project.userId,
        username: project.username || userEmail?.split('@')[0] || 'User',
        title: project.title || 'Untitled Project',
        description: project.description || 'No description provided',
        imageUrl: Array.isArray(project.screenshots) && project.screenshots.length > 0 
                ? project.screenshots[0] 
                : 'https://via.placeholder.com/600x400?text=Project+Image',
        likes: project.likes || 0,
        liked: project.likedBy?.includes(userId) || false,
        timestamp: project.createdAt || new Date().toISOString(),
        comments: project.comments || []
      }));
      
      
      formattedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setPosts(formattedPosts);
      
      
      const initialComments = {};
      formattedPosts.forEach(post => {
        initialComments[post.id] = post.comments || [];
      });
      setComments(initialComments);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setFetchError(true);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
      
      
      if (posts.length > 0) {
        fetchAttemptRef.current = 0;
      }
    }
  }, [userId, userEmail]);


  useEffect(() => {
    safelyFetchData();
  }, [safelyFetchData]);


  useEffect(() => {
    if (refreshKey > 0) {
      safelyFetchData();
    }
  }, [refreshKey, safelyFetchData]);

  
  useEffect(() => {
    if (!socket) {
      console.log('No socket connection available');
      return;
    }

    console.log('Setting up socket listeners');
    
    // Clear previous listeners
    socket.off('notification');
    socket.off('receivePrivateMessage');
    socket.off('postLiked');
    socket.off('newComment');
    socket.off('initialOnlineUsers');
    
    // Set up listeners
    socket.on('notification', (notification) => {
      if (notification.recipientId === userId) {
        setNotifications(prev => [notification, ...prev]);
      }
    });

    socket.on('receivePrivateMessage', (message) => {
      if (message.receiver === userId || message.sender === userId) {
        const partnerId = message.sender === userId ? message.receiver : message.sender;
        setMessages(prev => {
          const existingMessages = prev[partnerId] || [];
          
          // Check for duplicates
          if (existingMessages.some(msg => msg.id === message.id)) {
            return prev;
          }
          
          return {
            ...prev,
            [partnerId]: [...existingMessages, message]
          };
        });
      }
    });

    socket.on('postLiked', (data) => {
      setPosts(prev => prev.map(post => 
        post.id === data.postId 
          ? { ...post, likes: data.likesCount, liked: post.userId === userId ? true : post.liked } 
          : post
      ));
    });

    socket.on('newComment', (data) => {
      if (data.postId) {
        setComments(prev => ({
          ...prev,
          [data.postId]: [...(prev[data.postId] || []), data.comment]
        }));
      }
    });

    socket.on('initialOnlineUsers', (users) => {
      setOnlineUsers(users);
    });

    // Clean up on unmount
    return () => {
      socket.off('notification');
      socket.off('receivePrivateMessage');
      socket.off('postLiked');
      socket.off('newComment');
      socket.off('initialOnlineUsers');
    };
  }, [socket, userId]);

  // Handle clicks outside modals
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (commentRef.current && !commentRef.current.contains(event.target) && !event.target.closest('.comment-button')) {
        setActiveCommentPost(null);
      }
      if (chatRef.current && !chatRef.current.contains(event.target) && !event.target.closest('.message-button')) {
        setActiveChatUser(null);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target) && !event.target.closest('.notification-button')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    return date.toLocaleDateString();
  };

  // Like post
  const likePost = (postId) => {
    if (!socket || !socket.connected) {
      setShowSocketError(true);
      setTimeout(() => setShowSocketError(false), 3000);
      return;
    }
    
    // Optimistic UI update
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1, liked: true } : post
    ));
    
    // Send to server
    socket.emit('likePost', {
      postId,
      userId,
      likedBy: userId
    });
  };

  // Add comment
  const addComment = (postId) => {
    if (!newComment.trim() || !socket || !socket.connected) {
      return;
    }
    
    const comment = {
      id: `comment-${Date.now()}`,
      userId,
      username: userEmail?.split('@')[0] || 'User',
      text: newComment.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Optimistic UI update
    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), comment]
    }));
    
    // Clear input
    setNewComment('');
    
    // Send to server
    socket.emit('addComment', {
      postId,
      comment
    });
  };

  // Send message
  const sendMessage = (recipientId) => {
    if (!newMessage.trim() || !socket || !socket.connected || !recipientId) {
      return;
    }
    
    const message = {
      id: `msg-${Date.now()}`,
      sender: userId,
      senderName: userEmail?.split('@')[0] || 'User',
      receiver: recipientId,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Update local state
    setMessages(prev => ({
      ...prev,
      [recipientId]: [...(prev[recipientId] || []), message]
    }));
    
    // Clear input
    setNewMessage('');
    
    // Send to server
    socket.emit('sendPrivateMessage', message);
  };

  // Open chat with user
  const openChatWithUser = (userId) => {
    if (!userId) return;
    
    setActiveChatUser(userId);
    
    if (socket && socket.connected) {
      socket.emit('getChatHistory', {
        userId: window.localStorage.getItem('userId'),
        partnerId: userId
      });
    }
  };

  // Reset error display after a delay
  useEffect(() => {
    if (fetchError) {
      const timer = setTimeout(() => setFetchError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [fetchError]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Error messages */}
      {showSocketError && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg">
          <p>Connection error. Please try again later.</p>
        </div>
      )}
      
      {fetchError && (
        <div className="fixed top-4 left-4 z-50 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg">
          <p>Error loading content. <button className="underline" onClick={() => {setRefreshKey(prev => prev + 1); setFetchError(false);}}>Retry</button></p>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-gray-800 py-3 px-4 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Community</h1>
          
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 relative notification-button"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            
            <div className="bg-gray-700 px-3 py-1 rounded-full text-sm">
              {userEmail?.split('@')[0] || 'User'}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow container mx-auto p-4">
        {loading ? (
          // Loading state
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-700 rounded w-24"></div>
                    <div className="h-3 bg-gray-700 rounded w-16 mt-1"></div>
                  </div>
                </div>
                <div className="h-40 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          // Empty state
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-xl mb-4">No posts found</p>
            <p className="text-gray-400">Check back later for updates</p>
          </div>
        ) : (
          // Posts list
          <div className="space-y-6">
            {posts.map(post => (
              <motion.div 
                key={post.id}
                className="bg-gray-800 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Post header */}
                <div className="p-4 flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden cursor-pointer"
                    onClick={() => openChatWithUser(post.userId)}
                  >
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`}
                      alt={post.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{post.username}</p>
                    <p className="text-xs text-gray-400">{formatDate(post.timestamp)}</p>
                  </div>
                </div>
                
                {/* Post image */}
                <img 
                  src={post.imageUrl} 
                  alt={post.title}
                  className="w-full max-h-96 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/600x400?text=Image+Not+Available";
                  }}
                />
                
                {/* Post actions */}
                <div className="p-4 flex items-center space-x-4">
                  <button 
                    className={`flex items-center space-x-1 ${post.liked ? 'text-red-500' : 'text-gray-400'}`}
                    onClick={() => likePost(post.id)}
                  >
                    <Heart size={20} fill={post.liked ? "currentColor" : "none"} />
                    <span>{post.likes}</span>
                  </button>
                  <button 
                    className="flex items-center space-x-1 text-gray-400 comment-button"
                    onClick={() => setActiveCommentPost(post.id)}
                  >
                    <MessageCircle size={20} />
                    <span>{comments[post.id]?.length || 0}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-400">
                    <Share2 size={20} />
                  </button>
                  <div className="flex-grow"></div>
                  <button className="flex items-center space-x-1 text-gray-400">
                    <Bookmark size={20} />
                  </button>
                </div>
                
                {/* Post content */}
                <div className="px-4 pb-4">
                  <h3 className="font-bold">{post.title}</h3>
                  <p className="text-gray-300 mt-1">{post.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      
      {/* Comment modal */}
      {activeCommentPost && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div 
            ref={commentRef}
            className="bg-gray-800 rounded-lg w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="font-medium">Comments</h3>
              <button onClick={() => setActiveCommentPost(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto p-4">
              {comments[activeCommentPost]?.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No comments yet</p>
              ) : (
                <div className="space-y-4">
                  {comments[activeCommentPost]?.map(comment => (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex-shrink-0">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`}
                          alt={comment.username}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-baseline">
                          <p className="font-medium text-sm">{comment.username}</p>
                          <p className="text-xs text-gray-400 ml-2">{formatDate(comment.timestamp)}</p>
                        </div>
                        <p className="text-gray-200 mt-1">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-grow bg-gray-700 border-none rounded-l px-4 py-2"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addComment(activeCommentPost)}
                />
                <button
                  className="bg-blue-600 text-white rounded-r px-4 py-2 disabled:opacity-50"
                  disabled={!newComment.trim()}
                  onClick={() => addComment(activeCommentPost)}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat modal */}
      {activeChatUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div 
            ref={chatRef}
            className="bg-gray-800 rounded-lg w-full max-w-md overflow-hidden flex flex-col h-[80vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChatUser}`}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium">
                  {posts.find(p => p.userId === activeChatUser)?.username || 'User'}
                </h3>
              </div>
              <button onClick={() => setActiveChatUser(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4">
              {!messages[activeChatUser] || messages[activeChatUser].length === 0 ? (
                <p className="text-center text-gray-400 py-8">No messages yet</p>
              ) : (
                <div className="space-y-3">
                  {messages[activeChatUser].map(message => (
                    <div 
                      key={message.id}
                      className={`flex ${message.sender === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[75%] rounded-lg px-3 py-2 ${
                          message.sender === userId ? 'bg-blue-600' : 'bg-gray-700'
                        }`}
                      >
                        <p>{message.text}</p>
                        <p className="text-right text-xs text-gray-300 mt-1">
                          {formatDate(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-grow bg-gray-700 border-none rounded-l px-4 py-2"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(activeChatUser)}
                />
                <button
                  className="bg-blue-600 text-white rounded-r px-4 py-2 disabled:opacity-50"
                  disabled={!newMessage.trim() || !isConnected}
                  onClick={() => sendMessage(activeChatUser)}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notifications dropdown */}
      {showNotifications && (
        <div 
          ref={notificationsRef}
          className="fixed top-16 right-4 bg-gray-800 rounded-lg shadow-lg w-80 z-50"
        >
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
            <button 
              className="text-xs text-blue-400"
              onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
            >
              Mark all as read
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 p-4">No notifications</p>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-3 border-b border-gray-700 ${!notification.read ? 'bg-gray-700/30' : ''}`}
                >
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex-shrink-0 mr-2">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.senderName || 'user'}`}
                        alt="User"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{notification.senderName}</span>
                        {notification.type === 'like' && ' liked your post'}
                        {notification.type === 'comment' && ' commented on your post'}
                        {notification.type === 'message' && ' sent you a message'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(notification.timestamp)}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedCommunity; 