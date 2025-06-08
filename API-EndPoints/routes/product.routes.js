const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const Product = require('../models/product.model');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const path = require('path');

// Import controllers
const createProduct = require('../controllers/product/create.controller');

// Import validators
const createProductValidator = require('../validators/product/create.validator');

// Configure multer for product images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/products'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 10
    } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const sortOptions = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOptions[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate('category')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalProducts: total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('ratings.user', 'username');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product (Admin only)
router.post('/',
  authenticate,
  isAdmin,
  upload.array('images', 5),
  createProductValidator,
  createProduct
);

// Update product (Admin only)
router.put('/:id',
  authenticate,
  isAdmin,
  upload.array('images', 5),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Parse form data
      const updateFields = req.body;
      
      // Handle arrays and objects
      if (req.body.sizes) {
        updateFields.sizes = Array.isArray(req.body.sizes) ? req.body.sizes : [req.body.sizes];
      }

      const colors = [];
      if (req.body['colors[0][name]']) {
        let index = 0;
        while (req.body[`colors[${index}][name]`]) {
          colors.push({
            name: req.body[`colors[${index}][name]`],
            code: req.body[`colors[${index}][code]`]
          });
          index++;
        }
        updateFields.colors = colors;
      }

      if (req.files && req.files.length > 0) {
        updateFields.images = req.files.map(file => ({
          url: `/uploads/products/${file.filename}`,
          alt: updateFields.name || product.name
        }));
      }

      Object.assign(product, updateFields);
      await product.save();
      await product.populate('category');

      res.json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete product (Admin only)
router.delete('/:id',
  authenticate,
  isAdmin,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Soft delete
      product.isActive = false;
      await product.save();

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Add review
router.post('/:id/reviews', [
  authenticate,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().trim().notEmpty().withMessage('Review cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { rating, review } = req.body;

    // Check if user already reviewed
    const existingReview = product.ratings.find(
      r => r.user.toString() === req.user.id
    );

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.review = review;
      existingReview.date = new Date();
    } else {
      product.ratings.push({
        user: req.user.id,
        rating,
        review,
        date: new Date()
      });
    }

    await product.save();
    await product.populate('ratings.user', 'username');

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 