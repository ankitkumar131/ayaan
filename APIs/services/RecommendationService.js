/**
 * Recommendation Service
 * 
 * Provides intelligent product recommendations using collaborative filtering,
 * content-based filtering, and hybrid approaches for the e-commerce platform.
 */

const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const mongoose = require('mongoose');

class RecommendationService {
  /**
   * Get collaborative filtering recommendations
   * Users who bought this product also bought...
   * @param {string} productId - Target product ID
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Array>} Recommended products
   */
  async getCollaborativeRecommendations(productId, limit = 5) {
    try {
      const recommendations = await Order.aggregate([
        // Find orders containing the target product
        {
          $match: {
            'items.product': new mongoose.Types.ObjectId(productId),
            status: { $ne: 'cancelled' }
          }
        },
        // Get all products from these orders
        { $unwind: '$items' },
        {
          $match: {
            'items.product': { $ne: new mongoose.Types.ObjectId(productId) }
          }
        },
        // Count frequency of each product
        {
          $group: {
            _id: '$items.product',
            frequency: { $sum: 1 },
            totalQuantity: { $sum: '$items.quantity' },
            uniqueCustomers: { $addToSet: '$user' }
          }
        },
        {
          $addFields: {
            customerCount: { $size: '$uniqueCustomers' },
            score: {
              $multiply: [
                '$frequency',
                { $add: [1, { $divide: ['$customerCount', 10] }] }
              ]
            }
          }
        },
        // Sort by score (frequency + customer diversity)
        { $sort: { score: -1 } },
        { $limit: limit * 2 }, // Get more to filter out inactive products
        // Populate product details
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        // Filter active products only
        { $match: { 'product.isActive': true } },
        {
          $project: {
            product: '$product',
            score: 1,
            frequency: 1,
            customerCount: 1
          }
        },
        { $limit: limit }
      ]);
      
      return recommendations.map(rec => ({
        ...rec.product,
        recommendationScore: rec.score,
        recommendationType: 'collaborative',
        reason: `${rec.customerCount} customers who bought this item also bought this`
      }));
    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }

  /**
   * Get content-based recommendations
   * Products similar by attributes (category, brand, tags, etc.)
   * @param {string} productId - Target product ID
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Array>} Recommended products
   */
  async getContentBasedRecommendations(productId, limit = 5) {
    try {
      const targetProduct = await Product.findById(productId);
      if (!targetProduct) return [];
      
      const recommendations = await Product.aggregate([
        {
          $match: {
            _id: { $ne: new mongoose.Types.ObjectId(productId) },
            isActive: true
          }
        },
        {
          $addFields: {
            score: {
              $add: [
                // Category match (highest weight)
                {
                  $cond: [
                    { $eq: ['$category', targetProduct.category] },
                    5,
                    0
                  ]
                },
                // Brand match
                {
                  $cond: [
                    { $eq: ['$specifications.brand', targetProduct.specifications?.brand] },
                    3,
                    0
                  ]
                },
                // Price similarity (within 50% range)
                {
                  $cond: [
                    {
                      $and: [
                        { $gte: ['$price', targetProduct.price * 0.5] },
                        { $lte: ['$price', targetProduct.price * 1.5] }
                      ]
                    },
                    2,
                    0
                  ]
                },
                // Tag matches
                {
                  $size: {
                    $setIntersection: [
                      { $ifNull: ['$tags', []] },
                      targetProduct.tags || []
                    ]
                  }
                },
                // Rating boost
                { $multiply: [{ $ifNull: ['$averageRating', 0] }, 0.5] }
              ]
            }
          }
        },
        { $match: { score: { $gt: 0 } } },
        { $sort: { score: -1, averageRating: -1 } },
        { $limit: limit }
      ]);
      
      return recommendations.map(product => ({
        ...product,
        recommendationScore: product.score,
        recommendationType: 'content-based',
        reason: this.generateContentBasedReason(product, targetProduct)
      }));
    } catch (error) {
      console.error('Content-based filtering error:', error);
      return [];
    }
  }

  /**
   * Get trending products
   * @param {number} limit - Number of products
   * @param {number} days - Days to look back
   * @returns {Promise<Array>} Trending products
   */
  async getTrendingProducts(limit = 10, days = 7) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const trending = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $ne: 'cancelled' }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            recentSales: { $sum: '$items.quantity' },
            recentRevenue: { $sum: '$items.totalPrice' },
            uniqueCustomers: { $addToSet: '$user' }
          }
        },
        {
          $addFields: {
            trendScore: {
              $add: [
                '$recentSales',
                { $multiply: [{ $size: '$uniqueCustomers' }, 2] }
              ]
            }
          }
        },
        { $sort: { trendScore: -1 } },
        { $limit: limit * 2 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        { $match: { 'product.isActive': true } },
        {
          $project: {
            product: '$product',
            recentSales: 1,
            trendScore: 1
          }
        },
        { $limit: limit }
      ]);
      
      return trending.map(item => ({
        ...item.product,
        recommendationScore: item.trendScore,
        recommendationType: 'trending',
        reason: `Trending now - ${item.recentSales} recent sales`
      }));
    } catch (error) {
      console.error('Trending products error:', error);
      return [];
    }
  }

  /**
   * Get personalized recommendations based on user history
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Array>} Personalized recommendations
   */
  async getPersonalizedRecommendations(userId, limit = 10) {
    try {
      // Get user's purchase history
      const userOrders = await Order.find({
        user: userId,
        status: { $ne: 'cancelled' }
      }).select('items');
      
      const purchasedProducts = userOrders.flatMap(order => 
        order.items.map(item => item.product.toString())
      );
      
      if (purchasedProducts.length === 0) {
        // New user - return trending products
        return this.getTrendingProducts(limit);
      }
      
      // Get categories and brands from user's history
      const userProducts = await Product.find({
        _id: { $in: purchasedProducts }
      }).select('category specifications.brand tags');
      
      const userCategories = [...new Set(userProducts.map(p => p.category.toString()))];
      const userBrands = [...new Set(userProducts.map(p => p.specifications?.brand).filter(Boolean))];
      const userTags = [...new Set(userProducts.flatMap(p => p.tags || []))];
      
      // Find similar products
      const recommendations = await Product.aggregate([
        {
          $match: {
            _id: { $nin: purchasedProducts.map(id => new mongoose.Types.ObjectId(id)) },
            isActive: true
          }
        },
        {
          $addFields: {
            relevanceScore: {
              $add: [
                // Category preference (highest weight)
                {
                  $cond: [
                    { $in: ['$category', userCategories.map(id => new mongoose.Types.ObjectId(id))] },
                    8,
                    0
                  ]
                },
                // Brand preference
                {
                  $cond: [
                    { $in: ['$specifications.brand', userBrands] },
                    5,
                    0
                  ]
                },
                // Tag matches
                {
                  $multiply: [
                    {
                      $size: {
                        $setIntersection: [
                          { $ifNull: ['$tags', []] },
                          userTags
                        ]
                      }
                    },
                    2
                  ]
                },
                // Rating boost
                { $multiply: [{ $ifNull: ['$averageRating', 0] }, 1] },
                // Popularity boost
                { $multiply: [{ $ifNull: ['$totalSales', 0] }, 0.1] }
              ]
            }
          }
        },
        { $match: { relevanceScore: { $gt: 0 } } },
        { $sort: { relevanceScore: -1, averageRating: -1 } },
        { $limit: limit }
      ]);
      
      return recommendations.map(product => ({
        ...product,
        recommendationScore: product.relevanceScore,
        recommendationType: 'personalized',
        reason: 'Based on your purchase history'
      }));
    } catch (error) {
      console.error('Personalized recommendations error:', error);
      return this.getTrendingProducts(limit);
    }
  }

  /**
   * Get hybrid recommendations combining multiple approaches
   * @param {string} userId - User ID (optional)
   * @param {string} productId - Product ID (optional, for product page)
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Array>} Hybrid recommendations
   */
  async getHybridRecommendations(userId = null, productId = null, limit = 10) {
    try {
      const recommendations = [];
      
      // If viewing a specific product, get collaborative recommendations
      if (productId) {
        const collaborative = await this.getCollaborativeRecommendations(productId, Math.ceil(limit * 0.4));
        recommendations.push(...collaborative);
      }
      
      // If user is logged in, get personalized recommendations
      if (userId) {
        const personalized = await this.getPersonalizedRecommendations(userId, Math.ceil(limit * 0.4));
        recommendations.push(...personalized);
      }
      
      // Fill remaining slots with trending products
      const remainingSlots = limit - recommendations.length;
      if (remainingSlots > 0) {
        const trending = await this.getTrendingProducts(remainingSlots);
        recommendations.push(...trending);
      }
      
      // Remove duplicates and limit results
      const uniqueRecommendations = this.removeDuplicates(recommendations);
      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      console.error('Hybrid recommendations error:', error);
      return this.getTrendingProducts(limit);
    }
  }

  /**
   * Get recommendations for cart page (frequently bought together)
   * @param {Array} cartItems - Items in cart
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Array>} Cart recommendations
   */
  async getCartRecommendations(cartItems, limit = 5) {
    try {
      if (!cartItems || cartItems.length === 0) return [];
      
      const cartProductIds = cartItems.map(item => item.product.toString());
      
      const recommendations = await Order.aggregate([
        // Find orders containing any of the cart products
        {
          $match: {
            'items.product': { $in: cartProductIds.map(id => new mongoose.Types.ObjectId(id)) },
            status: { $ne: 'cancelled' }
          }
        },
        { $unwind: '$items' },
        // Exclude products already in cart
        {
          $match: {
            'items.product': { $nin: cartProductIds.map(id => new mongoose.Types.ObjectId(id)) }
          }
        },
        {
          $group: {
            _id: '$items.product',
            frequency: { $sum: 1 },
            avgQuantity: { $avg: '$items.quantity' }
          }
        },
        { $sort: { frequency: -1 } },
        { $limit: limit * 2 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        { $match: { 'product.isActive': true } },
        {
          $project: {
            product: '$product',
            frequency: 1
          }
        },
        { $limit: limit }
      ]);
      
      return recommendations.map(rec => ({
        ...rec.product,
        recommendationScore: rec.frequency,
        recommendationType: 'frequently-bought-together',
        reason: 'Frequently bought together'
      }));
    } catch (error) {
      console.error('Cart recommendations error:', error);
      return [];
    }
  }

  /**
   * Get seasonal recommendations
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Array>} Seasonal recommendations
   */
  async getSeasonalRecommendations(limit = 10) {
    try {
      const currentMonth = new Date().getMonth() + 1;
      let season;
      
      if (currentMonth >= 3 && currentMonth <= 5) season = 'spring';
      else if (currentMonth >= 6 && currentMonth <= 8) season = 'summer';
      else if (currentMonth >= 9 && currentMonth <= 11) season = 'autumn';
      else season = 'winter';
      
      const seasonalProducts = await Product.find({
        isActive: true,
        $or: [
          { 'specifications.season': season },
          { 'specifications.season': 'all-season' }
        ]
      })
      .sort({ averageRating: -1, totalSales: -1 })
      .limit(limit)
      .lean();
      
      return seasonalProducts.map(product => ({
        ...product,
        recommendationScore: product.averageRating || 0,
        recommendationType: 'seasonal',
        reason: `Perfect for ${season}`
      }));
    } catch (error) {
      console.error('Seasonal recommendations error:', error);
      return [];
    }
  }

  /**
   * Remove duplicate products from recommendations
   * @param {Array} recommendations - Array of recommendations
   * @returns {Array} Deduplicated recommendations
   */
  removeDuplicates(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      const id = rec._id.toString();
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  /**
   * Generate reason text for content-based recommendations
   * @param {Object} product - Recommended product
   * @param {Object} targetProduct - Target product
   * @returns {string} Reason text
   */
  generateContentBasedReason(product, targetProduct) {
    const reasons = [];
    
    if (product.category.toString() === targetProduct.category.toString()) {
      reasons.push('same category');
    }
    
    if (product.specifications?.brand === targetProduct.specifications?.brand) {
      reasons.push('same brand');
    }
    
    const commonTags = (product.tags || []).filter(tag => 
      (targetProduct.tags || []).includes(tag)
    );
    
    if (commonTags.length > 0) {
      reasons.push(`similar style (${commonTags.slice(0, 2).join(', ')})`);
    }
    
    return reasons.length > 0 
      ? `Similar product: ${reasons.join(', ')}`
      : 'You might also like this';
  }

  /**
   * Get recommendation performance metrics
   * @returns {Promise<Object>} Performance metrics
   */
  async getRecommendationMetrics() {
    try {
      // This would require tracking recommendation clicks and conversions
      // For now, return basic metrics
      const totalProducts = await Product.countDocuments({ isActive: true });
      const totalOrders = await Order.countDocuments({ status: { $ne: 'cancelled' } });
      
      return {
        totalProducts,
        totalOrders,
        // These would be tracked in a real implementation
        recommendationClicks: 0,
        recommendationConversions: 0,
        conversionRate: 0
      };
    } catch (error) {
      console.error('Recommendation metrics error:', error);
      return {};
    }
  }
}

module.exports = new RecommendationService();