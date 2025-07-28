/**
 * Category Routes
 * 
 * Handles category management including CRUD operations, hierarchical structure,
 * and public category browsing for the e-commerce platform.
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler, ApplicationError, successResponse } = require('../middleware/errorHandler');
const { uploadProductImages } = require('../middleware/upload');

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories with optional filtering
 * @access  Public
 * @query   parent, gender, featured, includeInactive
 */
router.get('/', [
  query('parent')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID'),
  
  query('gender')
    .optional()
    .isIn(['men', 'women', 'unisex', 'kids'])
    .withMessage('Invalid gender filter'),
  
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  query('includeInactive')
    .optional()
    .isBoolean()
    .withMessage('Include inactive must be a boolean')
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
    parent,
    gender,
    featured,
    includeInactive = false
  } = req.query;
  
  // Build query
  const query = {};
  
  // Only show active categories unless specifically requested
  if (includeInactive !== 'true') {
    query.isActive = true;
  }
  
  // Parent filter
  if (parent) {
    query.parent = parent;
  } else if (parent === null || parent === 'null') {
    query.parent = null; // Get main categories only
  }
  
  // Gender filter
  if (gender) {
    query.gender = gender;
  }
  
  // Featured filter
  if (featured === 'true') {
    query.isFeatured = true;
  }
  
  // Execute query
  const categories = await Category.find(query)
    .populate('parent', 'name slug')
    .sort({ order: 1, name: 1 })
    .lean();
  
  // Add product count for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const productCount = await Product.countDocuments({
        category: category._id,
        isActive: true
      });
      
      return {
        ...category,
        productCount
      };
    })
  );
  
  successResponse(res, categoriesWithCount, 'Categories retrieved successfully');
}));

/**
 * @route   GET /api/categories/main
 * @desc    Get main categories (no parent)
 * @access  Public
 */
router.get('/main', asyncHandler(async (req, res) => {
  const mainCategories = await Category.getMainCategories()
    .lean();
  
  // Add product count and subcategory count for each main category
  const categoriesWithDetails = await Promise.all(
    mainCategories.map(async (category) => {
      const [productCount, subcategoryCount] = await Promise.all([
        Product.countDocuments({
          category: category._id,
          isActive: true
        }),
        Category.countDocuments({
          parent: category._id,
          isActive: true
        })
      ]);
      
      return {
        ...category,
        productCount,
        subcategoryCount
      };
    })
  );
  
  successResponse(res, categoriesWithDetails, 'Main categories retrieved successfully');
}));

/**
 * @route   GET /api/categories/featured
 * @desc    Get featured categories
 * @access  Public
 */
router.get('/featured', asyncHandler(async (req, res) => {
  const featuredCategories = await Category.getFeaturedCategories()
    .lean();
  
  // Add product count for each featured category
  const categoriesWithCount = await Promise.all(
    featuredCategories.map(async (category) => {
      const productCount = await Product.countDocuments({
        category: category._id,
        isActive: true
      });
      
      return {
        ...category,
        productCount
      };
    })
  );
  
  successResponse(res, categoriesWithCount, 'Featured categories retrieved successfully');
}));

/**
 * @route   GET /api/categories/gender/:gender
 * @desc    Get categories by gender
 * @access  Public
 */
router.get('/gender/:gender', asyncHandler(async (req, res) => {
  const { gender } = req.params;
  
  // Validate gender
  if (!['men', 'women', 'unisex', 'kids'].includes(gender)) {
    throw new ApplicationError('Invalid gender parameter', 400, 'INVALID_GENDER');
  }
  
  const categories = await Category.getCategoriesByGender(gender)
    .lean();
  
  // Add product count for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const productCount = await Product.countDocuments({
        category: category._id,
        isActive: true
      });
      
      return {
        ...category,
        productCount
      };
    })
  );
  
  successResponse(res, categoriesWithCount, `${gender.charAt(0).toUpperCase() + gender.slice(1)} categories retrieved successfully`);
}));

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by ID
 * @access  Public
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate ObjectId
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApplicationError('Invalid category ID', 400, 'INVALID_CATEGORY_ID');
  }
  
  const category = await Category.findById(id)
    .populate('parent', 'name slug')
    .lean();
  
  if (!category) {
    throw new ApplicationError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }
  
  // Get additional information
  const [productCount, subcategories, breadcrumbs] = await Promise.all([
    Product.countDocuments({
      category: category._id,
      isActive: true
    }),
    Category.find({
      parent: category._id,
      isActive: true
    }).sort({ order: 1, name: 1 }).lean(),
    Category.findById(id).then(cat => cat ? cat.getBreadcrumbs() : [])
  ]);
  
  const categoryWithDetails = {
    ...category,
    productCount,
    subcategories,
    breadcrumbs
  };
  
  successResponse(res, categoryWithDetails, 'Category retrieved successfully');
}));

