/**
 * Product Routes
 * 
 * Handles product management including CRUD operations, search, filtering,
 * and public product browsing for the e-commerce platform.
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const { asyncHandler, ApplicationError, successResponse, paginatedResponse } = require('../middleware/errorHandler');
const { uploadProductImages } = require('../middleware/upload');

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering, sorting, and pagination
 * @access  Public
 * @query   category, minPrice, maxPrice, sort, page, limit, search, featured, onSale
 */
router.get('/', [
  // Query validation
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'oldest', 'rating', 'popular'])
    .withMessage('Invalid sort option')
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
    category,
    minPrice,
    maxPrice,
    sort = 'newest',
    page = 1,
    limit = 12,
    search,
    featured,
    onSale
  } = req.query;
  
  // Build query
  const query = { isActive: true };
  
  // Category filter
  if (category) {
    query.category = category;
  }
  
  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }
  
  // Featured filter
  if (featured === 'true') {
    query.isFeatured = true;
  }
  
  // On sale filter
  if (onSale === 'true') {
    query.isOnSale = true;
  }
  
  // Search filter
  if (search) {
    query.$text = { $search: search };
  }
  
  // Build sort object
  let sortObj = {};
  switch (sort) {
    case 'price_asc':
      sortObj = { price: 1 };
      break;
    case 'price_desc':
      sortObj = { price: -1 };
      break;
    case 'name_asc':
      sortObj = { name: 1 };
      break;
    case 'name_desc':
      sortObj = { name: -1 };
      break;
    case 'oldest':
      sortObj = { createdAt: 1 };
      break;
    case 'rating':
      sortObj = { averageRating: -1, totalReviews: -1 };
      break;
    case 'popular':
      sortObj = { totalSales: -1 };
      break;
    default: // newest
      sortObj = { createdAt: -1 };
  }
  
  // Add text score for search results
  if (search) {
    sortObj.score = { $meta: 'textScore' };
  }
  
  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  
  // Execute query
  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query)
  ]);
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalProducts / limitNum);
  
  paginatedResponse(res, products, {
    page: pageNum,
    limit: limitNum,
    totalPages,
    totalItems: totalProducts
  }, 'Products retrieved successfully');
}));

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 * @query   limit
 */
router.get('/featured', [
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
  
  const limit = parseInt(req.query.limit) || 10;
  
  const products = await Product.findFeatured(limit)
    .populate('category', 'name slug')
    .lean();
  
  successResponse(res, products, 'Featured products retrieved successfully');
}));

/**
 * @route   GET /api/products/on-sale
 * @desc    Get products on sale
 * @access  Public
 * @query   limit
 */
router.get('/on-sale', [
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
  
  const limit = parseInt(req.query.limit) || 10;
  
  const products = await Product.findOnSale(limit)
    .populate('category', 'name slug')
    .lean();
  
  successResponse(res, products, 'Sale products retrieved successfully');
}));

/**
 * @route   GET /api/products/search
 * @desc    Search products
 * @access  Public
 * @query   q, category, minPrice, maxPrice, page, limit
 */
router.get('/search', [
  query('q')
    .notEmpty()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters long'),
  
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  
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
    q: searchQuery,
    category,
    minPrice,
    maxPrice,
    page = 1,
    limit = 12
  } = req.query;
  
  // Build search options
  const options = {};
  if (category) options.category = category;
  if (minPrice) options.minPrice = parseFloat(minPrice);
  if (maxPrice) options.maxPrice = parseFloat(maxPrice);
  
  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  
  // Execute search
  const searchResults = await Product.searchProducts(searchQuery, options)
    .populate('category', 'name slug')
    .skip(skip)
    .limit(limitNum)
    .lean();
  
  // Get total count for pagination
  const totalResults = await Product.searchProducts(searchQuery, options).countDocuments();
  const totalPages = Math.ceil(totalResults / limitNum);
  
  paginatedResponse(res, searchResults, {
    page: pageNum,
    limit: limitNum,
    totalPages,
    totalItems: totalResults
  }, `Search results for "${searchQuery}"`);
}));

