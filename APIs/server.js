/**
 * E-commerce Clothing Website - Main Server File
 * 
 * This is the main entry point for the e-commerce API server.
 * It sets up Express server, connects to MongoDB, configures middleware,
 * and defines all API routes for the clothing e-commerce platform.
 * 
 * Features:
 * - JWT-based authentication with role-based access control
 * - File upload support for product images
 * - Rate limiting and security middleware
 * - Comprehensive error handling
 * - CORS configuration for frontend integration
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const categoryRoutes = require('./routes/category');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/review');
const promotionRoutes = require('./routes/promotion');
const analyticsRoutes = require('./routes/analytics');
const searchRoutes = require('./routes/search');
const recommendationsRoutes = require('./routes/recommendations');
const seoRoutes = require('./routes/seo');

// Import middleware
const { errorHandler, asyncHandler } = require('./middleware/errorHandler');
const { requestLogger, errorLogger } = require('./middleware/logger');
const { createDefaultAdmin } = require('./utils/adminSetup');

// Import services
const searchService = require('./services/SearchService');
const seoService = require('./services/SeoService');
const { warmCache } = require('./middleware/cache');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression middleware for better performance
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use('/api/', limiter);

// Request logging middleware
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', asyncHandler(async (req, res) => {
  const { getCacheStats } = require('./middleware/cache');
  
  // Check database connection
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  // Check cache status
  const cacheStats = await getCacheStats();
  
  // Check services
  const services = {
    database: dbStatus,
    cache: cacheStats.available ? 'available' : 'unavailable',
    search: 'available', // Would check Elasticsearch in production
    recommendations: 'available'
  };
  
  const allServicesHealthy = Object.values(services).every(status => 
    status === 'connected' || status === 'available'
  );
  
  res.status(allServicesHealthy ? 200 : 503).json({
    status: allServicesHealthy ? 'OK' : 'DEGRADED',
    message: 'E-commerce API server health check',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // Updated to match final.md specification
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/seo', seoRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to E-commerce Clothing API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: [
      '/api/auth',
      '/api/user',
      '/api/products',
      '/api/categories',
      '/api/cart',
      '/api/orders',
      '/api/admin',
      '/api/reviews',
      '/api/promotions',
      '/api/analytics',
      '/api/search',
      '/api/recommendations',
      '/api/seo'
    ]
  });
});

// Error logging middleware
try {
  app.use(errorLogger);
} catch (error) {
  console.log('⚠️ Error logger middleware failed to initialize:', error.message);
}

// Global error handling middleware
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB successfully');
  
  // Create default admin user if it doesn't exist
  await createDefaultAdmin();
  
  // Initialize services
  console.log('🔧 Initializing services...');
  
  // Initialize search service
  try {
    await searchService.initializeIndices();
    console.log('✅ Search service initialized');
  } catch (error) {
    console.log('⚠️ Search service initialization failed:', error.message);
  }
  
  // Warm cache
  try {
    await warmCache();
    console.log('✅ Cache warmed');
  } catch (error) {
    console.log('⚠️ Cache warming failed:', error.message);
  }
  
  // Schedule SEO sitemap updates
  try {
    seoService.scheduleSitemapUpdates();
    console.log('✅ SEO sitemap updates scheduled');
  } catch (error) {
    console.log('⚠️ SEO service initialization failed:', error.message);
  }
  
  console.log('✅ Database initialization completed');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 E-commerce API server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;