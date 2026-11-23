const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

/**
 * Middleware to check if user owns the resource
 */
const requireOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    // For admin users, allow access to all resources
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if the resource belongs to the current user
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-passwordHash');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};

const SESSION_SECONDS = 2 * 60 * 60;

const sessionEnd = (sessionEndsAt) => sessionEndsAt || Math.floor(Date.now() / 1000) + SESSION_SECONDS;

const secondsLeft = (sessionEndsAt) => Math.max(1, sessionEnd(sessionEndsAt) - Math.floor(Date.now() / 1000));

/**
 * Generate JWT token. A login lasts two hours, and a refresh cannot extend it.
 */
const generateToken = (userId, sessionEndsAt) => {
  const ends = sessionEnd(sessionEndsAt);
  return jwt.sign(
    { userId, sessionEndsAt: ends },
    process.env.JWT_SECRET,
    { expiresIn: secondsLeft(ends) }
  );
};

/**
 * Generate refresh token bound to the same two-hour session.
 */
const generateRefreshToken = (userId, sessionEndsAt) => {
  const ends = sessionEnd(sessionEndsAt);
  return jwt.sign(
    { userId, type: 'refresh', sessionEndsAt: ends },
    process.env.JWT_SECRET,
    { expiresIn: secondsLeft(ends) }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnership,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  SESSION_SECONDS
};


