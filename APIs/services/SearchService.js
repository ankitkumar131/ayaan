/**
 * Search Service
 * 
 * Provides advanced search functionality using Elasticsearch for the e-commerce platform.
 * Includes product search, auto-complete, and faceted search capabilities.
 */

const Product = require('../models/Product');
const Category = require('../models/Category');

class SearchService {
  constructor() {
    // Initialize Elasticsearch client if available
    this.elasticsearchAvailable = false;
    this.client = null;
    
    try {
      const { Client } = require('@elastic/elasticsearch');
      this.client = new Client({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
      });
      this.elasticsearchAvailable = true;
      console.log('✅ Elasticsearch client initialized');
    } catch (error) {
      console.log('⚠️ Elasticsearch not available, falling back to MongoDB search');
    }
  }

  /**
   * Initialize Elasticsearch indices
   */
  async initializeIndices() {
    if (!this.elasticsearchAvailable) return;
    
    try {
      // Create products index
      const productsIndexExists = await this.client.indices.exists({
        index: 'products'
      });
      
      if (!productsIndexExists.body) {
        await this.client.indices.create({
          index: 'products',
          body: {
            mappings: {
              properties: {
                name: {
                  type: 'text',
                  analyzer: 'standard',
                  fields: {
                    keyword: { type: 'keyword' },
                    suggest: {
                      type: 'completion',
                      analyzer: 'simple'
                    }
                  }
                },
                description: { type: 'text', analyzer: 'standard' },
                category: {
                  type: 'text',
                  fields: { keyword: { type: 'keyword' } }
                },
                brand: {
                  type: 'text',
                  fields: { keyword: { type: 'keyword' } }
                },
                price: { type: 'float' },
                tags: { type: 'keyword' },
                isActive: { type: 'boolean' },
                ratings: {
                  type: 'object',
                  properties: {
                    average: { type: 'float' },
                    count: { type: 'integer' }
                  }
                },
                createdAt: { type: 'date' },
                totalSales: { type: 'integer' }
              }
            }
          }
        });
        console.log('✅ Products index created');
      }
      
      // Index existing products
      await this.indexAllProducts();
      
    } catch (error) {
      console.error('❌ Error initializing Elasticsearch indices:', error);
    }
  }

  /**
   * Index a single product
   * @param {Object} product - Product object
   */
  async indexProduct(product) {
    if (!this.elasticsearchAvailable) return;
    
    try {
      await this.client.index({
        index: 'products',
        id: product._id.toString(),
        body: {
          name: product.name,
          description: product.description,
          category: product.category?.name || '',
          brand: product.specifications?.brand || '',
          price: product.price,
          tags: product.tags || [],
          isActive: product.isActive,
          ratings: {
            average: product.averageRating || 0,
            count: product.totalReviews || 0
          },
          createdAt: product.createdAt,
          totalSales: product.totalSales || 0,
          suggest: {
            input: [
              product.name,
              ...(product.tags || []),
              product.specifications?.brand || ''
            ].filter(Boolean)
          }
        }
      });
    } catch (error) {
      console.error('Error indexing product:', error);
    }
  }

  /**
   * Remove product from index
   * @param {string} productId - Product ID
   */
  async removeProduct(productId) {
    if (!this.elasticsearchAvailable) return;
    
    try {
      await this.client.delete({
        index: 'products',
        id: productId
      });
    } catch (error) {
      console.error('Error removing product from index:', error);
    }
  }

  /**
   * Index all products from database
   */
  async indexAllProducts() {
    if (!this.elasticsearchAvailable) return;
    
    try {
      const products = await Product.find({ isActive: true })
        .populate('category', 'name')
        .lean();
      
      const body = [];
      
      for (const product of products) {
        body.push({ index: { _index: 'products', _id: product._id.toString() } });
        body.push({
          name: product.name,
          description: product.description,
          category: product.category?.name || '',
          brand: product.specifications?.brand || '',
          price: product.price,
          tags: product.tags || [],
          isActive: product.isActive,
          ratings: {
            average: product.averageRating || 0,
            count: product.totalReviews || 0
          },
          createdAt: product.createdAt,
          totalSales: product.totalSales || 0,
          suggest: {
            input: [
              product.name,
              ...(product.tags || []),
              product.specifications?.brand || ''
            ].filter(Boolean)
          }
        });
      }
      
      if (body.length > 0) {
        await this.client.bulk({ body });
        console.log(`✅ Indexed ${products.length} products`);
      }
    } catch (error) {
      console.error('Error indexing all products:', error);
    }
  }

