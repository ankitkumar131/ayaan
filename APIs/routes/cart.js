/**
 * Cart Routes
 * 
 * Handles shopping cart operations including adding/removing items,
 * updating quantities, applying promotions, and cart management.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, ApplicationError, successResponse } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  let cart = await Cart.findByUser(userId)
    .populate({
      path: 'items.product',
      select: 'name price images stock isActive',
      populate: {
        path: 'category',
        select: 'name slug'
      }
    });
  
  // Create empty cart if none exists
  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [],
      subtotal: 0,
      total: 0
    });
    await cart.save();
  }
  
  // Validate cart items and update if necessary
  const validationErrors = await cart.validateCart();
  
  successResponse(res, {
    cart,
    validationErrors: validationErrors.length > 0 ? validationErrors : null
  }, 'Cart retrieved successfully');
}));

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    productId, quantity, size, color, specifications
 */
router.post('/add', [
  authenticate,
  
  // Validation middleware
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('quantity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10'),
  
  body('size')
    .optional()
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42'])
    .withMessage('Invalid size option'),
  
  body('color.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Color name must be between 1 and 50 characters'),
  
  body('color.code')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Invalid color code format')
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
  const { productId, quantity, size, color, specifications } = req.body;
  
  // Find or create cart
  let cart = await Cart.findByUser(userId);
  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [],
      subtotal: 0,
      total: 0
    });
  }
  
  // Add item to cart
  const options = {};
  if (size) options.size = size;
  if (color) options.color = color;
  if (specifications) options.specifications = specifications;
  
  await cart.addItem(productId, quantity, options);
  
  // Populate cart items for response
  await cart.populate({
    path: 'items.product',
    select: 'name price images stock isActive',
    populate: {
      path: 'category',
      select: 'name slug'
    }
  });
  
  successResponse(res, cart, 'Item added to cart successfully');
}));

/**
 * @route   PUT /api/cart/update/:itemId
 * @desc    Update cart item quantity
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    quantity
 */
router.put('/update/:itemId', [
  authenticate,
  
  // Validation middleware
  body('quantity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10')
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
  const { itemId } = req.params;
  const { quantity } = req.body;
  
  // Find user's cart
  const cart = await Cart.findByUser(userId);
  if (!cart) {
    throw new ApplicationError('Cart not found', 404, 'CART_NOT_FOUND');
  }
  
  // Update item quantity
  await cart.updateItemQuantity(itemId, quantity);
  
  // Populate cart items for response
  await cart.populate({
    path: 'items.product',
    select: 'name price images stock isActive',
    populate: {
      path: 'category',
      select: 'name slug'
    }
  });
  
  successResponse(res, cart, 'Cart item updated successfully');
}));

/**
 * @route   DELETE /api/cart/remove/:itemId
 * @desc    Remove item from cart
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.delete('/remove/:itemId', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { itemId } = req.params;
  
  // Find user's cart
  const cart = await Cart.findByUser(userId);
  if (!cart) {
    throw new ApplicationError('Cart not found', 404, 'CART_NOT_FOUND');
  }
  
  // Remove item from cart
  await cart.removeItem(itemId);
  
  // Populate cart items for response
  await cart.populate({
    path: 'items.product',
    select: 'name price images stock isActive',
    populate: {
      path: 'category',
      select: 'name slug'
    }
  });
  
  successResponse(res, cart, 'Item removed from cart successfully');
}));

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear all items from cart
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.delete('/clear', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Find user's cart
  const cart = await Cart.findByUser(userId);
  if (!cart) {
    throw new ApplicationError('Cart not found', 404, 'CART_NOT_FOUND');
  }
  
  // Clear cart
  await cart.clearCart();
  
  successResponse(res, cart, 'Cart cleared successfully');
}));

/**
 * @route   POST /api/cart/apply-promotion
 * @desc    Apply promotion code to cart
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    code
 */
router.post('/apply-promotion', [
  authenticate,
  
  // Validation middleware
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Promotion code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Promotion code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Promotion code can only contain uppercase letters and numbers')
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
  const { code } = req.body;
  
  // Find user's cart
  const cart = await Cart.findByUser(userId);
  if (!cart) {
    throw new ApplicationError('Cart not found', 404, 'CART_NOT_FOUND');
  }
  
  if (cart.isEmpty()) {
    throw new ApplicationError('Cannot apply promotion to empty cart', 400, 'EMPTY_CART');
  }
  
  // Apply promotion
  await cart.applyPromotion(code.toUpperCase());
  
  // Populate cart items for response
  await cart.populate({
    path: 'items.product',
    select: 'name price images stock isActive',
    populate: {
      path: 'category',
      select: 'name slug'
    }
  });
  
  successResponse(res, cart, 'Promotion applied successfully');
}));

