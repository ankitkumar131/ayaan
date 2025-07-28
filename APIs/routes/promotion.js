/**
 * Promotion Routes
 * 
 * This file contains all routes related to promotion and discount code management.
 * It includes endpoints for creating, updating, deleting, and applying promotions.
 * 
 * Routes:
 * - GET /api/promotions - Get all active promotions
 * - GET /api/promotions/:id - Get promotion by ID
 * - POST /api/promotions/validate - Validate promotion code
 * - POST /api/admin/promotions - Create new promotion (Admin)
 * - PUT /api/admin/promotions/:id - Update promotion (Admin)
 * - DELETE /api/admin/promotions/:id - Delete promotion (Admin)
 * - GET /api/admin/promotions - Get all promotions with analytics (Admin)
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();

// Import middleware
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler, successResponse, ApplicationError } = require('../middleware/errorHandler');

// Import models
const Promotion = require('../models/Promotion');
const Cart = require('../models/Cart');

/**
 * @route   GET /api/promotions
 * @desc    Get all active promotions
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const promotions = await Promotion.find({
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  }).select('code description discountType discountValue minimumOrderValue maxUsage');

  successResponse(res, promotions, 'Active promotions retrieved successfully');
}));

/**
 * @route   GET /api/promotions/:id
 * @desc    Get promotion by ID
 * @access  Public
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid promotion ID')
], asyncHandler(async (req, res) => {
  const { id } = req.params;

  const promotion = await Promotion.findById(id);
  if (!promotion) {
    throw new ApplicationError('Promotion not found', 404);
  }

  successResponse(res, promotion, 'Promotion retrieved successfully');
}));

/**
 * @route   POST /api/promotions/validate
 * @desc    Validate promotion code
 * @access  Public
 */
router.post('/validate', [
  body('code')
    .notEmpty()
    .withMessage('Promotion code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Promotion code must be between 3 and 20 characters'),
  body('orderValue')
    .optional()
    .isNumeric()
    .withMessage('Order value must be a number')
], asyncHandler(async (req, res) => {
  const { code, orderValue = 0 } = req.body;

  const promotion = await Promotion.findOne({
    code: code.toUpperCase(),
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  });

  if (!promotion) {
    throw new ApplicationError('Invalid or expired promotion code', 400);
  }

  // Check if promotion has reached maximum usage
  if (promotion.maxUsage && promotion.usageCount >= promotion.maxUsage) {
    throw new ApplicationError('Promotion code has reached maximum usage limit', 400);
  }

  // Check minimum order value
  if (promotion.minimumOrderValue && orderValue < promotion.minimumOrderValue) {
    throw new ApplicationError(
      `Minimum order value of $${promotion.minimumOrderValue} required for this promotion`,
      400
    );
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (promotion.discountType === 'percentage') {
    discountAmount = (orderValue * promotion.discountValue) / 100;
    if (promotion.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, promotion.maxDiscountAmount);
    }
  } else {
    discountAmount = promotion.discountValue;
  }

  const validationResult = {
    valid: true,
    promotion: {
      id: promotion._id,
      code: promotion.code,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      discountAmount: Math.round(discountAmount * 100) / 100
    }
  };

  successResponse(res, validationResult, 'Promotion code validated successfully');
}));

// Admin Routes
/**
 * @route   GET /api/admin/promotions
 * @desc    Get all promotions with analytics (Admin)
 * @access  Private (Admin)
 */
router.get('/admin/all', [
  authenticate,
  requireAdmin,
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
    .isIn(['active', 'inactive', 'expired'])
    .withMessage('Status must be active, inactive, or expired')
], asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { status } = req.query;

  let filter = {};
  const now = new Date();

  if (status === 'active') {
    filter = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    };
  } else if (status === 'inactive') {
    filter = { isActive: false };
  } else if (status === 'expired') {
    filter = {
      $or: [
        { endDate: { $lt: now } },
        { maxUsage: { $lte: '$usageCount' } }
      ]
    };
  }

  const [promotions, totalCount] = await Promise.all([
    Promotion.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Promotion.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  const response = {
    promotions,
    pagination: {
      page,
      limit,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };

  successResponse(res, response, 'Promotions retrieved successfully');
}));

/**
 * @route   POST /api/admin/promotions
 * @desc    Create new promotion (Admin)
 * @access  Private (Admin)
 */