  /**
   * Search products with advanced filtering and facets
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<Object>} Search results
   */
  async searchProducts(query, filters = {}, page = 1, limit = 20) {
    if (this.elasticsearchAvailable) {
      return this.elasticsearchSearch(query, filters, page, limit);
    } else {
      return this.mongodbSearch(query, filters, page, limit);
    }
  }

  /**
   * Elasticsearch-based search
   */
  async elasticsearchSearch(query, filters, page, limit) {
    try {
      const from = (page - 1) * limit;
      
      // Build search query
      const searchQuery = {
        index: 'products',
        body: {
          from,
          size: limit,
          query: {
            bool: {
              must: [],
              filter: [{ term: { isActive: true } }]
            }
          },
          aggs: {
            categories: {
              terms: { field: 'category.keyword', size: 20 }
            },
            brands: {
              terms: { field: 'brand.keyword', size: 20 }
            },
            price_ranges: {
              range: {
                field: 'price',
                ranges: [
                  { key: 'Under $50', to: 50 },
                  { key: '$50 - $100', from: 50, to: 100 },
                  { key: '$100 - $200', from: 100, to: 200 },
                  { key: 'Over $200', from: 200 }
                ]
              }
            },
            rating_ranges: {
              range: {
                field: 'ratings.average',
                ranges: [
                  { key: '4+ Stars', from: 4 },
                  { key: '3+ Stars', from: 3 },
                  { key: '2+ Stars', from: 2 },
                  { key: '1+ Stars', from: 1 }
                ]
              }
            }
          },
          sort: this.buildSortQuery(filters.sort)
        }
      };
      
      // Add text search
      if (query && query.trim()) {
        searchQuery.body.query.bool.must.push({
          multi_match: {
            query: query.trim(),
            fields: ['name^3', 'description^2', 'brand^2', 'tags^1.5'],
            fuzziness: 'AUTO',
            operator: 'and'
          }
        });
      } else {
        searchQuery.body.query.bool.must.push({ match_all: {} });
      }
      
      // Apply filters
      if (filters.category) {
        searchQuery.body.query.bool.filter.push({
          term: { 'category.keyword': filters.category }
        });
      }
      
      if (filters.brand) {
        searchQuery.body.query.bool.filter.push({
          term: { 'brand.keyword': filters.brand }
        });
      }
      
      if (filters.minPrice || filters.maxPrice) {
        const priceRange = {};
        if (filters.minPrice) priceRange.gte = parseFloat(filters.minPrice);
        if (filters.maxPrice) priceRange.lte = parseFloat(filters.maxPrice);
        
        searchQuery.body.query.bool.filter.push({
          range: { price: priceRange }
        });
      }
      
      if (filters.minRating) {
        searchQuery.body.query.bool.filter.push({
          range: { 'ratings.average': { gte: parseFloat(filters.minRating) } }
        });
      }
      
      if (filters.tags && filters.tags.length > 0) {
        searchQuery.body.query.bool.filter.push({
          terms: { tags: filters.tags }
        });
      }
      
      const response = await this.client.search(searchQuery);
      
      // Get product IDs and fetch full product data from MongoDB
      const productIds = response.body.hits.hits.map(hit => hit._id);
      const products = await Product.find({ _id: { $in: productIds } })
        .populate('category', 'name slug')
        .lean();
      
      // Maintain search result order
      const orderedProducts = productIds.map(id => 
        products.find(p => p._id.toString() === id)
      ).filter(Boolean);
      
      return {
        products: orderedProducts,
        total: response.body.hits.total.value,
        page,
        limit,
        totalPages: Math.ceil(response.body.hits.total.value / limit),
        facets: {
          categories: response.body.aggregations.categories.buckets,
          brands: response.body.aggregations.brands.buckets,
          priceRanges: response.body.aggregations.price_ranges.buckets,
          ratingRanges: response.body.aggregations.rating_ranges.buckets
        }
      };
      
    } catch (error) {
      console.error('Elasticsearch search error:', error);
      // Fallback to MongoDB search
      return this.mongodbSearch(query, filters, page, limit);
    }
  }