/**
 * @route   GET /api/categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const category = await Category.findOne({ slug, isActive: true })
    .populate('parent', 'name slug')
    .lean();
  
  if (!category) {
    throw new ApplicationError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }
  
  // Get additional information
  const [productCount, subcategories, breadcrumbs] = await Promise.all([
    Product.countDocuments({
      category: category._id,
      isActive: true
    }),
    Category.find({
      parent: category._id,
      isActive: true
    }).sort({ order: 1, name: 1 }).lean(),
    Category.findById(category._id).then(cat => cat.getBreadcrumbs())
  ]);
  
  const categoryWithDetails = {
    ...category,
    productCount,
    subcategories,
    breadcrumbs
  };
  
  successResponse(res, categoryWithDetails, 'Category retrieved successfully');
}));

/**
 * @route   GET /api/categories/:id/products
 * @desc    Get products in a category
 * @access  Public
 * @query   page, limit, sort, includeSubcategories
 */
router.get('/:id/products', [
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
    .isIn(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'oldest', 'rating', 'popular'])
    .withMessage('Invalid sort option'),
  
  query('includeSubcategories')
    .optional()
    .isBoolean()
    .withMessage('Include subcategories must be a boolean')
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
  const {
    page = 1,
    limit = 12,
    sort = 'newest',
    includeSubcategories = false
  } = req.query;
  
  // Find category
  const category = await Category.findById(id);
  if (!category) {
    throw new ApplicationError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }
  
  // Build query
  let categoryQuery = { category: id };
  
  // Include subcategories if requested
  if (includeSubcategories === 'true') {
    const subcategories = await category.getAllSubcategories();
    const categoryIds = [id, ...subcategories.map(sub => sub._id)];
    categoryQuery = { category: { $in: categoryIds } };
  }
  
  const query = {
    ...categoryQuery,
    isActive: true
  };
  
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
  
  const totalPages = Math.ceil(totalProducts / limitNum);
  
  successResponse(res, {
    products,
    category: {
      _id: category._id,
      name: category.name,
      slug: category.slug
    },
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems: totalProducts,
      itemsPerPage: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    }
  }, 'Category products retrieved successfully');
}));

/**
 * @route   POST /api/categories
 * @desc    Create new category (Admin only)
 * @access  Private (Admin)
 * @headers Authorization: Bearer <admin_token>
 * @body    name, description, parent, gender, order, image (file)
 */
router.post('/', [
  authenticate,
  requireAdmin,
  uploadProductImages,
  
  // Validation middleware
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID'),
  
  body('gender')
    .optional()
    .isIn(['men', 'women', 'unisex', 'kids'])
    .withMessage('Invalid gender value'),
  
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  
  body('categoryType')
    .optional()
    .isIn(['main', 'subcategory', 'product-type'])
    .withMessage('Invalid category type')
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
    parent,
    gender = 'unisex',
    order = 0,
    categoryType = 'main',
    metaTitle,
    metaDescription
  } = req.body;
  
  // Check if parent category exists
  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      throw new ApplicationError('Parent category not found', 404, 'PARENT_CATEGORY_NOT_FOUND');
    }
  }
  
  // Check if category name already exists
  const existingCategory = await Category.findOne({ name: name.trim() });
  if (existingCategory) {
    throw new ApplicationError('Category name already exists', 400, 'CATEGORY_NAME_EXISTS');
  }
  
  // Create category data
  const categoryData = {
    name: name.trim(),
    description,
    parent: parent || null,
    gender,
    order: parseInt(order),
    categoryType,
    isActive: true,
    metaTitle: metaTitle || name.trim(),
    metaDescription
  };
  
  // Add category image if uploaded
  if (req.uploadedImages && req.uploadedImages.length > 0) {
    categoryData.image = {
      url: req.uploadedImages[0].url,
      alt: req.uploadedImages[0].alt || name
    };
  }
  
  const category = new Category(categoryData);
  await category.save();
  
  // Populate parent for response
  await category.populate('parent', 'name slug');
  
  successResponse(res, category, 'Category created successfully', 201);
}));

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category (Admin only)
 * @access  Private (Admin)
 * @headers Authorization: Bearer <admin_token>
 */
