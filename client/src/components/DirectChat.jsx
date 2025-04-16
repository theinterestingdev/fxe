import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiPaperclip, FiSmile, FiImage, FiMoreVertical, FiCheck, FiCheckCircle, FiClock } from 'react-icons/fi';
import Picker from 'emoji-picker-react';
import './DirectChat.css';

const DirectChat = ({ socket, userId, recipientId, recipientName, isOnline, recipientAvatar }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const messageInputRef = useRef(null);

  
  useEffect(() => {
    if (!socket) {
      console.error('DirectChat: No socket connection available');
      setError('No socket connection available');
      setLoading(false);
      return;
    }
    
    console.log(`DirectChat: Initializing with userId=${userId}, recipientId=${recipientId}`);
    console.log('DirectChat: Socket connected status:', socket.connected);
    
    setLoading(true);
    setError(null);
    
    
    console.log('DirectChat: Requesting message history...');
    socket.emit('get_direct_messages', { 
      senderId: userId, 
      recipientId: recipientId 
    }, (response) => {
      console.log('DirectChat: Received message history response:', response);
      if (response && response.success) {
        setMessages(response.messages || []);
        console.log(`DirectChat: Loaded ${response.messages?.length || 0} messages`);
      } else {
        console.error('DirectChat: Failed to load messages:', response?.error || 'Unknown error');
        setError(response?.error || 'Failed to load messages');
      }
      setLoading(false);
    });
    
    
    const handleDirectMessage = (message) => {
      console.log('DirectChat: Received direct message:', message);
      if (
        (message.senderId === userId && message.recipientId === recipientId) ||
        (message.senderId === recipientId && message.recipientId === userId)
      ) {
        console.log('DirectChat: Adding message to chat');
        setMessages(prev => [...prev, message]);
        
        
        if (message.senderId === recipientId) {
          setTimeout(() => {
            socket.emit('markMessageRead', { messageId: message.id });
          }, 1000);
        }
      } else {
        console.log('DirectChat: Message not for this conversation', {
          messageSender: message.senderId,
          messageRecipient: message.recipientId,
          currentUser: userId,
          currentRecipient: recipientId
        });
      }
    };
    
  
    const handleTypingStatus = (data) => {
      if (data.senderId === recipientId && data.recipientId === userId) {
        setIsTyping(data.isTyping);
      }
    };
    
    
    const handleReadReceipt = (data) => {
      if (data.messageId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === data.messageId ? { ...msg, read: true } : msg
          )
        );
      }
    };
    
    console.log('DirectChat: Setting up listeners');
    socket.on('direct_message', handleDirectMessage);
    socket.on('typing_status', handleTypingStatus);
    socket.on('messageRead', handleReadReceipt);
    
    
    socket.on('receivePrivateMessage', (message) => {
      console.log('DirectChat: Received via receivePrivateMessage:', message);
      if (
        (message.sender === userId && message.receiver === recipientId) ||
        (message.sender === recipientId && message.receiver === userId)
      ) {
        
        const formattedMessage = {
          id: message.id,
          senderId: message.sender,
          recipientId: message.receiver,
          content: message.text,
          timestamp: message.timestamp
        };
        
        console.log('DirectChat: Adding converted message to chat');
        setMessages(prev => [...prev, formattedMessage]);
      }
    });
    
    return () => {
      console.log('DirectChat: Cleaning up listeners');
      socket.off('direct_message', handleDirectMessage);
      socket.off('typing_status', handleTypingStatus);
      socket.off('messageRead', handleReadReceipt);
      socket.off('receivePrivateMessage');
    };
  }, [socket, userId, recipientId]);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const sendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      console.log('DirectChat: Cannot send empty message');
      return;
    }
    
    if (!socket || !socket.connected) {
      console.error('DirectChat: Cannot send message - socket not connected');
      setError('Not connected to chat server');
      return;
    }
    
    console.log(`DirectChat: Sending message to ${recipientId}:`, newMessage);
    
    const messageData = {
      senderId: userId,
      recipientId: recipientId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    };
    
    
    const optimisticMessage = {
      ...messageData,
      id: `temp-${Date.now()}`,
      pending: true
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    
    socket.emit('typing_status', { 
      senderId: userId, 
      recipientId: recipientId, 
      isTyping: false 
    });
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    
    
    socket.emit('send_direct_message', messageData, (response) => {
      console.log('DirectChat: Send message response:', response);
      if (response && response.success) {
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticMessage.id 
              ? { ...optimisticMessage, id: response.messageId, pending: false } 
              : msg
          )
        );
      } else {
        console.error('DirectChat: Failed to send message:', response?.error || 'Unknown error');
        setError(response?.error || 'Failed to send message. Please try again.');
        
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticMessage.id 
              ? { ...msg, failed: true, pending: false } 
              : msg
          )
        );
        
        
        console.log('DirectChat: Trying fallback send method...');
        socket.emit('sendPrivateMessage', {
          id: `fallback-${Date.now()}`,
          sender: userId,
          receiver: recipientId,
          text: messageData.content,
          timestamp: messageData.timestamp
        });
      }
    });
  };

  
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    
    if (!typingTimeout && socket && socket.connected) {
      socket.emit('typing_status', { 
        senderId: userId, 
        recipientId: recipientId, 
        isTyping: true 
      });
      
      
      const timeout = setTimeout(() => {
        if (socket && socket.connected) {
          socket.emit('typing_status', { 
            senderId: userId, 
            recipientId: recipientId, 
            isTyping: false 
          });
        }
        setTypingTimeout(null);
      }, 3000);
      
      setTypingTimeout(timeout);
    } else if (typingTimeout) {
      
      clearTimeout(typingTimeout);
      const timeout = setTimeout(() => {
        if (socket && socket.connected) {
          socket.emit('typing_status', { 
            senderId: userId, 
            recipientId: recipientId, 
            isTyping: false 
          });
        }
        setTypingTimeout(null);
      }, 3000);
      
      setTypingTimeout(timeout);
    }
  };

  
  const onEmojiClick = (event, emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    messageInputRef.current.focus();
  };

  
  const formatTimestamp = (timestamp) => {
    const msgDate = new Date(timestamp);
    const now = new Date();
    
  
    if (msgDate.toDateString() === now.toDateString()) {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
  
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    
    if (msgDate.getFullYear() === now.getFullYear()) {
      return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
        ' at ' + msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    
    return msgDate.toLocaleDateString() + 
      ' at ' + msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  
  const shouldShowDateDivider = (message, index) => {
    if (index === 0) return true;
    
    const prevMessage = messages[index - 1];
    const prevDate = new Date(prevMessage.timestamp).toDateString();
    const currDate = new Date(message.timestamp).toDateString();
    
    return prevDate !== currDate;
  };

  
  const formatDividerDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
  
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
  
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    if (date > lastWeek) {
      return date.toLocaleDateString([], { weekday: 'long' });
    }
    
    
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  
  const handleAttachmentClick = () => {
    fileInputRef.current.click();
  };

  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`File attached: ${file.name} (Note: File upload not fully implemented)`);
    }
  };

  return (
    <div className="direct-chat">
      <div className="chat-header">
        <div className="recipient-info">
          {recipientAvatar ? (
            <img 
              src={recipientAvatar} 
              alt={recipientName} 
              className="recipient-avatar"
            />
          ) : (
            <div className="recipient-avatar-placeholder">
              {recipientName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="recipient-details">
            <h3>{recipientName}</h3>
            <div className="recipient-status">
              <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <div className="chat-actions">
          <button className="icon-button" title="More options">
            <FiMoreVertical />
          </button>
        </div>
      </div>
      
      {error && (
        <div className="chat-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="messages-container">
        {loading ? (
          <div className="chat-loader">
            <div className="loading-bubble"></div>
            <div className="loading-bubble"></div>
            <div className="loading-bubble"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-illustration">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16ZM7 9H9V11H7V9ZM15 9H17V11H15V9ZM11 9H13V11H11V9Z" fill="#CBD5E0"/>
              </svg>
            </div>
            <h3>No messages yet</h3>
            <p>Say hello to start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <React.Fragment key={message.id || index}>
                {shouldShowDateDivider(message, index) && (
                  <div className="date-divider">
                    <span>{formatDividerDate(message.timestamp)}</span>
                  </div>
                )}
                <div 
                  className={`message ${message.senderId === userId ? 'sent' : 'received'} ${message.pending ? 'pending' : ''} ${message.failed ? 'failed' : ''}`}
                >
                  <div className="message-bubble">
                    <div className="message-content">{message.content}</div>
                    <div className="message-footer">
                      <span className="message-time">
                        {message.pending ? 'Sending...' : message.failed ? 'Failed to send' :
                          formatTimestamp(message.timestamp)}
                      </span>
                      {message.senderId === userId && !message.pending && !message.failed && (
                        <span className="message-status">
                          {message.read ? (
                            <FiCheckCircle className="read-icon" title="Read" />
                          ) : (
                            <FiCheck className="delivered-icon" title="Delivered" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </>
        )}
        
        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-bubble"></div>
            <div className="typing-bubble"></div>
            <div className="typing-bubble"></div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-composer">
        <div className="composer-actions">
          <button type="button" className="composer-button" onClick={handleAttachmentClick}>
            <FiPaperclip />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
          <button type="button" className="composer-button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <FiSmile />
          </button>
          {showEmojiPicker && (
            <div className="emoji-picker-container" ref={emojiPickerRef}>
              <Picker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>
        
        <form className="message-form" onSubmit={sendMessage}>
          <div className="message-input-container">
            <input
              type="text"
              ref={messageInputRef}
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              disabled={loading}
              className="message-input"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={!newMessage.trim() || loading}
            className="send-button"
          >
            <FiSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DirectChat; 