  /**
   * MongoDB-based search (fallback)
   */
  async mongodbSearch(query, filters, page, limit) {
    try {
      const skip = (page - 1) * limit;
      
      // Build MongoDB query
      const searchQuery = { isActive: true };
      
      // Text search
      if (query && query.trim()) {
        searchQuery.$text = { $search: query.trim() };
      }
      
      // Apply filters
      if (filters.category) {
        const category = await Category.findOne({ 
          $or: [
            { name: { $regex: filters.category, $options: 'i' } },
            { slug: filters.category }
          ]
        });
        if (category) {
          searchQuery.category = category._id;
        }
      }
      
      if (filters.minPrice || filters.maxPrice) {
        searchQuery.price = {};
        if (filters.minPrice) searchQuery.price.$gte = parseFloat(filters.minPrice);
        if (filters.maxPrice) searchQuery.price.$lte = parseFloat(filters.maxPrice);
      }
      
      if (filters.minRating) {
        searchQuery.averageRating = { $gte: parseFloat(filters.minRating) };
      }
      
      if (filters.tags && filters.tags.length > 0) {
        searchQuery.tags = { $in: filters.tags };
      }
      
      if (filters.brand) {
        searchQuery['specifications.brand'] = { $regex: filters.brand, $options: 'i' };
      }
      
      // Build sort
      let sort = { createdAt: -1 };
      if (query && query.trim()) {
        sort = { score: { $meta: 'textScore' }, ...sort };
      }
      
      if (filters.sort) {
        switch (filters.sort) {
          case 'price_asc':
            sort = { price: 1 };
            break;
          case 'price_desc':
            sort = { price: -1 };
            break;
          case 'rating':
            sort = { averageRating: -1, totalReviews: -1 };
            break;
          case 'popular':
            sort = { totalSales: -1 };
            break;
          case 'newest':
            sort = { createdAt: -1 };
            break;
        }
      }
      
      // Execute search
      const [products, total] = await Promise.all([
        Product.find(searchQuery)
          .populate('category', 'name slug')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(searchQuery)
      ]);
      
      // Generate basic facets
      const [categories, brands] = await Promise.all([
        Product.aggregate([
          { $match: { isActive: true } },
          { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
          { $unwind: '$category' },
          { $group: { _id: '$category.name', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Product.aggregate([
          { $match: { isActive: true, 'specifications.brand': { $exists: true, $ne: '' } } },
          { $group: { _id: '$specifications.brand', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);
      
      return {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        facets: {
          categories: categories.map(c => ({ key: c._id, doc_count: c.count })),
          brands: brands.map(b => ({ key: b._id, doc_count: b.count })),
          priceRanges: [],
          ratingRanges: []
        }
      };
      
    } catch (error) {
      console.error('MongoDB search error:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions/auto-complete
   * @param {string} query - Partial search query
   * @param {number} limit - Number of suggestions
   * @returns {Promise<Array>} Search suggestions
   */
  async getSuggestions(query, limit = 5) {
    if (!query || query.length < 2) return [];
    
    if (this.elasticsearchAvailable) {
      try {
        const response = await this.client.search({
          index: 'products',
          body: {
            suggest: {
              product_suggest: {
                prefix: query,
                completion: {
                  field: 'suggest',
                  size: limit
                }
              }
            }
          }
        });
        
        return response.body.suggest.product_suggest[0].options.map(option => ({
          text: option.text,
          score: option._score
        }));
      } catch (error) {
        console.error('Elasticsearch suggestions error:', error);
      }
    }
    
    // Fallback to MongoDB
    const suggestions = await Product.find({
      isActive: true,
      name: { $regex: query, $options: 'i' }
    })
    .select('name')
    .limit(limit)
    .lean();
    
    return suggestions.map(s => ({ text: s.name, score: 1 }));
  }

  /**
   * Build sort query for Elasticsearch
   */
  buildSortQuery(sortOption) {
    switch (sortOption) {
      case 'price_asc':
        return [{ price: 'asc' }];
      case 'price_desc':
        return [{ price: 'desc' }];
      case 'rating':
        return [{ 'ratings.average': 'desc' }, { 'ratings.count': 'desc' }];
      case 'popular':
        return [{ totalSales: 'desc' }];
      case 'newest':
        return [{ createdAt: 'desc' }];
      default:
        return [{ _score: 'desc' }, { createdAt: 'desc' }];
    }
  }

  /**
   * Get trending searches
   * @returns {Promise<Array>} Trending search terms
   */
  async getTrendingSearches() {
    // This would require implementing search analytics
    // For now, return popular product names
    const trending = await Product.find({ isActive: true })
      .sort({ totalSales: -1 })
      .limit(10)
      .select('name tags')
      .lean();
    
    const terms = [];
    trending.forEach(product => {
      terms.push(product.name);
      if (product.tags) {
        terms.push(...product.tags);
      }
    });
    
    return [...new Set(terms)].slice(0, 10);
  }

  /**
   * Search analytics - track search queries
   * @param {string} query - Search query
   * @param {number} resultsCount - Number of results returned
   * @param {string} userId - User ID (optional)
   */
  async trackSearch(query, resultsCount, userId = null) {
    // This would typically be stored in a separate analytics collection
    // For now, just log it
    console.log('Search tracked:', {
      query,
      resultsCount,
      userId,
      timestamp: new Date()
    });
  }
}

module.exports = new SearchService();