/**
 * Admin Routes
 * 
 * Handles admin-specific operations including user management, order processing,
 * analytics, and system administration for the e-commerce platform.
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Promotion = require('../models/Promotion');
const { authenticate, requireAdmin, generateToken, authRateLimit } = require('../middleware/auth');
const { asyncHandler, ApplicationError, successResponse, paginatedResponse } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/admin/auth/login
 * @desc    Admin-specific login endpoint
 * @access  Public
 * @body    email, password
 */
router.post('/auth/login', [
  // Apply stricter rate limiting for admin login
  authRateLimit(3, 15 * 60 * 1000), // 3 attempts per 15 minutes
  
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
    throw new ApplicationError('Invalid admin credentials', 401, 'INVALID_CREDENTIALS');
  }
  
  // Check if user has admin role
  if (user.role !== 'admin') {
    throw new ApplicationError('Invalid admin credentials', 401, 'INVALID_CREDENTIALS');
  }
  
  // Check if user is active
  if (!user.isActive) {
    throw new ApplicationError('Admin account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
  }
  
  // Check password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    throw new ApplicationError('Invalid admin credentials', 401, 'INVALID_CREDENTIALS');
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  // Generate JWT token with shorter expiry for admin
  const token = generateToken(user, '4h');
  
  // Return success response
  successResponse(res, {
    token,
    user: user.getPublicProfile()
  }, 'Admin login successful');
}));

// Apply admin authentication to all routes except login
router.use(authenticate);
router.use(requireAdmin);

// Dashboard and Analytics Routes

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard overview
 * @access  Private (Admin)
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    newUsersThisMonth,
    ordersThisWeek,
    revenueThisMonth,
    pendingOrders,
    lowStockProducts,
    pendingReviews
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    User.countDocuments({ 
      role: 'user',
      createdAt: { $gte: thirtyDaysAgo }
    }),
    Order.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    }),
    Order.aggregate([
      { 
        $match: { 
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Order.countDocuments({ status: 'pending' }),
    Product.countDocuments({ stock: { $lt: 10 }, isActive: true }),
    Review.countDocuments({ status: 'pending' })
  ]);
  
  const dashboardData = {
    overview: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      newUsersThisMonth,
      ordersThisWeek,
      revenueThisMonth: revenueThisMonth[0]?.total || 0
    },
    alerts: {
      pendingOrders,
      lowStockProducts,
      pendingReviews
    }
  };
  
  successResponse(res, dashboardData, 'Dashboard data retrieved successfully');
}));

/**
 * @route   GET /api/admin/statistics
 * @desc    Get comprehensive sales statistics
 * @access  Private (Admin)
 */
router.get('/statistics', [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Invalid period. Use 7d, 30d, 90d, or 1y')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { period = '30d' } = req.query;
  
  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  const [salesStats, topProducts, salesByDate] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['delivered', 'shipped'] }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          totalItems: { $sum: { $sum: '$items.quantity' } }
        }
      }
    ]),
    
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['delivered', 'shipped'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          name: '$product.name',
          totalSold: 1,
          revenue: 1
        }
      }
    ]),
    
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['delivered', 'shipped'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ])
  ]);
  
  const statistics = {
    period,
    summary: salesStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalItems: 0
    },
    topProducts,
    salesByDate
  };
  
  successResponse(res, statistics, 'Sales statistics retrieved successfully');
}));

/**
 * @route   GET /api/admin/user-statistics
 * @desc    Get user statistics and analytics
 * @access  Private (Admin)
 */
router.get('/user-statistics', asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const [
    totalUsers,
    newUsers,
    activeUsers,
    usersByDate,
    topCustomers
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    
    User.countDocuments({
      role: 'user',
      createdAt: { $gte: thirtyDaysAgo }
    }),
    
    User.countDocuments({
      role: 'user',
      lastLogin: { $gte: thirtyDaysAgo }
    }),
    
    User.aggregate([
      {
        $match: {
          role: 'user',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),
    
    Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          email: '$user.email',
          totalOrders: 1,
          totalSpent: 1
        }
      }
    ])
  ]);
  
  const userStatistics = {
    totalUsers,
    newUsers,
    activeUsers,
    usersByDate,
    topCustomers
  };
  
  successResponse(res, userStatistics, 'User statistics retrieved successfully');
}));

// User Management Routes

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin)
 */
router.get('/users', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Invalid role filter'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status filter')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const {
    page = 1,
    limit = 20,
    role,
    status,
    search
  } = req.query;
  
  // Build query
  const query = {};
  
  if (role) query.role = role;
  if (status) query.isActive = status === 'active';
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  
  // Execute query
  const [users, totalUsers] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query)
  ]);
  
  const totalPages = Math.ceil(totalUsers / limitNum);
  
  paginatedResponse(res, users, {
    page: pageNum,
    limit: limitNum,
    totalPages,
    totalItems: totalUsers
  }, 'Users retrieved successfully');
}));

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get specific user details
 * @access  Private (Admin)
 */
