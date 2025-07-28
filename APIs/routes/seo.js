/**
 * SEO Routes
 * 
 * Provides SEO-related endpoints including sitemap generation,
 * robots.txt, and structured data for the e-commerce platform.
 */

const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler, successResponse } = require('../middleware/errorHandler');
const seoService = require('../services/SeoService');

const router = express.Router();

/**
 * @route   GET /api/seo/sitemap.xml
 * @desc    Generate and serve XML sitemap
 * @access  Public
 */
router.get('/sitemap.xml', asyncHandler(async (req, res) => {
  const sitemap = await seoService.generateSitemap();
  
  res.set({
    'Content-Type': 'application/xml',
    'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
  });
  
  res.send(sitemap);
}));

/**
 * @route   GET /api/seo/robots.txt
 * @desc    Generate and serve robots.txt
 * @access  Public
 */
router.get('/robots.txt', (req, res) => {
  const robotsTxt = seoService.generateRobotsTxt();
  
  res.set({
    'Content-Type': 'text/plain',
    'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
  });
  
  res.send(robotsTxt);
});

/**
 * @route   GET /api/seo/structured-data/product/:productId
 * @desc    Get structured data for a product
 * @access  Public
 */
router.get('/structured-data/product/:productId', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  // Validate product ID format
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format'
    });
  }
  
  const Product = require('../models/Product');
  const product = await Product.findById(productId)
    .populate('category', 'name')
    .lean();
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  const structuredData = seoService.generateProductStructuredData(product);
  
  res.set({
    'Content-Type': 'application/ld+json',
    'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
  });
  
  res.json(structuredData);
}));

/**
 * @route   GET /api/seo/structured-data/organization
 * @desc    Get organization structured data
 * @access  Public
 */
router.get('/structured-data/organization', (req, res) => {
  const structuredData = seoService.generateOrganizationStructuredData();
  
  res.set({
    'Content-Type': 'application/ld+json',
    'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
  });
  
  res.json(structuredData);
});

/**
 * @route   POST /api/seo/structured-data/breadcrumb
 * @desc    Generate breadcrumb structured data
 * @access  Public
 * @body    breadcrumbs - Array of breadcrumb objects
 */
router.post('/structured-data/breadcrumb', asyncHandler(async (req, res) => {
  const { breadcrumbs } = req.body;
  
  if (!Array.isArray(breadcrumbs)) {
    return res.status(400).json({
      success: false,
      message: 'Breadcrumbs must be an array'
    });
  }
  
  // Validate breadcrumb structure
  for (const crumb of breadcrumbs) {
    if (!crumb.name || !crumb.url) {
      return res.status(400).json({
        success: false,
        message: 'Each breadcrumb must have name and url properties'
      });
    }
  }
  
  const structuredData = seoService.generateBreadcrumbStructuredData(breadcrumbs);
  
  res.set({
    'Content-Type': 'application/ld+json',
    'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
  });
  
  res.json(structuredData);
}));

/**
 * @route   GET /api/seo/meta-tags/product/:productId
 * @desc    Get meta tags for a product
 * @access  Public
 */
router.get('/meta-tags/product/:productId', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  // Validate product ID format
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format'
    });
  }
  
  const Product = require('../models/Product');
  const product = await Product.findById(productId)
    .populate('category', 'name')
    .lean();
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  const metaTags = seoService.generateProductMetaTags(product);
  
  successResponse(res, {
    productId,
    metaTags
  }, 'Product meta tags generated successfully');
}));

/**
 * @route   GET /api/seo/meta-tags/category/:categoryId
 * @desc    Get meta tags for a category
 * @access  Public
 */
router.get('/meta-tags/category/:categoryId', asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  
  // Validate category ID format
  if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category ID format'
    });
  }
  
  const Category = require('../models/Category');
  const category = await Category.findById(categoryId).lean();
  
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }
  
  const metaTags = seoService.generateCategoryMetaTags(category);
  
  successResponse(res, {
    categoryId,
    metaTags
  }, 'Category meta tags generated successfully');
}));

/**
 * @route   POST /api/seo/canonical-url
 * @desc    Generate canonical URL
 * @access  Public
 * @body    path - URL path
 */
router.post('/canonical-url', asyncHandler(async (req, res) => {
  const { path } = req.body;
  
  if (!path || typeof path !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Path is required and must be a string'
    });
  }
  
  const canonicalUrl = seoService.generateCanonicalUrl(path);
  
  successResponse(res, {
    path,
    canonicalUrl
  }, 'Canonical URL generated successfully');
}));

/**
 * @route   POST /api/seo/hreflang
 * @desc    Generate hreflang tags
 * @access  Public
 * @body    path - URL path
 */
router.post('/hreflang', asyncHandler(async (req, res) => {
  const { path } = req.body;
  
  if (!path || typeof path !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Path is required and must be a string'
    });
  }
  
  const hreflangTags = seoService.generateHreflangTags(path);
  
  successResponse(res, {
    path,
    hreflangTags
  }, 'Hreflang tags generated successfully');
}));

/**
 * @route   POST /api/seo/sitemap/update
 * @desc    Update sitemap (Admin only)
 * @access  Private (Admin)
 */
router.post('/sitemap/update', [
  authenticate,
  requireAdmin
], asyncHandler(async (req, res) => {
  await seoService.updateSitemap();
  
  successResponse(res, null, 'Sitemap updated successfully');
}));

/**
 * @route   GET /api/seo/sitemap/status
 * @desc    Get sitemap status (Admin only)
 * @access  Private (Admin)
 */
router.get('/sitemap/status', [
  authenticate,
  requireAdmin
], asyncHandler(async (req, res) => {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
    const stats = await fs.stat(sitemapPath);
    
    successResponse(res, {
      exists: true,
      lastModified: stats.mtime,
      size: stats.size
    }, 'Sitemap status retrieved successfully');
  } catch (error) {
    successResponse(res, {
      exists: false,
      lastModified: null,
      size: 0
    }, 'Sitemap does not exist');
  }
}));

module.exports = router;