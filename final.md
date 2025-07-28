# E-Commerce Clothing Website - Comprehensive Analysis and Documentation

## Table of Contents
1. [API Endpoints](#api-endpoints)
2. [Frontend Endpoints](#frontend-endpoints)
3. [Summary Table](#summary-table)
4. [Production Readiness Improvements](#production-readiness-improvements)
5. [Technology Stack Recommendations](#technology-stack-recommendations)

---

## API Endpoints

### Authentication Endpoints

#### Public Authentication
- **POST** `/api/auth/register` - Register new user
  - **Parameters**: username, email, password, firstName, lastName, phone, address fields
  - **Response**: JWT token and user object with role "user"

- **POST** `/api/auth/login` - User/Admin login
  - **Parameters**: email, password
  - **Response**: JWT token and user object with role information

- **POST** `/api/auth/forgot-password` - Request password reset
  - **Parameters**: email
  - **Response**: Confirmation message

- **PUT** `/api/auth/reset-password` - Reset password with token
  - **Parameters**: token, password
  - **Response**: Success confirmation

#### Admin Authentication
- **POST** `/api/auth/register-admin` - Register admin user
  - **Parameters**: username, email, password, firstName, lastName, phone, adminKey
  - **Response**: JWT token and admin user object

- **POST** `/api/admin/auth/login` - Admin-specific login
  - **Parameters**: email, password
  - **Response**: Admin JWT token

### User Management Endpoints

#### User Profile (Authenticated Users)
- **GET** `/api/user/profile` - Get user profile
  - **Headers**: Authorization Bearer token
  - **Response**: User profile information

- **PUT** `/api/user/profile` - Update user profile
  - **Headers**: Authorization Bearer token
  - **Parameters**: username, phone, address fields, profilePicture
  - **Response**: Updated user profile

- **PUT** `/api/user/change-password` - Change password
  - **Headers**: Authorization Bearer token
  - **Parameters**: currentPassword, newPassword
  - **Response**: Success confirmation

#### Admin User Management
- **GET** `/api/admin/users` - Get all users
- **GET** `/api/admin/users/:userId` - Get specific user details
- **PUT** `/api/admin/users/:userId/status` - Update user status
- **DELETE** `/api/admin/users/:userId` - Delete user
- **POST** `/api/admin/invite` - Invite new admin

### Product Management Endpoints

#### Public Product Access
- **GET** `/api/products` - Get all products with filtering
  - **Query Parameters**: category, minPrice, maxPrice, sort, page, limit
  - **Response**: Paginated product list

- **GET** `/api/products/:id` - Get product by ID
  - **Response**: Detailed product information

- **GET** `/api/products/category/:categoryId` - Get products by category
  - **Response**: Category-filtered products

- **GET** `/api/products/search` - Search products
  - **Query Parameters**: search query
  - **Response**: Search results

#### Admin Product Management
- **POST** `/api/admin/products` - Create new product
  - **Headers**: Admin authorization
  - **Parameters**: name, description, price, category, stock, sku, images, specifications
  - **Response**: Created product object

- **PUT** `/api/admin/products/:id` - Update product
  - **Headers**: Admin authorization
  - **Parameters**: Product update fields
  - **Response**: Updated product object

- **DELETE** `/api/admin/products/:id` - Delete product
  - **Headers**: Admin authorization
  - **Response**: Deletion confirmation

### Category Management Endpoints

#### Public Category Access
- **GET** `/api/categories` - Get all categories
  - **Response**: List of categories

- **GET** `/api/categories/:id` - Get category by ID
  - **Response**: Category details

#### Admin Category Management
- **POST** `/api/admin/categories` - Create category
- **PUT** `/api/admin/categories/:id` - Update category
- **DELETE** `/api/admin/categories/:id` - Delete category

### Cart Management Endpoints

#### User Cart Operations (Authenticated)
- **GET** `/api/cart` - Get user's cart
  - **Headers**: User authorization
  - **Response**: Cart items and totals

- **POST** `/api/cart/add` - Add item to cart
  - **Headers**: User authorization
  - **Parameters**: productId, quantity, specifications (size, color)
  - **Response**: Updated cart

- **PUT** `/api/cart/update/:productId` - Update cart item
  - **Headers**: User authorization
  - **Parameters**: quantity, specifications
  - **Response**: Updated cart

- **DELETE** `/api/cart/remove/:productId` - Remove item from cart
  - **Headers**: User authorization
  - **Response**: Updated cart

### Order Management Endpoints

#### User Order Operations (Authenticated)
- **POST** `/api/orders` - Place order
  - **Headers**: User authorization
  - **Parameters**: shippingAddress, billingAddress, paymentMethod
  - **Response**: Created order object

- **GET** `/api/orders` - Get user's order history
  - **Headers**: User authorization
  - **Query Parameters**: page, limit
  - **Response**: Paginated order list

- **GET** `/api/orders/:orderId/track` - Track order
  - **Headers**: User authorization
  - **Response**: Order status and tracking information

- **POST** `/api/orders/:orderId/review` - Leave product review
  - **Headers**: User authorization
  - **Parameters**: rating, comment, images
  - **Response**: Review confirmation

- **POST** `/api/orders/:orderId/replacement` - Request replacement
  - **Headers**: User authorization
  - **Parameters**: reason, items, images
  - **Response**: Replacement request confirmation

- **POST** `/api/orders/:orderId/refund` - Request refund
  - **Headers**: User authorization
  - **Parameters**: reason, items, images, bankDetails
  - **Response**: Refund request confirmation

#### Admin Order Management
- **GET** `/api/admin/orders` - Get all orders
  - **Headers**: Admin authorization
  - **Query Parameters**: status, startDate, endDate
  - **Response**: Filtered order list

- **PUT** `/api/admin/orders/:orderId/status` - Update order status
  - **Headers**: Admin authorization
  - **Parameters**: status, trackingNumber
  - **Response**: Updated order

### Promotion Management Endpoints

#### Admin Promotion Operations
- **GET** `/api/admin/promotions` - Get all promotions
- **POST** `/api/admin/promotions` - Create promotion
- **PUT** `/api/admin/promotions/:id` - Update promotion
- **DELETE** `/api/admin/promotions/:id` - Delete promotion

### Analytics Endpoints

#### Admin Analytics
- **GET** `/api/admin/statistics` - Get sales statistics
  - **Headers**: Admin authorization
  - **Response**: Sales data, order metrics, top products

- **GET** `/api/admin/user-statistics` - Get user statistics
  - **Headers**: Admin authorization
  - **Response**: User registration data, top customers

---

## Frontend Endpoints

### Public Routes (Angular 19)

#### Landing and Navigation
- **/** - Home page with featured products, categories, and promotions
- **/home** - Main landing page (redirect from root)

#### Authentication Routes
- **/auth/login** - User login form with email/password
- **/auth/register** - User registration form with validation
- **/auth/forgot-password** - Password reset request form
- **/auth/reset-password** - New password setup form

#### Product Browsing
- **/products** - All products with filtering, sorting, and pagination
- **/products/category/:categorySlug** - Category-specific products (men/women)
- **/products/search** - Product search results with query parameters
- **/products/:productId** - Detailed product view with images, specifications, and reviews

#### Shopping Cart
- **/cart** - Shopping cart page with item management and totals

### Authenticated User Routes

#### Checkout Process
- **/checkout** - Multi-step checkout process
- **/checkout/shipping** - Shipping address form
- **/checkout/payment** - Payment information form
- **/checkout/confirmation/:orderId** - Order confirmation page

#### Account Management
- **/account/profile** - User profile management and editing
- **/account/orders** - Order history with status and details
- **/account/orders/:orderId** - Specific order details and tracking
- **/account/returns** - Return and refund request management
- **/account/reviews** - User's product reviews management

### Admin Routes (Admin Role Required)

#### Admin Dashboard
- **/admin/dashboard** - Overview with sales statistics and recent activity

#### Product Management
- **/admin/products** - Product list with search, filter, and bulk actions
- **/admin/products/add** - Add new product form with image upload
- **/admin/products/:productId** - Edit existing product
- **/admin/products/images/:productId** - Manage product images

#### Category Management
- **/admin/categories** - Category list with hierarchy management
- **/admin/categories/add** - Add new category form
- **/admin/categories/:categoryId** - Edit existing category

#### Order Management
- **/admin/orders** - All orders with filtering by status and date
- **/admin/orders/:orderId** - Order details with status management
- **/admin/returns** - Return and refund request processing
- **/admin/returns/:returnId** - Specific return request details

#### User Management
- **/admin/users** - User list with role and status management
- **/admin/users/:userId** - User details and order history
- **/admin/users/invite** - Invite new admin users

#### Promotion Management
- **/admin/promotions** - Promotion list with status filtering
- **/admin/promotions/add** - Create new promotion
- **/admin/promotions/:promotionId** - Edit existing promotion
- **/admin/promotions/analytics** - Promotion usage statistics

#### Settings Management
- **/admin/settings/general** - Store information and configuration
- **/admin/settings/shipping** - Shipping methods and rates
- **/admin/settings/payment** - Payment gateway configuration

---

## Summary Table

| Feature Category | User Role | Admin Role | Key Functionality |
|------------------|-----------|------------|-------------------|
| **Authentication** | Login, Register, Password Reset | Admin Login, Admin Registration | JWT-based authentication with role-based access |
| **Product Browsing** | View, Search, Filter Products | Full CRUD Operations | Category-based browsing (Men/Women), detailed product views |
| **Shopping Cart** | Add, Remove, Update Items | View User Carts | Persistent cart with specifications (size, color) |
| **Order Management** | Place Orders, Track Status | Process Orders, Update Status | Complete order lifecycle with tracking |
| **User Account** | Profile Management, Order History | User Management, Account Control | Personal information and order tracking |
| **Reviews & Ratings** | Leave Reviews, View Ratings | Moderate Reviews | Product feedback system |
| **Returns & Refunds** | Request Returns/Refunds | Process Return Requests | Complete return management workflow |
| **Promotions** | Apply Promotion Codes | Create and Manage Promotions | Discount code system |
| **Analytics** | Personal Order Statistics | Sales and User Analytics | Business intelligence and reporting |

### Current Implementation Status

| Component | Status | Issues Identified |
|-----------|--------|-------------------|
| **Backend API** | ✅ Implemented | Some endpoints may need fixes (admin login route) |
| **Frontend Routes** | ✅ Implemented | Cart functionality and password change endpoints |
| **Authentication** | ✅ Working | Default admin account created on server start |
| **Product Management** | ✅ Working | Full CRUD operations available |
| **Order Processing** | ✅ Working | Complete order lifecycle implemented |
| **Admin Panel** | ⚠️ Partial | Some API endpoints need verification |
| **Payment Integration** | ⚠️ Basic | Supports credit card, PayPal, Stripe |
| **File Upload** | ✅ Working | Product images with 5MB limit |

---

## Production Readiness Improvements

### Security Enhancements

#### Authentication & Authorization
- **Multi-Factor Authentication (MFA)**: Implement 2FA for admin accounts and optional for users
- **OAuth Integration**: Add Google, Facebook, and Apple login options
- **Session Management**: Implement refresh tokens with automatic renewal
- **Rate Limiting**: Enhanced rate limiting with IP-based restrictions
- **CAPTCHA Integration**: Add CAPTCHA for registration and sensitive operations

#### Data Protection
- **Input Sanitization**: Comprehensive input validation and sanitization
- **SQL Injection Prevention**: Parameterized queries and ORM usage
- **XSS Protection**: Content Security Policy (CSP) headers
- **HTTPS Enforcement**: SSL/TLS certificates with HSTS headers
- **Data Encryption**: Encrypt sensitive data at rest and in transit

### Performance Optimizations

#### Frontend Performance
- **Code Splitting**: Implement advanced lazy loading for all feature modules
- **Image Optimization**: WebP format, responsive images, and lazy loading
- **Caching Strategy**: Service worker implementation for offline functionality
- **Bundle Optimization**: Tree shaking and dead code elimination
- **CDN Integration**: Static asset delivery through CDN

#### Backend Performance
- **Database Optimization**: Indexing, query optimization, and connection pooling
- **Caching Layer**: Redis implementation for session storage and frequent queries
- **API Response Optimization**: Pagination, field selection, and compression
- **Load Balancing**: Horizontal scaling with load balancers
- **Database Sharding**: Implement database partitioning for large datasets

### Scalability Improvements

#### Infrastructure
- **Microservices Architecture**: Break down monolithic structure into services
- **Container Orchestration**: Docker and Kubernetes deployment
- **Auto-scaling**: Implement horizontal and vertical scaling
- **Message Queues**: Asynchronous processing for order handling and notifications
- **Database Clustering**: Master-slave replication for read/write optimization

#### Monitoring & Logging
- **Application Performance Monitoring (APM)**: Real-time performance tracking
- **Error Tracking**: Comprehensive error logging and alerting
- **Analytics Integration**: Google Analytics, user behavior tracking
- **Health Checks**: Automated system health monitoring
- **Audit Logging**: Complete audit trail for all admin actions

### User Experience Enhancements

#### Mobile Optimization
- **Progressive Web App (PWA)**: Offline functionality and app-like experience
- **Mobile-First Design**: Responsive design optimized for mobile devices
- **Touch Gestures**: Swipe navigation and touch-friendly interactions
- **Mobile Payment Integration**: Apple Pay, Google Pay, and mobile wallets

#### Advanced Features
- **Wishlist Functionality**: Save products for later purchase
- **Product Recommendations**: AI-powered product suggestions
- **Live Chat Support**: Real-time customer support integration
- **Social Media Integration**: Social login and sharing capabilities
- **Email Marketing**: Automated email campaigns and newsletters

### Business Logic Enhancements

#### Inventory Management
- **Real-time Stock Updates**: Live inventory tracking across all channels
- **Low Stock Alerts**: Automated notifications for inventory management
- **Supplier Integration**: Direct supplier connectivity for restocking
- **Warehouse Management**: Multi-location inventory tracking

#### Advanced Order Management
- **Order Tracking Integration**: Real-time shipping updates from carriers
- **Partial Shipments**: Support for split orders and partial deliveries
- **Automated Refunds**: Streamlined refund processing
- **Return Merchandise Authorization (RMA)**: Structured return process

#### Marketing & Sales
- **Advanced Promotion Engine**: Complex discount rules and combinations
- **Customer Segmentation**: Targeted marketing based on user behavior
- **Loyalty Program**: Points-based reward system
- **Abandoned Cart Recovery**: Automated email reminders

### Compliance & Legal

#### Data Privacy
- **GDPR Compliance**: Data protection and user consent management
- **CCPA Compliance**: California Consumer Privacy Act adherence
- **Cookie Management**: Comprehensive cookie consent and management
- **Data Retention Policies**: Automated data cleanup and archival

#### Accessibility
- **WCAG 2.1 AA Compliance**: Web accessibility standards implementation
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: Ensure proper color contrast ratios

---

## Technology Stack Recommendations

### Backend Technology Stack

#### Core Framework
- **Node.js with Express.js** (Current)
  - **Pros**: Fast development, large ecosystem, JavaScript consistency
  - **Cons**: Single-threaded limitations for CPU-intensive tasks
  - **Recommendation**: Continue with current stack, add clustering for production

#### Alternative Backend Options
1. **Node.js with Fastify**
   - **Benefits**: Better performance than Express, built-in validation
   - **Migration Effort**: Low - similar API structure

2. **Python with FastAPI**
   - **Benefits**: Excellent performance, automatic API documentation, type safety
   - **Migration Effort**: Medium - requires rewriting but maintains similar structure

3. **TypeScript with NestJS**
   - **Benefits**: Enterprise-grade architecture, dependency injection, decorators
   - **Migration Effort**: Medium - provides better structure and maintainability

### Database Technology

#### Primary Database
- **MongoDB** (Current)
  - **Pros**: Flexible schema, good for product catalogs, horizontal scaling
  - **Cons**: Limited ACID transactions, complex aggregations
  - **Recommendation**: Continue with MongoDB, implement proper indexing

#### Complementary Database Solutions
1. **Redis** - Caching and session storage
2. **Elasticsearch** - Advanced product search and analytics
3. **PostgreSQL** - For complex relational data (orders, transactions)

### Frontend Technology Stack

#### Core Framework
- **Angular 19** (Current)
  - **Pros**: Enterprise-ready, TypeScript support, comprehensive tooling
  - **Cons**: Steep learning curve, larger bundle size
  - **Recommendation**: Excellent choice for e-commerce applications

#### State Management
- **NgRx** - For complex state management
- **Akita** - Lightweight alternative to NgRx
- **RxJS** - Current approach with services (sufficient for current scope)

#### UI Component Library
- **Angular Material** - Google's Material Design components
- **PrimeNG** - Rich set of UI components
- **Ng-Bootstrap** - Bootstrap components for Angular

### DevOps & Infrastructure

#### Cloud Platform Recommendations
1. **AWS (Amazon Web Services)**
   - **Services**: EC2, RDS, S3, CloudFront, Lambda
   - **Benefits**: Comprehensive services, scalability, reliability

2. **Google Cloud Platform**
   - **Services**: Compute Engine, Cloud SQL, Cloud Storage, Cloud CDN
   - **Benefits**: Excellent for AI/ML integration, competitive pricing

3. **Microsoft Azure**
   - **Services**: App Service, Azure Database, Blob Storage, CDN
   - **Benefits**: Good integration with Microsoft ecosystem

#### Containerization & Orchestration
- **Docker** - Application containerization
- **Kubernetes** - Container orchestration and scaling
- **Docker Compose** - Development environment setup

#### CI/CD Pipeline
- **GitHub Actions** - Automated testing and deployment
- **Jenkins** - Enterprise CI/CD solution
- **GitLab CI/CD** - Integrated DevOps platform

### Monitoring & Analytics

#### Application Monitoring
- **New Relic** - Comprehensive APM solution
- **Datadog** - Infrastructure and application monitoring
- **Sentry** - Error tracking and performance monitoring

#### Analytics & Business Intelligence
- **Google Analytics 4** - Web analytics and user behavior
- **Mixpanel** - Product analytics and user engagement
- **Tableau** - Business intelligence and data visualization

### Payment & Financial Services

#### Payment Gateways
- **Stripe** - Comprehensive payment processing
- **PayPal** - Popular payment option
- **Square** - Point-of-sale and online payments
- **Razorpay** - Popular in Asian markets

#### Financial Management
- **QuickBooks API** - Accounting integration
- **Xero API** - Cloud-based accounting
- **FreshBooks** - Invoice and expense management

### Communication & Notifications

#### Email Services
- **SendGrid** - Transactional and marketing emails
- **Mailgun** - Email API service
- **Amazon SES** - Cost-effective email service

#### SMS & Push Notifications
- **Twilio** - SMS and communication APIs
- **Firebase Cloud Messaging** - Push notifications
- **OneSignal** - Multi-platform push notifications

### Security & Compliance

#### Security Services
- **Auth0** - Identity and access management
- **Okta** - Enterprise identity solutions
- **AWS Cognito** - User authentication and authorization

#### SSL & Security
- **Let's Encrypt** - Free SSL certificates
- **Cloudflare** - CDN with security features
- **AWS WAF** - Web application firewall

### Recommended Implementation Phases

#### Phase 1: Foundation (Months 1-2)
- Implement security enhancements
- Set up monitoring and logging
- Optimize database performance
- Implement caching layer

#### Phase 2: User Experience (Months 3-4)
- Mobile optimization and PWA
- Advanced search functionality
- Wishlist and recommendations
- Email marketing integration

#### Phase 3: Business Growth (Months 5-6)
- Advanced analytics and reporting
- Loyalty program implementation
- Multi-language and multi-currency support
- Advanced promotion engine

#### Phase 4: Scale & Optimize (Months 7-8)
- Microservices migration
- Advanced caching strategies
- Performance optimization
- Load testing and optimization

This comprehensive technology stack provides a solid foundation for building a production-ready e-commerce platform that can scale with business growth while maintaining security, performance, and user experience standards.
---


## Advanced Implementation Strategies

### Database Schema Optimization

#### Recommended MongoDB Collections Structure

```javascript
// Users Collection
{
  _id: ObjectId,
  username: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: String (enum: ['user', 'admin']),
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String
  },
  addresses: [{
    type: String (enum: ['shipping', 'billing']),
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: Boolean
  }],
  preferences: {
    newsletter: Boolean,
    notifications: Boolean,
    language: String,
    currency: String
  },
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  isActive: Boolean
}

// Products Collection
{
  _id: ObjectId,
  name: String (indexed),
  slug: String (unique, indexed),
  description: String,
  shortDescription: String,
  price: {
    regular: Number,
    sale: Number,
    currency: String
  },
  category: ObjectId (ref: 'Category', indexed),
  subcategory: ObjectId (ref: 'Category'),
  brand: String,
  sku: String (unique, indexed),
  inventory: {
    stock: Number,
    lowStockThreshold: Number,
    trackQuantity: Boolean
  },
  variants: [{
    size: String,
    color: {
      name: String,
      code: String
    },
    stock: Number,
    sku: String,
    price: Number
  }],
  images: [{
    url: String,
    alt: String,
    isPrimary: Boolean,
    order: Number
  }],
  specifications: {
    material: String,
    care: [String],
    origin: String,
    weight: String
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  ratings: {
    average: Number,
    count: Number
  },
  tags: [String],
  isActive: Boolean,
  isFeatured: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Orders Collection
{
  _id: ObjectId,
  orderNumber: String (unique, indexed),
  user: ObjectId (ref: 'User', indexed),
  items: [{
    product: ObjectId (ref: 'Product'),
    variant: {
      size: String,
      color: String
    },
    quantity: Number,
    price: Number,
    total: Number
  }],
  pricing: {
    subtotal: Number,
    tax: Number,
    shipping: Number,
    discount: Number,
    total: Number
  },
  addresses: {
    shipping: {
      firstName: String,
      lastName: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String
    },
    billing: {
      firstName: String,
      lastName: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String
    }
  },
  payment: {
    method: String,
    status: String,
    transactionId: String,
    gateway: String
  },
  shipping: {
    method: String,
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  },
  status: String (enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String,
    updatedBy: ObjectId (ref: 'User')
  }],
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Database Indexing Strategy

```javascript
// Essential Indexes for Performance
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })
db.users.createIndex({ "createdAt": -1 })

db.products.createIndex({ "name": "text", "description": "text" })
db.products.createIndex({ "category": 1, "isActive": 1 })
db.products.createIndex({ "price.regular": 1 })
db.products.createIndex({ "ratings.average": -1 })
db.products.createIndex({ "createdAt": -1 })
db.products.createIndex({ "slug": 1 }, { unique: true })

db.orders.createIndex({ "user": 1, "createdAt": -1 })
db.orders.createIndex({ "orderNumber": 1 }, { unique: true })
db.orders.createIndex({ "status": 1 })
db.orders.createIndex({ "createdAt": -1 })

db.categories.createIndex({ "slug": 1 }, { unique: true })
db.categories.createIndex({ "parent": 1 })
```

### API Architecture Enhancements

#### RESTful API Design Principles

```javascript
// Consistent Response Format
{
  "success": boolean,
  "data": object | array | null,
  "message": string,
  "errors": array,
  "meta": {
    "timestamp": "ISO_DATE",
    "version": "API_VERSION",
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "pages": number
    }
  }
}

// Error Response Format
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "code": "INVALID_EMAIL",
      "message": "Please provide a valid email address"
    }
  ],
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "v1"
  }
}
```

#### Advanced Middleware Implementation

```javascript
// Rate Limiting Middleware
const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      errors: [{ code: 'RATE_LIMIT_EXCEEDED' }]
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Different limits for different endpoints
const authLimiter = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts');
const apiLimiter = createRateLimit(15 * 60 * 1000, 100, 'Too many requests');
const adminLimiter = createRateLimit(15 * 60 * 1000, 1000, 'Admin rate limit exceeded');

