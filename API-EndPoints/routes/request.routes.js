const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const Order = require('../models/order.model');

// Request replacement for an order
router.post('/orders/:orderId/replacement', authenticate, async (req, res) => {
  try {
    const { reason, items } = req.body;
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['delivered', 'shipped'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Replacement can only be requested for delivered or shipped orders' 
      });
    }

    // Create replacement request
    order.replacementRequest = {
      status: 'pending',
      reason,
      items: items || order.items, // If no specific items, replace all
      requestedAt: new Date()
    };

    await order.save();
    res.json({ message: 'Replacement request submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request refund for an order
router.post('/orders/:orderId/refund', authenticate, async (req, res) => {
  try {
    const { reason, items } = req.body;
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['delivered', 'shipped'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Refund can only be requested for delivered or shipped orders' 
      });
    }

    // Create refund request
    order.refundRequest = {
      status: 'pending',
      reason,
      items: items || order.items, // If no specific items, refund all
      requestedAt: new Date(),
      amount: items ? 
        items.reduce((sum, item) => sum + item.total, 0) : 
        order.total
    };

    await order.save();
    res.json({ message: 'Refund request submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get request statuses for an order
router.get('/orders/:orderId/requests', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const requests = {
      replacement: order.replacementRequest || null,
      refund: order.refundRequest || null
    };

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update request status
router.put('/orders/:orderId/requests/:type', authenticate, isAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const requestType = req.params.type;
    if (!['replacement', 'refund'].includes(requestType)) {
      return res.status(400).json({ message: 'Invalid request type' });
    }

    const request = order[`${requestType}Request`];
    if (!request) {
      return res.status(404).json({ message: `No ${requestType} request found` });
    }

    request.status = status;
    request.note = note;
    request.updatedAt = new Date();

    if (status === 'approved') {
      if (requestType === 'refund') {
        order.status = 'refunded';
      } else if (requestType === 'replacement') {
        // Create a new replacement order
        // Implementation depends on business logic
      }
    }

    await order.save();
    res.json({ message: `${requestType} request updated successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;