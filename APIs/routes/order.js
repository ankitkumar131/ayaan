/**
 * Order Routes
 * 
 * Handles order management including order placement, tracking, history,
 * reviews, returns, and refunds for the e-commerce platform.
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { authenticate, requireOwnershipOrAdmin } = require('../middleware/auth');
const { asyncHandler, ApplicationError, successResponse, paginatedResponse } = require('../middleware/errorHandler');
const { uploadReviewImages } = require('../middleware/upload');

const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Place a new order
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    shippingAddress, billingAddress, paymentMethod
 */
router.post('/', [
  authenticate,
  
  // Shipping address validation
  body('shippingAddress.firstName')
    .trim()
    .notEmpty()
    .withMessage('Shipping first name is required'),
  
  body('shippingAddress.lastName')
    .trim()
    .notEmpty()
    .withMessage('Shipping last name is required'),
  
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Shipping street address is required'),
  
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('Shipping city is required'),
  
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('Shipping state is required'),
  
  body('shippingAddress.country')
    .trim()
    .notEmpty()
    .withMessage('Shipping country is required'),
  
  body('shippingAddress.zipCode')
    .matches(/^\d{5,6}(-\d{4})?$/)
    .withMessage('Please provide a valid shipping ZIP code'),
  
  body('shippingAddress.phone')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid shipping phone number'),
  
  // Billing address validation
  body('billingAddress.firstName')
    .trim()
    .notEmpty()
    .withMessage('Billing first name is required'),
  
  body('billingAddress.lastName')
    .trim()
    .notEmpty()
    .withMessage('Billing last name is required'),
  
  body('billingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Billing street address is required'),
  
  body('billingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('Billing city is required'),
  
  body('billingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('Billing state is required'),
  
  body('billingAddress.country')
    .trim()
    .notEmpty()
    .withMessage('Billing country is required'),
  
  body('billingAddress.zipCode')
    .matches(/^\d{5,6}(-\d{4})?$/)
    .withMessage('Please provide a valid billing ZIP code'),
  
  body('billingAddress.phone')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid billing phone number'),
  
  // Payment method validation
  body('paymentMethod.type')
    .isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'cod'])
    .withMessage('Invalid payment method type'),
  
  body('paymentMethod.details')
    .notEmpty()
    .withMessage('Payment details are required')
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
  const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;
  
  // Get user's cart
  const cart = await Cart.findByUser(userId)
    .populate('items.product', 'name price images stock isActive');
  
  if (!cart || cart.isEmpty()) {
    throw new ApplicationError('Cart is empty', 400, 'EMPTY_CART');
  }
  
  // Validate cart items
  const validationErrors = await cart.validateCart();
  if (validationErrors.length > 0) {
    throw new ApplicationError('Cart validation failed: ' + validationErrors.join(', '), 400, 'CART_VALIDATION_FAILED');
  }
  
  // Create order items from cart
  const orderItems = cart.items.map(item => ({
    product: item.product._id,
    productName: item.product.name,
    productImage: item.product.images && item.product.images.length > 0 
      ? item.product.images[0].url 
      : null,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice
  }));
  
  // Create order
  const orderData = {
    user: userId,
    items: orderItems,
    shippingAddress,
    billingAddress,
    paymentInfo: {
      method: paymentMethod.type,
      status: 'pending',
      // Note: In production, encrypt payment details
      paymentDetails: JSON.stringify(paymentMethod.details)
    },
    subtotal: cart.subtotal,
    discount: {
      code: cart.appliedPromotion?.code || null,
      amount: cart.appliedPromotion?.discountAmount || 0
    },
    tax: {
      rate: cart.taxRate,
      amount: cart.taxAmount
    },
    shipping: {
      method: 'standard',
      cost: cart.shippingCost
    },
    total: cart.total,
    status: 'pending'
  };
  
  if (notes?.customer) {
    orderData.notes = { customer: notes.customer };
  }
  
  const order = new Order(orderData);
  await order.save();
  
  // Update product stock
  for (const item of cart.items) {
    const product = await Product.findById(item.product._id);
    if (product) {
      product.updateStock(item.quantity, item.size, item.color?.name);
      product.totalSales += item.quantity;
      await product.save();
    }
  }
  
  // Record promotion usage if applied
  if (cart.appliedPromotion?.code) {
    const Promotion = require('../models/Promotion');
    const promotion = await Promotion.findByCode(cart.appliedPromotion.code);
    if (promotion) {
      await promotion.recordUsage(userId, order._id, cart.appliedPromotion.discountAmount);
    }
  }
  
  // Clear cart
  await cart.clearCart();
  
  // Populate order for response
  await order.populate([
    { path: 'user', select: 'username email' },
    { path: 'items.product', select: 'name slug images' }
  ]);
  
  successResponse(res, order, 'Order placed successfully', 201);
}));

/**
 * @route   GET /api/orders
 * @desc    Get user's order history
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @query   page, limit, status
 */