// Request Validation Middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          code: detail.type.toUpperCase(),
          message: detail.message
        }))
      });
    }
    next();
  };
};
```

### Frontend Architecture Enhancements

#### Angular Service Architecture

```typescript
// Base API Service
@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected apiUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) {}
  
  protected get<T>(endpoint: string, params?: HttpParams): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, { params })
      .pipe(
        catchError(this.handleError),
        map(response => this.transformResponse(response))
      );
  }
  
  protected post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, data)
      .pipe(
        catchError(this.handleError),
        map(response => this.transformResponse(response))
      );
  }
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    // Centralized error handling
    return throwError(() => error);
  }
  
  private transformResponse<T>(response: any): ApiResponse<T> {
    // Response transformation logic
    return response;
  }
}

// Product Service Implementation
@Injectable({
  providedIn: 'root'
})
export class ProductService extends BaseApiService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();
  
  getProducts(filters?: ProductFilters): Observable<PaginatedResponse<Product>> {
    const params = this.buildFilterParams(filters);
    return this.get<PaginatedResponse<Product>>('/products', params);
  }
  
  getProduct(id: string): Observable<Product> {
    return this.get<Product>(`/products/${id}`).pipe(
      map(response => response.data)
    );
  }
  
  searchProducts(query: string): Observable<Product[]> {
    const params = new HttpParams().set('q', query);
    return this.get<Product[]>('/products/search', params).pipe(
      map(response => response.data)
    );
  }
  
  private buildFilterParams(filters?: ProductFilters): HttpParams {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key].toString());
        }
      });
    }
    return params;
  }
}
```

#### State Management with NgRx (Optional Enhancement)

```typescript
// Product State
export interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  pagination: PaginationInfo;
}

