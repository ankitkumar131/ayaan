/**
 * Recommendations Routes
 * 
 * Provides intelligent product recommendation endpoints using various
 * recommendation algorithms for the e-commerce platform.
 */

const express = require('express');
const { query, validationResult } = require('express-validator');
const { optionalAuth } = require('../middleware/auth');
const { asyncHandler, successResponse } = require('../middleware/errorHandler');
const { conditionalCache } = require('../middleware/cache');
const recommendationService = require('../services/RecommendationService');

const router = express.Router();

/**
 * @route   GET /api/recommendations/product/:productId
 * @desc    Get recommendations for a specific product (collaborative filtering)
 * @access  Public
 * @query   limit
 */
router.get('/product/:productId', [
  conditionalCache.products,
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
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
  const { limit = 5 } = req.query;

  // Validate product ID format
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format'
    });
  }

  const recommendations = await recommendationService.getCollaborativeRecommendations(
    productId,
    parseInt(limit)
  );

  successResponse(res, {
    productId,
    recommendations,
    type: 'collaborative',
    description: 'Customers who bought this item also bought'
  }, 'Product recommendations retrieved successfully');
}));

/**
 * @route   GET /api/recommendations/similar/:productId
 * @desc    Get similar products (content-based filtering)
 * @access  Public
 * @query   limit
 */
router.get('/similar/:productId', [
  conditionalCache.products,
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
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
  const { limit = 5 } = req.query;

  // Validate product ID format
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format'
    });
  }

  const recommendations = await recommendationService.getContentBasedRecommendations(
    productId,
    parseInt(limit)
  );

  successResponse(res, {
    productId,
    recommendations,
    type: 'content-based',
    description: 'Similar products you might like'
  }, 'Similar products retrieved successfully');
}));

/**
 * @route   GET /api/recommendations/personalized
 * @desc    Get personalized recommendations for logged-in user
 * @access  Private
 * @query   limit
 */
router.get('/personalized', [
  require('../middleware/auth').authenticate,
  conditionalCache.userSpecific,
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const userId = req.user._id;
  const { limit = 10 } = req.query;

  const recommendations = await recommendationService.getPersonalizedRecommendations(
    userId.toString(),
    parseInt(limit)
  );

  successResponse(res, {
    userId,
    recommendations,
    type: 'personalized',
    description: 'Recommended for you based on your purchase history'
  }, 'Personalized recommendations retrieved successfully');
}));

/**
 * @route   GET /api/recommendations/trending
 * @desc    Get trending products
 * @access  Public
 * @query   limit, days
 */
router.get('/trending', [
  conditionalCache.products,
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
  
  query('days')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Days must be between 1 and 30')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { limit = 10, days = 7 } = req.query;

  const recommendations = await recommendationService.getTrendingProducts(
    parseInt(limit),
    parseInt(days)
  );

  successResponse(res, {
    recommendations,
    type: 'trending',
    period: `${days} days`,
    description: `Trending products in the last ${days} days`
  }, 'Trending products retrieved successfully');
}));

/**
 * @route   GET /api/recommendations/seasonal
 * @desc    Get seasonal recommendations
 * @access  Public
 * @query   limit
 */
router.get('/seasonal', [
  conditionalCache.products,
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { limit = 10 } = req.query;

  const recommendations = await recommendationService.getSeasonalRecommendations(
    parseInt(limit)
  );

  successResponse(res, {
    recommendations,
    type: 'seasonal',
    description: 'Perfect for the current season'
  }, 'Seasonal recommendations retrieved successfully');
}));

/**
 * @route   POST /api/recommendations/cart
 * @desc    Get recommendations based on cart items
 * @access  Public
 * @body    cartItems - Array of cart items
 */
router.post('/cart', [
  conditionalCache.products,
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Limit must be between 1 and 10')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { cartItems } = req.body;
  const { limit = 5 } = req.query;

  if (!Array.isArray(cartItems)) {
    return res.status(400).json({
      success: false,
      message: 'Cart items must be an array'
    });
  }

  const recommendations = await recommendationService.getCartRecommendations(
    cartItems,
    parseInt(limit)
  );

  successResponse(res, {
    recommendations,
    type: 'frequently-bought-together',
    description: 'Frequently bought together'
  }, 'Cart recommendations retrieved successfully');
}));

/**
 * @route   GET /api/recommendations/hybrid
 * @desc    Get hybrid recommendations combining multiple approaches
 * @access  Public (better with authentication)
 * @query   productId, limit
 */
router.get('/hybrid', [
  optionalAuth,
  conditionalCache.products,
  
  query('productId')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { productId, limit = 10 } = req.query;
  const userId = req.user ? req.user._id.toString() : null;

  const recommendations = await recommendationService.getHybridRecommendations(
    userId,
    productId,
    parseInt(limit)
  );

  successResponse(res, {
    recommendations,
    type: 'hybrid',
    description: 'Curated recommendations just for you'
  }, 'Hybrid recommendations retrieved successfully');
}));

/**
 * @route   GET /api/recommendations/homepage
 * @desc    Get recommendations for homepage
 * @access  Public (better with authentication)
 * @query   limit
 */
router.get('/homepage', [
  optionalAuth,
  conditionalCache.products,
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Limit must be between 1 and 30')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { limit = 20 } = req.query;
  const userId = req.user ? req.user._id.toString() : null;

  // Get a mix of recommendations for homepage
  const [trending, seasonal, personalized] = await Promise.all([
    recommendationService.getTrendingProducts(Math.ceil(limit * 0.4)),
    recommendationService.getSeasonalRecommendations(Math.ceil(limit * 0.3)),
    userId ? 
      recommendationService.getPersonalizedRecommendations(userId, Math.ceil(limit * 0.3)) :
      []
  ]);

  // Combine and deduplicate
  const allRecommendations = [...trending, ...seasonal, ...personalized];
  const uniqueRecommendations = recommendationService.removeDuplicates(allRecommendations);

  successResponse(res, {
    sections: {
      trending: {
        title: 'Trending Now',
        products: trending.slice(0, Math.ceil(limit * 0.4))
      },
      seasonal: {
        title: 'Perfect for This Season',
        products: seasonal.slice(0, Math.ceil(limit * 0.3))
      },
      ...(userId && personalized.length > 0 && {
        personalized: {
          title: 'Recommended for You',
          products: personalized.slice(0, Math.ceil(limit * 0.3))
        }
      })
    },
    combined: uniqueRecommendations.slice(0, parseInt(limit)),
    type: 'homepage',
    description: 'Curated selection for homepage'
  }, 'Homepage recommendations retrieved successfully');
}));

/**
 * @route   GET /api/recommendations/metrics
 * @desc    Get recommendation performance metrics (Admin only)
 * @access  Private (Admin)
 */
router.get('/metrics', [
  require('../middleware/auth').authenticate,
  require('../middleware/auth').requireAdmin,
  conditionalCache.analytics
], asyncHandler(async (req, res) => {
  const metrics = await recommendationService.getRecommendationMetrics();

  successResponse(res, metrics, 'Recommendation metrics retrieved successfully');
}));

module.exports = router;