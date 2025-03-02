const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes'); // Import Auth Routes
const profileRoutes = require('./routes/profileRoutes'); // Import Profile Routes
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Replace with your frontend URL
    credentials: true, // Allow cookies to be sent
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes); // ✅ Auth routes are now correctly mapped
app.use('/api/profile', profileRoutes); // ✅ Profile routes are now correctly mapped

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