// Product Actions
export const loadProducts = createAction(
  '[Product] Load Products',
  props<{ filters?: ProductFilters }>()
);

export const loadProductsSuccess = createAction(
  '[Product] Load Products Success',
  props<{ products: Product[]; pagination: PaginationInfo }>()
);

export const loadProductsFailure = createAction(
  '[Product] Load Products Failure',
  props<{ error: string }>()
);

// Product Effects
@Injectable()
export class ProductEffects {
  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadProducts),
      switchMap(({ filters }) =>
        this.productService.getProducts(filters).pipe(
          map(response => loadProductsSuccess({
            products: response.data,
            pagination: response.meta.pagination
          })),
          catchError(error => of(loadProductsFailure({ error: error.message })))
        )
      )
    )
  );
  
  constructor(
    private actions$: Actions,
    private productService: ProductService
  ) {}
}
```

### Security Implementation Details

#### JWT Token Management

```typescript
// Token Service
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }
  
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }
  
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
  
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
  
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

// Auth Interceptor with Token Refresh
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  
  constructor(
    private tokenService: TokenService,
    private authService: AuthService
  ) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.tokenService.getAccessToken();
    
    if (token && !this.tokenService.isTokenExpired(token)) {
      req = this.addTokenToRequest(req, token);
    }
    
    return next.handle(req).pipe(
      catchError(error => {
        if (error.status === 401 && token) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }
  
  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      
      const refreshToken = this.tokenService.getRefreshToken();
      if (refreshToken) {
        return this.authService.refreshToken(refreshToken).pipe(
          switchMap(response => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(response.accessToken);
            return next.handle(this.addTokenToRequest(req, response.accessToken));
          }),
          catchError(error => {
            this.isRefreshing = false;
            this.authService.logout();
            return throwError(() => error);
          })
        );
      }
    }
    
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(this.addTokenToRequest(req, token!)))
    );
  }
  
  private addTokenToRequest(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
```

### Performance Optimization Strategies

#### Backend Caching Implementation

```javascript
// Redis Caching Service
class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    });
  }
  
  async get(key) {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  async set(key, data, ttl = 3600) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  async del(key) {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
  
  async flush() {
    try {
      await this.redis.flushall();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }
}

// Cache Middleware
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cachedData = await cacheService.get(key);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const originalSend = res.json;
    res.json = function(data) {
      cacheService.set(key, data, ttl);
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Usage in routes
router.get('/products', cacheMiddleware(600), getProducts);
router.get('/categories', cacheMiddleware(3600), getCategories);
```

#### Frontend Performance Optimizations

```typescript
// Lazy Loading Images Directive
@Directive({
  selector: '[appLazyLoad]'
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Input() appLazyLoad!: string;
  @Input() placeholder = '/assets/images/placeholder.jpg';
  
  private observer!: IntersectionObserver;
  
  constructor(private el: ElementRef<HTMLImageElement>) {}
  
  ngOnInit(): void {
    this.el.nativeElement.src = this.placeholder;
    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
            this.observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    this.observer.observe(this.el.nativeElement);
  }
  
  private loadImage(): void {
    const img = new Image();
    img.onload = () => {
      this.el.nativeElement.src = this.appLazyLoad;
    };
    img.src = this.appLazyLoad;
  }
  
  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Virtual Scrolling for Large Lists
@Component({
  selector: 'app-product-list',
  template: `
    <cdk-virtual-scroll-viewport itemSize="300" class="product-viewport">
      <div *cdkVirtualFor="let product of products$ | async" class="product-item">
        <app-product-card [product]="product"></app-product-card>
      </div>
    </cdk-virtual-scroll-viewport>
  `
})
export class ProductListComponent {
  products$ = this.productService.products$;
  
  constructor(private productService: ProductService) {}
}
```

### Testing Strategy

#### Backend Testing

```javascript
// Unit Tests with Jest
describe('ProductService', () => {
  let productService;
  let mockProductModel;
  
  beforeEach(() => {
    mockProductModel = {
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn()
    };
    
    productService = new ProductService(mockProductModel);
  });
  
  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const mockProducts = [{ name: 'Test Product' }];
      mockProductModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockProducts)
            })
          })
        })
      });
      
      const result = await productService.getProducts({ page: 1, limit: 10 });
      
      expect(result.products).toEqual(mockProducts);
      expect(mockProductModel.find).toHaveBeenCalled();
    });
  });
});

