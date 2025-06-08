const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const Promotion = require('../models/promotion.model');
const { body, validationResult } = require('express-validator');

// Get all active promotions
router.get('/', async (req, res) => {
  try {
    const promotions = await Promotion.find({ 
      isActive: true,
      endDate: { $gt: new Date() }
    })
      .populate('applicableCategories')
      .populate('applicableProducts');
    res.json(promotions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get promotion by code
router.get('/:code', async (req, res) => {
  try {
    const promotion = await Promotion.findOne({ 
      code: req.params.code.toUpperCase(),
      isActive: true
    })
      .populate('applicableCategories')
      .populate('applicableProducts');

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    if (!promotion.isValid()) {
      return res.status(400).json({ message: 'Promotion is not valid' });
    }

    res.json(promotion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create promotion (Admin only)
router.post('/', [
  authenticate,
  isAdmin,
  body('code').trim().notEmpty().withMessage('Promotion code is required'),
  body('type').isIn(['percentage', 'fixed_amount']).withMessage('Invalid promotion type'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('minimumPurchase').optional().isFloat({ min: 0 }),
  body('maximumDiscount').optional().isFloat({ min: 0 }),
  body('usageLimit').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      code,
      type,
      value,
      description,
      startDate,
      endDate,
      minimumPurchase,
      maximumDiscount,
      usageLimit,
      applicableCategories,
      applicableProducts
    } = req.body;

    // Check if promotion code already exists
    const existingPromotion = await Promotion.findOne({ code: code.toUpperCase() });
    if (existingPromotion) {
      return res.status(400).json({ message: 'Promotion code already exists' });
    }

    const promotion = new Promotion({
      code: code.toUpperCase(),
      type,
      value,
      description,
      startDate,
      endDate,
      minimumPurchase,
      maximumDiscount,
      usageLimit,
      applicableCategories,
      applicableProducts
    });

    await promotion.save();
    res.status(201).json(promotion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update promotion (Admin only)
router.put('/:id', [
  authenticate,
  isAdmin,
  body('code').optional().trim().notEmpty().withMessage('Promotion code cannot be empty'),
  body('type').optional().isIn(['percentage', 'fixed_amount']).withMessage('Invalid promotion type'),
  body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('minimumPurchase').optional().isFloat({ min: 0 }),
  body('maximumDiscount').optional().isFloat({ min: 0 }),
  body('usageLimit').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    const updateFields = req.body;
    
    // If updating code, check if new code already exists
    if (updateFields.code) {
      const existingPromotion = await Promotion.findOne({
        code: updateFields.code.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingPromotion) {
        return res.status(400).json({ message: 'Promotion code already exists' });
      }
      updateFields.code = updateFields.code.toUpperCase();
    }

    Object.assign(promotion, updateFields);
    await promotion.save();

    res.json(promotion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete promotion (Admin only)
router.delete('/:id', [authenticate, isAdmin], async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    // Soft delete
    promotion.isActive = false;
    await promotion.save();

    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 