import React, { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [ws, setWs] = useState(null);
  const [username, setUsername] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = React.useRef(null);

  // Connect WebSocket when username is set
  React.useEffect(() => {
    if (!username) return; // Only dependency is username now
    if (ws) return; // Avoid creating multiple connections, but don't add ws to deps array
    
    console.log('Attempting to connect to WebSocket...');
    const socket = new WebSocket('ws://localhost:3001');
    
    // Set up all event handlers before setting the ws state
    socket.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
    };
    
    socket.onmessage = (event) => {
      console.log('Message received:', event.data);
      try {
        const parsedData = JSON.parse(event.data);
        
        // Handle typing status updates
        if (parsedData.type === 'typingStatus') {
          setTypingUsers(parsedData.users.filter(user => user !== username));
          return;
        }
        
        // Handle regular messages
        setMessages((prev) => [...prev, parsedData]);
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };
    
    // Set the WebSocket instance to state after all handlers are set up
    setWs(socket);
    
    // Cleanup function only runs when username changes or component unmounts
    return () => {
      console.log('Cleaning up WebSocket connection');
      if (socket.readyState === WebSocket.OPEN || 
          socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [username]); // Only username as dependency

  // Send typing status to server
  const sendTypingStatus = (isTyping) => {
    if (!ws || !username) return;
    ws.send(JSON.stringify({
      type: 'typing',
      user: username,
      isTyping
    }));
  };

  // Handle input changes with typing indication
  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Send typing status
    if (e.target.value.trim() && connected) {
      sendTypingStatus(true);
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set a new timeout to clear typing status after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 2000);
    } else if (!e.target.value.trim()) {
      sendTypingStatus(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !ws) return;
    
    // Send message
    const msg = { user: username, text: input };
    ws.send(JSON.stringify(msg));
    
    // Clear input and typing status
    setInput('');
    sendTypingStatus(false);
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  if (!username) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100 }}>
        <h2>Enter your username</h2>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && input.trim() && setUsername(input.trim())}
          placeholder="Username"
        />
        <button onClick={() => setUsername(input.trim())} disabled={!input.trim()}>Join Chat</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Chat Room</h2>
      <div style={{ border: '1px solid #ddd', padding: 10, minHeight: 300, maxHeight: 300, overflowY: 'auto', marginBottom: 10, background: '#fafafa' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ margin: '5px 0', color: msg.user === username ? 'blue' : 'black' }}>
            <b>{msg.user}:</b> {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1 }}
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          autoFocus
        />
        <button type="submit" disabled={!input.trim() || !connected}>Send</button>
      </form>
      <div style={{ marginTop: 10, fontSize: 12, color: '#888' }}>
        <div>Logged in as <b>{username}</b> {connected ? '🟢' : '🔴'}</div>
        {typingUsers.length > 0 && (
          <div style={{ marginTop: 5, fontStyle: 'italic' }}>
            {typingUsers.length === 1 ? 
              `${typingUsers[0]} is typing...` : 
              `${typingUsers.join(', ')} are typing...`}
          </div>
        )}
      </div>
    </div>
  );
}

export default App