/**
 * @route   DELETE /api/cart/remove-promotion
 * @desc    Remove promotion code from cart
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.delete('/remove-promotion', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Find user's cart
  const cart = await Cart.findByUser(userId);
  if (!cart) {
    throw new ApplicationError('Cart not found', 404, 'CART_NOT_FOUND');
  }
  
  // Remove promotion
  await cart.removePromotion();
  
  // Populate cart items for response
  await cart.populate({
    path: 'items.product',
    select: 'name price images stock isActive',
    populate: {
      path: 'category',
      select: 'name slug'
    }
  });
  
  successResponse(res, cart, 'Promotion removed successfully');
}));

/**
 * @route   POST /api/cart/validate
 * @desc    Validate cart items (check stock, prices, etc.)
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.post('/validate', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Find user's cart
  const cart = await Cart.findByUser(userId);
  if (!cart) {
    throw new ApplicationError('Cart not found', 404, 'CART_NOT_FOUND');
  }
  
  // Validate cart
  const validationErrors = await cart.validateCart();
  
  // Populate cart items for response
  await cart.populate({
    path: 'items.product',
    select: 'name price images stock isActive',
    populate: {
      path: 'category',
      select: 'name slug'
    }
  });
  
  successResponse(res, {
    cart,
    isValid: validationErrors.length === 0,
    validationErrors
  }, 'Cart validation completed');
}));

/**
 * @route   GET /api/cart/summary
 * @desc    Get cart summary (totals only)
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/summary', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const cart = await Cart.findByUser(userId);
  
  if (!cart) {
    return successResponse(res, {
      totalItems: 0,
      uniqueItems: 0,
      subtotal: 0,
      taxAmount: 0,
      shippingCost: 0,
      discountAmount: 0,
      total: 0,
      appliedPromotion: null
    }, 'Cart summary retrieved successfully');
  }
  
  const summary = {
    totalItems: cart.totalItems,
    uniqueItems: cart.uniqueItems,
    subtotal: cart.subtotal,
    taxAmount: cart.taxAmount,
    shippingCost: cart.shippingCost,
    discountAmount: cart.appliedPromotion?.discountAmount || 0,
    total: cart.total,
    appliedPromotion: cart.appliedPromotion?.code || null
  };
  
  successResponse(res, summary, 'Cart summary retrieved successfully');
}));

/**
 * @route   POST /api/cart/estimate-shipping
 * @desc    Estimate shipping cost for cart
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    zipCode, country
 */
router.post('/estimate-shipping', [
  authenticate,
  
  // Validation middleware
  body('zipCode')
    .matches(/^\d{5,6}(-\d{4})?$/)
    .withMessage('Please provide a valid ZIP code'),
  
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ max: 100 })
    .withMessage('Country name cannot exceed 100 characters')
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
  const { zipCode, country } = req.body;
  
  // Find user's cart
  const cart = await Cart.findByUser(userId);
  if (!cart) {
    throw new ApplicationError('Cart not found', 404, 'CART_NOT_FOUND');
  }
  
  if (cart.isEmpty()) {
    throw new ApplicationError('Cannot estimate shipping for empty cart', 400, 'EMPTY_CART');
  }
  
  // Simple shipping calculation (in production, integrate with shipping API)
  let shippingCost = 0;
  
  // Basic shipping logic
  if (country.toLowerCase() === 'united states' || country.toLowerCase() === 'usa') {
    // Domestic shipping
    if (cart.subtotal >= 50) {
      shippingCost = 0; // Free shipping over $50
    } else {
      shippingCost = 5.99; // Standard domestic shipping
    }
  } else {
    // International shipping
    shippingCost = 15.99;
  }
  
  // Update cart with shipping cost
  cart.shippingCost = shippingCost;
  cart.calculateTotals();
  await cart.save();
  
  const shippingEstimate = {
    zipCode,
    country,
    shippingCost,
    estimatedDelivery: {
      min: 3,
      max: 7,
      unit: 'business days'
    },
    freeShippingThreshold: country.toLowerCase() === 'united states' || country.toLowerCase() === 'usa' ? 50 : null
  };
  
  successResponse(res, {
    shippingEstimate,
    cartTotal: cart.total
  }, 'Shipping cost estimated successfully');
}));

/**
 * @route   GET /api/cart/count
 * @desc    Get cart item count (for header display)
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/count', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const cart = await Cart.findByUser(userId);
  
  const count = cart ? cart.totalItems : 0;
  
  successResponse(res, { count }, 'Cart count retrieved successfully');
}));

module.exports = router;