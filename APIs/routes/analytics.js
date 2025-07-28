/**
 * Analytics Routes
 * 
 * Provides analytics and business intelligence endpoints for the e-commerce platform.
 * Includes KPIs, sales analytics, and performance metrics.
 */

const express = require('express');
const { query, validationResult } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler, successResponse } = require('../middleware/errorHandler');
const { conditionalCache } = require('../middleware/cache');
const analyticsService = require('../services/AnalyticsService');

const router = express.Router();

// Apply admin authentication to all analytics routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get comprehensive dashboard analytics
 * @access  Private (Admin)
 * @query   period - Time period (7d, 30d, 90d, 1y)
 */
router.get('/dashboard', [
  conditionalCache.analytics,
  
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
  
  const dashboardData = await analyticsService.getDashboardAnalytics(period);
  
  successResponse(res, dashboardData, 'Dashboard analytics retrieved successfully');
}));

/**
 * @route   GET /api/analytics/conversion-rate
 * @desc    Get conversion rate
 * @access  Private (Admin)
 * @query   period - Time period
 */
router.get('/conversion-rate', [
  conditionalCache.analytics,
  
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Invalid period')
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
  
  const conversionRate = await analyticsService.getConversionRate(period);
  
  successResponse(res, {
    period,
    conversionRate,
    unit: 'percentage'
  }, 'Conversion rate retrieved successfully');
}));

/**
 * @route   GET /api/analytics/aov
 * @desc    Get Average Order Value
 * @access  Private (Admin)
 * @query   period - Time period
 */
router.get('/aov', [
  conditionalCache.analytics,
  
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Invalid period')
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
  
  const aov = await analyticsService.getAverageOrderValue(period);
  
  successResponse(res, {
    period,
    averageOrderValue: aov,
    currency: 'USD'
  }, 'Average Order Value retrieved successfully');
}));

/**
 * @route   GET /api/analytics/clv
 * @desc    Get Customer Lifetime Value
 * @access  Private (Admin)
 */
router.get('/clv', [
  conditionalCache.analytics
], asyncHandler(async (req, res) => {
  const clvData = await analyticsService.getCustomerLifetimeValue();
  
  successResponse(res, clvData, 'Customer Lifetime Value retrieved successfully');
}));

/**
 * @route   GET /api/analytics/cart-abandonment
 * @desc    Get cart abandonment rate
 * @access  Private (Admin)
 */
router.get('/cart-abandonment', [
  conditionalCache.analytics
], asyncHandler(async (req, res) => {
  const abandonmentRate = await analyticsService.getCartAbandonmentRate();
  
  successResponse(res, {
    cartAbandonmentRate: abandonmentRate,
    unit: 'percentage'
  }, 'Cart abandonment rate retrieved successfully');
}));

/**
 * @route   GET /api/analytics/top-products
 * @desc    Get top selling products
 * @access  Private (Admin)
 * @query   limit, period
 */
router.get('/top-products', [
  conditionalCache.analytics,
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Invalid period')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { limit = 10, period = '30d' } = req.query;
  
  const topProducts = await analyticsService.getTopSellingProducts(parseInt(limit), period);
  
  successResponse(res, {
    period,
    topProducts
  }, 'Top selling products retrieved successfully');
}));

/**
 * @route   GET /api/analytics/revenue-by-category
 * @desc    Get revenue breakdown by category
 * @access  Private (Admin)
 * @query   period
 */
router.get('/revenue-by-category', [
  conditionalCache.analytics,
  
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Invalid period')
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
  
  const revenueByCategory = await analyticsService.getRevenueByCategory(period);
  
  successResponse(res, {
    period,
    revenueByCategory
  }, 'Revenue by category retrieved successfully');
}));

/**
 * @route   GET /api/analytics/customer-segments
 * @desc    Get customer segmentation data
 * @access  Private (Admin)
 */
router.get('/customer-segments', [
  conditionalCache.analytics
], asyncHandler(async (req, res) => {
  const customerSegments = await analyticsService.getCustomerSegmentation();
  
  successResponse(res, {
    customerSegments
  }, 'Customer segmentation data retrieved successfully');
}));

/**
 * @route   GET /api/analytics/sales-trends
 * @desc    Get sales trends over time
 * @access  Private (Admin)
 * @query   period, groupBy
 */
router.get('/sales-trends', [
  conditionalCache.analytics,
  
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Invalid period'),
  
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('Invalid groupBy. Use day, week, or month')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { period = '30d', groupBy = 'day' } = req.query;
  
  const salesTrends = await analyticsService.getSalesTrends(period, groupBy);
  
  successResponse(res, {
    period,
    groupBy,
    salesTrends
  }, 'Sales trends retrieved successfully');
}));

/**
 * @route   GET /api/analytics/product/:productId
 * @desc    Get analytics for specific product
 * @access  Private (Admin)
 * @query   period
 */
router.get('/product/:productId', [
  conditionalCache.analytics,
  
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Invalid period')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { productId } = req.params;
  const { period = '30d' } = req.query;
  
  const productAnalytics = await analyticsService.getProductAnalytics(productId, period);
  
  successResponse(res, productAnalytics, 'Product analytics retrieved successfully');
}));

module.exports = router;