router.get('/', [
  authenticate,
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
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
  
  const userId = req.user._id;
  const { page = 1, limit = 10, status } = req.query;
  
  // Build query
  const query = { user: userId };
  if (status) {
    query.status = status;
  }
  
  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  
  // Execute query
  const [orders, totalOrders] = await Promise.all([
    Order.find(query)
      .populate('items.product', 'name slug images')
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
  }, 'Order history retrieved successfully');
}));

/**
 * @route   GET /api/orders/:id
 * @desc    Get specific order details
 * @access  Private (Owner or Admin)
 * @headers Authorization: Bearer <token>
 */
router.get('/:id', [
  authenticate,
  requireOwnershipOrAdmin('user')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await Order.findById(id)
    .populate([
      { path: 'user', select: 'username email' },
      { path: 'items.product', select: 'name slug images' }
    ]);
  
  if (!order) {
    throw new ApplicationError('Order not found', 404, 'ORDER_NOT_FOUND');
  }
  
  // Check ownership if not admin
  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
    throw new ApplicationError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  successResponse(res, order, 'Order details retrieved successfully');
}));

/**
 * @route   GET /api/orders/:id/track
 * @desc    Track order status
 * @access  Private (Owner or Admin)
 * @headers Authorization: Bearer <token>
 */
router.get('/:id/track', [
  authenticate,
  requireOwnershipOrAdmin('user')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await Order.findById(id)
    .select('orderNumber status statusHistory shipping createdAt')
    .lean();
  
  if (!order) {
    throw new ApplicationError('Order not found', 404, 'ORDER_NOT_FOUND');
  }
  
  // Check ownership if not admin
  if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
    throw new ApplicationError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  const trackingInfo = {
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.shipping?.trackingNumber || null,
    carrier: order.shipping?.carrier || null,
    estimatedDelivery: order.shipping?.estimatedDelivery || null,
    statusHistory: order.statusHistory,
    orderDate: order.createdAt
  };
  
  successResponse(res, trackingInfo, 'Order tracking information retrieved successfully');
}));

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private (Owner only)
 * @headers Authorization: Bearer <token>
 * @body    reason
 */
router.post('/:id/cancel', [
  authenticate,
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { id } = req.params;
  const { reason } = req.body;
  
  const order = await Order.findById(id);
  
  if (!order) {
    throw new ApplicationError('Order not found', 404, 'ORDER_NOT_FOUND');
  }
  
  // Check ownership
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApplicationError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  // Check if order can be cancelled
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new ApplicationError('Order cannot be cancelled at this stage', 400, 'CANNOT_CANCEL_ORDER');
  }
  
  // Cancel order
  await order.updateStatus('cancelled', reason || 'Cancelled by customer', req.user._id);
  
  // Restore product stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      // Add back the stock
      product.updateStock(-item.quantity, item.size, item.color?.name);
      product.totalSales = Math.max(0, product.totalSales - item.quantity);
      await product.save();
    }
  }
  
  successResponse(res, order, 'Order cancelled successfully');
}));

/**
 * @route   POST /api/orders/:id/review
 * @desc    Leave a review for ordered products
 * @access  Private (Owner only)
 * @headers Authorization: Bearer <token>
 * @body    productId, rating, title, comment, images (files)
 */
router.post('/:id/review', [
  authenticate,
  uploadReviewImages,
  
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
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
  
  const { id } = req.params;
  const { productId, rating, title, comment } = req.body;
  
  const order = await Order.findById(id);
  
  if (!order) {
    throw new ApplicationError('Order not found', 404, 'ORDER_NOT_FOUND');
  }
  
  // Check ownership
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApplicationError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  // Check if order is delivered
  if (order.status !== 'delivered') {
    throw new ApplicationError('Can only review delivered orders', 400, 'ORDER_NOT_DELIVERED');
  }
  
  // Check if product was in the order
  const orderItem = order.items.find(item => item.product.toString() === productId);
  if (!orderItem) {
    throw new ApplicationError('Product not found in this order', 400, 'PRODUCT_NOT_IN_ORDER');
  }
  
  // Check if review already exists
  const existingReview = await Review.findOne({
    user: req.user._id,
    product: productId,
    order: id
  });
  
  if (existingReview) {
    throw new ApplicationError('Review already exists for this product', 400, 'REVIEW_EXISTS');
  }
  
  // Create review
  const reviewData = {
    product: productId,
    user: req.user._id,
    order: id,
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
    
    // Recalculate product rating
    await product.calculateAverageRating();
  }
  
  successResponse(res, review, 'Review submitted successfully', 201);
}));

/**
 * @route   POST /api/orders/:id/replacement
 * @desc    Request product replacement
 * @access  Private (Owner only)
 * @headers Authorization: Bearer <token>
 * @body    reason, items, images (files)
 */
