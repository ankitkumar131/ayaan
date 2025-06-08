# E-commerce API Documentation

## Initial Setup
When the server starts, it automatically checks for the existence of an admin account. If no admin account exists, it creates a default admin with the following credentials:

```javascript
Default Admin Credentials:
username: ankit
email: ak3057955@gmail.com
password: ASdf@1234
role: admin
```

IMPORTANT: It is recommended to change the password immediately after first login.

## Authentication

### Register User
- **Endpoint**: `POST /api/auth/register`
- **Role**: Public
- **Access**: Public
- **Form Data**:
  ```
  username: string (required)
  email: string (required)
  password: string (required)
  firstName: string
  lastName: string
  phone: string
  address[street]: string
  address[city]: string
  address[state]: string
  address[country]: string
  address[zipCode]: string (6 digits)
  ```
- **Response**:
  ```json
  {
    "token": "JWT_TOKEN",
    "user": {
      "id": "user_id",
      "username": "username",
      "email": "email",
      "role": "user"
    }
  }
  ```

### Login
- **Endpoint**: `POST /api/auth/login`
- **Role**: Public
- **Access**: Public
- **Form Data**:
  ```
  email: string (required)
  password: string (required)
  ```
- **Response**: Same as Register

### Password Reset Request
- **Endpoint**: `POST /api/auth/forgot-password`
- **Role**: Public
- **Access**: Public
- **Form Data**:
  ```
  email: string (required)
  ```
- **Response**:
  ```json
  {
    "message": "Password reset link sent to email"
  }
  ```

### Reset Password
- **Endpoint**: `PUT /api/auth/reset-password`
- **Role**: Public
- **Access**: Public (with token)
- **Form Data**:
  ```
  token: string (required)
  password: string (required)
  ```
- **Response**:
  ```json
  {
    "message": "Password reset successful"
  }
  ```

## Cart Management

### Add to Cart
- **Endpoint**: `POST /api/cart/add`
- **Role**: User
- **Access**: Private (User)
- **Headers**: `Authorization: Bearer USER_TOKEN`
- **Form Data**:
  ```
  productId: string (required)
  quantity: number (required)
  specifications: JSON string (optional)
  Example specifications:
  {
    "size": "XL",
    "color": "Blue",
    "customization": "Text to print"
  }
  ```
- **Response**:
  ```json
  {
    "cart": {
      "items": [...],
      "subtotal": number,
      "tax": number,
      "total": number
    }
  }
  ```

### Remove from Cart
- **Endpoint**: `DELETE /api/cart/remove/:productId`
- **Role**: User
- **Access**: Private (User)
- **Headers**: `Authorization: Bearer USER_TOKEN`
- **Response**: Same as Add to Cart

### Update Cart
- **Endpoint**: `PUT /api/cart/update/:productId`
- **Access**: Private (User)
- **Headers**: `Authorization: Bearer USER_TOKEN`
- **Form Data**:
  ```
  quantity: number (required)
  specifications: JSON string (optional)
  ```
- **Response**: Same as Add to Cart

### View Cart
- **Endpoint**: `GET /api/cart`
- **Access**: Private (User)
- **Headers**: `Authorization: Bearer USER_TOKEN`
- **Response**: Same as Add to Cart

## Order Management

### Place Order
- **Endpoint**: `POST /api/orders`
- **Access**: Private (User)
- **Headers**: `Authorization: Bearer USER_TOKEN`
- **Form Data**:
  ```
  shippingAddress[firstName]: string (required)
  shippingAddress[lastName]: string (required)
  shippingAddress[street]: string (required)
  shippingAddress[city]: string (required)
  shippingAddress[state]: string (required)
  shippingAddress[country]: string (required)
  shippingAddress[zipCode]: string (required, 6 digits)
  shippingAddress[phone]: string (required)
  
  billingAddress[firstName]: string (required)
  billingAddress[lastName]: string (required)
  billingAddress[street]: string (required)
  billingAddress[city]: string (required)
  billingAddress[state]: string (required)
  billingAddress[country]: string (required)
  billingAddress[zipCode]: string (required, 6 digits)
  billingAddress[phone]: string (required)
  
  paymentMethod[type]: string (required, one of: credit_card, paypal, stripe)
  paymentMethod[details]: JSON string (required)
  Example payment details for credit card:
  {
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2024",
    "cvv": "123"
  }
  ```
- **Response**:
  ```json
  {
    "order": {
      "id": "order_id",
      "items": [...],
      "status": "pending",
      "total": number
    }
  }
  ```

### View Order History
- **Endpoint**: `GET /api/orders`
- **Access**: Private (User)
- **Headers**: `Authorization: Bearer USER_TOKEN`
- **Query Parameters**:
  ```
  page: number (default: 1)
  limit: number (default: 10)
  ```
- **Response**:
  ```json
  {
    "orders": [...],
    "total": number,
    "page": number,
    "pages": number
  }
  ```

