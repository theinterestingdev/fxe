const bcrypt = require('bcrypt');
const User = require('../models/User');
const sendOTP = require('../utils/emailService');
const generateToken = require('../utils/generateToken');

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
      console.log('Invalid or expired OTP');
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Find the user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate JWT token
    const token = generateToken(user._id);
    console.log('Generated Token:', token);

    // Clear OTP from memory
    otpStore.delete(normalizedEmail);

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
module.exports = { register, login, verifyOTP, verifyLoginOTP };
