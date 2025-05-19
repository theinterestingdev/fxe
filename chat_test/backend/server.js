// Enhanced Node.js WebSocket chat server using ws
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const JWT_SECRET = 'your_jwt_secret'; // Replace with env var in prod
const MONGODB_URI = 'mongodb://localhost:27017/chat_test'; // Adjust as needed
const PORT = 3001;

// Mongoose models
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});
const messageSchema = new mongoose.Schema({
  user: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

// Express app for auth endpoints
const app = express();
app.use(cors());
app.use(express.json());

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash });
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// HTTP server for Express + WebSocket
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server });
const clients = new Set();
const typingUsers = new Map(); // username -> timeout

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

wss.on('connection', async function connection(ws, req) {
  // Expect JWT token in query string: ws://host:port?token=...
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  let username = null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    username = payload.username;
  } catch (err) {
    ws.send(JSON.stringify({ user: 'System', text: 'Authentication failed' }));
    ws.close();
    return;
  }
  clients.add(ws);
  ws.userData = { username };

  // Send welcome message
  ws.send(JSON.stringify({ user: 'System', text: `Welcome ${username}!` }));

  // Send recent messages
  const recent = await Message.find({}).sort({ timestamp: -1 }).limit(20).lean();
  ws.send(JSON.stringify({ type: 'history', messages: recent.reverse() }));

  // Broadcast total number of connected clients
  const countMsg = JSON.stringify({ user: 'System', text: `${clients.size} user(s) online` });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(countMsg);
    }
  }

  ws.on('message', async function incoming(message) {
    console.log('Received message:', message.toString());
    try {
      // Parse the message
      const msgData = JSON.parse(message.toString());
      
      // Store the username on first message
      if (!ws.userData.username && msgData.user) {
        ws.userData.username = msgData.user;
      }
      
      // Handle typing indicator messages
      if (msgData.type === 'typing') {
        const username = msgData.user;
        
        // Clear any existing timeout for this user
        if (typingUsers.has(username)) {
          clearTimeout(typingUsers.get(username));
        }
        
        // Set user as typing
        if (msgData.isTyping) {
          // Add to typing users
          typingUsers.set(username, setTimeout(() => {
            // Automatically clear typing status after 3 seconds of inactivity
            typingUsers.delete(username);
            broadcastTypingUsers();
          }, 3000));
        } else {
          // Remove from typing users
          typingUsers.delete(username);
        }
        
        // Broadcast typing users to all clients
        broadcastTypingUsers();
        return;
      }
      
      // For regular messages, save to DB and broadcast
      if (msgData.text) {
        const saved = new Message({ user: username, text: msgData.text });
        await saved.save();
        const msgToSend = JSON.stringify({ user: username, text: msgData.text, timestamp: saved.timestamp });
        for (const client of clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(msgToSend);
          }
        }
      }
    } catch (error) {
      console.error('Invalid message format:', error);
      ws.send(JSON.stringify({ user: 'System', text: 'Error: Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
    
    // Remove from typing users if they were typing
    if (ws.userData.username && typingUsers.has(ws.userData.username)) {
      typingUsers.delete(ws.userData.username);
      broadcastTypingUsers();
    }
    
    // Notify remaining clients
    const leftMsg = JSON.stringify({ user: 'System', text: `A user left. ${clients.size} user(s) remaining.` });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(leftMsg);
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Function to broadcast typing users to all clients
function broadcastTypingUsers() {
  const typingUsersList = Array.from(typingUsers.keys());
  const typingMsg = JSON.stringify({
    type: 'typingStatus',
    users: typingUsersList
  });
  
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(typingMsg);
    }
  }
}

server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