router.get('/users/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId).select('-password');
  
  if (!user) {
    throw new ApplicationError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  // Get user's order statistics
  const orderStats = await Order.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' }
      }
    }
  ]);
  
  const userDetails = {
    ...user.toObject(),
    orderStatistics: orderStats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0
    }
  };
  
  successResponse(res, userDetails, 'User details retrieved successfully');
}));

/**
 * @route   PUT /api/admin/users/:userId/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private (Admin)
 */
router.put('/users/:userId/status', [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { userId } = req.params;
  const { isActive } = req.body;
  
  const user = await User.findById(userId);
  
  if (!user) {
    throw new ApplicationError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  // Prevent deactivating other admins
  if (user.role === 'admin' && !isActive) {
    throw new ApplicationError('Cannot deactivate admin users', 400, 'CANNOT_DEACTIVATE_ADMIN');
  }
  
  user.isActive = isActive;
  await user.save();
  
  successResponse(res, user.getPublicProfile(), `User ${isActive ? 'activated' : 'deactivated'} successfully`);
}));

// Order Management Routes

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders with filtering and pagination
 * @access  Private (Admin)
 */
router.get('/orders', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid status filter'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const {
    page = 1,
    limit = 20,
    status,
    startDate,
    endDate,
    search
  } = req.query;
  
  // Build query
  const query = {};
  
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  if (search) {
    query.orderNumber = { $regex: search, $options: 'i' };
  }
  
  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  
  // Execute query
  const [orders, totalOrders] = await Promise.all([
    Order.find(query)
      .populate('user', 'username email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(query)
  ]);
  
  const totalPages = Math.ceil(totalOrders / limitNum);
  
  paginatedResponse(res, orders, {
    page: pageNum,
    limit: limitNum,
    totalPages,
    totalItems: totalOrders
  }, 'Orders retrieved successfully');
}));

/**
 * @route   PUT /api/admin/orders/:orderId/status
 * @desc    Update order status
 * @access  Private (Admin)
 */
router.put('/orders/:orderId/status', [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid order status'),
  
  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Tracking number must be between 5 and 50 characters'),
  
  body('carrier')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Carrier name cannot exceed 100 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { orderId } = req.params;
  const { status, trackingNumber, carrier, notes } = req.body;
  
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new ApplicationError('Order not found', 404, 'ORDER_NOT_FOUND');
  }
  
  // Update order status
  await order.updateStatus(status, notes, req.user._id);
  
  // Add tracking information if provided
  if (trackingNumber) {
    order.shipping.trackingNumber = trackingNumber;
  }
  if (carrier) {
    order.shipping.carrier = carrier;
  }
  
  await order.save();
  
  successResponse(res, order, 'Order status updated successfully');
}));

// Review Management Routes

/**
 * @route   GET /api/admin/reviews
 * @desc    Get all reviews with filtering and pagination
 * @access  Private (Admin)
 */
router.get('/reviews', [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'flagged'])
    .withMessage('Invalid status filter'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const {
    status = 'pending',
    page = 1,
    limit = 20
  } = req.query;
  
  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  
  // Execute query
  const [reviews, totalReviews] = await Promise.all([
    Review.find({ status })
      .populate('user', 'username email')
      .populate('product', 'name images')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments({ status })
  ]);
  
  const totalPages = Math.ceil(totalReviews / limitNum);
  
  paginatedResponse(res, reviews, {
    page: pageNum,
    limit: limitNum,
    totalPages,
    totalItems: totalReviews
  }, 'Reviews retrieved successfully');
}));

/**
 * @route   PUT /api/admin/reviews/:reviewId/status
 * @desc    Update review status (approve/reject)
 * @access  Private (Admin)
 */
router.put('/reviews/:reviewId/status', [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  
  body('moderationNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Moderation notes cannot exceed 500 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { reviewId } = req.params;
  const { status, moderationNotes } = req.body;
  
  const review = await Review.findById(reviewId);
  
  if (!review) {
    throw new ApplicationError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }
  
  review.status = status;
  review.moderationNotes = moderationNotes;
  review.moderatedBy = req.user._id;
  review.moderatedAt = new Date();
  
  await review.save();
  
  // Update product rating if approved
  if (status === 'approved') {
    const product = await Product.findById(review.product);
    if (product) {
      await product.calculateAverageRating();
    }
  }
  
  successResponse(res, review, `Review ${status} successfully`);
}));

module.exports = router;