### Track Order
- **Endpoint**: `GET /api/orders/:orderId/track`
- **Access**: Private (User)
- **Headers**: `Authorization: Bearer USER_TOKEN`
- **Response**:
  ```json
  {
    "status": "string",
    "trackingNumber": "string",
    "updates": [
      {
        "status": "string",
        "timestamp": "date",
        "location": "string"
      }
    ]
  }
  ```

## Reviews and Ratings

### Leave Review
- **Endpoint**: `POST /api/orders/:orderId/review`
- **Access**: Private (User)
- **Headers**: `Authorization: Bearer USER_TOKEN`
- **Form Data**:
  ```
  rating: number (required, 1-5)
  comment: string (required)
  images: File[] (optional, max 5 images)
  ```
- **Response**:
  ```json
  {
    "message": "Review added successfully"
  }
  ```

### View Reviews
- **Endpoint**: `GET /api/orders/:orderId/reviews`
- **Access**: Public
- **Response**:
  ```json
  {
    "reviews": [
      {
        "rating": number,
        "comment": string,
        "user": {
          "username": string
        },
        "createdAt": date
      }
    ]
  }
  ```

## Returns and Refunds

### Request Replacement
- **Endpoint**: `POST /api/orders/:orderId/replacement`
- **Access**: Private (User)
- **Headers**: `Authorization: Bearer USER_TOKEN`
- **Form Data**:
  ```
  reason: string (required)
  items: Array (optional)
  [
    {
      "productId": string,
      "quantity": number
    }
  ]
  images: File[] (optional, max 5 images)
  ```
- **Response**:
  ```json
  {
    "message": "Replacement request submitted successfully",
    "requestId": "string"
  }
  ```

### Request Refund
- **Endpoint**: `POST /api/orders/:orderId/refund`
- **Access**: Private (User)
- **Headers**: `Authorization: Bearer USER_TOKEN`
- **Form Data**:
  ```
  reason: string (required)
  items: Array (optional)
  [
    {
      "productId": string,
      "quantity": number
    }
  ]
  images: File[] (optional, max 5 images)
  bankDetails: JSON string (required)
  {
    "accountNumber": string,
    "ifscCode": string,
    "accountHolderName": string
  }
  ```
- **Response**:
  ```json
  {
    "message": "Refund request submitted successfully",
    "requestId": "string"
  }
  ```

### View Requests
- **Endpoint**: `GET /api/orders/:orderId/requests`
- **Access**: Private (User)
- **Headers**: `Authorization: Bearer USER_TOKEN`
- **Response**:
  ```json
  {
    "replacement": {
      "status": string,
      "reason": string,
      "items": Array,
      "requestedAt": date,
      "updatedAt": date
    },
    "refund": {
      "status": string,
      "reason": string,
      "amount": number,
      "requestedAt": date,
      "updatedAt": date
    }
  }
  ```

## Admin Endpoints

### Admin Login
- **Endpoint**: `POST /api/admin/auth/login`
- **Role**: Admin
- **Access**: Public
- **Form Data**:
  ```
  email: string (required)
  password: string (required)
  ```
- **Response**:
  ```json
  {
    "token": "ADMIN_JWT_TOKEN",
    "user": {
      "id": "user_id",
      "role": "admin"
    }
  }
  ```

### Manage Products
- **Add Product**
  - **Endpoint**: `POST /api/admin/products`
  - **Role**: Admin
  - **Headers**: `Authorization: Bearer ADMIN_TOKEN`
  - **Form Data**:
    ```
    name: string (required)
    description: string (required)
    price: number (required)
    category: string (required, category ID)
    stock: number (required)
    sku: string (required)
    images: File[] (required, max 5)
    specifications: JSON string (optional)
    {
      "sizes": ["S", "M", "L", "XL"],
      "colors": ["Red", "Blue", "Green"],
      "material": "Cotton",
      "weight": "200g"
    }
    ```

### Manage Orders
- **Update Order Status**
  - **Endpoint**: `PUT /api/admin/orders/:orderId/status`
  - **Role**: Admin
  - **Headers**: `Authorization: Bearer ADMIN_TOKEN`
  - **Form Data**:
    ```
    status: string (required, one of: processing, shipped, delivered)
    trackingNumber: string (required for shipped status)
    ```

## Important Notes

1. **File Upload Limits**:
   - Maximum file size: 5MB per file
   - Supported formats: JPG, PNG, WEBP
   - Maximum files per request: 5

2. **Token Usage**:
   - After login/register, store the token
   - Include in all private requests as: `Authorization: Bearer <token>`
   - User token for regular operations
   - Admin token for admin operations

3. **Form Data Arrays**:
   - For arrays in form data, use indexed notation:
   ```
   items[0][productId]: "123"
   items[0][quantity]: 2
   items[1][productId]: "456"
   items[1][quantity]: 1
   ```

4. **Error Responses**:
   ```json
   {
     "message": "Error description",
     "errors": [] // Validation errors if any
   }
   ```

