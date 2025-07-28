/**
 * Search Routes
 * 
 * Provides advanced search functionality including product search,
 * auto-complete, and search analytics for the e-commerce platform.
 */

const express = require('express');
const { query, validationResult } = require('express-validator');
const { optionalAuth } = require('../middleware/auth');
const { asyncHandler, successResponse } = require('../middleware/errorHandler');
const { conditionalCache } = require('../middleware/cache');
const searchService = require('../services/SearchService');
const { businessLogger } = require('../middleware/logger');

const router = express.Router();

/**
 * @route   GET /api/search
 * @desc    Search products with advanced filtering
 * @access  Public
 * @query   q, category, brand, minPrice, maxPrice, minRating, tags, sort, page, limit
 */
router.get('/', [
  optionalAuth,
  conditionalCache.search,
  
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category filter cannot exceed 50 characters'),
  
  query('brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand filter cannot exceed 50 characters'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  
  query('minRating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
  
  query('sort')
    .optional()
    .isIn(['relevance', 'price_asc', 'price_desc', 'rating', 'popular', 'newest'])
    .withMessage('Invalid sort option'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
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
    q: query,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    tags,
    sort = 'relevance',
    page = 1,
    limit = 20
  } = req.query;

  // Build filters object
  const filters = {};
  if (category) filters.category = category;
  if (brand) filters.brand = brand;
  if (minPrice) filters.minPrice = parseFloat(minPrice);
  if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
  if (minRating) filters.minRating = parseFloat(minRating);
  if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
  if (sort) filters.sort = sort;

  // Perform search
  const searchResults = await searchService.searchProducts(
    query || '',
    filters,
    parseInt(page),
    parseInt(limit)
  );

  // Log search for analytics
  if (query) {
    businessLogger.searchPerformed(
      query,
      req.user ? req.user._id : null,
      searchResults.total
    );
    
    // Track search in service
    await searchService.trackSearch(
      query,
      searchResults.total,
      req.user ? req.user._id.toString() : null
    );
  }

  successResponse(res, {
    query: query || '',
    filters,
    results: searchResults.products,
    pagination: {
      page: searchResults.page,
      limit: searchResults.limit,
      total: searchResults.total,
      totalPages: searchResults.totalPages
    },
    facets: searchResults.facets
  }, 'Search completed successfully');
}));

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions/auto-complete
 * @access  Public
 * @query   q, limit
 */
router.get('/suggestions', [
  conditionalCache.search,
  
  query('q')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Query must be between 2 and 50 characters'),
  
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

  const { q: query, limit = 5 } = req.query;

  const suggestions = await searchService.getSuggestions(query, parseInt(limit));

  successResponse(res, {
    query,
    suggestions
  }, 'Search suggestions retrieved successfully');
}));

/**
 * @route   GET /api/search/trending
 * @desc    Get trending search terms
 * @access  Public
 * @query   limit
 */
router.get('/trending', [
  conditionalCache.search,
  
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

  const trendingSearches = await searchService.getTrendingSearches();

  successResponse(res, {
    trending: trendingSearches.slice(0, parseInt(limit))
  }, 'Trending searches retrieved successfully');
}));

/**
 * @route   GET /api/search/facets
 * @desc    Get available search facets
 * @access  Public
 * @query   q, category
 */
router.get('/facets', [
  conditionalCache.search,
  
  query('q')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Query cannot exceed 100 characters'),
  
  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { q: query, category } = req.query;

  // Get facets by performing a search with limit 0 (just for facets)
  const filters = {};
  if (category) filters.category = category;

  const searchResults = await searchService.searchProducts(
    query || '',
    filters,
    1,
    0 // No products, just facets
  );

  successResponse(res, {
    query: query || '',
    facets: searchResults.facets
  }, 'Search facets retrieved successfully');
}));

/**
 * @route   POST /api/search/index/rebuild
 * @desc    Rebuild search index (Admin only)
 * @access  Private (Admin)
 */
router.post('/index/rebuild', [
  require('../middleware/auth').authenticate,
  require('../middleware/auth').requireAdmin
], asyncHandler(async (req, res) => {
  // Initialize search indices
  await searchService.initializeIndices();

  successResponse(res, null, 'Search index rebuilt successfully');
}));

/**
 * @route   GET /api/search/popular
 * @desc    Get popular search terms
 * @access  Public
 * @query   limit, period
 */
router.get('/popular', [
  conditionalCache.search,
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
  
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d'])
    .withMessage('Invalid period. Use 7d, 30d, or 90d')
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

  // For now, return trending searches as popular searches
  // In a real implementation, you'd track and analyze search frequency
  const popularSearches = await searchService.getTrendingSearches();

  successResponse(res, {
    period,
    popular: popularSearches.slice(0, parseInt(limit))
  }, 'Popular searches retrieved successfully');
}));

/**
 * @route   GET /api/search/filters
 * @desc    Get available search filters
 * @access  Public
 */
router.get('/filters', [
  conditionalCache.categories
], asyncHandler(async (req, res) => {
  const Category = require('../models/Category');
  const Product = require('../models/Product');

  // Get available categories
  const categories = await Category.find({ isActive: true })
    .select('name slug')
    .sort({ name: 1 })
    .lean();

  // Get available brands
  const brands = await Product.aggregate([
    { $match: { isActive: true, 'specifications.brand': { $exists: true, $ne: '' } } },
    { $group: { _id: '$specifications.brand', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);

  // Get price ranges
  const priceStats = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        avgPrice: { $avg: '$price' }
      }
    }
  ]);

  const priceRange = priceStats[0] || { minPrice: 0, maxPrice: 1000, avgPrice: 100 };

  successResponse(res, {
    categories,
    brands: brands.map(b => ({ name: b._id, count: b.count })),
    priceRange: {
      min: Math.floor(priceRange.minPrice),
      max: Math.ceil(priceRange.maxPrice),
      average: Math.round(priceRange.avgPrice)
    },
    sortOptions: [
      { value: 'relevance', label: 'Relevance' },
      { value: 'price_asc', label: 'Price: Low to High' },
      { value: 'price_desc', label: 'Price: High to Low' },
      { value: 'rating', label: 'Customer Rating' },
      { value: 'popular', label: 'Most Popular' },
      { value: 'newest', label: 'Newest First' }
    ]
  }, 'Search filters retrieved successfully');
}));

module.exports = router;