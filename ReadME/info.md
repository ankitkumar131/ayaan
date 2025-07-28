# Shopping Website API Documentation

## Base URLs
- API Base URL: `http://localhost:3000/api`
- Admin API Base URL: `http://localhost:3000/api/admin`

## Authentication Endpoints

### Public Routes
- POST `/auth/register` - Register new user
- POST `/auth/login` - User login
- POST `/auth/forgot-password` - Request password reset
- POST `/auth/reset-password` - Reset password with token

### Admin Authentication
- POST `/admin/auth/login` - Admin login (Secret route)

## Product Endpoints

### Public Routes
- GET `/products` - Get all products
- GET `/products/:id` - Get product by ID
- GET `/products/category/:categoryId` - Get products by category
- GET `/products/search` - Search products

### Admin Routes
- POST `/admin/products` - Create new product
- PUT `/admin/products/:id` - Update product
- DELETE `/admin/products/:id` - Delete product
- POST `/admin/products/upload` - Upload product images

## Category Endpoints

### Public Routes
- GET `/categories` - Get all categories
- GET `/categories/:id` - Get category by ID

### Admin Routes
- POST `/admin/categories` - Create new category
- PUT `/admin/categories/:id` - Update category
- DELETE `/admin/categories/:id` - Delete category

## Cart Endpoints

### User Routes (Requires Authentication)
- GET `/cart` - Get user's cart
- POST `/cart/add` - Add item to cart
- PUT `/cart/update/:itemId` - Update cart item
- DELETE `/cart/remove/:itemId` - Remove item from cart
- POST `/cart/apply-promotion` - Apply promotion code

## Order Endpoints

### User Routes (Requires Authentication)
- GET `/orders` - Get user's orders
- GET `/orders/:id` - Get order details
- POST `/orders` - Create new order
- POST `/orders/:id/cancel` - Cancel order
- POST `/orders/:id/refund` - Request refund

### Admin Routes
- GET `/admin/orders` - Get all orders
- PUT `/admin/orders/:id/status` - Update order status
- PUT `/admin/orders/:id/refund` - Process refund request

## User Management

### User Routes (Requires Authentication)
- GET `/users/profile` - Get user profile
- PUT `/users/profile` - Update user profile
- PUT `/users/password` - Change password

### Admin Routes
- GET `/admin/users` - Get all users
- GET `/admin/users/:id` - Get user details
- PUT `/admin/users/:id` - Update user
- DELETE `/admin/users/:id` - Delete user

## Promotion Management

### Admin Routes
- GET `/admin/promotions` - Get all promotions
- POST `/admin/promotions` - Create promotion
- PUT `/admin/promotions/:id` - Update promotion
- DELETE `/admin/promotions/:id` - Delete promotion

## Important Notes

1. All admin routes require admin authentication token
2. Admin routes are not exposed in frontend navigation
3. File uploads are handled at `/uploads` endpoint
4. All responses follow standard format:
   ```json
   {
     "success": boolean,
     "data": object | array,
     "message": string,
     "error": string (optional)
   }
   ```
5. Authentication uses JWT tokens
6. All dates are in ISO format
7. Pagination is supported on list endpoints using `page` and `limit` query parameters 