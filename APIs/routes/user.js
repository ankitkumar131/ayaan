/**
 * User Routes
 * 
 * Handles user profile management, account settings, and user-specific operations
 * for the e-commerce platform. Includes profile updates, password changes, and address management.
 * 
 * Note: Routes updated to match final.md specification (/api/user/* instead of /api/users/*)
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, requireOwnershipOrAdmin } = require('../middleware/auth');
const { asyncHandler, ApplicationError, successResponse } = require('../middleware/errorHandler');
const { uploadUserImage } = require('../middleware/upload');

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  // Return user profile (password already excluded by authenticate middleware)
  successResponse(res, req.user.getPublicProfile(), 'Profile retrieved successfully');
}));

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    username, firstName, lastName, phone, address fields, profilePicture (file)
 */
router.put('/profile', [
  authenticate,
  uploadUserImage,
  
  // Validation middleware
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
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
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City name cannot exceed 100 characters'),
  
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State name cannot exceed 100 characters'),
  
  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country name cannot exceed 100 characters'),
  
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
    firstName,
    lastName,
    phone,
    address
  } = req.body;
  
  const user = req.user;
  
  // Check if username is being changed and if it's available
  if (username && username.toLowerCase() !== user.username) {
    const existingUser = await User.findOne({ 
      username: username.toLowerCase(),
      _id: { $ne: user._id }
    });
    
    if (existingUser) {
      throw new ApplicationError('Username is already taken', 400, 'USERNAME_TAKEN');
    }
    
    user.username = username.toLowerCase();
  }
  
  // Update profile fields
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  
  // Update address
  if (address) {
    if (!user.address) user.address = {};
    
    if (address.street !== undefined) user.address.street = address.street;
    if (address.city !== undefined) user.address.city = address.city;
    if (address.state !== undefined) user.address.state = address.state;
    if (address.country !== undefined) user.address.country = address.country;
    if (address.zipCode !== undefined) user.address.zipCode = address.zipCode;
  }
  
  // Update profile picture if uploaded
  if (req.uploadedImage) {
    // TODO: Delete old profile picture file if exists
    user.profilePicture = req.uploadedImage.url;
  }
  
  await user.save();
  
  successResponse(res, user.getPublicProfile(), 'Profile updated successfully');
}));

/**
 * @route   PUT /api/users/password
 * @desc    Change user password
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    currentPassword, newPassword
 */
router.put('/password', [
  authenticate,
  
  // Validation middleware
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
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
  
  const { currentPassword, newPassword } = req.body;
  const user = req.user;
  
  // Get user with password field (since authenticate middleware excludes it)
  const userWithPassword = await User.findById(user._id);
  
  // Verify current password
  const isCurrentPasswordValid = await userWithPassword.comparePassword(currentPassword);
  
  if (!isCurrentPasswordValid) {
    throw new ApplicationError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
  }
  
  // Check if new password is different from current
  const isSamePassword = await userWithPassword.comparePassword(newPassword);
  
  if (isSamePassword) {
    throw new ApplicationError('New password must be different from current password', 400, 'SAME_PASSWORD');
  }
  
  // Update password
  userWithPassword.password = newPassword;
  await userWithPassword.save();
  
  successResponse(res, null, 'Password updated successfully');
}));

/**
 * @route   PUT /api/users/address
 * @desc    Update user address
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    street, city, state, country, zipCode
 */
router.put('/address', [
  authenticate,
  
  // Validation middleware
  body('street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City name cannot exceed 100 characters'),
  
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State name cannot exceed 100 characters'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country name cannot exceed 100 characters'),
  
  body('zipCode')
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
  
  const { street, city, state, country, zipCode } = req.body;
  const user = req.user;
  
  // Initialize address object if it doesn't exist
  if (!user.address) {
    user.address = {};
  }
  
  // Update address fields
  if (street !== undefined) user.address.street = street;
  if (city !== undefined) user.address.city = city;
  if (state !== undefined) user.address.state = state;
  if (country !== undefined) user.address.country = country;
  if (zipCode !== undefined) user.address.zipCode = zipCode;
  
  await user.save();
  
  successResponse(res, user.getPublicProfile(), 'Address updated successfully');
}));

/**
 * @route   GET /api/users/preferences
 * @desc    Get user preferences
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/preferences', authenticate, asyncHandler(async (req, res) => {
  const user = req.user;
  
  successResponse(res, {
    preferences: user.preferences || {
      newsletter: true,
      notifications: true
    }
  }, 'Preferences retrieved successfully');
}));

/**
 * @route   PUT /api/users/preferences
 * @desc    Update user preferences
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    newsletter, notifications
 */
router.put('/preferences', [
  authenticate,
  
  // Validation middleware
  body('newsletter')
    .optional()
    .isBoolean()
    .withMessage('Newsletter preference must be a boolean'),
  
  body('notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications preference must be a boolean')
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
  
  const { newsletter, notifications } = req.body;
  const user = req.user;
  
  // Initialize preferences object if it doesn't exist
  if (!user.preferences) {
    user.preferences = {};
  }
  
  // Update preferences
  if (newsletter !== undefined) user.preferences.newsletter = newsletter;
  if (notifications !== undefined) user.preferences.notifications = notifications;
  
  await user.save();
  
  successResponse(res, {
    preferences: user.preferences
  }, 'Preferences updated successfully');
}));

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account (soft delete)
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    password (for confirmation)
 */
router.delete('/account', [
  authenticate,
  
  // Validation middleware
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account')
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
  
  const { password } = req.body;
  const user = req.user;
  
  // Get user with password field
  const userWithPassword = await User.findById(user._id);
  
  // Verify password
  const isPasswordValid = await userWithPassword.comparePassword(password);
  
  if (!isPasswordValid) {
    throw new ApplicationError('Password is incorrect', 400, 'INVALID_PASSWORD');
  }
  
  // Soft delete - deactivate account instead of removing
  userWithPassword.isActive = false;
  userWithPassword.email = `deleted_${Date.now()}_${userWithPassword.email}`;
  userWithPassword.username = `deleted_${Date.now()}_${userWithPassword.username}`;
  
  await userWithPassword.save();
  
  // TODO: Clean up user data (orders, cart, etc.) or mark as deleted
  
  successResponse(res, null, 'Account deleted successfully');
}));

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics (orders, reviews, etc.)
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get user statistics
  const Order = require('../models/Order');
  const Review = require('../models/Review');
  
  const [orderStats, reviewStats] = await Promise.all([
    Order.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]),
    Review.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ])
  ]);
  
  const stats = {
    orders: orderStats[0] || { totalOrders: 0, totalSpent: 0, averageOrderValue: 0 },
    reviews: reviewStats[0] || { totalReviews: 0, averageRating: 0 },
    memberSince: req.user.createdAt,
    lastLogin: req.user.lastLogin
  };
  
  successResponse(res, stats, 'User statistics retrieved successfully');
}));

module.exports = router;