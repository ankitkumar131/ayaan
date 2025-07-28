/**
 * Logging Middleware
 * 
 * Provides comprehensive logging using Winston for the e-commerce API.
 * Includes request logging, error logging, and performance monitoring.
 */

// Simple console logger for development
const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta);
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, meta);
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, meta);
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, meta);
    }
  },
  http: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[HTTP] ${new Date().toISOString()}: ${message}`, meta);
    }
  }
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logger.http('Request started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user._id : null,
    userRole: req.user ? req.user.role : null,
    timestamp: new Date().toISOString()
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // Log response
    logger.http('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user ? req.user._id : null,
      userRole: req.user ? req.user.role : null,
      responseSize: res.get('Content-Length') || 0,
      timestamp: new Date().toISOString()
    });
    
    // Performance warning for slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        userId: req.user ? req.user._id : null
      });
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Error logging middleware
 */
const errorLogger = (err, req, res, next) => {
  try {
    // Log error details
    logger.error('Request error', {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code || err.statusCode
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      user: req.user ? {
        id: req.user._id,
        role: req.user.role,
        email: req.user.email
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (logError) {
    // Fallback to console if logger fails
    console.error('Error logging failed:', logError);
    console.error('Original error:', err);
  }
  
  next(err);
};

/**
 * Security event logger
 */
const securityLogger = {
  loginAttempt: (email, success, ip, userAgent) => {
    logger.info('Login attempt', {
      event: 'login_attempt',
      email,
      success,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  loginFailure: (email, reason, ip, userAgent) => {
    logger.warn('Login failure', {
      event: 'login_failure',
      email,
      reason,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  rateLimitExceeded: (ip, endpoint, userAgent) => {
    logger.warn('Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ip,
      endpoint,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  suspiciousActivity: (userId, activity, details) => {
    logger.warn('Suspicious activity detected', {
      event: 'suspicious_activity',
      userId,
      activity,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  adminAction: (adminId, action, target, details) => {
    logger.info('Admin action performed', {
      event: 'admin_action',
      adminId,
      action,
      target,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Business event logger
 */
const businessLogger = {
  orderPlaced: (orderId, userId, total, items) => {
    logger.info('Order placed', {
      event: 'order_placed',
      orderId,
      userId,
      total,
      itemCount: items.length,
      timestamp: new Date().toISOString()
    });
  },
  
  orderStatusChanged: (orderId, oldStatus, newStatus, changedBy) => {
    logger.info('Order status changed', {
      event: 'order_status_changed',
      orderId,
      oldStatus,
      newStatus,
      changedBy,
      timestamp: new Date().toISOString()
    });
  },
  
  paymentProcessed: (orderId, amount, method, status) => {
    logger.info('Payment processed', {
      event: 'payment_processed',
      orderId,
      amount,
      method,
      status,
      timestamp: new Date().toISOString()
    });
  },
  
  productViewed: (productId, userId, source) => {
    logger.info('Product viewed', {
      event: 'product_viewed',
      productId,
      userId,
      source,
      timestamp: new Date().toISOString()
    });
  },
  
  searchPerformed: (query, userId, resultsCount) => {
    logger.info('Search performed', {
      event: 'search_performed',
      query,
      userId,
      resultsCount,
      timestamp: new Date().toISOString()
    });
  },
  
  promotionUsed: (promotionCode, userId, orderId, discountAmount) => {
    logger.info('Promotion used', {
      event: 'promotion_used',
      promotionCode,
      userId,
      orderId,
      discountAmount,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Performance monitoring
 */
const performanceLogger = {
  databaseQuery: (operation, collection, duration, query) => {
    if (duration > 100) { // Log slow queries (>100ms)
      logger.warn('Slow database query', {
        event: 'slow_db_query',
        operation,
        collection,
        duration: `${duration}ms`,
        query: JSON.stringify(query),
        timestamp: new Date().toISOString()
      });
    }
  },
  
  cacheOperation: (operation, key, hit, duration) => {
    logger.debug('Cache operation', {
      event: 'cache_operation',
      operation,
      key,
      hit,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  },
  
  externalApiCall: (service, endpoint, duration, status) => {
    logger.info('External API call', {
      event: 'external_api_call',
      service,
      endpoint,
      duration: `${duration}ms`,
      status,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Log aggregation and analysis helpers
 */
const logAnalytics = {
  // Get error rate for the last hour
  getErrorRate: async (hours = 1) => {
    // This would typically query a log aggregation service
    // For now, return a placeholder
    return {
      period: `${hours}h`,
      totalRequests: 0,
      errorRequests: 0,
      errorRate: 0
    };
  },
  
  // Get top errors
  getTopErrors: async (limit = 10) => {
    // This would typically query aggregated error logs
    return [];
  },
  
  // Get performance metrics
  getPerformanceMetrics: async () => {
    return {
      averageResponseTime: 0,
      slowestEndpoints: [],
      databasePerformance: {
        averageQueryTime: 0,
        slowestQueries: []
      }
    };
  }
};

/**
 * Log rotation and cleanup
 */
const logMaintenance = {
  // Clean up old log files
  cleanup: () => {
    logger.info('Log cleanup would run here in production');
  },
  
  // Archive logs
  archive: () => {
    // Implementation for log archiving
    logger.info('Log archiving started');
  }
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  securityLogger,
  businessLogger,
  performanceLogger,
  logAnalytics,
  logMaintenance
};