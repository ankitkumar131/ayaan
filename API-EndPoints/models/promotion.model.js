const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed_amount'],
    default: 'percentage'
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  minimumPurchase: {
    type: Number,
    default: 0
  },
  maximumDiscount: {
    type: Number
  },
  usageLimit: {
    type: Number
  },
  usageCount: {
    type: Number,
    default: 0
  },
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Check if promotion is valid
promotionSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (!this.usageLimit || this.usageCount < this.usageLimit)
  );
};

// Calculate discount amount
promotionSchema.methods.calculateDiscount = function(subtotal) {
  if (!this.isValid()) return 0;

  if (subtotal < this.minimumPurchase) return 0;

  let discount = 0;
  if (this.type === 'percentage') {
    discount = (subtotal * this.value) / 100;
  } else {
    discount = this.value;
  }

  if (this.maximumDiscount) {
    discount = Math.min(discount, this.maximumDiscount);
  }

  return discount;
};

module.exports = mongoose.model('Promotion', promotionSchema); 