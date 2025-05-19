import React, { useEffect, useState, useRef } from 'react';
import { useChat } from '../client/src/components/WebSocketContext';

/**
 * ChatWindow: A real-time direct chat component using Socket.io
 * Props:
 *   username - current user's display name
 *   recipientName - display name of the chat recipient or chat room name
 *   roomId - optional room identifier (defaults to 'public')
 *   onClose - function to call to close the chat window
 */
const ChatWindow = ({ username, recipientName, roomId = 'public', onClose }) => {
  // Get Chat context values
  const { 
    messages, 
    sendMessage, 
    typingUsers, 
    sendTypingStatus, 
    connected 
  } = useChat();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const [error, setError] = useState(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle input changes and typing status
  const typingTimeoutRef = useRef(null);
  const handleInputChange = (e) => {
    setInput(e.target.value);
    try {
      if (e.target.value.trim() && connected) {
        sendTypingStatus(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          sendTypingStatus(false);
        }, 2000);
      } else if (!e.target.value.trim()) {
        sendTypingStatus(false);
      }
    } catch (err) {
      console.error('Error in typing status:', err);
      // Don't show UI error for typing status issues
    }
  };

  // Send message
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !connected) return;
    
    try {
      sendMessage(input.trim());
      setInput('');
      sendTypingStatus(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <span className="status-dot online"></span>
        <span>{recipientName || 'Chat Room'}</span>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      
      {error && (
        <div className="chat-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="chat-messages">
        {!connected ? (
          <div className="connecting">Connecting to chat server...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.senderId === 'system' ? 'system' : 
                msg.senderName === username ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                <span className="sender">{msg.senderName || msg.senderId}</span>
                <span className="text">{msg.message}</span>
                <span className="time">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={!connected}
          autoFocus
        />
        <button type="submit" disabled={!input.trim() || !connected}>
          Send
        </button>
      </form>
      
      {typingUsers && typingUsers.length > 0 && (
        <div className="chat-typing">
          {typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : `${typingUsers.join(', ')} are typing...`}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