/**
 * @route   GET /api/products/all
 * @desc    Get all products (admin only)
 * @access  Private/Admin
 */
router.get('/all', [
  authenticate,
  requireAdmin
], asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate('category', 'name slug')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    message: 'Products retrieved successfully',
    data: products
  });
}));

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate ObjectId
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApplicationError('Invalid product ID', 400, 'INVALID_PRODUCT_ID');
  }
  
  const product = await Product.findById(id)
    .populate('category', 'name slug')
    .populate({
      path: 'reviews',
      populate: {
        path: 'user',
        select: 'username'
      },
      match: { status: 'approved' },
      options: { sort: { createdAt: -1 }, limit: 10 }
    })
    .lean();
  
  if (!product) {
    throw new ApplicationError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }
  
  if (!product.isActive) {
    throw new ApplicationError('Product is not available', 404, 'PRODUCT_NOT_AVAILABLE');
  }
  
  successResponse(res, product, 'Product retrieved successfully');
}));

/**
 * @route   POST /api/products
 * @desc    Create new product (Admin only)
 * @access  Private (Admin)
 * @headers Authorization: Bearer <admin_token>
 * @body    name, description, price, category, stock, sku, sizes, colors, specifications, images (files)
 */
router.post('/', [
  authenticate,
  requireAdmin,
  uploadProductImages,
  
  // Validation middleware
  body('name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('category')
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ max: 50 })
    .withMessage('SKU cannot exceed 50 characters'),
  
  body('comparePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Compare price must be a positive number'),
  
  body('costPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number')
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
    name,
    description,
    price,
    category,
    stock,
    sku,
    comparePrice,
    costPrice,
    tags,
    specifications
  } = req.body;
  
  // Check if category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new ApplicationError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }
  
  // Check if SKU is unique
  const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
  if (existingProduct) {
    throw new ApplicationError('SKU already exists', 400, 'SKU_EXISTS');
  }
  
  // Process sizes if provided
  let sizes = [];
  if (req.body.sizes) {
    try {
      sizes = JSON.parse(req.body.sizes);
    } catch (error) {
      sizes = [];
    }
  }
  
  // Process colors if provided
  let colors = [];
  if (req.body.colors) {
    try {
      colors = JSON.parse(req.body.colors);
    } catch (error) {
      colors = [];
    }
  }
  
  // Process specifications if provided
  let parsedSpecifications = {};
  if (specifications) {
    try {
      parsedSpecifications = JSON.parse(specifications);
    } catch (error) {
      parsedSpecifications = {};
    }
  }
  
  // Process tags
  let processedTags = [];
  if (tags) {
    if (Array.isArray(tags)) {
      processedTags = tags;
    } else if (typeof tags === 'string') {
      processedTags = tags.split(',').map(tag => tag.trim().toLowerCase());
    }
  }
  
  // Create product data
  const productData = {
    name,
    description,
    price: parseFloat(price),
    category,
    stock: parseInt(stock),
    sku: sku.toUpperCase(),
    tags: processedTags,
    sizes,
    colors,
    specifications: parsedSpecifications,
    isActive: true
  };
  
  // Add optional fields
  if (comparePrice) productData.comparePrice = parseFloat(comparePrice);
  if (costPrice) productData.costPrice = parseFloat(costPrice);
  
  // Add uploaded images
  if (req.uploadedImages && req.uploadedImages.length > 0) {
    productData.images = req.uploadedImages.map((img, index) => ({
      url: img.url,
      alt: img.alt || name,
      isPrimary: index === 0 // First image is primary
    }));
  }
  
  const product = new Product(productData);
  await product.save();
  
  // Populate category for response
  await product.populate('category', 'name slug');
  
  successResponse(res, product, 'Product created successfully', 201);
}));

/**
 * @route   PUT /api/products/:id
 * @desc    Update product (Admin only)
 * @access  Private (Admin)
 * @headers Authorization: Bearer <admin_token>
 */
