/**
 * Promotion Model
 * 
 * Defines the promotion/discount schema for the e-commerce platform.
 * Manages discount codes, promotional campaigns, and usage tracking.
 * Supports percentage and fixed amount discounts with various conditions.
 */

const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  // Basic promotion information
  name: {
    type: String,
    required: [true, 'Promotion name is required'],
    trim: true,
    maxlength: [100, 'Promotion name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Promotion code
  code: {
    type: String,
    required: [true, 'Promotion code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Promotion code must be at least 3 characters'],
    maxlength: [20, 'Promotion code cannot exceed 20 characters'],
    match: [/^[A-Z0-9]+$/, 'Promotion code can only contain uppercase letters and numbers']
  },
  
  // Discount configuration
  discountType: {
    type: String,
    required: [true, 'Discount type is required'],
    enum: ['percentage', 'fixed']
  },
  
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value must be positive']
  },
  
  // Maximum discount amount (for percentage discounts)
  maxDiscountAmount: {
    type: Number,
    min: [0, 'Maximum discount amount must be positive'],
    default: null
  },
  
  // Minimum purchase requirement
  minimumPurchase: {
    type: Number,
    min: [0, 'Minimum purchase must be positive'],
    default: 0
  },
  
  // Validity period
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  
  // Usage limitations
  usageLimit: {
    type: Number,
    min: [1, 'Usage limit must be at least 1'],
    default: null // null means unlimited
  },
  
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  },
  
  // Per-user usage limit
  userUsageLimit: {
    type: Number,
    min: [1, 'User usage limit must be at least 1'],
    default: 1
  },
  
  // Applicable products/categories
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Exclusions
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  excludedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Customer eligibility
  eligibleUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Customer type restrictions
  customerType: {
    type: String,
    enum: ['all', 'new', 'existing', 'vip'],
    default: 'all'
  },
  
  // Promotion status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Promotion type
  promotionType: {
    type: String,
    enum: ['coupon', 'automatic', 'bogo', 'free_shipping'],
    default: 'coupon'
  },
  
  // BOGO (Buy One Get One) configuration
  bogoConfig: {
    buyQuantity: {
      type: Number,
      min: [1, 'Buy quantity must be at least 1'],
      default: 1
    },
    getQuantity: {
      type: Number,
      min: [1, 'Get quantity must be at least 1'],
      default: 1
    },
    getDiscountPercentage: {
      type: Number,
      min: [0, 'Get discount percentage must be positive'],
      max: [100, 'Get discount percentage cannot exceed 100'],
      default: 100 // 100% = free
    }
  },
  
  // Usage tracking
  usageHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    discountAmount: {
      type: Number,
      required: true,
      min: [0, 'Discount amount must be positive']
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Analytics
  analytics: {
    totalSavings: {
      type: Number,
      default: 0,
      min: [0, 'Total savings cannot be negative']
    },
    conversionRate: {
      type: Number,
      default: 0,
      min: [0, 'Conversion rate cannot be negative'],
      max: [1, 'Conversion rate cannot exceed 100%']
    },
    averageOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'Average order value cannot be negative']
    }
  },
  
  // Creator information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for remaining usage
promotionSchema.virtual('remainingUsage').get(function() {
  if (!this.usageLimit) return null; // Unlimited
  return Math.max(0, this.usageLimit - this.usageCount);
});

// Virtual for usage percentage
promotionSchema.virtual('usagePercentage').get(function() {
  if (!this.usageLimit) return 0;
  return Math.round((this.usageCount / this.usageLimit) * 100);
});

// Virtual for promotion status
promotionSchema.virtual('status').get(function() {
  const now = new Date();
  
  if (!this.isActive) return 'inactive';
  if (now < this.startDate) return 'scheduled';
  if (now > this.endDate) return 'expired';
  if (this.usageLimit && this.usageCount >= this.usageLimit) return 'exhausted';
  
  return 'active';
});

// Virtual for days remaining
promotionSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const timeDiff = this.endDate - now;
  return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
});

// Indexes for better performance
promotionSchema.index({ code: 1 });
promotionSchema.index({ isActive: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ promotionType: 1 });
promotionSchema.index({ createdBy: 1 });
promotionSchema.index({ 'usageHistory.user': 1 });

// Pre-save middleware
promotionSchema.pre('save', function(next) {
  // Ensure code is uppercase
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  
  // Validate discount value based on type
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }
  
  next();
});

