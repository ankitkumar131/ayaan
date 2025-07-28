/**
 * SEO Service
 * 
 * Provides SEO functionality including sitemap generation, structured data,
 * and meta tag management for the e-commerce platform.
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const fs = require('fs').promises;
const path = require('path');

class SeoService {
  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    this.sitemapPath = path.join(__dirname, '../public/sitemap.xml');
  }

  /**
   * Generate XML sitemap
   * @returns {Promise<string>} XML sitemap content
   */
  async generateSitemap() {
    try {
      const [products, categories] = await Promise.all([
        Product.find({ isActive: true })
          .select('slug updatedAt createdAt averageRating totalReviews')
          .lean(),
        Category.find({ isActive: true })
          .select('slug updatedAt createdAt')
          .lean()
      ]);

      const urls = [
        // Static pages
        {
          url: '/',
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: 1.0
        },
        {
          url: '/products',
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: 0.9
        },
        {
          url: '/categories',
          lastmod: new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.8
        },
        {
          url: '/about',
          lastmod: new Date().toISOString(),
          changefreq: 'monthly',
          priority: 0.5
        },
        {
          url: '/contact',
          lastmod: new Date().toISOString(),
          changefreq: 'monthly',
          priority: 0.5
        },

        // Category pages
        ...categories.map(category => ({
          url: `/category/${category.slug}`,
          lastmod: category.updatedAt.toISOString(),
          changefreq: 'weekly',
          priority: 0.7
        })),

        // Product pages
        ...products.map(product => ({
          url: `/products/${product.slug}`,
          lastmod: product.updatedAt.toISOString(),
          changefreq: 'weekly',
          priority: this.calculateProductPriority(product)
        }))
      ];

      return this.generateSitemapXML(urls);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      throw error;
    }
  }

  /**
   * Calculate product priority based on various factors
   * @param {Object} product - Product object
   * @returns {number} Priority value between 0.1 and 0.9
   */
  calculateProductPriority(product) {
    let priority = 0.6; // Base priority

    // Boost for high-rated products
    if (product.averageRating >= 4.5) priority += 0.2;
    else if (product.averageRating >= 4.0) priority += 0.1;

    // Boost for products with many reviews
    if (product.totalReviews >= 50) priority += 0.1;
    else if (product.totalReviews >= 10) priority += 0.05;

    // Boost for newer products (within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (product.createdAt > thirtyDaysAgo) priority += 0.1;

    return Math.min(0.9, Math.max(0.1, priority));
  }

  /**
   * Generate XML sitemap content
   * @param {Array} urls - Array of URL objects
   * @returns {string} XML sitemap
   */
  generateSitemapXML(urls) {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const urlsetClose = '</urlset>';

    const urlElements = urls.map(urlObj => {
      return `
  <url>
    <loc>${this.baseUrl}${urlObj.url}</loc>
    <lastmod>${urlObj.lastmod}</lastmod>
    <changefreq>${urlObj.changefreq}</changefreq>
    <priority>${urlObj.priority}</priority>
  </url>`;
    }).join('');

    return `${xmlHeader}\n${urlsetOpen}${urlElements}\n${urlsetClose}`;
  }

  /**
   * Save sitemap to file
   * @returns {Promise<void>}
   */
  async saveSitemap() {
    try {
      const sitemapContent = await this.generateSitemap();
      
      // Ensure public directory exists
      const publicDir = path.dirname(this.sitemapPath);
      await fs.mkdir(publicDir, { recursive: true });
      
      await fs.writeFile(this.sitemapPath, sitemapContent, 'utf8');
      console.log('✅ Sitemap saved successfully');
    } catch (error) {
      console.error('❌ Error saving sitemap:', error);
      throw error;
    }
  }

  /**
   * Generate robots.txt content
   * @returns {string} Robots.txt content
   */
  generateRobotsTxt() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      return `User-agent: *
Allow: /

# Disallow admin and user account pages
Disallow: /admin/
Disallow: /account/
Disallow: /auth/
Disallow: /checkout/

# Disallow API endpoints
Disallow: /api/

# Allow important pages
Allow: /products/
Allow: /category/
Allow: /

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl delay
Crawl-delay: 1`;
    } else {
      return `User-agent: *
Disallow: /

# Development environment - block all crawlers`;
    }
  }

  /**
   * Generate structured data for product
   * @param {Object} product - Product object
   * @returns {Object} JSON-LD structured data
   */
  generateProductStructuredData(product) {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images?.map(img => `${this.baseUrl}${img.url}`) || [],
      sku: product.sku,
      brand: {
        '@type': 'Brand',
        name: product.specifications?.brand || 'Premium Clothing Store'
      },
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'USD',
        availability: product.stock > 0 ? 
          'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: `${this.baseUrl}/products/${product.slug}`,
        seller: {
          '@type': 'Organization',
          name: 'Premium Clothing Store'
        }
      }
    };

    // Add review data if available
    if (product.averageRating && product.totalReviews > 0) {
      structuredData.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating,
        reviewCount: product.totalReviews,
        bestRating: 5,
        worstRating: 1
      };
    }

    // Add category information
    if (product.category) {
      structuredData.category = product.category.name;
    }

    // Add additional properties
    if (product.specifications) {
      const additionalProperties = [];
      
      Object.entries(product.specifications).forEach(([key, value]) => {
        if (value && key !== 'brand') {
          additionalProperties.push({
            '@type': 'PropertyValue',
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: value
          });
        }
      });

      if (additionalProperties.length > 0) {
        structuredData.additionalProperty = additionalProperties;
      }
    }

    return structuredData;
  }

  /**
   * Generate structured data for organization
   * @returns {Object} JSON-LD structured data
   */
  generateOrganizationStructuredData() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Premium Clothing Store',
      url: this.baseUrl,
      logo: `${this.baseUrl}/assets/images/logo.png`,
      description: 'Premium clothing store offering high-quality men\'s and women\'s fashion',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Fashion Street',
        addressLocality: 'New York',
        addressRegion: 'NY',
        postalCode: '10001',
        addressCountry: 'US'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-555-123-4567',
        contactType: 'customer service',
        availableLanguage: 'English'
      },
      sameAs: [
        'https://www.facebook.com/premiumclothing',
        'https://www.instagram.com/premiumclothing',
        'https://www.twitter.com/premiumclothing'
      ]
    };
  }

  /**
   * Generate structured data for breadcrumbs
   * @param {Array} breadcrumbs - Breadcrumb items
   * @returns {Object} JSON-LD structured data
   */
  generateBreadcrumbStructuredData(breadcrumbs) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `${this.baseUrl}${crumb.url}`
      }))
    };
  }

  /**
   * Generate meta tags for product page
   * @param {Object} product - Product object
   * @returns {Object} Meta tags object
   */
  generateProductMetaTags(product) {
    const title = `${product.name} | Premium Clothing Store`;
    const description = product.shortDescription || 
      product.description.substring(0, 160).replace(/\s+/g, ' ').trim();
    const image = product.images?.[0]?.url ? 
      `${this.baseUrl}${product.images[0].url}` : 
      `${this.baseUrl}/assets/images/default-product.jpg`;

    return {
      title,
      description,
      keywords: [
        product.name,
        product.category?.name,
        product.specifications?.brand,
        ...(product.tags || []),
        'clothing',
        'fashion'
      ].filter(Boolean).join(', '),
      
      // Open Graph tags
      'og:title': title,
      'og:description': description,
      'og:image': image,
      'og:url': `${this.baseUrl}/products/${product.slug}`,
      'og:type': 'product',
      'og:site_name': 'Premium Clothing Store',
      
      // Twitter Card tags
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': image,
      
      // Product-specific meta tags
      'product:price:amount': product.price,
      'product:price:currency': 'USD',
      'product:availability': product.stock > 0 ? 'in stock' : 'out of stock'
    };
  }

  /**
   * Generate meta tags for category page
   * @param {Object} category - Category object
   * @returns {Object} Meta tags object
   */
  generateCategoryMetaTags(category) {
    const title = `${category.name} | Premium Clothing Store`;
    const description = category.description || 
      `Shop the best ${category.name.toLowerCase()} collection at Premium Clothing Store. High-quality fashion with fast shipping.`;

    return {
      title,
      description,
      keywords: [
        category.name,
        'clothing',
        'fashion',
        'online shopping'
      ].join(', '),
      
      'og:title': title,
      'og:description': description,
      'og:url': `${this.baseUrl}/category/${category.slug}`,
      'og:type': 'website',
      
      'twitter:card': 'summary',
      'twitter:title': title,
      'twitter:description': description
    };
  }

  /**
   * Update sitemap automatically
   * @returns {Promise<void>}
   */
  async updateSitemap() {
    try {
      await this.saveSitemap();
      console.log('Sitemap updated successfully');
    } catch (error) {
      console.error('Failed to update sitemap:', error);
    }
  }

  /**
   * Schedule sitemap updates
   */
  scheduleSitemapUpdates() {
    // Update sitemap daily at 2 AM
    const updateInterval = 24 * 60 * 60 * 1000; // 24 hours
    
    setInterval(() => {
      this.updateSitemap();
    }, updateInterval);
    
    console.log('Sitemap auto-update scheduled');
  }

  /**
   * Generate canonical URL
   * @param {string} path - URL path
   * @returns {string} Canonical URL
   */
  generateCanonicalUrl(path) {
    return `${this.baseUrl}${path}`;
  }

  /**
   * Generate hreflang tags for internationalization
   * @param {string} path - Current path
   * @returns {Array} Hreflang tags
   */
  generateHreflangTags(path) {
    // For future internationalization
    return [
      {
        rel: 'alternate',
        hreflang: 'en-US',
        href: `${this.baseUrl}${path}`
      }
    ];
  }
}

module.exports = new SeoService();