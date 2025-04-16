import React, { useState, useEffect, useRef } from 'react';

const DirectChat = ({ socket, userId, recipientId, recipientName, isOnline }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch message history when component mounts
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
    
    // Emit event to get message history
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
    
    // Listen for new messages
    const handleDirectMessage = (message) => {
      console.log('DirectChat: Received direct message:', message);
      if (
        (message.senderId === userId && message.recipientId === recipientId) ||
        (message.senderId === recipientId && message.recipientId === userId)
      ) {
        console.log('DirectChat: Adding message to chat');
        setMessages(prev => [...prev, message]);
      } else {
        console.log('DirectChat: Message not for this conversation', {
          messageSender: message.senderId,
          messageRecipient: message.recipientId,
          currentUser: userId,
          currentRecipient: recipientId
        });
      }
    };
    
    console.log('DirectChat: Setting up direct_message listener');
    socket.on('direct_message', handleDirectMessage);
    
    // Also listen for normal private messages as fallback
    socket.on('receivePrivateMessage', (message) => {
      console.log('DirectChat: Received via receivePrivateMessage:', message);
      if (
        (message.sender === userId && message.receiver === recipientId) ||
        (message.sender === recipientId && message.receiver === userId)
      ) {
        // Convert to direct_message format
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
      socket.off('receivePrivateMessage');
    };
  }, [socket, userId, recipientId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
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
    
    // Add message to UI immediately for better user experience
    const optimisticMessage = {
      ...messageData,
      id: `temp-${Date.now()}`,
      pending: true
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    // Send message through socket
    socket.emit('send_direct_message', messageData, (response) => {
      console.log('DirectChat: Send message response:', response);
      if (response && response.success) {
        // Replace optimistic message with confirmed one
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
        
        // Mark message as failed
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticMessage.id 
              ? { ...msg, failed: true, pending: false } 
              : msg
          )
        );
        
        // Try fallback method - send via private message
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

  return (
    <div className="direct-chat">
      <div className="chat-status">
        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
        <span>{recipientName} is {isOnline ? 'online' : 'offline'}</span>
      </div>
      
      {error && (
        <div className="chat-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="messages-container">
        {loading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">No messages yet. Say hello!</div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={message.id || index} 
              className={`message ${message.senderId === userId ? 'sent' : 'received'} ${message.pending ? 'pending' : ''} ${message.failed ? 'failed' : ''}`}
            >
              <div className="message-content">{message.content}</div>
              <div className="message-time">
                {message.pending ? 'Sending...' : message.failed ? 'Failed to send' :
                  new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="message-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button type="submit" disabled={!newMessage.trim() || loading}>
          Send
        </button>
      </form>
    </div>
  );
};

export default DirectChat; 