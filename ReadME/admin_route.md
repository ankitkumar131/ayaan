# Admin Routes Documentation

## Overview
This document outlines all the admin-accessible routes in the e-commerce application, starting from the base URL `http://localhost:4200/`. Each route is explained with its purpose and functionality.

## Admin Authentication

### Admin Login
- **Route**: `/auth/admin-login`
- **Description**: Admin-specific login page.
- **Features**:
  - Login form with email and password fields
  - Remember me option
  - Restricted to users with admin privileges
  - Link to register new admin

### Admin Registration
- **Route**: `/auth/register-admin`
- **Description**: Registration page for new admin users.
- **Features**:
  - Registration form with username, email, password, name, and phone fields
  - Admin key validation for security
  - Automatic login and redirection to admin dashboard upon successful registration

## Admin Dashboard

### Dashboard Overview
- **Route**: `/admin/dashboard`
- **Description**: Main admin dashboard with overview statistics.
- **Features**:
  - Sales summary
  - Recent orders
  - Low stock alerts
  - User registration statistics

## Product Management

### Product List
- **Route**: `/admin/products`
- **Description**: List and manage all products.
- **Features**:
  - Product table with search, filter, and sort capabilities
  - Add, edit, and delete product options
  - Bulk actions
  - Pagination

### Add Product
- **Route**: `/admin/products/add`
- **Description**: Form to add a new product.
- **Features**:
  - Product details form (name, description, price, etc.)
  - Category and subcategory selection
  - Image upload
  - Inventory management
  - SEO settings

### Edit Product
- **Route**: `/admin/products/:productId`
- **Description**: Form to edit an existing product.
- **Features**:
  - Pre-filled form with existing product details
  - Update product information
  - Manage product images
  - Update inventory

## Category Management

### Category List
- **Route**: `/admin/categories`
- **Description**: List and manage product categories.
- **Features**:
  - Category table with search and filter
  - Add, edit, and delete category options
  - Category hierarchy management

### Add Category
- **Route**: `/admin/categories/add`
- **Description**: Form to add a new category.
- **Features**:
  - Category details (name, description)
  - Parent category selection
  - Category image upload

### Edit Category
- **Route**: `/admin/categories/:categoryId`
- **Description**: Form to edit an existing category.
- **Features**:
  - Update category information
  - Manage subcategories

## Order Management

### Order List
- **Route**: `/admin/orders`
- **Description**: List and manage all orders.
- **Features**:
  - Order table with search, filter by status, and sort capabilities
  - View order details
  - Update order status
  - Pagination

### Order Details
- **Route**: `/admin/orders/:orderId`
- **Description**: Detailed view of a specific order.
- **Features**:
  - Order items and quantities
  - Customer information
  - Shipping and billing details
  - Order status management
  - Order notes
  - Process refunds

## User Management

### User List
- **Route**: `/admin/users`
- **Description**: List and manage all users.
- **Features**:
  - User table with search, filter by role, and sort capabilities
  - View user details
  - Update user status (active/inactive)
  - Update user role
  - Delete user
  - Pagination

### User Details
- **Route**: `/admin/users/:userId`
- **Description**: Detailed view of a specific user.
- **Features**:
  - User profile information
  - Order history
  - Account status management

## Promotion Management

### Promotion List
- **Route**: `/admin/promotions`
- **Description**: List and manage all promotions and discounts.
- **Features**:
  - Promotion table with search, filter by status, and sort capabilities
  - Add, edit, and delete promotion options
  - Pagination

### Add Promotion
- **Route**: `/admin/promotions/add`
- **Description**: Form to add a new promotion.
- **Features**:
  - Promotion details (name, description, discount amount/percentage)
  - Promotion type (coupon, automatic discount)
  - Applicable products or categories
  - Validity period
  - Usage limits

### Edit Promotion
- **Route**: `/admin/promotions/:promotionId`
- **Description**: Form to edit an existing promotion.
- **Features**:
  - Update promotion details
  - Adjust validity period
  - Modify usage limits

## Return and Refund Management

### Return Requests
- **Route**: `/admin/returns`
- **Description**: List and manage return/refund requests.
- **Features**:
  - Return request table with search, filter by status, and sort capabilities
  - View request details
  - Approve or reject requests
  - Process refunds
  - Pagination

### Return Request Details
- **Route**: `/admin/returns/:returnId`
- **Description**: Detailed view of a specific return request.
- **Features**:
  - Return reason and details
  - Order information
  - Customer information
  - Return status management
  - Communication with customer

## Settings

### General Settings
- **Route**: `/admin/settings/general`
- **Description**: Manage general store settings.
- **Features**:
  - Store information (name, contact details)
  - Currency and tax settings
  - Email notification settings

### Shipping Settings
- **Route**: `/admin/settings/shipping`
- **Description**: Manage shipping options and rates.
- **Features**:
  - Shipping methods
  - Shipping zones
  - Shipping rates

### Payment Settings
- **Route**: `/admin/settings/payment`
- **Description**: Manage payment gateways and options.
- **Features**:
  - Payment gateway configuration
  - Payment method enablement

## API Endpoint Issues

The admin routes are experiencing issues with their corresponding API endpoints, particularly:

1. **Admin Login** - Route: `/auth/admin/login`
   - Error: "Route not found"
   - The frontend is attempting to call `${apiUrl}/auth/admin/login` but this endpoint may not be properly implemented on the backend.

## Required API Fixes

Based on the API documentation and frontend implementation, the following endpoints need to be fixed or implemented:

1. **Admin Authentication**:
   - `POST ${apiUrl}/auth/admin/login` - Admin login endpoint

2. **User Management**:
   - `PUT ${apiUrl}/users/password` - Change user password
   - `PUT ${apiUrl}/users/address` - Update user address

3. **Cart Management**:
   - Ensure all cart-related endpoints are properly implemented and responding

## Access Control

All admin routes should be protected by:

1. Authentication check - Verify the user is logged in
2. Role verification - Ensure the user has admin privileges
3. Proper error handling for unauthorized access attempts

The frontend implements these checks through:
- Auth guards that verify authentication status and admin role
- HTTP interceptors that add authentication tokens to requests
- Conditional UI rendering based on user role