// Integration Tests with Supertest
describe('Product API', () => {
  let app;
  let server;
  
  beforeAll(async () => {
    app = require('../app');
    server = app.listen(0);
  });
  
  afterAll(async () => {
    await server.close();
  });
  
  describe('GET /api/products', () => {
    it('should return products list', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });
  });
});
```

#### Frontend Testing

```typescript
// Component Testing with Angular Testing Utilities
describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [
        { provide: ProductService, useValue: mockProductService }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
  });
  
  it('should display product information', () => {
    const mockProduct: Product = {
      id: '1',
      name: 'Test Product',
      price: { regular: 99.99 },
      images: [{ url: 'test.jpg', alt: 'Test' }]
    };
    
    component.product = mockProduct;
    fixture.detectChanges();
    
    expect(fixture.debugElement.query(By.css('.product-name')).nativeElement.textContent)
      .toContain('Test Product');
    expect(fixture.debugElement.query(By.css('.product-price')).nativeElement.textContent)
      .toContain('$99.99');
  });
});

// E2E Testing with Cypress
describe('Shopping Flow', () => {
  it('should complete purchase flow', () => {
    cy.visit('/');
    cy.get('[data-cy=product-card]').first().click();
    cy.get('[data-cy=add-to-cart]').click();
    cy.get('[data-cy=cart-icon]').click();
    cy.get('[data-cy=checkout-button]').click();
    
    // Fill shipping information
    cy.get('[data-cy=shipping-form]').within(() => {
      cy.get('input[name=firstName]').type('John');
      cy.get('input[name=lastName]').type('Doe');
      cy.get('input[name=email]').type('john@example.com');
    });
    
    cy.get('[data-cy=continue-payment]').click();
    
    // Complete payment
    cy.get('[data-cy=payment-form]').within(() => {
      cy.get('input[name=cardNumber]').type('4111111111111111');
      cy.get('input[name=expiryDate]').type('12/25');
      cy.get('input[name=cvv]').type('123');
    });
    
    cy.get('[data-cy=place-order]').click();
    cy.url().should('include', '/checkout/confirmation');
    cy.get('[data-cy=order-success]').should('be.visible');
  });
});
```

### Deployment and DevOps

#### Docker Configuration

```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]

# Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build --prod

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose for Development

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: ecommerce-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    container_name: ecommerce-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    container_name: ecommerce-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/ecommerce?authSource=admin
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    container_name: ecommerce-frontend
    restart: unless-stopped
    ports:
      - "4200:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
  redis_data:
```

#### Kubernetes Deployment

```yaml
# Backend Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ecommerce-backend
  template:
    metadata:
      labels:
        app: ecommerce-backend
    spec:
      containers:
      - name: backend
        image: ecommerce-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: ecommerce-secrets
              key: mongodb-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: ecommerce-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: ecommerce-backend-service
spec:
  selector:
    app: ecommerce-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

This comprehensive extension provides detailed implementation strategies, advanced architectural patterns, security implementations, performance optimizations, testing strategies, and deployment configurations that will help transform the current e-commerce application into a robust, scalable, and production-ready platform.-
--

## Business Intelligence and Analytics

### Analytics Implementation Strategy

#### Key Performance Indicators (KPIs)

```typescript
// Analytics Service
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private http: HttpClient) {}
  
  // E-commerce Specific KPIs
  getConversionRate(period: string): Observable<number> {
    return this.http.get<number>(`/api/analytics/conversion-rate?period=${period}`);
  }
  
  getAverageOrderValue(period: string): Observable<number> {
    return this.http.get<number>(`/api/analytics/aov?period=${period}`);
  }
  
  getCustomerLifetimeValue(): Observable<number> {
    return this.http.get<number>('/api/analytics/clv');
  }
  
  getCartAbandonmentRate(): Observable<number> {
    return this.http.get<number>('/api/analytics/cart-abandonment');
  }
  
  getTopSellingProducts(limit: number = 10): Observable<ProductAnalytics[]> {
    return this.http.get<ProductAnalytics[]>(`/api/analytics/top-products?limit=${limit}`);
  }
  
  getRevenueByCategory(): Observable<CategoryRevenue[]> {
    return this.http.get<CategoryRevenue[]>('/api/analytics/revenue-by-category');
  }
  
  getCustomerSegmentation(): Observable<CustomerSegment[]> {
    return this.http.get<CustomerSegment[]>('/api/analytics/customer-segments');
  }
}

// Analytics Interfaces
interface ProductAnalytics {
  productId: string;
  name: string;
  totalSold: number;
  revenue: number;
  conversionRate: number;
}

interface CategoryRevenue {
  categoryId: string;
  categoryName: string;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
}

interface CustomerSegment {
  segment: string;
  customerCount: number;
  averageOrderValue: number;
  totalRevenue: number;
  retentionRate: number;
}
```

