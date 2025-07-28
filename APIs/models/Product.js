/**
 * Product Model
 * 
 * Defines the product schema for the e-commerce clothing platform.
 * Includes comprehensive product information, variants (size, color),
 * inventory management, and review system integration.
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic product information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [3, 'Product name must be at least 3 characters long'],
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  
  // Pricing information
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be a positive number']
  },
  
  comparePrice: {
    type: Number,
    min: [0, 'Compare price must be a positive number'],
    validate: {
      validator: function(value) {
        return !value || value > this.price;
      },
      message: 'Compare price must be greater than regular price'
    }
  },
  
  costPrice: {
    type: Number,
    min: [0, 'Cost price must be a positive number']
  },
  
  // Product categorization
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Product variants
  sizes: [{
    name: {
      type: String,
      required: true,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42']
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock must be a positive number'],
      default: 0
    },
    price: {
      type: Number,
      min: [0, 'Size-specific price must be positive']
    }
  }],
  
  colors: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color code']
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock must be a positive number'],
      default: 0
    },
    images: [{
      url: String,
      alt: String
    }]
  }],
  
  // Inventory management
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock must be a positive number'],
    default: 0
  },
  
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  trackQuantity: {
    type: Boolean,
    default: true
  },
  
  allowBackorder: {
    type: Boolean,
    default: false
  },
  
  // Product images
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Product specifications for clothing
  specifications: {
    material: {
      type: String,
      trim: true
    },
    careInstructions: {
      type: String,
      trim: true
    },
    fit: {
      type: String,
      enum: ['slim', 'regular', 'loose', 'oversized'],
      default: 'regular'
    },
    season: {
      type: String,
      enum: ['spring', 'summer', 'autumn', 'winter', 'all-season'],
      default: 'all-season'
    },
    occasion: [{
      type: String,
      enum: ['casual', 'formal', 'party', 'work', 'sports', 'outdoor']
    }],
    brand: {
      type: String,
      trim: true
    },
    countryOfOrigin: {
      type: String,
      trim: true
    }
  },
  
  // Product status and visibility
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isOnSale: {
    type: Boolean,
    default: false
  },
  
  // SEO properties
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  
  // Review and rating system
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  
  totalReviews: {
    type: Number,
    default: 0,
    min: [0, 'Total reviews cannot be negative']
  },
  
  // Sales tracking
  totalSales: {
    type: Number,
    default: 0,
    min: [0, 'Total sales cannot be negative']
  },
  
  // Timestamps for product lifecycle
  publishedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

// Virtual for total stock across all variants
productSchema.virtual('totalStock').get(function() {
  let total = this.stock;
  
  // Add size-specific stock
  if (this.sizes && this.sizes.length > 0) {
    total += this.sizes.reduce((sum, size) => sum + size.stock, 0);
  }
  
  // Add color-specific stock
  if (this.colors && this.colors.length > 0) {
    total += this.colors.reduce((sum, color) => sum + color.stock, 0);
  }
  
  return total;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  if (this.images && this.images.length > 0) {
    const primary = this.images.find(img => img.isPrimary);
    return primary || this.images[0];
  }
  return null;
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isOnSale: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ totalSales: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });

// Pre-save middleware to generate slug and set defaults
productSchema.pre('save', function(next) {
  // Generate slug from name
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Set meta title if not provided
  if (!this.metaTitle) {
    this.metaTitle = this.name;
  }
  
  // Set short description if not provided
  if (!this.shortDescription && this.description) {
    this.shortDescription = this.description.substring(0, 150) + '...';
  }
  
  // Set published date if product is being activated
  if (this.isActive && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Ensure at least one image is marked as primary
  if (this.images && this.images.length > 0) {
    const hasPrimary = this.images.some(img => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }
  }
  
  next();
});

// Static method to find active products
productSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find featured products
productSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ isFeatured: true, isActive: true })
    .limit(limit)
    .sort({ createdAt: -1 });
};

// Static method to find products on sale
productSchema.statics.findOnSale = function(limit = 10) {
  return this.find({ isOnSale: true, isActive: true })
    .limit(limit)
    .sort({ createdAt: -1 });
};

// Static method to search products
productSchema.statics.searchProducts = function(query, options = {}) {
  const searchQuery = {
    $text: { $search: query },
    isActive: true
  };
  
  // Add category filter if provided
  if (options.category) {
    searchQuery.category = options.category;
  }
  
  // Add price range filter if provided
  if (options.minPrice || options.maxPrice) {
    searchQuery.price = {};
    if (options.minPrice) searchQuery.price.$gte = options.minPrice;
    if (options.maxPrice) searchQuery.price.$lte = options.maxPrice;
  }
  
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Method to check if product is in stock
productSchema.methods.isInStock = function(size = null, color = null) {
  if (!this.trackQuantity) return true;
  
  // Check specific size stock
  if (size && this.sizes && this.sizes.length > 0) {
    const sizeVariant = this.sizes.find(s => s.name === size);
    return sizeVariant ? sizeVariant.stock > 0 : false;
  }
  
  // Check specific color stock
  if (color && this.colors && this.colors.length > 0) {
    const colorVariant = this.colors.find(c => c.name === color);
    return colorVariant ? colorVariant.stock > 0 : false;
  }
  
  // Check general stock
  return this.stock > 0 || this.allowBackorder;
};

// Method to update stock
productSchema.methods.updateStock = function(quantity, size = null, color = null) {
  if (!this.trackQuantity) return;
  
  // Update size-specific stock
  if (size && this.sizes && this.sizes.length > 0) {
    const sizeVariant = this.sizes.find(s => s.name === size);
    if (sizeVariant) {
      sizeVariant.stock = Math.max(0, sizeVariant.stock - quantity);
    }
  }
  
  // Update color-specific stock
  if (color && this.colors && this.colors.length > 0) {
    const colorVariant = this.colors.find(c => c.name === color);
    if (colorVariant) {
      colorVariant.stock = Math.max(0, colorVariant.stock - quantity);
    }
  }
  
  // Update general stock
  this.stock = Math.max(0, this.stock - quantity);
};

// Method to calculate average rating
productSchema.methods.calculateAverageRating = async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { product: this._id } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.averageRating = Math.round(stats[0].averageRating * 10) / 10;
    this.totalReviews = stats[0].totalReviews;
  } else {
    this.averageRating = 0;
    this.totalReviews = 0;
  }
  
  await this.save();
};

module.exports = mongoose.model('Product', productSchema);