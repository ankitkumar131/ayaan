/**
 * Review Model
 * 
 * Defines the review schema for the e-commerce platform.
 * Manages product reviews, ratings, and moderation system.
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Core review information
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required for review']
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for review']
  },
  
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required for verified purchase']
  },
  
  // Review content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Review title cannot exceed 100 characters']
  },
  
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    minlength: [10, 'Review comment must be at least 10 characters'],
    maxlength: [1000, 'Review comment cannot exceed 1000 characters']
  },
  
  // Review images
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: 'Review image'
    }
  }],
  
  // Product variant information
  variant: {
    size: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42']
    },
    color: {
      name: String,
      code: String
    }
  },
  
  // Review verification and status
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  
  // Community interaction
  helpfulVotes: {
    type: Number,
    default: 0,
    min: [0, 'Helpful votes cannot be negative']
  },
  
  unhelpfulVotes: {
    type: Number,
    default: 0,
    min: [0, 'Unhelpful votes cannot be negative']
  },
  
  // Users who voted on this review
  voters: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['helpful', 'unhelpful']
    }
  }],
  
  // Moderation
  moderationNotes: {
    type: String,
    trim: true
  },
  
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  moderatedAt: {
    type: Date
  },
  
  // Flags and reports
  flags: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other']
    },
    description: String,
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Response from seller/admin
  response: {
    text: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for helpfulness ratio
reviewSchema.virtual('helpfulnessRatio').get(function() {
  const totalVotes = this.helpfulVotes + this.unhelpfulVotes;
  return totalVotes > 0 ? (this.helpfulVotes / totalVotes) * 100 : 0;
});

// Virtual for review age
reviewSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Indexes for better performance
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ helpfulVotes: -1 });
reviewSchema.index({ status: 1 });

// Compound index for product reviews with status
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });

// Pre-save middleware
reviewSchema.pre('save', function(next) {
  // Set verified purchase if order exists
  if (this.order && !this.isVerifiedPurchase) {
    this.isVerifiedPurchase = true;
  }
  
  // Set moderation timestamp
  if (this.isModified('status') && this.status !== 'pending') {
    this.moderatedAt = new Date();
  }
  
  next();
});

// Method to vote on review
reviewSchema.methods.vote = function(userId, voteType) {
  // Remove existing vote from this user
  this.voters = this.voters.filter(voter => 
    voter.user.toString() !== userId.toString()
  );
  
  // Add new vote
  this.voters.push({
    user: userId,
    vote: voteType
  });
  
  // Recalculate vote counts
  this.helpfulVotes = this.voters.filter(v => v.vote === 'helpful').length;
  this.unhelpfulVotes = this.voters.filter(v => v.vote === 'unhelpful').length;
  
  return this.save();
};

// Method to flag review
reviewSchema.methods.flag = function(userId, reason, description) {
  // Check if user already flagged this review
  const existingFlag = this.flags.find(flag => 
    flag.user.toString() === userId.toString()
  );
  
  if (existingFlag) {
    throw new Error('You have already flagged this review');
  }
  
  this.flags.push({
    user: userId,
    reason,
    description,
    flaggedAt: new Date()
  });
  
  // Auto-flag if multiple reports
  if (this.flags.length >= 3 && this.status === 'approved') {
    this.status = 'flagged';
  }
  
  return this.save();
};

// Method to respond to review
reviewSchema.methods.respond = function(responderId, responseText) {
  this.response = {
    text: responseText,
    respondedBy: responderId,
    respondedAt: new Date()
  };
  
  return this.save();
};

// Static method to get reviews for product
reviewSchema.statics.getProductReviews = function(productId, options = {}) {
  const {
    status = 'approved',
    page = 1,
    limit = 10,
    sort = 'createdAt'
  } = options;
  
  const skip = (page - 1) * limit;
  
  return this.find({ product: productId, status })
    .populate('user', 'username')
    .sort({ [sort]: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get review statistics
reviewSchema.statics.getReviewStats = async function(productId) {
  const stats = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
  
  const result = stats[0];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  result.ratingDistribution.forEach(rating => {
    distribution[rating]++;
  });
  
  return {
    totalReviews: result.totalReviews,
    averageRating: Math.round(result.averageRating * 10) / 10,
    ratingDistribution: distribution
  };
};

// Static method to get user's reviews
reviewSchema.statics.getUserReviews = function(userId, options = {}) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;
  
  return this.find({ user: userId })
    .populate('product', 'name images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get pending reviews for moderation
reviewSchema.statics.getPendingReviews = function(options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  
  return this.find({ status: 'pending' })
    .populate('user', 'username email')
    .populate('product', 'name')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Review', reviewSchema);