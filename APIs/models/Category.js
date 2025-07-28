/**
 * Category Model
 * 
 * Defines the category schema for organizing products in the e-commerce platform.
 * Supports hierarchical categories with parent-child relationships.
 * Designed specifically for clothing categories (Men, Women, and subcategories).
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // Basic category information
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    minlength: [2, 'Category name must be at least 2 characters long'],
    maxlength: [100, 'Category name cannot exceed 100 characters']
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
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Hierarchical structure
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  
  // Category image
  image: {
    url: {
      type: String,
      default: null
    },
    alt: {
      type: String,
      default: ''
    }
  },
  
  // Display properties
  order: {
    type: Number,
    default: 0,
    min: [0, 'Order must be a positive number']
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
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
  
  // Category-specific properties for clothing
  categoryType: {
    type: String,
    enum: ['main', 'subcategory', 'product-type'],
    default: 'main'
  },
  
  // Gender specification for clothing
  gender: {
    type: String,
    enum: ['men', 'women', 'unisex', 'kids'],
    default: 'unisex'
  },
  
  // Size guide reference
  sizeGuide: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual for getting products in this category
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category'
});

// Virtual for product count
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Indexes for better performance
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ gender: 1 });
categorySchema.index({ categoryType: 1 });

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
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
  
  next();
});

// Pre-remove middleware to handle subcategories
categorySchema.pre('remove', async function(next) {
  try {
    // Find all subcategories
    const subcategories = await this.constructor.find({ parent: this._id });
    
    // Remove all subcategories
    for (const subcategory of subcategories) {
      await subcategory.remove();
    }
    
    // Update products to remove category reference
    await mongoose.model('Product').updateMany(
      { category: this._id },
      { $unset: { category: 1 } }
    );
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get main categories
categorySchema.statics.getMainCategories = function() {
  return this.find({ 
    parent: null, 
    isActive: true 
  }).sort({ order: 1, name: 1 });
};

// Static method to get categories by gender
categorySchema.statics.getCategoriesByGender = function(gender) {
  return this.find({ 
    gender: gender, 
    isActive: true 
  }).sort({ order: 1, name: 1 });
};

// Static method to get featured categories
categorySchema.statics.getFeaturedCategories = function() {
  return this.find({ 
    isFeatured: true, 
    isActive: true 
  }).sort({ order: 1, name: 1 });
};

// Method to get full category path
categorySchema.methods.getFullPath = async function() {
  const path = [this.name];
  let current = this;
  
  while (current.parent) {
    current = await this.constructor.findById(current.parent);
    if (current) {
      path.unshift(current.name);
    }
  }
  
  return path.join(' > ');
};

// Method to get all subcategories (recursive)
categorySchema.methods.getAllSubcategories = async function() {
  const subcategories = [];
  
  const findSubcategories = async (parentId) => {
    const subs = await this.constructor.find({ parent: parentId, isActive: true });
    
    for (const sub of subs) {
      subcategories.push(sub);
      await findSubcategories(sub._id);
    }
  };
  
  await findSubcategories(this._id);
  return subcategories;
};

// Method to check if category has products
categorySchema.methods.hasProducts = async function() {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ category: this._id });
  return count > 0;
};

// Method to get category hierarchy for breadcrumbs
categorySchema.methods.getBreadcrumbs = async function() {
  const breadcrumbs = [];
  let current = this;
  
  while (current) {
    breadcrumbs.unshift({
      _id: current._id,
      name: current.name,
      slug: current.slug
    });
    
    if (current.parent) {
      current = await this.constructor.findById(current.parent);
    } else {
      current = null;
    }
  }
  
  return breadcrumbs;
};

module.exports = mongoose.model('Category', categorySchema);