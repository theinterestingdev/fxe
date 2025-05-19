import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from './SocketContext';

/**
 * ChatWindow: A robust, real-time direct chat component using socket.io
 * Props:
 *   currentUserId - logged-in user ID
 *   recipientId - user ID of the person you're chatting with
 *   recipientName - display name of the recipient
 *   isOnline - boolean, is the recipient online?
 *   onClose - function to call to close the chat window
 */
const ChatWindow = ({ currentUserId, recipientId, recipientName, isOnline, onClose }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch message history on mount or recipient change
  useEffect(() => {
    if (!socket || !recipientId) return;
    setLoading(true);
    setError(null);
    socket.emit('get_direct_messages', {
      senderId: currentUserId,
      recipientId
    }, (response) => {
      if (response && response.success) {
        setMessages(response.messages || []);
      } else {
        setError(response?.error || 'Failed to load messages');
      }
      setLoading(false);
    });
  }, [socket, currentUserId, recipientId]);

  // Listen for incoming direct messages
  useEffect(() => {
    if (!socket) return;
    const handleDirectMessage = (message) => {
      // Only add if message is for this conversation
      if (
        (message.senderId === currentUserId && message.recipientId === recipientId) ||
        (message.senderId === recipientId && message.recipientId === currentUserId)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    };
    socket.on('direct_message', handleDirectMessage);
    return () => {
      socket.off('direct_message', handleDirectMessage);
    };
  }, [socket, currentUserId, recipientId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !socket.connected) return;
    const messageData = {
      senderId: currentUserId,
      recipientId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };
    // Optimistic update
    const optimisticMessage = { ...messageData, id: `temp-${Date.now()}`, pending: true };
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    socket.emit('send_direct_message', messageData, (response) => {
      if (response && response.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id
              ? { ...optimisticMessage, id: response.messageId, pending: false }
              : msg
          )
        );
      } else {
        setError(response?.error || 'Failed to send message.');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id
              ? { ...msg, failed: true, pending: false }
              : msg
          )
        );
      }
    });
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
        <span>{recipientName} is {isOnline ? 'online' : 'offline'}</span>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="chat-messages">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`message ${msg.senderId === currentUserId ? 'sent' : 'received'} ${msg.pending ? 'pending' : ''} ${msg.failed ? 'failed' : ''}`}
            >
              <div className="message-content">{msg.content}</div>
              <div className="message-time">
                {msg.pending ? 'Sending...' : msg.failed ? 'Failed to send' : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input" onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button type="submit" disabled={!newMessage.trim() || loading}>Send</button>
      </form>
      {error && (
        <div className="chat-error">{error}</div>
      )}
    </div>
  );
};

export default ChatWindow;
