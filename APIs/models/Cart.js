/**
 * Cart Model
 * 
 * Defines the shopping cart schema for the e-commerce platform.
 * Manages cart items, quantities, product variants, and pricing calculations.
 * Supports promotion codes and automatic total calculations.
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required for cart item']
  },
  
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [10, 'Maximum quantity per item is 10']
  },
  
  // Product variants selected
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
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color code'],
      default: null
    }
  },
  
  // Price at the time of adding to cart
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price must be positive']
  },
  
  // Total price for this item (unitPrice * quantity)
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price must be positive']
  },
  
  // Custom specifications or notes
  specifications: {
    type: Map,
    of: String,
    default: new Map()
  },
  
  // Timestamp when item was added
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  // Cart owner
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for cart']
  },
  
  // Cart items
  items: [cartItemSchema],
  
  // Pricing calculations
  subtotal: {
    type: Number,
    default: 0,
    min: [0, 'Subtotal must be positive']
  },
  
  // Applied promotion
  appliedPromotion: {
    code: {
      type: String,
      default: null
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: null
    },
    discountValue: {
      type: Number,
      min: [0, 'Discount value must be positive'],
      default: 0
    },
    discountAmount: {
      type: Number,
      min: [0, 'Discount amount must be positive'],
      default: 0
    }
  },
  
  // Tax calculation
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate must be positive'],
    max: [1, 'Tax rate cannot exceed 100%']
  },
  
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount must be positive']
  },
  
  // Shipping calculation
  shippingCost: {
    type: Number,
    default: 0,
    min: [0, 'Shipping cost must be positive']
  },
  
  // Final total
  total: {
    type: Number,
    default: 0,
    min: [0, 'Total must be positive']
  },
  
  // Cart status
  status: {
    type: String,
    enum: ['active', 'abandoned', 'converted'],
    default: 'active'
  },
  
  // Session information for guest carts
  sessionId: {
    type: String,
    default: null
  },
  
  // Expiration for abandoned cart cleanup
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for unique items count
cartSchema.virtual('uniqueItems').get(function() {
  return this.items.length;
});

// Virtual for cart weight (if needed for shipping)
cartSchema.virtual('totalWeight').get(function() {
  // This would require product weight information
  return this.items.reduce((total, item) => {
    // Assuming each item has a weight property
    return total + (item.quantity * (item.weight || 0));
  }, 0);
});

// Indexes for better performance
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ status: 1 });
cartSchema.index({ updatedAt: -1 });
cartSchema.index({ expiresAt: 1 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.calculateTotals();
  next();
});

// Method to calculate all totals
cartSchema.methods.calculateTotals = function() {
  // Calculate subtotal
  this.subtotal = this.items.reduce((total, item) => {
    item.totalPrice = item.unitPrice * item.quantity;
    return total + item.totalPrice;
  }, 0);
  
  // Apply promotion discount
  let discountAmount = 0;
  if (this.appliedPromotion && this.appliedPromotion.code) {
    if (this.appliedPromotion.discountType === 'percentage') {
      discountAmount = (this.subtotal * this.appliedPromotion.discountValue) / 100;
    } else if (this.appliedPromotion.discountType === 'fixed') {
      discountAmount = Math.min(this.appliedPromotion.discountValue, this.subtotal);
    }
    this.appliedPromotion.discountAmount = discountAmount;
  }
  
  // Calculate tax on discounted amount
  const taxableAmount = this.subtotal - discountAmount;
  this.taxAmount = taxableAmount * this.taxRate;
  
  // Calculate final total
  this.total = this.subtotal - discountAmount + this.taxAmount + this.shippingCost;
  
  // Ensure total is not negative
  this.total = Math.max(0, this.total);
};

// Method to add item to cart
cartSchema.methods.addItem = async function(productId, quantity, options = {}) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (!product.isActive) {
    throw new Error('Product is not available');
  }
  
  // Check stock availability
  if (!product.isInStock(options.size, options.color)) {
    throw new Error('Product is out of stock');
  }
  
  // Check if item already exists in cart
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId.toString() &&
    item.size === options.size &&
    item.color?.name === options.color?.name
  );
  
  if (existingItemIndex > -1) {
    // Update existing item quantity
    const newQuantity = this.items[existingItemIndex].quantity + quantity;
    if (newQuantity > 10) {
      throw new Error('Maximum quantity per item is 10');
    }
    this.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    const newItem = {
      product: productId,
      quantity: quantity,
      size: options.size || null,
      color: options.color || { name: null, code: null },
      unitPrice: product.price,
      totalPrice: product.price * quantity,
      specifications: options.specifications || new Map(),
      addedAt: new Date()
    };
    
    this.items.push(newItem);
  }
  
  // Update cart totals
  this.calculateTotals();
  
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId.toString());
  this.calculateTotals();
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.find(item => item._id.toString() === itemId.toString());
  
  if (!item) {
    throw new Error('Item not found in cart');
  }
  
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }
  
  if (quantity > 10) {
    throw new Error('Maximum quantity per item is 10');
  }
  
  item.quantity = quantity;
  this.calculateTotals();
  
  return this.save();
};

// Method to apply promotion code
cartSchema.methods.applyPromotion = async function(promotionCode) {
  const Promotion = mongoose.model('Promotion');
  const promotion = await Promotion.findOne({ 
    code: promotionCode,
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  });
  
  if (!promotion) {
    throw new Error('Invalid or expired promotion code');
  }
  
  // Check minimum purchase requirement
  if (promotion.minimumPurchase && this.subtotal < promotion.minimumPurchase) {
    throw new Error(`Minimum purchase of $${promotion.minimumPurchase} required`);
  }
  
  // Check usage limits
  if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
    throw new Error('Promotion code usage limit exceeded');
  }
  
  // Apply promotion
  this.appliedPromotion = {
    code: promotion.code,
    discountType: promotion.discountType,
    discountValue: promotion.discountValue,
    discountAmount: 0 // Will be calculated in calculateTotals
  };
  
  this.calculateTotals();
  
  return this.save();
};

// Method to remove promotion
cartSchema.methods.removePromotion = function() {
  this.appliedPromotion = {
    code: null,
    discountType: null,
    discountValue: 0,
    discountAmount: 0
  };
  
  this.calculateTotals();
  
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.removePromotion();
  this.calculateTotals();
  
  return this.save();
};

// Method to check if cart is empty
cartSchema.methods.isEmpty = function() {
  return this.items.length === 0;
};

// Method to validate cart items (check stock, prices, etc.)
cartSchema.methods.validateCart = async function() {
  const Product = mongoose.model('Product');
  const errors = [];
  
  for (let i = 0; i < this.items.length; i++) {
    const item = this.items[i];
    const product = await Product.findById(item.product);
    
    if (!product) {
      errors.push(`Product ${item.product} not found`);
      continue;
    }
    
    if (!product.isActive) {
      errors.push(`Product ${product.name} is no longer available`);
      continue;
    }
    
    if (!product.isInStock(item.size, item.color?.name)) {
      errors.push(`Product ${product.name} is out of stock`);
      continue;
    }
    
    // Check if price has changed
    if (item.unitPrice !== product.price) {
      item.unitPrice = product.price;
      errors.push(`Price updated for ${product.name}`);
    }
  }
  
  if (errors.length === 0) {
    this.calculateTotals();
    await this.save();
  }
  
  return errors;
};

// Static method to find cart by user
cartSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId, status: 'active' });
};

// Static method to find abandoned carts
cartSchema.statics.findAbandonedCarts = function(daysAgo = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
  
  return this.find({
    status: 'active',
    updatedAt: { $lt: cutoffDate },
    'items.0': { $exists: true } // Has at least one item
  });
};

// Static method to cleanup expired carts
cartSchema.statics.cleanupExpiredCarts = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

module.exports = mongoose.model('Cart', cartSchema);