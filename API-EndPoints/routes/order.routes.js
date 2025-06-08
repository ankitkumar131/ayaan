const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

// Place order
router.post('/', authenticate, async (req, res) => {
  try {
    const { shippingAddress, paymentInfo } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product')
      .populate('appliedPromoCode');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate stock for all items
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`
        });
      }
    }

    // Create order
    const order = new Order({
      user: req.user.id,
      items: cart.items,
      shippingAddress,
      paymentInfo,
      totalAmount: cart.totalAmount,
      discountAmount: cart.discountAmount,
      appliedPromoCode: cart.appliedPromoCode
    });

    // Update product stock
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      product.stock -= item.quantity;
      await product.save();
    }

    await order.save();

    // Clear cart
    await Cart.findByIdAndDelete(cart._id);

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order history
router.get('/', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product')
      .populate('appliedPromoCode')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order details
router.get('/:orderId', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.id
    })
      .populate('items.product')
      .populate('appliedPromoCode');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Track order
router.get('/:orderId/track', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      status: order.status,
      trackingInfo: order.trackingInfo,
      statusHistory: order.statusHistory
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request refund
router.post('/:orderId/refund', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.refundRequest) {
      return res.status(400).json({ message: 'Refund already requested' });
    }

    if (!['delivered', 'shipped'].includes(order.status)) {
      return res.status(400).json({ message: 'Order not eligible for refund' });
    }

    order.refundRequest = {
      status: 'pending',
      reason,
      requestDate: new Date()
    };

    await order.save();

    res.json({ message: 'Refund request submitted', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request replacement
router.post('/:orderId/replacement', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Order not eligible for replacement' });
    }

    // Create new replacement order
    const replacementOrder = new Order({
      user: req.user.id,
      items: order.items,
      shippingAddress: order.shippingAddress,
      totalAmount: 0, // No charge for replacement
      status: 'processing',
      originalOrder: order._id
    });

    await replacementOrder.save();

    // Update original order status
    order.status = 'replacement_requested';
    order.statusHistory.push({
      status: 'replacement_requested',
      note: reason
    });

    await order.save();

    res.json({
      message: 'Replacement request submitted',
      originalOrder: order,
      replacementOrder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave review
router.post('/:orderId/review', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only review delivered orders' });
    }

    // Add review to each product in the order
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      
      // Check if user already reviewed this product
      const existingReview = product.ratings.find(
        r => r.user.toString() === req.user.id
      );

      if (existingReview) {
        existingReview.rating = rating;
        existingReview.review = comment;
        existingReview.date = new Date();
      } else {
        product.ratings.push({
          user: req.user.id,
          rating,
          review: comment
        });
      }

      await product.save();
    }

    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 