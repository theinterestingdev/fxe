const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendOTP = require('../utils/emailService');

// Store OTPs temporarily in memory
const otpStore = new Map();

// Register: Generate and send OTP
const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    // Store OTP and user data temporarily
    otpStore.set(normalizedEmail, { password, otp, otpExpiry });

    // Send OTP to email
    await sendOTP(normalizedEmail, otp);

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Verify OTP and register user
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Retrieve stored OTP and user data
    const storedData = otpStore.get(normalizedEmail);

    if (!storedData || storedData.otp !== otp || storedData.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(storedData.password, 10);

    // Create and save the user
    const user = new User({ email: normalizedEmail, password: hashedPassword });
    await user.save();

    // Clear the OTP from memory
    otpStore.delete(normalizedEmail);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Login user
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    // Store OTP temporarily
    otpStore.set(normalizedEmail, { otp, otpExpiry });

    // Send OTP to email
    await sendOTP(normalizedEmail, otp);

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Verify login OTP
const verifyLoginOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Retrieve stored OTP
    const storedData = otpStore.get(normalizedEmail);

    if (!storedData || storedData.otp.trim() !== otp.trim() || storedData.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Find the user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set token as an HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // For local development without HTTPS
      sameSite: 'lax', // Allow cross-site cookies
      maxAge: 3600000, // 1 hour
      path: '/', // Make the cookie accessible across the entire domain
    });

    // Clear OTP from memory
    otpStore.delete(normalizedEmail);

    res.status(200).json({ message: 'Login successful', user: { email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Check authentication status
const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.token; // Get the token from cookies
    console.log('Token from cookies (backend):', token); // Debugging

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debugging

    const user = await User.findById(decoded.userId);
    console.log('User from database:', user); // Debugging

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Return the user's email
    res.status(200).json({ user: { email: user.email } });
  } catch (err) {
    console.error('Auth check error:', err);
    res.status(500).json({ message: 'Server error checking authentication' });
  }
};
module.exports = { register, login, verifyOTP, verifyLoginOTP, logout, checkAuth };