router.put('/:id', [
  authenticate,
  requireAdmin,
  uploadProductImages,
  
  // Validation middleware (all optional for updates)
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID'),
  
  body('gender')
    .optional()
    .isIn(['men', 'women', 'unisex', 'kids'])
    .withMessage('Invalid gender value'),
  
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
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
  
  // Find category
  const category = await Category.findById(id);
  if (!category) {
    throw new ApplicationError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }
  
  const updateData = {};
  
  // Update basic fields
  const basicFields = ['name', 'description', 'gender', 'order', 'categoryType', 'metaTitle', 'metaDescription'];
  basicFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });
  
  // Handle parent category update
  if (req.body.parent !== undefined) {
    if (req.body.parent) {
      // Check if parent exists
      const parentCategory = await Category.findById(req.body.parent);
      if (!parentCategory) {
        throw new ApplicationError('Parent category not found', 404, 'PARENT_CATEGORY_NOT_FOUND');
      }
      
      // Prevent circular reference
      if (req.body.parent === id) {
        throw new ApplicationError('Category cannot be its own parent', 400, 'CIRCULAR_REFERENCE');
      }
      
      updateData.parent = req.body.parent;
    } else {
      updateData.parent = null;
    }
  }
  
  // Check if name is being changed and if it's unique
  if (updateData.name && updateData.name !== category.name) {
    const existingCategory = await Category.findOne({
      name: updateData.name,
      _id: { $ne: id }
    });
    if (existingCategory) {
      throw new ApplicationError('Category name already exists', 400, 'CATEGORY_NAME_EXISTS');
    }
  }
  
  // Handle status updates
  if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive === 'true';
  if (req.body.isFeatured !== undefined) updateData.isFeatured = req.body.isFeatured === 'true';
  
  // Handle image update
  if (req.uploadedImages && req.uploadedImages.length > 0) {
    updateData.image = {
      url: req.uploadedImages[0].url,
      alt: req.uploadedImages[0].alt || updateData.name || category.name
    };
  }
  
  // Update category
  Object.assign(category, updateData);
  await category.save();
  
  // Populate parent for response
  await category.populate('parent', 'name slug');
  
  successResponse(res, category, 'Category updated successfully');
}));

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category (Admin only)
 * @access  Private (Admin)
 * @headers Authorization: Bearer <admin_token>
 */
router.delete('/:id', [
  authenticate,
  requireAdmin
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  if (!category) {
    throw new ApplicationError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }
  
  // Check if category has products
  const hasProducts = await category.hasProducts();
  if (hasProducts) {
    throw new ApplicationError('Cannot delete category with products. Move products to another category first.', 400, 'CATEGORY_HAS_PRODUCTS');
  }
  
  // Check if category has subcategories
  const subcategoryCount = await Category.countDocuments({ parent: id });
  if (subcategoryCount > 0) {
    throw new ApplicationError('Cannot delete category with subcategories. Delete subcategories first.', 400, 'CATEGORY_HAS_SUBCATEGORIES');
  }
  
  // Soft delete - deactivate instead of removing
  category.isActive = false;
  await category.save();
  
  successResponse(res, null, 'Category deleted successfully');
}));

/**
 * @route   GET /api/categories/:id/hierarchy
 * @desc    Get category hierarchy (breadcrumbs)
 * @access  Public
 */
router.get('/:id/hierarchy', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  if (!category) {
    throw new ApplicationError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }
  
  const breadcrumbs = await category.getBreadcrumbs();
  
  successResponse(res, breadcrumbs, 'Category hierarchy retrieved successfully');
}));

module.exports = router;