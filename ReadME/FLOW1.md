# E-commerce API Flow Documentation

## Roles Overview

### 1. User Role
- Basic authenticated user
- Can browse products
- Can manage their own profile
- Can manage their cart
- Can place orders
- Can view their order history
- Can write product reviews

### 2. Admin Role
- Has all user permissions
- Can manage products (CRUD operations)
- Can manage all orders
- Can access user statistics
- Can manage promotions
- Can manage categories
- Can process refunds
- Can view analytics

## Authentication Flow

### 1. Register as Regular User
```
POST http://localhost:3000/api/auth/register
Content-Type: multipart/form-data

Form Data:
- username (required): string, min 3 characters
- email (required): valid email format
- password (required): min 6 characters
- phone (optional): valid phone number
- address[street] (optional): string
- address[city] (optional): string
- address[state] (optional): string
- address[zipCode] (optional): 5 or 9 digit format
- address[country] (optional): string

Response (201):
{
    "message": "User registered successfully",
    "token": "jwt_token",
    "user": {
        "id": "user_id",
        "username": "username",
        "email": "email",
        "role": "user"
    }
}
```

### 2. Register as Admin
```
POST http://localhost:3000/api/auth/register-admin
Content-Type: multipart/form-data

Form Data:
- username (required): string, min 3 characters
- email (required): valid email format
- password (required): min 6 characters
- adminKey (required): match ADMIN_REGISTRATION_KEY from .env
- phone (optional): valid phone number
- address[street] (optional): string
- address[city] (optional): string
- address[state] (optional): string
- address[zipCode] (optional): 5 or 9 digit format
- address[country] (optional): string

Response (201):
{
    "message": "Admin user registered successfully",
    "token": "jwt_token",
    "user": {
        "id": "user_id",
        "username": "username",
        "email": "email",
        "role": "admin"
    }
}
```

### 3. Login (Both Roles)
```
POST http://localhost:3000/api/auth/login
Content-Type: multipart/form-data

Form Data:
- email (required): registered email
- password (required): user password

Response (200):
{
    "token": "jwt_token",
    "user": {
        "id": "user_id",
        "username": "username",
        "email": "email",
        "role": "user/admin"
    }
}
```

## User Management

### 1. Get Profile (Both Roles)
```
GET http://localhost:3000/api/user/profile
Headers:
- Authorization: Bearer <token>

Response (200):
{
    "_id": "user_id",
    "username": "username",
    "email": "email",
    "role": "user/admin",
    "phone": "phone_number",
    "address": {
        "street": "street",
        "city": "city",
        "state": "state",
        "zipCode": "zip",
        "country": "country"
    }
}
```

### 2. Update Profile (Both Roles)
```
PUT http://localhost:3000/api/user/profile
Headers:
- Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- username (optional): string, min 3 characters
- phone (optional): valid phone number
- address[street] (optional): string
- address[city] (optional): string
- address[state] (optional): string
- address[zipCode] (optional): 5 or 9 digit format
- address[country] (optional): string
- profilePicture (optional): image file, max 2MB

Response (200):
{
    "_id": "user_id",
    "username": "updated_username",
    "email": "email",
    "role": "user/admin",
    "phone": "updated_phone",
    "address": {
        "street": "updated_street",
        "city": "updated_city",
        "state": "updated_state",
        "zipCode": "updated_zip",
        "country": "updated_country"
    },
    "profilePicture": "/uploads/users/filename.jpg"
}
```

### 3. Change Password (Both Roles)
```
PUT http://localhost:3000/api/user/change-password
Headers:
- Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data or Raw Body(JSON):
- currentPassword (required): current password
- newPassword (required): new password, min 6 characters

Response (200):
{
    "message": "Password updated successfully"
}
```

## Product Management

### 0. Create Category (Admin Only)
```
POST http://localhost:3000/api/categories
Headers:
- Authorization: Bearer <your_admin_token>
Content-Type: multipart/form-data

Form Data:
- name: Men
- description: Men's clothing collection
- order: 1
```



