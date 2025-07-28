/**
 * Analytics Service
 * 
 * Provides comprehensive analytics and business intelligence for the e-commerce platform.
 * Includes conversion rate, AOV, CLV, and other key performance indicators.
 */

const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const mongoose = require('mongoose');

class AnalyticsService {
  /**
   * Get start date based on period
   * @param {string} period - Time period (7d, 30d, 90d, 1y)
   * @returns {Date} Start date
   */
  getStartDate(period) {
    const now = new Date();
    switch (period) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Calculate conversion rate
   * @param {string} period - Time period
   * @returns {Promise<number>} Conversion rate percentage
   */
  async getConversionRate(period = '30d') {
    const startDate = this.getStartDate(period);
    
    // For now, we'll use a simple calculation based on orders vs unique users
    // In production, you'd track actual sessions
    const [orders, uniqueUsers] = await Promise.all([
      Order.countDocuments({ 
        createdAt: { $gte: startDate },
        status: { $ne: 'cancelled' }
      }),
      Order.distinct('user', {
        createdAt: { $gte: startDate },
        status: { $ne: 'cancelled' }
      }).then(users => users.length)
    ]);
    
    // Estimate sessions as unique users * 3 (average sessions per user)
    const estimatedSessions = uniqueUsers * 3;
    const conversionRate = estimatedSessions > 0 ? (orders / estimatedSessions) * 100 : 0;
    
    return Math.round(conversionRate * 100) / 100;
  }

  /**
   * Calculate Average Order Value
   * @param {string} period - Time period
   * @returns {Promise<number>} Average order value
   */
  async getAverageOrderValue(period = '30d') {
    const startDate = this.getStartDate(period);
    
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          averageValue: { $avg: '$total' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);
    
    const aov = result.length > 0 ? result[0].averageValue : 0;
    return Math.round(aov * 100) / 100;
  }

  /**
   * Calculate Customer Lifetime Value
   * @returns {Promise<Object>} CLV data
   */
  async getCustomerLifetimeValue() {
    const result = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
          firstOrder: { $min: '$createdAt' },
          lastOrder: { $max: '$createdAt' }
        }
      },
      {
        $addFields: {
          customerLifespanDays: {
            $divide: [
              { $subtract: ['$lastOrder', '$firstOrder'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageCLV: { $avg: '$totalSpent' },
          averageLifespan: { $avg: '$customerLifespanDays' },
          averageOrderFrequency: { $avg: '$orderCount' }
        }
      }
    ]);
    
    if (result.length === 0) {
      return {
        clv: 0,
        averageLifespan: 0,
        averageOrderFrequency: 0
      };
    }
    
    return {
      clv: Math.round(result[0].averageCLV * 100) / 100,
      averageLifespan: Math.round(result[0].averageLifespan * 10) / 10,
      averageOrderFrequency: Math.round(result[0].averageOrderFrequency * 10) / 10
    };
  }

  /**
   * Calculate cart abandonment rate
   * @returns {Promise<number>} Cart abandonment rate percentage
   */
  async getCartAbandonmentRate() {
    const Cart = require('../models/Cart');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [totalCarts, completedOrders] = await Promise.all([
      Cart.countDocuments({ 
        'items.0': { $exists: true },
        updatedAt: { $gte: thirtyDaysAgo }
      }),
      Order.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
        status: { $ne: 'cancelled' }
      })
    ]);
    
    const abandonmentRate = totalCarts > 0 ? 
      ((totalCarts - completedOrders) / totalCarts) * 100 : 0;
    
