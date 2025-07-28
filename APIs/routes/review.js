/**
 * Review Routes
 * 
 * Handles product reviews and ratings for the e-commerce platform.
 * Includes review creation, moderation, and analytics.
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const { asyncHandler, ApplicationError, successResponse, paginatedResponse } = require('../middleware/errorHandler');
const { conditionalCache } = require('../middleware/cache');
const { uploadReviewImages } = require('../middleware/upload');
const { businessLogger } = require('../middleware/logger');

const router = express.Router();

/**
 * @route   GET /api/reviews/product/:productId
 * @desc    Get reviews for a specific product
 * @access  Public
 * @query   page, limit, sort
 */
router.get('/product/:productId', [
  conditionalCache.products,
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful'])
    .withMessage('Invalid sort option')
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
  const { page = 1, limit = 10, sort = 'newest' } = req.query;

  // Validate product ID format
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApplicationError('Invalid product ID format', 400, 'INVALID_PRODUCT_ID');
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApplicationError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Build sort object
  let sortObj = {};
  switch (sort) {
    case 'oldest':
      sortObj = { createdAt: 1 };
      break;
    case 'rating_high':
      sortObj = { rating: -1, createdAt: -1 };
      break;
    case 'rating_low':
      sortObj = { rating: 1, createdAt: -1 };
      break;
    case 'helpful':
      sortObj = { helpfulVotes: -1, createdAt: -1 };
      break;
    default: // newest
      sortObj = { createdAt: -1 };
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const [reviews, totalReviews, reviewStats] = await Promise.all([
    Review.find({ product: productId, status: 'approved' })
      .populate('user', 'username')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments({ product: productId, status: 'approved' }),
    Review.getReviewStats(productId)
  ]);

  const totalPages = Math.ceil(totalReviews / limitNum);

  successResponse(res, {
    reviews,
    statistics: reviewStats,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalPages,
      totalItems: totalReviews
    }
  }, 'Product reviews retrieved successfully');
}));

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private
 * @body    productId, orderId, rating, title, comment, images (files)
 */
router.post('/', [
  authenticate,
  uploadReviewImages,
  
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Review title cannot exceed 100 characters'),
  
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Review comment must be between 10 and 1000 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { productId, orderId, rating, title, comment } = req.body;
  const userId = req.user._id;

  // Verify order exists and belongs to user
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    status: 'delivered'
  });

  if (!order) {
    throw new ApplicationError('Order not found or not delivered', 404, 'ORDER_NOT_FOUND');
  }

  // Check if product was in the order
  const orderItem = order.items.find(item => 
    item.product.toString() === productId
  );

  if (!orderItem) {
    throw new ApplicationError('Product not found in this order', 400, 'PRODUCT_NOT_IN_ORDER');
  }

  // Check if review already exists
  const existingReview = await Review.findOne({
    user: userId,
    product: productId,
    order: orderId
  });

  if (existingReview) {
    throw new ApplicationError('Review already exists for this product', 400, 'REVIEW_EXISTS');
  }

  // Create review
  const reviewData = {
    product: productId,
    user: userId,
    order: orderId,
    rating: parseInt(rating),
    title,
    comment,
    variant: {
      size: orderItem.size,
      color: orderItem.color
    },
    isVerifiedPurchase: true,
    status: 'pending' // Reviews need moderation
  };

  // Add uploaded images
  if (req.uploadedImages && req.uploadedImages.length > 0) {
    reviewData.images = req.uploadedImages.map(img => ({
      url: img.url,
      alt: img.alt || 'Review image'
    }));
  }

  const review = new Review(reviewData);
  await review.save();

  // Add review to product
  const product = await Product.findById(productId);
  if (product) {
    product.reviews.push(review._id);
    await product.save();
  }

  // Log business event
  businessLogger.orderPlaced(orderId, userId, 'review_created', { productId, rating });

  successResponse(res, review, 'Review submitted successfully', 201);
}));

/**
 * @route   PUT /api/reviews/:reviewId
 * @desc    Update a review (owner only)
 * @access  Private
 * @body    rating, title, comment
 */