#### Backend Analytics Implementation

```javascript
// Analytics Controller
class AnalyticsController {
  // Conversion Rate: (Orders / Sessions) * 100
  async getConversionRate(req, res) {
    try {
      const { period = '30d' } = req.query;
      const startDate = this.getStartDate(period);
      
      const [orders, sessions] = await Promise.all([
        Order.countDocuments({ 
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }),
        Session.countDocuments({ 
          createdAt: { $gte: startDate }
        })
      ]);
      
      const conversionRate = sessions > 0 ? (orders / sessions) * 100 : 0;
      
      res.json({
        success: true,
        data: Math.round(conversionRate * 100) / 100
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // Average Order Value
  async getAverageOrderValue(req, res) {
    try {
      const { period = '30d' } = req.query;
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
            averageValue: { $avg: '$pricing.total' },
            totalOrders: { $sum: 1 }
          }
        }
      ]);
      
      const aov = result.length > 0 ? result[0].averageValue : 0;
      
      res.json({
        success: true,
        data: Math.round(aov * 100) / 100
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // Customer Lifetime Value
  async getCustomerLifetimeValue(req, res) {
    try {
      const result = await Order.aggregate([
        {
          $match: { status: { $ne: 'cancelled' } }
        },
        {
          $group: {
            _id: '$user',
            totalSpent: { $sum: '$pricing.total' },
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
      
      const clv = result.length > 0 ? result[0].averageCLV : 0;
      
      res.json({
        success: true,
        data: {
          clv: Math.round(clv * 100) / 100,
          averageLifespan: result[0]?.averageLifespan || 0,
          averageOrderFrequency: result[0]?.averageOrderFrequency || 0
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // Cart Abandonment Rate
  async getCartAbandonmentRate(req, res) {
    try {
      const [totalCarts, completedOrders] = await Promise.all([
        Cart.countDocuments({ 
          'items.0': { $exists: true },
          updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }),
        Order.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          status: { $ne: 'cancelled' }
        })
      ]);
      
      const abandonmentRate = totalCarts > 0 ? 
        ((totalCarts - completedOrders) / totalCarts) * 100 : 0;
      
      res.json({
        success: true,
        data: Math.round(abandonmentRate * 100) / 100
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // Top Selling Products
  async getTopSellingProducts(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const topProducts = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalSold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.total' },
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
            orderCount: 1
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: parseInt(limit) }
      ]);
      
      res.json({
        success: true,
        data: topProducts
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
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
}
```