router.post('/admin', [
  authenticate,
  requireAdmin,
  body('code')
    .notEmpty()
    .withMessage('Promotion code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Promotion code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Promotion code must contain only uppercase letters and numbers'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters'),
  body('discountType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be percentage or fixed'),
  body('discountValue')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number'),
  body('minimumOrderValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order value must be a positive number'),
  body('maxDiscountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount amount must be a positive number'),
  body('maxUsage')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum usage must be a positive integer'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
], asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minimumOrderValue,
    maxDiscountAmount,
    maxUsage,
    startDate,
    endDate,
    isActive = true
  } = req.body;

  // Check if promotion code already exists
  const existingPromotion = await Promotion.findOne({ code: code.toUpperCase() });
  if (existingPromotion) {
    throw new ApplicationError('Promotion code already exists', 400);
  }

  // Validate discount value based on type
  if (discountType === 'percentage' && discountValue > 100) {
    throw new ApplicationError('Percentage discount cannot exceed 100%', 400);
  }

  const promotion = new Promotion({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    minimumOrderValue,
    maxDiscountAmount,
    maxUsage,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    isActive,
    createdBy: req.user._id
  });

  await promotion.save();

  successResponse(res, promotion, 'Promotion created successfully', 201);
}));

/**
 * @route   PUT /api/admin/promotions/:id
 * @desc    Update promotion (Admin)
 * @access  Private (Admin)
 */
router.put('/admin/:id', [
  authenticate,
  requireAdmin,
  param('id').isMongoId().withMessage('Invalid promotion ID'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters'),
  body('discountType')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be percentage or fixed'),
  body('discountValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number'),
  body('minimumOrderValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order value must be a positive number'),
  body('maxDiscountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount amount must be a positive number'),
  body('maxUsage')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum usage must be a positive integer'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const promotion = await Promotion.findById(id);
  if (!promotion) {
    throw new ApplicationError('Promotion not found', 404);
  }

  // Validate date logic if dates are being updated
  if (updateData.startDate || updateData.endDate) {
    const startDate = new Date(updateData.startDate || promotion.startDate);
    const endDate = new Date(updateData.endDate || promotion.endDate);
    
    if (endDate <= startDate) {
      throw new ApplicationError('End date must be after start date', 400);
    }
  }

  // Validate discount value based on type
  const discountType = updateData.discountType || promotion.discountType;
  const discountValue = updateData.discountValue || promotion.discountValue;
  
  if (discountType === 'percentage' && discountValue > 100) {
    throw new ApplicationError('Percentage discount cannot exceed 100%', 400);
  }

  // Update promotion
  Object.keys(updateData).forEach(key => {
    if (key === 'startDate' || key === 'endDate') {
      promotion[key] = new Date(updateData[key]);
    } else {
      promotion[key] = updateData[key];
    }
  });

  promotion.updatedBy = req.user._id;
  await promotion.save();

  successResponse(res, promotion, 'Promotion updated successfully');
}));

/**
 * @route   DELETE /api/admin/promotions/:id
 * @desc    Delete promotion (Admin)
 * @access  Private (Admin)
 */
router.delete('/admin/:id', [
  authenticate,
  requireAdmin,
  param('id').isMongoId().withMessage('Invalid promotion ID')
], asyncHandler(async (req, res) => {
  const { id } = req.params;

  const promotion = await Promotion.findById(id);
  if (!promotion) {
    throw new ApplicationError('Promotion not found', 404);
  }

  // Check if promotion is currently being used
  const activeUsage = await Cart.countDocuments({
    'promotion.code': promotion.code
  });

  if (activeUsage > 0) {
    throw new ApplicationError(
      'Cannot delete promotion that is currently being used in active carts',
      400
    );
  }

  await Promotion.findByIdAndDelete(id);

  successResponse(res, null, 'Promotion deleted successfully');
}));

/**
 * @route   GET /api/admin/promotions/:id/analytics
 * @desc    Get promotion analytics (Admin)
 * @access  Private (Admin)
 */
router.get('/admin/:id/analytics', [
  authenticate,
  requireAdmin,
  param('id').isMongoId().withMessage('Invalid promotion ID')
], asyncHandler(async (req, res) => {
  const { id } = req.params;

  const promotion = await Promotion.findById(id);
  if (!promotion) {
    throw new ApplicationError('Promotion not found', 404);
  }

  // Get usage analytics
  const Order = require('../models/Order');
  
  const analytics = await Order.aggregate([
    {
      $match: {
        'promotion.code': promotion.code,
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        totalDiscount: { $sum: '$pricing.discount' },
        averageOrderValue: { $avg: '$pricing.total' }
      }
    }
  ]);

  const result = analytics.length > 0 ? analytics[0] : {
    totalOrders: 0,
    totalRevenue: 0,
    totalDiscount: 0,
    averageOrderValue: 0
  };

  const promotionAnalytics = {
    promotion: {
      code: promotion.code,
      description: promotion.description,
      usageCount: promotion.usageCount,
      maxUsage: promotion.maxUsage
    },
    analytics: {
      ...result,
      usageRate: promotion.maxUsage ? (promotion.usageCount / promotion.maxUsage) * 100 : null,
      averageDiscount: result.totalOrders > 0 ? result.totalDiscount / result.totalOrders : 0
    }
  };

  successResponse(res, promotionAnalytics, 'Promotion analytics retrieved successfully');
}));

module.exports = router;