// Method to check if promotion is valid
promotionSchema.methods.isValid = function(userId = null) {
  const now = new Date();
  
  // Check if promotion is active
  if (!this.isActive) {
    return { valid: false, reason: 'Promotion is not active' };
  }
  
  // Check date validity
  if (now < this.startDate) {
    return { valid: false, reason: 'Promotion has not started yet' };
  }
  
  if (now > this.endDate) {
    return { valid: false, reason: 'Promotion has expired' };
  }
  
  // Check usage limit
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    return { valid: false, reason: 'Promotion usage limit exceeded' };
  }
  
  // Check user-specific usage limit
  if (userId && this.userUsageLimit) {
    const userUsageCount = this.usageHistory.filter(
      usage => usage.user.toString() === userId.toString()
    ).length;
    
    if (userUsageCount >= this.userUsageLimit) {
      return { valid: false, reason: 'User usage limit exceeded' };
    }
  }
  
  return { valid: true };
};

// Method to calculate discount amount
promotionSchema.methods.calculateDiscount = function(subtotal, items = []) {
  let discountAmount = 0;
  
  // Check if promotion applies to the items
  if (this.applicableProducts.length > 0 || this.applicableCategories.length > 0) {
    // Calculate discount only on applicable items
    const applicableAmount = this.getApplicableAmount(items);
    
    if (this.discountType === 'percentage') {
      discountAmount = (applicableAmount * this.discountValue) / 100;
    } else {
      discountAmount = Math.min(this.discountValue, applicableAmount);
    }
  } else {
    // Apply to entire subtotal
    if (this.discountType === 'percentage') {
      discountAmount = (subtotal * this.discountValue) / 100;
    } else {
      discountAmount = Math.min(this.discountValue, subtotal);
    }
  }
  
  // Apply maximum discount limit for percentage discounts
  if (this.discountType === 'percentage' && this.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, this.maxDiscountAmount);
  }
  
  return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
};

// Method to get applicable amount from items
promotionSchema.methods.getApplicableAmount = function(items) {
  let applicableAmount = 0;
  
  items.forEach(item => {
    let isApplicable = false;
    
    // Check if product is in applicable products
    if (this.applicableProducts.length > 0) {
      isApplicable = this.applicableProducts.some(
        productId => productId.toString() === item.product.toString()
      );
    }
    
    // Check if product category is in applicable categories
    if (!isApplicable && this.applicableCategories.length > 0) {
      // This would require product population to check category
      // For now, assume it's handled in the calling code
    }
    
    // Check exclusions
    if (isApplicable) {
      // Check excluded products
      if (this.excludedProducts.some(
        productId => productId.toString() === item.product.toString()
      )) {
        isApplicable = false;
      }
      
      // Check excluded categories (similar logic as above)
    }
    
    if (isApplicable) {
      applicableAmount += item.totalPrice;
    }
  });
  
  return applicableAmount;
};

// Method to record usage
promotionSchema.methods.recordUsage = function(userId, orderId, discountAmount) {
  this.usageHistory.push({
    user: userId,
    order: orderId,
    discountAmount: discountAmount,
    usedAt: new Date()
  });
  
  this.usageCount += 1;
  this.analytics.totalSavings += discountAmount;
  
  return this.save();
};

// Static method to find active promotions
promotionSchema.statics.findActive = function() {
  const now = new Date();
  
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ['$usageCount', '$usageLimit'] } }
    ]
  });
};

// Static method to find promotions by code
promotionSchema.statics.findByCode = function(code) {
  return this.findOne({ 
    code: code.toUpperCase(),
    isActive: true
  });
};

// Static method to find automatic promotions
promotionSchema.statics.findAutomatic = function() {
  const now = new Date();
  
  return this.find({
    promotionType: 'automatic',
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
};

// Static method to get promotion analytics
promotionSchema.statics.getAnalytics = async function(startDate, endDate) {
  const analytics = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalPromotions: { $sum: 1 },
        activePromotions: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        totalUsage: { $sum: '$usageCount' },
        totalSavings: { $sum: '$analytics.totalSavings' }
      }
    }
  ]);
  
  return analytics[0] || {
    totalPromotions: 0,
    activePromotions: 0,
    totalUsage: 0,
    totalSavings: 0
  };
};

module.exports = mongoose.model('Promotion', promotionSchema);