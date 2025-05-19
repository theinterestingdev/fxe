import React, { useState, useEffect, useRef } from 'react';
import { useChat } from './WebSocketContext';
import { useAuth } from './AuthContext';
import { MessageCircle, Send, User, Circle, ChevronLeft } from 'lucide-react';

const ChatInterface = ({ initialUserId }) => {
  const {
    onlineUsers,
    allUsers,
    conversations,
    activeConversation,
    messages,
    typingUsers,
    sendMessage,
    setActiveConversation,
    setTypingStatus
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const [showUserList, setShowUserList] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Set active conversation based on initialUserId
  useEffect(() => {
    if (initialUserId) {
      console.log('Setting active conversation from initialUserId:', initialUserId);
      setActiveConversation(initialUserId);
      setShowUserList(false);
    }
  }, [initialUserId, setActiveConversation]);

  // Handle typing indicators
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (e.target.value.trim()) {
      setTypingStatus(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(false);
      }, 1500);
    } else {
      setTypingStatus(false);
    }
  };

  // Handle sending messages
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation) return;
    
    console.log('Sending message to:', activeConversation);
    sendMessage(messageInput.trim());
    setMessageInput('');
  };

  // Select a conversation
  const openConversation = (userId) => {
    setActiveConversation(userId);
    setShowUserList(false);
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Get username for a user ID
  const getUserName = (userId) => {
    const user = allUsers.find(u => u.userId === userId);
    return user ? user.username : `User-${userId.substring(0, 5)}`;
  };

  // Render the conversation list
  const renderConversationList = () => {
    // If we don't have allUsers yet, show loading
    if (!allUsers || allUsers.length === 0) {
      return (
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-gray-800">
            <h2 className="text-xl font-bold">Messages</h2>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-gray-400">Loading users...</p>
            </div>
          </div>
        </div>
      );
    }
    
    // Filter out current user from the list
    const filteredUsers = allUsers.filter(user => user.userId !== useAuth().userId);
    
    // Sort users: online first, then by username
    const sortedUsers = [...filteredUsers].sort((a, b) => {
      // Online users first
      if (onlineUsers.includes(a.userId) && !onlineUsers.includes(b.userId)) return -1;
      if (!onlineUsers.includes(a.userId) && onlineUsers.includes(b.userId)) return 1;
      
      // Then sort by username
      return a.username.localeCompare(b.username);
    });

    return (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-gray-800">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {sortedUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <p>No other users found</p>
              <p className="text-sm mt-1">When other users register, you'll be able to chat with them.</p>
            </div>
          ) : (
            sortedUsers.map(user => {
              // Get conversation data if it exists
              const conversation = conversations[user.userId] || {};
              const hasUnread = conversation.unreadCount && conversation.unreadCount > 0;
              
              return (
                <div 
                  key={user.userId}
                  className={`flex items-center p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer ${onlineUsers.includes(user.userId) ? 'border-l-4 border-l-green-500' : ''}`}
                  onClick={() => openConversation(user.userId)}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
                      <img 
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                        alt={user.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback";
                        }}
                      />
                    </div>
                    {onlineUsers.includes(user.userId) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                    )}
                  </div>
                  <div className="ml-3 flex-grow min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium truncate">{user.username}</p>
                      {conversation.lastMessageTime && (
                        <p className="text-xs text-gray-500 ml-2">
                          {formatTime(conversation.lastMessageTime)}
                        </p>
                      )}
                    </div>
                    <p className={`text-xs truncate ${hasUnread ? 'text-white font-semibold' : 'text-gray-400'}`}>
                      {typingUsers[user.userId] ? (
                        <span className="text-cyan-400">Typing...</span>
                      ) : conversation.lastMessage ? (
                        conversation.lastMessage
                      ) : (
                        'Click to start a conversation'
                      )}
                    </p>
                  </div>
                  {hasUnread && (
                    <div className="ml-2 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Render the active conversation
  const renderConversation = () => {
    const activeName = activeConversation ? getUserName(activeConversation) : '';
    const isUserTyping = typingUsers[activeConversation];
    
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-gray-800 flex items-center">
          <button 
            className="mr-2 p-1 rounded hover:bg-gray-700"
            onClick={() => setShowUserList(true)}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center">
            <div className="relative mr-2">
              <div className="bg-gray-700 h-8 w-8 rounded-full flex items-center justify-center">
                <User size={16} />
              </div>
              {onlineUsers.includes(activeConversation) && (
                <Circle className="text-green-500 absolute bottom-0 right-0 fill-current" size={8} />
              )}
            </div>
            <h2 className="text-lg font-semibold">{activeName}</h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="mx-auto mb-2" size={40} />
                <p>No messages yet</p>
                <p className="text-sm">Send a message to start the conversation</p>
              </div>
            </div>
          ) : (
            <>
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div 
                    key={msg.id || Math.random().toString()} 
                    className={`flex ${msg.senderId === useAuth().userId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`rounded-lg px-4 py-2 max-w-[75%] ${
                        msg.senderId === useAuth().userId 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      <div className="break-words">{msg.content}</div>
                      <div className="text-xs mt-1 opacity-70 flex justify-between">
                        <span>{formatTime(msg.timestamp)}</span>
                        {msg.senderId === useAuth().userId && (
                          <span>{msg.read ? 'Read' : 'Delivered'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 mt-4">
                  <p>No message history found</p>
                  <p className="text-sm">Send a message to start the conversation</p>
                </div>
              )}
              
              {isUserTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-white rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="typing-dot"></div>
                      <div className="typing-dot animation-delay-200"></div>
                      <div className="typing-dot animation-delay-400"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        <form 
          className="p-3 border-t border-gray-800 flex items-center"
          onSubmit={handleSendMessage}
        >
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit"
            className="ml-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={!messageInput.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 text-white rounded-lg shadow-lg overflow-hidden h-[500px] max-h-[80vh]">
      {showUserList || !activeConversation ? renderConversationList() : renderConversation()}
      
      <style jsx>{`
        .typing-dot {
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