### 1. Create Product (Admin Only)
```
POST http://localhost:3000/api/products
Headers:
- Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Form Data:
- name (required): string, min 3 characters
- description (required): string, min 10 characters
- price (required): positive number
- category (required): valid category ID
- stock (required): non-negative integer
- sizes (optional): array of sizes (XS, S, M, L, XL, XXL)
- colors[0][name] (optional): color name
- colors[0][code] (optional): hex color code
- images (optional): up to 5 image files, max 5MB each

Response (201):
{
    "_id": "product_id",
    "name": "product_name",
    "description": "description",
    "price": 99.99,
    "category": {
        "_id": "category_id",
        "name": "category_name"
    },
    "stock": 100,
    "sizes": ["M", "L", "XL"],
    "colors": [
        {
            "name": "Red",
            "code": "#FF0000"
        }
    ],
    "images": [
        {
            "url": "/uploads/products/image1.jpg",
            "alt": "product_name"
        }
    ]
}
```

### 2. Get Products (Public)
```
GET http://localhost:3000/api/products
Query Parameters:
- category (optional): category ID
- minPrice (optional): minimum price
- maxPrice (optional): maximum price
- sort (optional): field:order (e.g., price:desc)
- page (optional): page number, default 1
- limit (optional): items per page, default 10

Response (200):
{
    "products": [...],
    "currentPage": 1,
    "totalPages": 5,
    "totalProducts": 50
}
```

### 3. Update Product (Admin Only)
```
PUT http://localhost:3000/api/products/:id
Headers:
- Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Form Data: (same as create product)

Response (200):
{
    "message": "Product updated successfully",
    "product": {...}
}
```

### 4. Delete Product (Admin Only)
```
DELETE http://localhost:3000/api/products/:id
Headers:
- Authorization: Bearer <admin_token>

Response (200):
{
    "message": "Product deleted successfully"
}
```

## Order Management

### 1. Create Order (User)
```
POST http://localhost:3000/api/orders
Headers:
- Authorization: Bearer <user_token>
Content-Type: application/json

Body:
{
    "items": [
        {
            "product": "product_id",
            "quantity": 2,
            "size": "M",
            "color": "Red"
        }
    ],
    "shippingAddress": {
        "street": "street",
        "city": "city",
        "state": "state",
        "zipCode": "zip",
        "country": "country"
    },
    "paymentInfo": {
        "method": "card/cod"
    }
}

Response (201):
{
    "message": "Order created successfully",
    "order": {...}
}
```

### 2. Get User Orders (User)
```
GET http://localhost:3000/api/orders
Headers:
- Authorization: Bearer <user_token>

Response (200):
{
    "orders": [...]
}
```

### 3. Get All Orders (Admin Only)
```
GET http://localhost:3000/api/admin/orders
Headers:
- Authorization: Bearer <admin_token>
Query Parameters:
- status (optional): order status
- startDate (optional): ISO date
- endDate (optional): ISO date

Response (200):
{
    "orders": [...]
}
```

### 4. Update Order Status (Admin Only)
```
PUT http://localhost:3000/api/admin/orders/:orderId/status
Headers:
- Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Form Data:
- status (required): new status

Response (200):
{
    "message": "Order status updated successfully",
    "order": {...}
}
```

## Admin Statistics

### 1. Get User Statistics
```
GET http://localhost:3000/api/admin/user-statistics
Headers:
- Authorization: Bearer <admin_token>

Response (200):
{
    "totalUsers": 100,
    "newUsers": 10,
    "usersByDate": [...],
    "topCustomers": [...]
}
```

### 2. Get Sales Statistics
```
GET http://localhost:3000/api/admin/statistics
Headers:
- Authorization: Bearer <admin_token>

Response (200):
{
    "totalSales": 10000,
    "totalOrders": 100,
    "averageOrderValue": 100,
    "salesByDate": [...],
    "topProducts": [...]
}
```

## Important Notes

1. Token Usage:
   - After registration/login, save the JWT token
   - Include token in all authenticated requests
   - Admin endpoints require admin role token
   - Token format: `Bearer <token>`

2. Form Data vs JSON:
   - Use form-data for file uploads (images)
   - Use JSON for complex nested objects
   - Login/Register always use form-data

3. Error Responses:
   - 400: Bad Request (validation errors)
   - 401: Unauthorized (invalid/missing token)
   - 403: Forbidden (insufficient permissions)
   - 404: Not Found
   - 500: Server Error

4. Testing in Postman:
   - Create separate collections for User and Admin
   - Set environment variables for tokens
   - Use form-data for file uploads
   - Test all error cases
   - Verify role-based access

5. Security:
   - Never share tokens
   - Use HTTPS in production
   - Keep admin key secure
   - Validate all inputs
   - Handle errors gracefully 