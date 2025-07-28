/**
 * Authentication Middleware
 * 
 * Provides JWT-based authentication and authorization middleware
 * for protecting routes and verifying user roles in the e-commerce API.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and authenticate user
 * Adds user object to request for use in subsequent middleware/routes
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        error: 'MISSING_TOKEN'
      });
    }
    
    // Check if token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format. Use "Bearer <token>"',
        error: 'INVALID_TOKEN_FORMAT'
      });
    }
    
    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is empty.',
        error: 'EMPTY_TOKEN'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not found.',
        error: 'USER_NOT_FOUND'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User account is deactivated.',
        error: 'USER_DEACTIVATED'
      });
    }
    
    // Add user to request object
    req.user = user;
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token has expired.',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token not active yet.',
        error: 'TOKEN_NOT_ACTIVE'
      });
    }
    
    // Generic error
    res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
      error: 'AUTHENTICATION_ERROR'
    });
  }
};

/**
 * Verify user has admin role
 * Must be used after authenticate middleware
 */
const requireAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        error: 'NOT_AUTHENTICATED'
      });
    }
    
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        error: 'INSUFFICIENT_PRIVILEGES'
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Admin authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization failed. Please try again.',
      error: 'AUTHORIZATION_ERROR'
    });
  }
};

/**
 * Verify user has specific role
 * @param {string|Array} roles - Required role(s)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
          error: 'NOT_AUTHENTICATED'
        });
      }
      
      // Convert single role to array
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      // Check if user has any of the required roles
      if (!requiredRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
          error: 'INSUFFICIENT_PRIVILEGES'
        });
      }
      
      next();
      
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization failed. Please try again.',
        error: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for routes that work for both authenticated and anonymous users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    // Try to verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
      // Update last login time
      user.lastLogin = new Date();
      await user.save();
    } else {
      req.user = null;
    }
    
    next();
    
  } catch (error) {
    // If token is invalid, continue without authentication
    req.user = null;
    next();
  }
};

/**
 * Check if user owns the resource or is admin
 * @param {string} resourceUserField - Field name that contains the user ID in the resource
 */
const requireOwnershipOrAdmin = (resourceUserField = 'user') => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
          error: 'NOT_AUTHENTICATED'
        });
      }
      
      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }
      
      // For other routes, we need to check ownership
      // This will be implemented in specific route handlers
      // as it requires knowledge of the specific resource
      req.requireOwnership = true;
      req.resourceUserField = resourceUserField;
      
      next();
      
    } catch (error) {
      console.error('Ownership authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization failed. Please try again.',
        error: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip + ':' + req.path;
    const now = Date.now();
    
    // Clean up old entries
    for (const [k, v] of attempts.entries()) {
      if (now - v.firstAttempt > windowMs) {
        attempts.delete(k);
      }
    }
    
    // Check current attempts
    const userAttempts = attempts.get(key);
    
    if (!userAttempts) {
      attempts.set(key, {
        count: 1,
        firstAttempt: now
      });
      return next();
    }
    
    if (userAttempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Too many authentication attempts. Please try again in ${timeLeft} minutes.`,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: timeLeft
      });
    }
    
    userAttempts.count++;
    next();
  };
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @param {string} expiresIn - Token expiration time
 */
const generateToken = (user, expiresIn = null) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };
  
  const options = {};
  
  if (expiresIn) {
    options.expiresIn = expiresIn;
  } else {
    // Use different expiration times based on role
    options.expiresIn = user.role === 'admin' 
      ? process.env.JWT_ADMIN_EXPIRE || '4h'
      : process.env.JWT_EXPIRE || '24h';
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Verify token without adding to request
 * Useful for utility functions
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticate,
  requireAdmin,
  requireRole,
  optionalAuth,
  requireOwnershipOrAdmin,
  authRateLimit,
  generateToken,
  verifyToken
};