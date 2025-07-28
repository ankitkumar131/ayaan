# E-Commerce Clothing API

A comprehensive Node.js/Express API for an e-commerce clothing platform with advanced features including analytics, search, recommendations, and SEO optimization.

## 🚀 Features

### Core Features
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Product Management**: Complete CRUD operations with variants (sizes, colors)
- **Order Processing**: Full order lifecycle from cart to delivery
- **User Management**: Profile management, address handling, preferences
- **Review System**: Product reviews with moderation and voting
- **Promotion System**: Advanced discount codes and promotional campaigns

### Advanced Features
- **Analytics & BI**: Comprehensive business intelligence with KPIs
- **Advanced Search**: Elasticsearch integration with faceted search
- **Recommendations**: AI-powered product recommendations
- **SEO Optimization**: Sitemap generation, structured data, meta tags
- **Caching**: Redis-based caching for improved performance
- **Logging**: Comprehensive logging with Winston

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 6.0+
- Redis 7+ (optional, for caching)
- Elasticsearch 8+ (optional, for advanced search)

## 🛠 Installation

1. **Clone and navigate to the APIs directory**
   ```bash
   cd APIs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce-clothing

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=24h
JWT_ADMIN_EXPIRE=4h

# Admin Setup
ADMIN_REGISTRATION_KEY=admin_secret_key_2024
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@ecommerce.com
DEFAULT_ADMIN_PASSWORD=Admin@123456

# Services (Optional)
ELASTICSEARCH_URL=http://localhost:9200
REDIS_URL=redis://localhost:6379

# Frontend
FRONTEND_URL=http://localhost:4200
CORS_ORIGIN=http://localhost:4200
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | User login | Public |
| POST | `/auth/register-admin` | Register admin user | Public (with key) |
| POST | `/admin/auth/login` | Admin-specific login | Public |
| POST | `/auth/forgot-password` | Request password reset | Public |
| PUT | `/auth/reset-password` | Reset password | Public |

### Product Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/products` | Get all products | Public |
| GET | `/products/:id` | Get product by ID | Public |
| POST | `/products` | Create product | Admin |
| PUT | `/products/:id` | Update product | Admin |
| DELETE | `/products/:id` | Delete product | Admin |
| GET | `/products/featured` | Get featured products | Public |
| GET | `/products/search` | Search products | Public |

### User Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/user/profile` | Get user profile | User |
| PUT | `/user/profile` | Update profile | User |
| PUT | `/user/password` | Change password | User |
| PUT | `/user/address` | Update address | User |

### Cart Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/cart` | Get user cart | User |
| POST | `/cart/add` | Add item to cart | User |
| PUT | `/cart/update/:itemId` | Update cart item | User |
| DELETE | `/cart/remove/:itemId` | Remove from cart | User |
| POST | `/cart/apply-promotion` | Apply promo code | User |

### Order Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/orders` | Place order | User |
| GET | `/orders` | Get order history | User |
| GET | `/orders/:id` | Get order details | User |
| GET | `/orders/:id/track` | Track order | User |
| POST | `/orders/:id/cancel` | Cancel order | User |

### Advanced Features

#### Analytics (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/dashboard` | Dashboard analytics |
| GET | `/analytics/conversion-rate` | Conversion rate |
| GET | `/analytics/aov` | Average order value |
| GET | `/analytics/clv` | Customer lifetime value |

#### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Advanced product search |
| GET | `/search/suggestions` | Auto-complete suggestions |
| GET | `/search/trending` | Trending searches |

#### Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recommendations/product/:id` | Product recommendations |
| GET | `/recommendations/personalized` | Personalized recommendations |
| GET | `/recommendations/trending` | Trending products |

#### SEO
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/seo/sitemap.xml` | XML sitemap |
| GET | `/seo/robots.txt` | Robots.txt |
| GET | `/seo/structured-data/product/:id` | Product structured data |

## 🏗 Architecture

### Directory Structure
```
APIs/
├── middleware/          # Express middleware
│   ├── auth.js         # Authentication middleware
│   ├── cache.js        # Caching middleware
│   ├── errorHandler.js # Error handling
│   ├── logger.js       # Logging middleware
│   └── upload.js       # File upload handling
├── models/             # MongoDB models
│   ├── User.js         # User model
│   ├── Product.js      # Product model
│   ├── Order.js        # Order model
│   ├── Cart.js         # Cart model
│   ├── Review.js       # Review model
│   └── Promotion.js    # Promotion model
├── routes/             # API routes
│   ├── auth.js         # Authentication routes
│   ├── user.js         # User management
│   ├── product.js      # Product management
│   ├── admin.js        # Admin routes
│   ├── analytics.js    # Analytics endpoints
│   ├── search.js       # Search endpoints
│   └── recommendations.js # Recommendation endpoints
├── services/           # Business logic services
│   ├── AnalyticsService.js    # Analytics service
│   ├── SearchService.js       # Search service
│   ├── RecommendationService.js # Recommendation service
│   └── SeoService.js          # SEO service
├── utils/              # Utility functions
│   └── adminSetup.js   # Admin initialization
└── server.js           # Main server file
```

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Caching**: Redis
- **Search**: Elasticsearch
- **File Upload**: Multer
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: User and admin role separation
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **Password Hashing**: Bcrypt for secure password storage
- **CORS Configuration**: Controlled cross-origin requests
- **Security Headers**: Helmet.js for security headers

## 📊 Performance Features

- **Redis Caching**: Intelligent caching strategy
- **Database Indexing**: Optimized MongoDB queries
- **Compression**: Gzip compression for responses
- **Pagination**: Efficient data pagination
- **Lazy Loading**: On-demand resource loading

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📈 Monitoring & Analytics

### Health Check
```
GET /health
```

Returns comprehensive health status including:
- Database connection status
- Cache availability
- Service status
- Memory usage
- Uptime information

### Logging
- **Request Logging**: All API requests are logged
- **Error Logging**: Comprehensive error tracking
- **Business Events**: Order placement, user registration, etc.
- **Security Events**: Login attempts, suspicious activity

### Analytics Dashboard
Access comprehensive analytics through admin endpoints:
- Conversion rates
- Average order value
- Customer lifetime value
- Sales trends
- Product performance

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t ecommerce-api .

# Run container
docker run -p 3000:3000 ecommerce-api
```

### Production Considerations
1. **Environment Variables**: Set production values
2. **Database**: Use MongoDB Atlas or replica sets
3. **Caching**: Configure Redis cluster
4. **Search**: Set up Elasticsearch cluster
5. **Monitoring**: Implement APM tools
6. **Load Balancing**: Use nginx or cloud load balancers

## 🔧 Development

### Adding New Features
1. Create model in `/models` if needed
2. Add routes in `/routes`
3. Implement business logic in `/services`
4. Add middleware if required
5. Update documentation

### Code Style
- Use ESLint for code linting
- Follow Node.js best practices
- Implement proper error handling
- Add comprehensive logging
- Write unit tests

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalItems": 50
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with core e-commerce functionality
- Advanced analytics and search features
- Comprehensive recommendation system
- SEO optimization tools
- Production-ready architecture

---

**Built with ❤️ for modern e-commerce needs**