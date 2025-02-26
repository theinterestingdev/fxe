const express = require('express');
const { register, login, verifyOTP,verifyLoginOTP } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/verify-login-otp', verifyLoginOTP);

module.exports = router;
