/**
 * Caching Middleware
 * 
 * Provides Redis-based caching for API responses to improve performance.
 * Includes cache invalidation and smart caching strategies.
 */

let redis;
let redisAvailable = false;

// Initialize Redis client
try {
  redis = require('redis');
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  
  client.on('error', (err) => {
    console.log('Redis Client Error:', err);
    redisAvailable = false;
  });
  
  client.on('connect', () => {
    console.log('✅ Redis connected successfully');
    redisAvailable = true;
  });
  
  // Connect to Redis
  client.connect().catch(err => {
    console.log('⚠️ Redis not available, caching disabled');
    redisAvailable = false;
  });
  
  module.exports.redisClient = client;
} catch (error) {
  console.log('⚠️ Redis not available, caching disabled');
  redisAvailable = false;
}

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds
 * @param {string} keyPrefix - Cache key prefix
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (ttl = 300, keyPrefix = 'api') => {
  return async (req, res, next) => {
    // Skip caching if Redis is not available
    if (!redisAvailable) {
      return next();
    }
    
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip caching for authenticated admin requests
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    
    try {
      // Generate cache key
      const cacheKey = generateCacheKey(req, keyPrefix);
      
      // Try to get cached data
      const cachedData = await module.exports.redisClient.get(cacheKey);
      
      if (cachedData) {
        console.log(`Cache HIT: ${cacheKey}`);
        const parsedData = JSON.parse(cachedData);
        
        // Add cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`
        });
        
        return res.json(parsedData);
      }
      
      console.log(`Cache MISS: ${cacheKey}`);
      
      // Store original res.json method
      const originalJson = res.json;
      
      // Override res.json to cache the response
      res.json = function(data) {
        // Cache the response
        if (res.statusCode === 200 && data.success !== false) {
          module.exports.redisClient.setEx(cacheKey, ttl, JSON.stringify(data))
            .catch(err => console.error('Cache set error:', err));
        }
        
        // Add cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`
        });
        
        // Call original json method
        originalJson.call(this, data);
      };
      
      next();
      
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Generate cache key from request
 * @param {Object} req - Express request object
 * @param {string} prefix - Key prefix
 * @returns {string} Cache key
 */
const generateCacheKey = (req, prefix) => {
  const url = req.originalUrl || req.url;
  const userId = req.user ? req.user._id.toString() : 'anonymous';
  const userRole = req.user ? req.user.role : 'guest';
  
  // Include user context for personalized content
  const keyParts = [
    prefix,
    req.method,
    url.replace(/[^a-zA-Z0-9]/g, '_'),
    userRole
  ];
  
  // Add user ID for user-specific content
  if (req.user && (url.includes('/cart') || url.includes('/orders') || url.includes('/profile'))) {
    keyParts.push(userId);
  }
  
  return keyParts.join(':');
};

/**
 * Cache invalidation helper
 * @param {string|Array} patterns - Cache key patterns to invalidate
 */
const invalidateCache = async (patterns) => {
  if (!redisAvailable) return;
  
  try {
    const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
    
    for (const pattern of patternsArray) {
      const keys = await module.exports.redisClient.keys(pattern);
      if (keys.length > 0) {
        await module.exports.redisClient.del(keys);
        console.log(`Cache invalidated: ${keys.length} keys matching ${pattern}`);
      }
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

/**
 * Smart cache invalidation based on data changes
 */
const smartInvalidation = {
  // Invalidate product-related caches
  products: async (productId = null) => {
    const patterns = [
      'api:GET:*products*',
      'api:GET:*categories*',
      'api:GET:*search*'
    ];
    
    if (productId) {
      patterns.push(`api:GET:*products*${productId}*`);
    }
    
    await invalidateCache(patterns);
  },
  
  // Invalidate user-related caches
  users: async (userId = null) => {
    const patterns = ['api:GET:*users*'];
    
    if (userId) {
      patterns.push(`*:${userId}`);
    }
    
    await invalidateCache(patterns);
  },
  
  // Invalidate order-related caches
  orders: async (userId = null) => {
    const patterns = [
      'api:GET:*orders*',
      'api:GET:*statistics*'
    ];
    
    if (userId) {
      patterns.push(`*orders*:${userId}`);
    }
    
    await invalidateCache(patterns);
  },
  
  // Invalidate cart-related caches
  cart: async (userId) => {
    const patterns = [
      `*cart*:${userId}`,
      `*cart*count*:${userId}`
    ];
    
    await invalidateCache(patterns);
  },
  
  // Invalidate all caches (use sparingly)
  all: async () => {
    if (!redisAvailable) return;
    
    try {
      await module.exports.redisClient.flushAll();
      console.log('All caches invalidated');
    } catch (error) {
      console.error('Error flushing all caches:', error);
    }
  }
};

/**
 * Cache warming - pre-populate frequently accessed data
 */
const warmCache = async () => {
  if (!redisAvailable) {
    console.log('⚠️ Cache warming skipped - Redis not available');
    return;
  }
  
  try {
    console.log('Starting cache warming...');
    
    // Warm popular endpoints
    const Product = require('../models/Product');
    const Category = require('../models/Category');
    
    // Cache featured products
    const featuredProducts = await Product.find({ isFeatured: true, isActive: true })
      .populate('category', 'name slug')
      .limit(10)
      .lean();
    
    await module.exports.redisClient.setEx(
      'api:GET:*products*featured*:guest',
      600, // 10 minutes
      JSON.stringify({
        success: true,
        data: featuredProducts,
        message: 'Featured products retrieved successfully'
      })
    );
    
    // Cache categories
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
    
    await module.exports.redisClient.setEx(
      'api:GET:*categories*:guest',
      1800, // 30 minutes
      JSON.stringify({
        success: true,
        data: categories,
        message: 'Categories retrieved successfully'
      })
    );
    
    console.log('Cache warming completed');
  } catch (error) {
    console.error('Cache warming error:', error);
  }
};

/**
 * Cache statistics
 */
const getCacheStats = async () => {
  if (!redisAvailable) {
    return { available: false };
  }
  
  try {
    const info = await module.exports.redisClient.info('memory');
    const keyCount = await module.exports.redisClient.dbSize();
    
    return {
      available: true,
      keyCount,
      memoryInfo: info
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { available: false, error: error.message };
  }
};

/**
 * Conditional caching based on content type
 */
const conditionalCache = {
  // Cache product listings longer
  products: cacheMiddleware(600, 'products'), // 10 minutes
  
  // Cache categories for longer (they change less frequently)
  categories: cacheMiddleware(1800, 'categories'), // 30 minutes
  
  // Cache search results for shorter time
  search: cacheMiddleware(300, 'search'), // 5 minutes
  
  // Cache user-specific data for very short time
  userSpecific: cacheMiddleware(60, 'user'), // 1 minute
  
  // Cache analytics data
  analytics: cacheMiddleware(900, 'analytics'), // 15 minutes
  
  // Cache static content
  static: cacheMiddleware(3600, 'static') // 1 hour
};

module.exports = {
  cache: cacheMiddleware,
  conditionalCache,
  invalidateCache,
  smartInvalidation,
  warmCache,
  getCacheStats,
  redisAvailable: () => redisAvailable
};