const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const Promotion = require('../models/promotion.model');

// Add to cart
router.post('/add', authenticate, async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Check if product already exists in cart
    const existingItem = cart.items.find(item => 
      item.product.toString() === productId &&
      item.size === size &&
      item.color.code === color.code
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = product.price;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        size,
        color,
        price: product.price
      });
    }

    await cart.save();
    
    // Populate product details
    await cart.populate('items.product');

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove from cart
router.delete('/remove/:productId', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const { size, color } = req.query;
    cart.items = cart.items.filter(item => 
      !(item.product.toString() === req.params.productId &&
        item.size === size &&
        item.color.code === color)
    );

    await cart.save();
    await cart.populate('items.product');

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update cart item quantity
router.put('/update/:productId', authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { size, color } = req.query;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(item => 
      item.product.toString() === req.params.productId &&
      item.size === size &&
      item.color.code === color
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Check stock
    const product = await Product.findById(req.params.productId);
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product');

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// View cart
router.get('/', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product')
      .populate('appliedPromoCode');

    if (!cart) {
      return res.json({ items: [], totalAmount: 0 });
    }

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply promotion code
router.post('/apply-promotion', authenticate, async (req, res) => {
  try {
    const { code } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const promotion = await Promotion.findOne({ code, isActive: true });
    if (!promotion) {
      return res.status(404).json({ message: 'Invalid promotion code' });
    }

    if (!promotion.isValid()) {
      return res.status(400).json({ message: 'Promotion is not valid' });
    }

    const subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const discount = promotion.calculateDiscount(subtotal);

    cart.appliedPromoCode = promotion._id;
    cart.discountAmount = discount;
    await cart.save();

    // Increment usage count
    promotion.usageCount += 1;
    await promotion.save();

    await cart.populate('items.product');
    await cart.populate('appliedPromoCode');

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove promotion code
router.delete('/remove-promotion', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.appliedPromoCode = undefined;
    cart.discountAmount = 0;
    await cart.save();

    await cart.populate('items.product');

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 