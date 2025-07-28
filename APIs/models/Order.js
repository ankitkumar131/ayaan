/**
 * Order Model
 * 
 * Defines the order schema for the e-commerce platform.
 * Manages complete order lifecycle from placement to delivery,
 * including payment processing, shipping, and order status tracking.
 */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required for order item']
  },
  
  // Product details at time of order (for historical accuracy)
  productName: {
    type: String,
    required: [true, 'Product name is required']
  },
  
  productImage: {
    type: String,
    default: null
  },
  
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  
  // Product variants ordered
  size: {
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42'],
    default: null
  },
  
  color: {
    name: {
      type: String,
      default: null
    },
    code: {
      type: String,
      default: null
    }
  },
  
  // Pricing at time of order
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price must be positive']
  },
  
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price must be positive']
  },
  
  // Item-specific status for partial shipments
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  
  // Return/refund information
  returnRequest: {
    requested: {
      type: Boolean,
      default: false
    },
    reason: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed'],
      default: null
    },
    requestedAt: {
      type: Date,
      default: null
    },
    processedAt: {
      type: Date,
      default: null
    }
  }
});

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // Customer information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for order']
  },
  
  // Order items
  items: [orderItemSchema],
  
  // Shipping address
  shippingAddress: {
    firstName: {
      type: String,
      required: [true, 'First name is required for shipping']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required for shipping']
    },
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      match: [/^\d{5,6}(-\d{4})?$/, 'Please enter a valid ZIP code']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required for shipping']
    }
  },
  
  // Billing address
  billingAddress: {
    firstName: {
      type: String,
      required: [true, 'First name is required for billing']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required for billing']
    },
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      match: [/^\d{5,6}(-\d{4})?$/, 'Please enter a valid ZIP code']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required for billing']
    }
  },
  
  // Payment information
  paymentInfo: {
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'cod']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      default: null
    },
    paymentDate: {
      type: Date,
      default: null
    },
    // Encrypted payment details (never store raw card info)
    paymentDetails: {
      type: String,
      default: null
    }
  },
  
  // Order totals
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal must be positive']
  },
  
  // Applied discount
  discount: {
    code: {
      type: String,
      default: null
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount must be positive']
    }
  },
  
  // Tax information
  tax: {
    rate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate must be positive']
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Tax amount must be positive']
    }
  },
  
  // Shipping information
  shipping: {
    method: {
      type: String,
      default: 'standard'
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost must be positive']
    },
    trackingNumber: {
      type: String,
      default: null
    },
    carrier: {
      type: String,
      default: null
    },
    estimatedDelivery: {
      type: Date,
      default: null
    },
    actualDelivery: {
      type: Date,
      default: null
    }
  },
  
  // Final total
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total must be positive']
  },
  
  // Order status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // Status history for tracking
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  }],
  
  // Order notes
  notes: {
    customer: {
      type: String,
      default: null
    },
    admin: {
      type: String,
      default: null
    }
  },
  
  // Fulfillment information
  fulfillment: {
    warehouse: {
      type: String,
      default: null
    },
    packedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    packedAt: {
      type: Date,
      default: null
    },
    shippedAt: {
      type: Date,
      default: null
    }
  },
  
  // Customer communication
  emailsSent: [{
    type: {
      type: String,
      enum: ['confirmation', 'processing', 'shipped', 'delivered', 'cancelled']
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Return and refund tracking
  returns: [{
    items: [{
      orderItem: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }],
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'received', 'processed'],
      default: 'requested'
    },
    refundAmount: {
      type: Number,
      min: 0
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date,
      default: null
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for full shipping address
orderSchema.virtual('fullShippingAddress').get(function() {
  const addr = this.shippingAddress;
  return `${addr.firstName} ${addr.lastName}, ${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Indexes for better performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'paymentInfo.status': 1 });
orderSchema.index({ 'shipping.trackingNumber': 1 });

// Pre-save middleware to generate order number and add status history
orderSchema.pre('save', function(next) {
  // Generate order number if new order
  if (this.isNew) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${timestamp}-${random}`;
    
    // Add initial status to history
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: 'Order created'
    });
  }
  
  // Add status change to history if status was modified
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: `Status changed to ${this.status}`
    });
  }
  
  next();
});

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, note = null, updatedBy = null) {
  const validTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'cancelled'],
    'delivered': ['refunded'],
    'cancelled': [],
    'refunded': []
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot change status from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note: note,
    updatedBy: updatedBy
  });
  
  // Update specific timestamps
  if (newStatus === 'shipped') {
    this.fulfillment.shippedAt = new Date();
  }
  
  return this.save();
};

// Method to add tracking information
orderSchema.methods.addTrackingInfo = function(trackingNumber, carrier) {
  this.shipping.trackingNumber = trackingNumber;
  this.shipping.carrier = carrier;
  
  // Update status to shipped if not already
  if (this.status === 'processing') {
    this.status = 'shipped';
    this.fulfillment.shippedAt = new Date();
  }
  
  return this.save();
};

// Method to process refund
orderSchema.methods.processRefund = async function(items, reason, refundAmount) {
  const returnRequest = {
    items: items,
    reason: reason,
    status: 'requested',
    refundAmount: refundAmount,
    requestedAt: new Date()
  };
  
  this.returns.push(returnRequest);
  
  // Update item statuses
  items.forEach(returnItem => {
    const orderItem = this.items.id(returnItem.orderItem);
    if (orderItem) {
      orderItem.returnRequest.requested = true;
      orderItem.returnRequest.reason = reason;
      orderItem.returnRequest.status = 'pending';
      orderItem.returnRequest.requestedAt = new Date();
    }
  });
  
  return this.save();
};

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((total, item) => {
    item.totalPrice = item.unitPrice * item.quantity;
    return total + item.totalPrice;
  }, 0);
  
  // Calculate tax
  this.tax.amount = (this.subtotal - this.discount.amount) * this.tax.rate;
  
  // Calculate final total
  this.total = this.subtotal - this.discount.amount + this.tax.amount + this.shipping.cost;
  
  // Ensure total is not negative
  this.total = Math.max(0, this.total);
};

// Static method to find orders by user
orderSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ status: status }).sort({ createdAt: -1 });
};

// Static method to find orders requiring attention
orderSchema.statics.findRequiringAttention = function() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  return this.find({
    $or: [
      { status: 'pending', createdAt: { $lt: threeDaysAgo } },
      { status: 'processing', createdAt: { $lt: threeDaysAgo } },
      { 'returns.status': 'requested' }
    ]
  }).sort({ createdAt: -1 });
};

// Static method to get sales statistics
orderSchema.statics.getSalesStats = async function(startDate, endDate) {
  const matchStage = {
    status: { $in: ['delivered', 'shipped'] },
    createdAt: { $gte: startDate, $lte: endDate }
  };
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        totalItems: { $sum: { $sum: '$items.quantity' } }
      }
    }
  ]);
  
  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalItems: 0
  };
};

module.exports = mongoose.model('Order', orderSchema);