router.put('/:reviewId', [
  authenticate,
  uploadReviewImages,
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Review title cannot exceed 100 characters'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Review comment must be between 10 and 1000 characters')
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
  const { rating, title, comment } = req.body;
  const userId = req.user._id;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApplicationError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  // Check ownership
  if (review.user.toString() !== userId.toString()) {
    throw new ApplicationError('Access denied', 403, 'ACCESS_DENIED');
  }

  // Update review fields
  if (rating !== undefined) review.rating = parseInt(rating);
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;

  // Add new images if uploaded
  if (req.uploadedImages && req.uploadedImages.length > 0) {
    const newImages = req.uploadedImages.map(img => ({
      url: img.url,
      alt: img.alt || 'Review image'
    }));
    review.images = [...(review.images || []), ...newImages];
  }

  // Reset status to pending if content was modified
  if (rating !== undefined || title !== undefined || comment !== undefined) {
    review.status = 'pending';
  }

  await review.save();

  successResponse(res, review, 'Review updated successfully');
}));

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Delete a review (owner only)
 * @access  Private
 */
router.delete('/:reviewId', authenticate, asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApplicationError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  // Check ownership
  if (review.user.toString() !== userId.toString()) {
    throw new ApplicationError('Access denied', 403, 'ACCESS_DENIED');
  }

  // Remove review from product
  await Product.findByIdAndUpdate(review.product, {
    $pull: { reviews: reviewId }
  });

  // Delete review
  await Review.findByIdAndDelete(reviewId);

  // Recalculate product rating
  const product = await Product.findById(review.product);
  if (product) {
    await product.calculateAverageRating();
  }

  successResponse(res, null, 'Review deleted successfully');
}));

/**
 * @route   POST /api/reviews/:reviewId/vote
 * @desc    Vote on a review (helpful/unhelpful)
 * @access  Private
 * @body    vote (helpful/unhelpful)
 */
router.post('/:reviewId/vote', [
  authenticate,
  
  body('vote')
    .isIn(['helpful', 'unhelpful'])
    .withMessage('Vote must be either helpful or unhelpful')
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
  const { vote } = req.body;
  const userId = req.user._id;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApplicationError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  // Can't vote on own review
  if (review.user.toString() === userId.toString()) {
    throw new ApplicationError('Cannot vote on your own review', 400, 'CANNOT_VOTE_OWN_REVIEW');
  }

  await review.vote(userId, vote);

  successResponse(res, {
    helpfulVotes: review.helpfulVotes,
    unhelpfulVotes: review.unhelpfulVotes,
    helpfulnessRatio: review.helpfulnessRatio
  }, 'Vote recorded successfully');
}));

/**
 * @route   POST /api/reviews/:reviewId/flag
 * @desc    Flag a review as inappropriate
 * @access  Private
 * @body    reason, description
 */
router.post('/:reviewId/flag', [
  authenticate,
  
  body('reason')
    .isIn(['inappropriate', 'spam', 'fake', 'offensive', 'other'])
    .withMessage('Invalid flag reason'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
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
  const { reason, description } = req.body;
  const userId = req.user._id;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApplicationError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  try {
    await review.flag(userId, reason, description);
    successResponse(res, null, 'Review flagged successfully');
  } catch (error) {
    throw new ApplicationError(error.message, 400, 'FLAG_ERROR');
  }
}));

/**
 * @route   POST /api/reviews/:reviewId/respond
 * @desc    Respond to a review (Admin only)
 * @access  Private (Admin)
 * @body    response
 */
router.post('/:reviewId/respond', [
  authenticate,
  requireAdmin,
  
  body('response')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Response must be between 10 and 1000 characters')
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
  const { response } = req.body;
  const adminId = req.user._id;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApplicationError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  await review.respond(adminId, response);

  successResponse(res, review, 'Response added successfully');
}));

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get reviews by a specific user
 * @access  Public
 * @query   page, limit
 */
router.get('/user/:userId', [
  conditionalCache.userSpecific,
  
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

  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Validate user ID format
  if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApplicationError('Invalid user ID format', 400, 'INVALID_USER_ID');
  }

  const reviews = await Review.getUserReviews(userId, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  const totalReviews = await Review.countDocuments({ 
    user: userId, 
    status: 'approved' 
  });

  const totalPages = Math.ceil(totalReviews / parseInt(limit));

  successResponse(res, {
    reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      totalItems: totalReviews
    }
  }, 'User reviews retrieved successfully');
}));

/**
 * @route   GET /api/reviews/stats/:productId
 * @desc    Get review statistics for a product
 * @access  Public
 */
router.get('/stats/:productId', [
  conditionalCache.products
], asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Validate product ID format
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApplicationError('Invalid product ID format', 400, 'INVALID_PRODUCT_ID');
  }

  const stats = await Review.getReviewStats(productId);

  successResponse(res, stats, 'Review statistics retrieved successfully');
}));

module.exports = router;