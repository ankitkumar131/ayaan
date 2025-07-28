/**
 * Authentication Routes
 * 
 * Handles user authentication including registration, login, password reset,
 * and admin-specific authentication for the e-commerce platform.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, authRateLimit } = require('../middleware/auth');
const { asyncHandler, ApplicationError, successResponse, errorResponse } = require('../middleware/errorHandler');
const { uploadUserImage } = require('../middleware/upload');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    username, email, password, firstName, lastName, phone, address fields
 */
router.post('/register', [
  // Apply rate limiting
  authRateLimit(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
  
  // File upload middleware
  uploadUserImage,
  
  // Validation middleware
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  
  // Address validation
  body('address.zipCode')
    .optional()
    .matches(/^\d{5,6}(-\d{4})?$/)
    .withMessage('Please provide a valid ZIP code (5-6 digits)')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    phone,
    address
  } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: username.toLowerCase() }
    ]
  });
  
  if (existingUser) {
    const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
    throw new ApplicationError(`User with this ${field} already exists`, 400, 'USER_EXISTS');
  }
  
  // Create new user
  const userData = {
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    role: 'user'
  };
  
  // Add optional fields
  if (firstName) userData.firstName = firstName;
  if (lastName) userData.lastName = lastName;
  if (phone) userData.phone = phone;
  if (address) userData.address = address;
  
  // Add profile picture if uploaded
  if (req.uploadedImage) {
    userData.profilePicture = req.uploadedImage.url;
  }
  
  const user = new User(userData);
  await user.save();
  
  // Generate JWT token
  const token = generateToken(user);
  
  // Return success response
  successResponse(res, {
    token,
    user: user.getPublicProfile()
  }, 'User registered successfully', 201);
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    email, password
 */
router.post('/login', [
  // Apply rate limiting
  authRateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  
  // Validation middleware
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { email, password } = req.body;
  
  // Find user by email
  const user = await User.findByEmail(email);
  
  if (!user) {
    throw new ApplicationError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }
  
  // Check if user is active
  if (!user.isActive) {
    throw new ApplicationError('Account is deactivated. Please contact support.', 401, 'ACCOUNT_DEACTIVATED');
  }
  
  // Check password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    throw new ApplicationError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  // Generate JWT token
  const token = generateToken(user);
  
  // Return success response
  successResponse(res, {
    token,
    user: user.getPublicProfile()
  }, 'Login successful');
}));

/**
 * @route   POST /api/auth/register-admin
 * @desc    Register a new admin user
 * @access  Public (with admin key)
 * @body    username, email, password, firstName, lastName, phone, adminKey
 */
router.post('/register-admin', [
  // Apply stricter rate limiting for admin registration
  authRateLimit(3, 60 * 60 * 1000), // 3 attempts per hour
  
  // File upload middleware
  uploadUserImage,
  
  // Validation middleware
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Admin password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Admin password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('firstName')
    .notEmpty()
    .trim()
    .withMessage('First name is required for admin registration'),
  
  body('lastName')
    .notEmpty()
    .trim()
    .withMessage('Last name is required for admin registration'),
  
  body('adminKey')
    .notEmpty()
    .withMessage('Admin registration key is required')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    phone,
    adminKey
  } = req.body;
  
  // Verify admin registration key
  if (adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
    throw new ApplicationError('Invalid admin registration key', 403, 'INVALID_ADMIN_KEY');
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: username.toLowerCase() }
    ]
  });
  
  if (existingUser) {
    const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
    throw new ApplicationError(`User with this ${field} already exists`, 400, 'USER_EXISTS');
  }
  
  // Create new admin user
  const userData = {
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    firstName,
    lastName,
    role: 'admin',
    emailVerified: true // Admin accounts are pre-verified
  };
  
  // Add optional fields
  if (phone) userData.phone = phone;
  
  // Add profile picture if uploaded
  if (req.uploadedImage) {
    userData.profilePicture = req.uploadedImage.url;
  }
  
  const user = new User(userData);
  await user.save();
  
  // Generate JWT token with admin expiration
  const token = generateToken(user, process.env.JWT_ADMIN_EXPIRE || '4h');
  
  // Return success response
  successResponse(res, {
    token,
    user: user.getPublicProfile()
  }, 'Admin user registered successfully', 201);
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 * @body    email
 */
router.post('/forgot-password', [
  // Apply rate limiting
  authRateLimit(3, 60 * 60 * 1000), // 3 attempts per hour
  
  // Validation middleware
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { email } = req.body;
  
  // Find user by email
  const user = await User.findByEmail(email);
  
  // Always return success to prevent email enumeration
  if (!user) {
    return successResponse(res, null, 'If an account with that email exists, a password reset link has been sent.');
  }
  
  // Generate password reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();
  
  // TODO: Send email with reset token
  // For now, we'll just log it (in production, implement email service)
  console.log('Password reset token for', email, ':', resetToken);
  
  // In development, return the token for testing
  const responseData = process.env.NODE_ENV === 'development' 
    ? { resetToken } 
    : null;
  
  successResponse(res, responseData, 'If an account with that email exists, a password reset link has been sent.');
}));

/**
 * @route   PUT /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 * @body    token, password
 */
router.put('/reset-password', [
  // Apply rate limiting
  authRateLimit(5, 60 * 60 * 1000), // 5 attempts per hour
  
  // Validation middleware
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { token, password } = req.body;
  
  // Hash the token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with valid reset token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });
  
  if (!user) {
    throw new ApplicationError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
  }
  
  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  
  await user.save();
  
  successResponse(res, null, 'Password reset successful');
}));

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 * @body    token
 */
router.post('/verify-email', [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { token } = req.body;
  
  // Hash the token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with verification token
  const user = await User.findOne({
    emailVerificationToken: hashedToken
  });
  
  if (!user) {
    throw new ApplicationError('Invalid verification token', 400, 'INVALID_VERIFICATION_TOKEN');
  }
  
  // Verify email
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  
  await user.save();
  
  successResponse(res, null, 'Email verified successfully');
}));

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 * @body    email
 */
router.post('/resend-verification', [
  // Apply rate limiting
  authRateLimit(3, 60 * 60 * 1000), // 3 attempts per hour
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { email } = req.body;
  
  // Find user by email
  const user = await User.findByEmail(email);
  
  if (!user) {
    throw new ApplicationError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  if (user.emailVerified) {
    throw new ApplicationError('Email is already verified', 400, 'EMAIL_ALREADY_VERIFIED');
  }
  
  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();
  
  // TODO: Send verification email
  // For now, we'll just log it (in production, implement email service)
  console.log('Email verification token for', email, ':', verificationToken);
  
  // In development, return the token for testing
  const responseData = process.env.NODE_ENV === 'development' 
    ? { verificationToken } 
    : null;
  
  successResponse(res, responseData, 'Verification email sent successfully');
}));

module.exports = router;