5. **Rate Limiting**:
   - 100 requests per minute for public endpoints
   - 300 requests per minute for authenticated users
   - 1000 requests per minute for admin users

6. **Pagination**:
   - Default page size: 10 items
   - Maximum page size: 100 items
   - Use page and limit query parameters 

## Roles and Permissions

### User Roles
1. **Public (Unauthenticated)**
   - Access product listings and details
   - View product reviews
   - Register as a user
   - Login
   - Request password reset

2. **User Role**
   - All public permissions
   - Manage personal profile
   - Manage cart (add, remove, update items)
   - Place orders
   - View order history
   - Track orders
   - Leave product reviews
   - Request refunds/replacements
   - Apply promotion codes
   - Save favorite products
   - Manage shipping addresses

3. **Admin Role**
   - All user permissions
   - Manage products (CRUD operations)
   - Manage categories
   - Process orders
   - Manage user accounts
   - View analytics and reports
   - Manage promotions
   - Process refund/replacement requests
   - Manage inventory
   - Access admin dashboard

### Admin Registration
Admin accounts cannot be created through the regular registration process. There are two ways to create an admin account:

1. **Direct Database Setup**
   - The first admin account should be created directly in the database during initial setup
   - Use the following MongoDB command:
   ```javascript
   db.users.insertOne({
     username: "admin",
     email: "admin@example.com",
     password: "<hashed_password>", // Use bcrypt to hash the password
     role: "admin",
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

2. **Admin Invitation**
   - Only existing admins can create new admin accounts
   - **Endpoint**: `POST /api/admin/invite`
   - **Access**: Private (Admin only)
   - **Headers**: `Authorization: Bearer ADMIN_TOKEN`
   - **Form Data**:
     ```
     email: string (required)
     firstName: string (required)
     lastName: string (required)
     ```
   - **Response**:
     ```json
     {
       "message": "Admin invitation sent successfully",
       "inviteToken": "TOKEN"
     }
     ```
   - The invited user will receive an email with a link to complete registration

### Role-specific Endpoints

#### User Role Endpoints
1. **Cart Management**
   - POST /api/cart/add
   - DELETE /api/cart/remove/:productId
   - PUT /api/cart/update/:productId
   - GET /api/cart

2. **Order Management**
   - POST /api/orders
   - GET /api/orders
   - GET /api/orders/:orderId/track
   - POST /api/orders/:orderId/review
   - POST /api/orders/:orderId/replacement
   - POST /api/orders/:orderId/refund

3. **Profile Management**
   - GET /api/user/profile
   - PUT /api/user/profile
   - PUT /api/user/password

#### Admin Role Endpoints
1. **Product Management**
   - POST /api/admin/products
   - PUT /api/admin/products/:productId
   - DELETE /api/admin/products/:productId
   - GET /api/admin/products/analytics

2. **Order Management**
   - GET /api/admin/orders
   - PUT /api/admin/orders/:orderId/status
   - GET /api/admin/orders/analytics

3. **User Management**
   - GET /api/admin/users
   - PUT /api/admin/users/:userId/status
   - DELETE /api/admin/users/:userId
   - POST /api/admin/invite

4. **Category Management**
   - POST /api/admin/categories
   - PUT /api/admin/categories/:categoryId
   - DELETE /api/admin/categories/:categoryId

5. **Promotion Management**
   - POST /api/admin/promotions
   - PUT /api/admin/promotions/:promotionId
   - DELETE /api/admin/promotions/:promotionId
   - GET /api/admin/promotions/analytics

### Permission Enforcement
1. **Middleware Authentication**
   - All protected routes use JWT authentication
   - Tokens must be included in the Authorization header
   - Different tokens are issued for user and admin roles

2. **Role Validation**
   - Admin endpoints check for role: 'admin'
   - User endpoints check for valid authentication
   - Invalid role access returns 403 Forbidden

3. **Error Handling**
   - Unauthorized access (401): Missing or invalid token
   - Forbidden access (403): Valid token but insufficient permissions
   - Not Found (404): Resource doesn't exist

### Security Best Practices
1. **Token Management**
   - Admin tokens expire after 4 hours
   - User tokens expire after 24 hours
   - Refresh tokens are provided for seamless re-authentication

2. **Rate Limiting**
   - Admin endpoints: 1000 requests/minute
   - User endpoints: 300 requests/minute
   - Public endpoints: 100 requests/minute

3. **Audit Logging**
   - All admin actions are logged
   - Logs include actor, action, timestamp, and affected resources
   - Logs are retained for 90 days 

## Server Initialization
```javascript
// Server startup check for admin account
async function checkAndCreateDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('ASdf@1234', 10);
      await User.create({
        username: 'ankit',
        email: 'ak3057955@gmail.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Default admin account created successfully');
    }
  } catch (error) {
    console.error('Error checking/creating default admin:', error);
  }
}

// Call this function when server starts
server.listen(PORT, async () => {
  await checkAndCreateDefaultAdmin();
  console.log(`Server running on port ${PORT}`);
});
``` 