    return Math.round(abandonmentRate * 100) / 100;
  }

  /**
   * Get top selling products
   * @param {number} limit - Number of products to return
   * @param {string} period - Time period
   * @returns {Promise<Array>} Top selling products
   */
  async getTopSellingProducts(limit = 10, period = '30d') {
    const startDate = this.getStartDate(period);
    
    const topProducts = await Order.aggregate([
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
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          name: '$product.name',
          totalSold: 1,
          revenue: 1,
          orderCount: 1,
          averageOrderQuantity: { $divide: ['$totalSold', '$orderCount'] }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    return topProducts;
  }

  /**
   * Get revenue by category
   * @param {string} period - Time period
   * @returns {Promise<Array>} Revenue by category
   */
  async getRevenueByCategory(period = '30d') {
    const startDate = this.getStartDate(period);
    
    const categoryRevenue = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' } 
        } 
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          revenue: { $sum: '$items.totalPrice' },
          orderCount: { $sum: 1 },
          itemsSold: { $sum: '$items.quantity' }
        }
      },
      {
        $addFields: {
          averageOrderValue: { $divide: ['$revenue', '$orderCount'] }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    return categoryRevenue;
  }

  /**
   * Get customer segmentation data
   * @returns {Promise<Array>} Customer segments
   */
  async getCustomerSegmentation() {
    const segments = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      {
        $addFields: {
          segment: {
            $switch: {
              branches: [
                {
                  case: { $and: [{ $gte: ['$totalSpent', 1000] }, { $gte: ['$orderCount', 5] }] },
                  then: 'VIP'
                },
                {
                  case: { $and: [{ $gte: ['$totalSpent', 500] }, { $gte: ['$orderCount', 3] }] },
                  then: 'Loyal'
                },
                {
                  case: { $gte: ['$orderCount', 2] },
                  then: 'Regular'
                }
              ],
              default: 'New'
            }
          }
        }
      },
      {
        $group: {
          _id: '$segment',
          customerCount: { $sum: 1 },
          averageOrderValue: { $avg: { $divide: ['$totalSpent', '$orderCount'] } },
          totalRevenue: { $sum: '$totalSpent' },
          averageOrderCount: { $avg: '$orderCount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    return segments;
  }

  /**
   * Get sales trends over time
   * @param {string} period - Time period
   * @param {string} groupBy - Group by day, week, or month
   * @returns {Promise<Array>} Sales trends
   */
  async getSalesTrends(period = '30d', groupBy = 'day') {
    const startDate = this.getStartDate(period);
    
    let groupStage;
    switch (groupBy) {
      case 'week':
        groupStage = {
          _id: {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' }
          }
        };
        break;
      case 'month':
        groupStage = {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          }
        };
        break;
      default: // day
        groupStage = {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          }
        };
    }
    
    const trends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          ...groupStage,
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);
    
    return trends;
  }

  /**
   * Get comprehensive analytics dashboard data
   * @param {string} period - Time period
   * @returns {Promise<Object>} Complete analytics data
   */
  async getDashboardAnalytics(period = '30d') {
    const [
      conversionRate,
      averageOrderValue,
      customerLifetimeValue,
      cartAbandonmentRate,
      topProducts,
      revenueByCategory,
      customerSegments,
      salesTrends
    ] = await Promise.all([
      this.getConversionRate(period),
      this.getAverageOrderValue(period),
      this.getCustomerLifetimeValue(),
      this.getCartAbandonmentRate(),
      this.getTopSellingProducts(5, period),
      this.getRevenueByCategory(period),
      this.getCustomerSegmentation(),
      this.getSalesTrends(period)
    ]);
    
    return {
      period,
      kpis: {
        conversionRate,
        averageOrderValue,
        customerLifetimeValue,
        cartAbandonmentRate
      },
      topProducts,
      revenueByCategory,
      customerSegments,
      salesTrends
    };
  }

  /**
   * Get product performance analytics
   * @param {string} productId - Product ID
   * @param {string} period - Time period
   * @returns {Promise<Object>} Product analytics
   */
  async getProductAnalytics(productId, period = '30d') {
    const startDate = this.getStartDate(period);
    
    const [productStats, viewsData, conversionData] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            'items.product': new mongoose.Types.ObjectId(productId),
            createdAt: { $gte: startDate },
            status: { $ne: 'cancelled' }
          }
        },
        { $unwind: '$items' },
        {
          $match: {
            'items.product': new mongoose.Types.ObjectId(productId)
          }
        },
        {
          $group: {
            _id: null,
            totalSold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.totalPrice' },
            orderCount: { $sum: 1 },
            averageQuantityPerOrder: { $avg: '$items.quantity' }
          }
        }
      ]),
      
      // This would require implementing product view tracking
      // For now, return mock data
      Promise.resolve([{ totalViews: 0 }]),
      
      // Calculate conversion rate for this product
      Order.aggregate([
        {
          $match: {
            'items.product': new mongoose.Types.ObjectId(productId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            conversions: { $sum: 1 }
          }
        }
      ])
    ]);
    
    const stats = productStats[0] || {
      totalSold: 0,
      revenue: 0,
      orderCount: 0,
      averageQuantityPerOrder: 0
    };
    
    const views = viewsData[0]?.totalViews || 0;
    const conversions = conversionData[0]?.conversions || 0;
    const conversionRate = views > 0 ? (conversions / views) * 100 : 0;
    
    return {
      productId,
      period,
      ...stats,
      views,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  }
}

module.exports = new AnalyticsService();