router.put('/:id', [
  authenticate,
  requireAdmin,
  uploadProductImages,
  
  // Validation middleware (same as create, but all optional)
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  
  body('sku')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('SKU cannot be empty')
    .isLength({ max: 50 })
    .withMessage('SKU cannot exceed 50 characters')
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
  
  // Find product
  const product = await Product.findById(id);
  if (!product) {
    throw new ApplicationError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }
  
  const updateData = {};
  
  // Update basic fields
  const basicFields = ['name', 'description', 'price', 'stock', 'comparePrice', 'costPrice'];
  basicFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });
  
  // Update category if provided
  if (req.body.category) {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      throw new ApplicationError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
    updateData.category = req.body.category;
  }
  
  // Update SKU if provided
  if (req.body.sku) {
    const existingProduct = await Product.findOne({ 
      sku: req.body.sku.toUpperCase(),
      _id: { $ne: id }
    });
    if (existingProduct) {
      throw new ApplicationError('SKU already exists', 400, 'SKU_EXISTS');
    }
    updateData.sku = req.body.sku.toUpperCase();
  }
  
  // Update complex fields
  if (req.body.sizes) {
    try {
      updateData.sizes = JSON.parse(req.body.sizes);
    } catch (error) {
      // Keep existing sizes if parsing fails
    }
  }
  
  if (req.body.colors) {
    try {
      updateData.colors = JSON.parse(req.body.colors);
    } catch (error) {
      // Keep existing colors if parsing fails
    }
  }
  
  if (req.body.specifications) {
    try {
      updateData.specifications = JSON.parse(req.body.specifications);
    } catch (error) {
      // Keep existing specifications if parsing fails
    }
  }
  
  if (req.body.tags) {
    if (Array.isArray(req.body.tags)) {
      updateData.tags = req.body.tags;
    } else if (typeof req.body.tags === 'string') {
      updateData.tags = req.body.tags.split(',').map(tag => tag.trim().toLowerCase());
    }
  }
  
  // Update status fields
  if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive === 'true';
  if (req.body.isFeatured !== undefined) updateData.isFeatured = req.body.isFeatured === 'true';
  if (req.body.isOnSale !== undefined) updateData.isOnSale = req.body.isOnSale === 'true';
  
  // Handle image updates
  if (req.uploadedImages && req.uploadedImages.length > 0) {
    // Add new images to existing ones
    const newImages = req.uploadedImages.map(img => ({
      url: img.url,
      alt: img.alt || product.name,
      isPrimary: false
    }));
    
    updateData.images = [...(product.images || []), ...newImages];
    
    // If no primary image exists, make first image primary
    if (!updateData.images.some(img => img.isPrimary) && updateData.images.length > 0) {
      updateData.images[0].isPrimary = true;
    }
  }
  
  // Update product
  Object.assign(product, updateData);
  await product.save();
  
  // Populate category for response
  await product.populate('category', 'name slug');
  
  successResponse(res, product, 'Product updated successfully');
}));

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (Admin only)
 * @access  Private (Admin)
 * @headers Authorization: Bearer <admin_token>
 */
router.delete('/:id', [
  authenticate,
  requireAdmin
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findById(id);
  if (!product) {
    throw new ApplicationError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }
  
  // Soft delete - deactivate instead of removing
  product.isActive = false;
  await product.save();
  
  // TODO: Handle related data (cart items, order items, etc.)
  
  successResponse(res, null, 'Product deleted successfully');
}));

/**
 * @route   GET /api/products/:id/related
 * @desc    Get related products
 * @access  Public
 * @query   limit
 */
router.get('/:id/related', [
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
  
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 8;
  
  // Find the product
  const product = await Product.findById(id);
  if (!product) {
    throw new ApplicationError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }
  
  // Find related products in the same category
  const relatedProducts = await Product.find({
    _id: { $ne: id },
    category: product.category,
    isActive: true
  })
    .populate('category', 'name slug')
    .limit(limit)
    .sort({ totalSales: -1, createdAt: -1 })
    .lean();
  
  successResponse(res, relatedProducts, 'Related products retrieved successfully');
}));

module.exports = router;