### SEO and Marketing Optimization

#### SEO Implementation

```typescript
// SEO Service
@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    private meta: Meta,
    private title: Title,
    private router: Router
  ) {}
  
  updateProductSEO(product: Product): void {
    // Update page title
    this.title.setTitle(`${product.name} - Premium Clothing Store`);
    
    // Update meta tags
    this.meta.updateTag({ 
      name: 'description', 
      content: product.shortDescription || product.description.substring(0, 160) 
    });
    
    this.meta.updateTag({ 
      name: 'keywords', 
      content: product.tags?.join(', ') || `${product.name}, clothing, fashion` 
    });
    
    // Open Graph tags
    this.meta.updateTag({ 
      property: 'og:title', 
      content: product.name 
    });
    
    this.meta.updateTag({ 
      property: 'og:description', 
      content: product.shortDescription || product.description.substring(0, 160) 
    });
    
    this.meta.updateTag({ 
      property: 'og:image', 
      content: product.images[0]?.url || '/assets/images/default-product.jpg' 
    });
    
    this.meta.updateTag({ 
      property: 'og:url', 
      content: `${window.location.origin}/products/${product.slug}` 
    });
    
    // Twitter Card tags
    this.meta.updateTag({ 
      name: 'twitter:card', 
      content: 'summary_large_image' 
    });
    
    this.meta.updateTag({ 
      name: 'twitter:title', 
      content: product.name 
    });
    
    this.meta.updateTag({ 
      name: 'twitter:description', 
      content: product.shortDescription || product.description.substring(0, 160) 
    });
    
    // Structured data (JSON-LD)
    this.addStructuredData({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images.map(img => img.url),
      brand: {
        '@type': 'Brand',
        name: product.brand || 'Premium Clothing Store'
      },
      offers: {
        '@type': 'Offer',
        price: product.price.sale || product.price.regular,
        priceCurrency: product.price.currency || 'USD',
        availability: product.inventory.stock > 0 ? 
          'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      },
      aggregateRating: product.ratings.count > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: product.ratings.average,
        reviewCount: product.ratings.count
      } : undefined
    });
  }
  
  private addStructuredData(data: any): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }
}

// Sitemap Generation (Backend)
class SitemapController {
  async generateSitemap(req, res) {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://yourstore.com';
      
      // Static pages
      const staticPages = [
        { url: '/', priority: 1.0, changefreq: 'daily' },
        { url: '/products', priority: 0.9, changefreq: 'daily' },
        { url: '/products/category/men', priority: 0.8, changefreq: 'daily' },
        { url: '/products/category/women', priority: 0.8, changefreq: 'daily' }
      ];
      
      // Dynamic product pages
      const products = await Product.find({ isActive: true })
        .select('slug updatedAt')
        .lean();
      
      const productPages = products.map(product => ({
        url: `/products/${product.slug}`,
        priority: 0.7,
        changefreq: 'weekly',
        lastmod: product.updatedAt.toISOString()
      }));
      
      // Dynamic category pages
      const categories = await Category.find({ isActive: true })
        .select('slug updatedAt')
        .lean();
      
      const categoryPages = categories.map(category => ({
        url: `/products/category/${category.slug}`,
        priority: 0.6,
        changefreq: 'weekly',
        lastmod: category.updatedAt.toISOString()
      }));
      
      const allPages = [...staticPages, ...productPages, ...categoryPages];
      
      // Generate XML
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <priority>${page.priority}</priority>
    <changefreq>${page.changefreq}</changefreq>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
  </url>`).join('')}
</urlset>`;
      
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
```

### Advanced E-commerce Features

#### Recommendation Engine