router.post('/:id/replacement', [
  authenticate,
  uploadReviewImages,
  
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Replacement reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
  
  body('items.*.productId')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { id } = req.params;
  const { reason, items } = req.body;
  
  const order = await Order.findById(id);
  
  if (!order) {
    throw new ApplicationError('Order not found', 404, 'ORDER_NOT_FOUND');
  }
  
  // Check ownership
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApplicationError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  // Check if order is delivered
  if (order.status !== 'delivered') {
    throw new ApplicationError('Can only request replacement for delivered orders', 400, 'ORDER_NOT_DELIVERED');
  }
  
  // Check if replacement window is still open (e.g., 30 days)
  const deliveryDate = order.shipping?.actualDelivery || order.updatedAt;
  const daysSinceDelivery = Math.floor((Date.now() - deliveryDate) / (1000 * 60 * 60 * 24));
  
  if (daysSinceDelivery > 30) {
    throw new ApplicationError('Replacement window has expired (30 days)', 400, 'REPLACEMENT_WINDOW_EXPIRED');
  }
  
  // Process replacement items
  let replacementItems = [];
  if (items && items.length > 0) {
    replacementItems = items.map(item => ({
      orderItem: order.items.find(orderItem => 
        orderItem.product.toString() === item.productId
      )?._id,
      quantity: item.quantity
    })).filter(item => item.orderItem);
  } else {
    // If no specific items, include all items
    replacementItems = order.items.map(item => ({
      orderItem: item._id,
      quantity: item.quantity
    }));
  }
  
  // Create replacement request
  const replacementData = {
    items: replacementItems,
    reason,
    status: 'requested',
    requestedAt: new Date()
  };
  
  // Process replacement
  await order.processRefund(replacementItems, reason, 0); // No refund amount for replacement
  
  successResponse(res, order, 'Replacement request submitted successfully');
}));

/**
 * @route   POST /api/orders/:id/refund
 * @desc    Request order refund
 * @access  Private (Owner only)
 * @headers Authorization: Bearer <token>
 * @body    reason, items, bankDetails, images (files)
 */
router.post('/:id/refund', [
  authenticate,
  uploadReviewImages,
  
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Refund reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  body('bankDetails.accountNumber')
    .trim()
    .notEmpty()
    .withMessage('Bank account number is required'),
  
  body('bankDetails.ifscCode')
    .trim()
    .notEmpty()
    .withMessage('IFSC code is required'),
  
  body('bankDetails.accountHolderName')
    .trim()
    .notEmpty()
    .withMessage('Account holder name is required'),
  
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { id } = req.params;
  const { reason, items, bankDetails } = req.body;
  
  const order = await Order.findById(id);
  
  if (!order) {
    throw new ApplicationError('Order not found', 404, 'ORDER_NOT_FOUND');
  }
  
  // Check ownership
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApplicationError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  // Check if order can be refunded
  if (!['delivered', 'shipped'].includes(order.status)) {
    throw new ApplicationError('Order cannot be refunded at this stage', 400, 'CANNOT_REFUND_ORDER');
  }
  
  // Check refund window (e.g., 30 days)
  const orderDate = order.createdAt;
  const daysSinceOrder = Math.floor((Date.now() - orderDate) / (1000 * 60 * 60 * 24));
  
  if (daysSinceOrder > 30) {
    throw new ApplicationError('Refund window has expired (30 days)', 400, 'REFUND_WINDOW_EXPIRED');
  }
  
  // Process refund items and calculate amount
  let refundItems = [];
  let refundAmount = 0;
  
  if (items && items.length > 0) {
    refundItems = items.map(item => {
      const orderItem = order.items.find(orderItem => 
        orderItem.product.toString() === item.productId
      );
      if (orderItem) {
        refundAmount += orderItem.totalPrice * (item.quantity / orderItem.quantity);
        return {
          orderItem: orderItem._id,
          quantity: item.quantity
        };
      }
      return null;
    }).filter(item => item);
  } else {
    // Full refund
    refundItems = order.items.map(item => ({
      orderItem: item._id,
      quantity: item.quantity
    }));
    refundAmount = order.total;
  }
  
  // Store bank details securely (in production, encrypt this)
  const refundData = {
    ...refundItems,
    reason,
    bankDetails: JSON.stringify(bankDetails),
    refundAmount
  };
  
  // Process refund request
  await order.processRefund(refundItems, reason, refundAmount);
  
  successResponse(res, order, 'Refund request submitted successfully');
}));

/**
 * @route   GET /api/orders/:id/requests
 * @desc    Get order return/refund requests
 * @access  Private (Owner or Admin)
 * @headers Authorization: Bearer <token>
 */
router.get('/:id/requests', [
  authenticate,
  requireOwnershipOrAdmin('user')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await Order.findById(id)
    .select('returns user')
    .populate('returns.items.orderItem', 'productName quantity');
  
  if (!order) {
    throw new ApplicationError('Order not found', 404, 'ORDER_NOT_FOUND');
  }
  
  // Check ownership if not admin
  if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
    throw new ApplicationError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  successResponse(res, {
    orderId: id,
    returns: order.returns
  }, 'Order requests retrieved successfully');
}));

module.exports = router;