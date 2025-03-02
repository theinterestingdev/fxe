const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // First check for token in cookies (primary method based on your login system)
  let token = req.cookies.token;
  
  // Fall back to checking Authorization header if cookie is not available
  if (!token) {
    token = req.header('Authorization')?.replace('Bearer ', '');
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Set userId consistently on req.user.userId to match your controller expectations
    req.user = { userId: decoded.userId };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;