import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../client/src/components/WebSocketContext';

const DirectChat = ({ username, recipientName }) => {
  const { messages, sendMessage, typingUsers, sendTypingStatus, connected } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Handle input changes and typing status
  const typingTimeoutRef = useRef(null);
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (e.target.value.trim() && connected) {
      sendTypingStatus(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 2000);
    } else if (!e.target.value.trim()) {
      sendTypingStatus(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !connected) return;
    sendMessage(input.trim());
    setInput('');
    sendTypingStatus(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  return (
    <div className="direct-chat">
      <div className="chat-status">
        <span className="status-dot online"></span>
        <span>{recipientName || 'Chat Room'}</span>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.user === username ? 'sent' : 'received'}`}
            >
              <div className="message-content"><b>{msg.user}:</b> {msg.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : `${typingUsers.join(', ')} are typing...`}
        </div>
      )}
      
      <form className="message-form" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <button type="submit" disabled={!input.trim() || !connected}>
          Send
        </button>
      </form>
    </div>
  );
};

export default DirectChat; 