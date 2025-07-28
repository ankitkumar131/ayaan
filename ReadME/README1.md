# E-commerce API Documentation

This is the backend API for an e-commerce clothing website built with Node.js, Express, and MongoDB.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/shopping-website
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=24h
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
FRONTEND_URL=http://localhost:4200
```

3. Create required directories:
```bash
mkdir uploads
mkdir uploads/products
```

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints Documentation

### Authentication

#### Register User
- **URL**: `POST /api/auth/register`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```
  username: string (required)
  email: string (required)
  password: string (required, min 6 characters)
  ```
- **Response**:
  ```json
  {
    "message": "User registered successfully",
    "token": "jwt_token_here"
  }
  ```

#### Login
- **URL**: `POST /api/auth/login`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```
  email: string (required)
  password: string (required)
  ```
- **Response**:
  ```json
  {
    "token": "jwt_token_here"
  }
  ```

### User Management

#### Get Profile
- **URL**: `GET /api/user/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "username": "string",
    "email": "string",
    "role": "user/admin",
    "address": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "country": "string"
    },
    "phone": "string"
  }
  ```

#### Update Profile
- **URL**: `PUT /api/user/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```
  username: string (optional)
  email: string (optional)
  phone: string (optional)
  address[street]: string (optional)
  address[city]: string (optional)
  address[state]: string (optional)
  address[zipCode]: string (optional)
  address[country]: string (optional)
  ```
- **Response**: Updated user object

### Products

#### Get All Products
- **URL**: `GET /api/products`
- **Query Parameters**:
  ```
  category: string (optional)
  minPrice: number (optional)
  maxPrice: number (optional)
  sort: string (optional, format: field:asc/desc)
  page: number (optional, default: 1)
  limit: number (optional, default: 10)
  ```
- **Response**:
  ```json
  {
    "products": [],
    "currentPage": 1,
    "totalPages": 5,
    "totalProducts": 50
  }
  ```

#### Create Product (Admin)
- **URL**: `POST /api/products`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```
  name: string (required)
  description: string (required)
  price: number (required)
  category: string (required, category ID)
  stock: number (required)
  sizes: array (optional, ['S', 'M', 'L'])
  colors[0][name]: string (optional)
  colors[0][code]: string (optional, hex code)
  images: files (optional, max 5 images)
  ```
- **Response**: Created product object

### Categories

#### Get All Categories
- **URL**: `GET /api/categories`
- **Response**: Array of category objects

#### Create Category (Admin)
- **URL**: `POST /api/categories`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```
  name: string (required)
  description: string (required)
  parent: string (optional, category ID)
  order: number (optional)
  image: file (optional)
  ```
- **Response**: Created category object

### Cart

#### Add to Cart
- **URL**: `POST /api/cart/add`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```
  productId: string (required)
  quantity: number (required)
  size: string (optional)
  color[name]: string (optional)
  color[code]: string (optional)
  ```
- **Response**: Updated cart object

#### Apply Promotion
- **URL**: `POST /api/cart/apply-promotion`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```
  code: string (required)
  ```
- **Response**: Updated cart object with applied promotion

### Orders

#### Place Order
- **URL**: `POST /api/orders`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```
  shippingAddress[street]: string (required)
  shippingAddress[city]: string (required)
  shippingAddress[state]: string (required)
  shippingAddress[zipCode]: string (required)
  shippingAddress[country]: string (required)
  paymentInfo[method]: string (required)
  ```
- **Response**: Created order object

#### Request Refund
- **URL**: `POST /api/orders/:orderId/refund`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  ```
  reason: string (required)
  ```
- **Response**: Updated order object

## Error Responses

All error responses follow this format:
```json
{
  "message": "Error message here"
}
```

For validation errors:
```json
{
  "errors": [
    {
      "param": "field_name",
      "msg": "Error message"
    }
  ]
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Testing in Postman

1. Import the provided Postman collection
2. Set up environment variables:
   - `baseUrl`: Your API base URL (e.g., http://localhost:3000)
   - `token`: JWT token received after login

3. For file uploads:
   - Use form-data in the request body
   - For image fields, select "File" type
   - For nested objects (e.g., address), use dot notation:
     ```
     address[street]: 123 Main St
     address[city]: New York
     ```

4. For arrays:
   ```
   sizes[0]: S
   sizes[1]: M
   colors[0][name]: Red
   colors[0][code]: #FF0000
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password` - Reset password

### Cart Management

- `POST /api/cart/add` - Add product to cart
- `DELETE /api/cart/remove/:productId` - Remove product from cart
- `PUT /api/cart/update/:productId` - Update cart item quantity
- `GET /api/cart` - View cart contents
- `POST /api/cart/apply-promotion` - Apply promotion code
- `DELETE /api/cart/remove-promotion` - Remove promotion code

### Order Management

- `POST /api/orders` - Place order
- `GET /api/orders` - Get order history
- `GET /api/orders/:orderId` - Get order details
- `GET /api/orders/:orderId/track` - Track order status
- `POST /api/orders/:orderId/refund` - Request refund
- `POST /api/orders/:orderId/replacement` - Request replacement
- `POST /api/orders/:orderId/review` - Leave order review

### Product Management

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Add new product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `POST /api/products/:id/reviews` - Add product review

### Admin Routes

- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:orderId/status` - Update order status
- `PUT /api/admin/orders/:orderId/refund` - Process refund request
- `GET /api/admin/statistics` - Get sales statistics
- `GET /api/admin/user-statistics` - Get user statistics

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Models

### User
- Username
- Email
- Password (hashed)
- Role (user/admin)
- Address
- Phone
- Created At

### Product
- Name
- Description
- Price
- Category
- Stock
- Images
- Sizes
- Colors
- Ratings
- Average Rating
- Is Active

### Cart
- User
- Items (Product, Quantity, Size, Color, Price)
- Total Amount
- Applied Promotion
- Discount Amount

### Order
- User
- Items
- Shipping Address
- Payment Info
- Total Amount
- Discount Amount
- Status
- Tracking Info
- Status History
- Refund Request

### Category
- Name
- Description
- Slug
- Parent Category
- Image
- Is Active
- Order

### Promotion
- Code
- Type (percentage/fixed)
- Value
- Description
- Start/End Date
- Minimum Purchase
- Maximum Discount
- Usage Limit
- Usage Count
- Applicable Categories/Products
- Is Active

## Error Handling

The API uses standard HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

Error responses follow this format:
```json
{
  "message": "Error message here"
}
```

## File Upload

Product images are uploaded using multer and stored in the `uploads/products` directory. The maximum allowed files per upload is 5, and only image files are accepted.

## Data Validation

Input validation is performed using express-validator. All endpoints that accept user input validate the data before processing.

## Security Features

1. Password Hashing (bcryptjs)
2. JWT Authentication
3. Role-based Access Control
4. Input Validation
5. Error Handling
6. Secure Headers
7. Rate Limiting (TODO)
8. Request Sanitization (TODO)

## Dependencies

- express
- mongoose
- jsonwebtoken
- bcryptjs
- multer
- cors
- dotenv
- express-validator
- nodemailer

## Development Dependencies

- nodemon 