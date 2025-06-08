const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const Order = require('../models/order.model');
const Product = require('../models/product.model');

// Leave a review for an order
router.post('/orders/:orderId/review', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only review delivered orders' });
    }

    // Add review to each product in the order
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      
      // Add review
      product.reviews.push({
        user: req.user.id,
        rating,
        comment,
        orderId: order._id
      });

      // Update product rating
      const totalRatings = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      product.ratings.average = totalRatings / product.reviews.length;
      product.ratings.count = product.reviews.length;

      await product.save();
    }

    res.json({ message: 'Review added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get reviews for an order
router.get('/orders/:orderId/reviews', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate({
        path: 'items.product',
        select: 'name reviews',
        match: { 'reviews.orderId': req.params.orderId }
      });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const reviews = order.items.map(item => ({
      product: {
        id: item.product._id,
        name: item.product.name
      },
      reviews: item.product.reviews.filter(review => 
        review.orderId.toString() === req.params.orderId
      )
    }));

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;