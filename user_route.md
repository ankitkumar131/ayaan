# User Routes Documentation

## Overview
This document outlines all the user-accessible routes in the e-commerce application, starting from the base URL `http://localhost:4200/`. Each route is explained with its purpose and functionality.

## Public Routes

### Home Page
- **Route**: `/`
- **Description**: The main landing page of the application.
- **Features**:
  - Hero section with promotional content
  - Featured products display
  - New arrivals section
  - Shop by category section (should only show Men and Women categories)

### Authentication Routes

#### Register
- **Route**: `/auth/register`
- **Description**: User registration page.
- **Features**:
  - Registration form with fields for username, first name, last name, email, password, and confirm password
  - Form validation for required fields and password strength
  - Terms and conditions agreement checkbox

#### Login
- **Route**: `/auth/login`
- **Description**: User login page.
- **Features**:
  - Login form with email and password fields
  - Remember me option
  - Forgot password link

#### Forgot Password
- **Route**: `/auth/forgot-password`
- **Description**: Page to request a password reset.
- **Features**:
  - Form to enter email address
  - Submit button to request password reset link

#### Reset Password
- **Route**: `/auth/reset-password`
- **Description**: Page to set a new password after receiving a reset link.
- **Features**:
  - Form with new password and confirm password fields
  - Password strength indicator

### Product Routes

#### All Products
- **Route**: `/products`
- **Description**: Page displaying all available products.
- **Features**:
  - Product grid with filtering and sorting options
  - Pagination

#### Product Categories
- **Route**: `/products/category/:categoryName`
- **Description**: Products filtered by category (e.g., men, women).
- **Features**:
  - Category-specific product listings
  - Subcategory filtering

#### Product Details
- **Route**: `/products/:productId`
- **Description**: Detailed view of a specific product.
- **Features**:
  - Product images, description, price, and availability
  - Size and color selection (if applicable)
  - Add to cart functionality
  - Related products

#### New Arrivals
- **Route**: `/products/new-arrivals`
- **Description**: Page displaying recently added products.

#### Featured Products
- **Route**: `/products/featured`
- **Description**: Page displaying featured or promoted products.

### Cart and Checkout

#### Cart
- **Route**: `/cart`
- **Description**: Shopping cart page.
- **Features**:
  - List of items in cart
  - Quantity adjustment
  - Remove items
  - Cart summary with subtotal
  - Proceed to checkout button

#### Checkout
- **Route**: `/checkout`
- **Description**: Checkout process pages.
- **Features**:
  - Shipping address form
  - Payment method selection
  - Order summary
  - Place order button

## Authenticated User Routes

### Account Management

#### Profile
- **Route**: `/account/profile`
- **Description**: User profile management page.
- **Features**:
  - View and edit personal information (username, phone)
  - Email display (non-editable)
  - Link to change password

#### Change Password
- **Route**: `/account/change-password`
- **Description**: Page to update account password.
- **Features**:
  - Current password verification
  - New password and confirmation fields
  - Password strength indicator

#### Addresses
- **Route**: `/account/addresses`
- **Description**: Manage shipping addresses.
- **Features**:
  - View existing address
  - Add or edit address with fields for street, city, state, ZIP code (5-digit format), and country

#### Orders
- **Route**: `/account/orders`
- **Description**: View order history.
- **Features**:
  - List of past orders with status
  - Order details access

#### Order Details
- **Route**: `/account/orders/:orderId`
- **Description**: Detailed view of a specific order.
- **Features**:
  - Order items and quantities
  - Shipping and billing information
  - Order status
  - Return/refund request option (if applicable)

## API Endpoint Issues

The following routes are currently experiencing issues with their corresponding API endpoints:

1. **Password Change** - Route: `/account/change-password`
   - Error: "Route not found"
   - The frontend is attempting to call `${apiUrl}/users/password` but this endpoint may not be properly implemented on the backend.

2. **Address Management** - Route: `/account/addresses`
   - Error: "Route not found"
   - The frontend is attempting to call `${apiUrl}/users/address` but this endpoint may not be properly implemented on the backend.
   - Note: The ZIP code validation in the frontend uses a 5-digit format (`/^\d{5}(-\d{4})?$/`), but the API may be expecting a 6-digit format.

3. **Cart Functionality** - Route: `/cart` and cart icon in header
   - Issue: Cart option in header doesn't work
   - The cart functionality appears to be properly implemented in the frontend, but there may be issues with the corresponding API endpoints.

## Navigation Elements

### Header
- Contains logo, main navigation menu, search, cart, and user menu
- Cart icon shows number of items in cart
- User menu provides access to account pages when logged in
- Login/Register buttons when not logged in

### Footer
- Contains links to various pages, contact information, and social media links
- Currently working as expected