```javascript
// Recommendation Service
class RecommendationService {
  // Collaborative Filtering - Users who bought this also bought
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
            totalQuantity: { $sum: '$items.quantity' }
          }
        },
        // Sort by frequency
        { $sort: { frequency: -1 } },
        { $limit: limit },
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
        {
          $project: {
            product: '$product',
            score: '$frequency'
          }
        }
      ]);
      
      return recommendations;
    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }
  
  // Content-Based Filtering - Similar products by attributes
  async getContentBasedRecommendations(productId, limit = 5) {
    try {
      const targetProduct = await Product.findById(productId);
      if (!targetProduct) return [];
      
      const recommendations = await Product.aggregate([
        {
          $match: {
            _id: { $ne: new mongoose.Types.ObjectId(productId) },
            isActive: true,
            $or: [
              { category: targetProduct.category },
              { tags: { $in: targetProduct.tags || [] } },
              { brand: targetProduct.brand }
            ]
          }
        },
        {
          $addFields: {
            score: {
              $add: [
                // Category match
                { $cond: [{ $eq: ['$category', targetProduct.category] }, 3, 0] },
                // Brand match
                { $cond: [{ $eq: ['$brand', targetProduct.brand] }, 2, 0] },
                // Tag matches
                { $size: { $setIntersection: ['$tags', targetProduct.tags || []] } }
              ]
            }
          }
        },
        { $sort: { score: -1, 'ratings.average': -1 } },
        { $limit: limit }
      ]);
      
      return recommendations;
    } catch (error) {
      console.error('Content-based filtering error:', error);
      return [];
    }
  }
  
  // Trending Products
  async getTrendingProducts(limit = 10) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const trending = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status: { $ne: 'cancelled' }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            recentSales: { $sum: '$items.quantity' },
            recentRevenue: { $sum: '$items.total' }
          }
        },
        { $sort: { recentSales: -1 } },
        { $limit: limit },
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
            product: '$product',
            recentSales: 1,
            recentRevenue: 1
          }
        }
      ]);
      
      return trending;
    } catch (error) {
      console.error('Trending products error:', error);
      return [];
    }
  }
  
  // Personalized Recommendations based on user history
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
      }).select('category brand tags');
      
      const userCategories = [...new Set(userProducts.map(p => p.category.toString()))];
      const userBrands = [...new Set(userProducts.map(p => p.brand).filter(Boolean))];
      const userTags = [...new Set(userProducts.flatMap(p => p.tags || []))];
      
      // Find similar products
      const recommendations = await Product.aggregate([
        {
          $match: {
            _id: { $nin: purchasedProducts.map(id => new mongoose.Types.ObjectId(id)) },
            isActive: true,
            $or: [
              { category: { $in: userCategories.map(id => new mongoose.Types.ObjectId(id)) } },
              { brand: { $in: userBrands } },
              { tags: { $in: userTags } }
            ]
          }
        },
        {
          $addFields: {
            relevanceScore: {
              $add: [
                // Category preference
                { $cond: [{ $in: ['$category', userCategories.map(id => new mongoose.Types.ObjectId(id))] }, 5, 0] },
                // Brand preference
                { $cond: [{ $in: ['$brand', userBrands] }, 3, 0] },
                // Tag matches
                { $size: { $setIntersection: ['$tags', userTags] } },
                // Rating boost
                { $multiply: ['$ratings.average', 0.5] }
              ]
            }
          }
        },
        { $sort: { relevanceScore: -1, 'ratings.average': -1 } },
        { $limit: limit }
      ]);
      
      return recommendations;
    } catch (error) {
      console.error('Personalized recommendations error:', error);
      return this.getTrendingProducts(limit);
    }
  }
}
```

#### Advanced Search Implementation

```javascript
// Search Service with Elasticsearch integration
class SearchService {
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });
  }
  
  // Index product for search
  async indexProduct(product) {
    try {
      await this.client.index({
        index: 'products',
        id: product._id.toString(),
        body: {
          name: product.name,
          description: product.description,
          category: product.category.name,
          brand: product.brand,
          price: product.price.regular,
          tags: product.tags,
          isActive: product.isActive,
          ratings: product.ratings.average,
          createdAt: product.createdAt
        }
      });
    } catch (error) {
      console.error('Product indexing error:', error);
    }
  }
  
  // Advanced search with filters, sorting, and facets
  async searchProducts(query, filters = {}, sort = 'relevance', page = 1, limit = 20) {
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
              must: query ? [
                {
                  multi_match: {
                    query,
                    fields: ['name^3', 'description^2', 'brand^2', 'tags'],
                    fuzziness: 'AUTO'
                  }
                }
              ] : [{ match_all: {} }],
              filter: [
                { term: { isActive: true } }
              ]
            }
          },
          aggs: {
            categories: {
              terms: { field: 'category.keyword' }
            },
            brands: {
              terms: { field: 'brand.keyword' }
            },
            price_ranges: {
              range: {
                field: 'price',
                ranges: [
                  { to: 50 },
                  { from: 50, to: 100 },
                  { from: 100, to: 200 },
                  { from: 200 }
                ]
              }
            }
          }
        }
      };
      
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
        if (filters.minPrice) priceRange.gte = filters.minPrice;
        if (filters.maxPrice) priceRange.lte = filters.maxPrice;
        
        searchQuery.body.query.bool.filter.push({
          range: { price: priceRange }
        });
      }
      
      // Apply sorting
      switch (sort) {
        case 'price_asc':
          searchQuery.body.sort = [{ price: 'asc' }];
          break;
        case 'price_desc':
          searchQuery.body.sort = [{ price: 'desc' }];
          break;
        case 'rating':
          searchQuery.body.sort = [{ ratings: 'desc' }];
          break;
        case 'newest':
          searchQuery.body.sort = [{ createdAt: 'desc' }];
          break;
        default:
          // Relevance sorting (default)
          break;
      }
      
      const response = await this.client.search(searchQuery);
      
      return {
        products: response.body.hits.hits.map(hit => ({
          id: hit._id,
          ...hit._source,
          score: hit._score
        })),
        total: response.body.hits.total.value,
        facets: {
          categories: response.body.aggregations.categories.buckets,
          brands: response.body.aggregations.brands.buckets,
          priceRanges: response.body.aggregations.price_ranges.buckets
        }
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }
  
  // Auto-complete suggestions
  async getSuggestions(query, limit = 5) {
    try {
      const response = await this.client.search({
        index: 'products',
        body: {
          size: 0,
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
      console.error('Suggestions error:', error);
      return [];
    }
  }
}
```

This comprehensive extension covers advanced business intelligence, SEO optimization, recommendation engines, and search functionality that will significantly enhance the e-commerce platform's capabilities and user experience. These features are essential for a competitive, modern e-commerce solution.