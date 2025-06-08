# Angular 19 Frontend Routes Structure

This document outlines the detailed routing structure for the e-commerce frontend application based on the Angular 19 architecture. It describes the navigation flow for both users and administrators, including route protection, lazy loading, and route parameters.

## Base Routes Configuration

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent) },
  { path: 'auth', loadChildren: () => import('./features/public/auth/auth.routes').then(m => m.AUTH_ROUTES) },
  { path: 'products', loadChildren: () => import('./features/public/products/products.routes').then(m => m.PRODUCTS_ROUTES) },
  { path: 'cart', loadChildren: () => import('./features/public/cart/cart.routes').then(m => m.CART_ROUTES) },
  { path: 'checkout', loadChildren: () => import('./features/public/checkout/checkout.routes').then(m => m.CHECKOUT_ROUTES), canActivate: [authGuard] },
  { path: 'account', loadChildren: () => import('./features/public/user-account/user-account.routes').then(m => m.USER_ACCOUNT_ROUTES), canActivate: [authGuard] },
  { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES), canActivate: [authGuard, adminGuard] },
  { path: '**', loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
```

## Initial Landing Page

When a user first visits the application (using `ng serve`), they will land on the home page (`/home`). This is configured through the default route redirect: `{ path: '', redirectTo: '/home', pathMatch: 'full' }`.

The home page will display:
- Featured products
- Category navigation (Men/Women)
- Promotional banners
- New arrivals
- Special offers

## Public Routes (Unauthenticated Users)

### Authentication Routes

```typescript
// auth.routes.ts
export const AUTH_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent) }
];
```

- **Login** (`/auth/login`): User login form
- **Register** (`/auth/register`): New user registration form
- **Forgot Password** (`/auth/forgot-password`): Request password reset
- **Reset Password** (`/auth/reset-password`): Reset password with token

### Product Routes

```typescript
// products.routes.ts
export const PRODUCTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./product-list/product-list.component').then(m => m.ProductListComponent) },
  { path: 'category/:categorySlug', loadComponent: () => import('./product-list/product-list.component').then(m => m.ProductListComponent) },
  { path: 'search', loadComponent: () => import('./product-search/product-search.component').then(m => m.ProductSearchComponent) },
  { path: ':productId', loadComponent: () => import('./product-detail/product-detail.component').then(m => m.ProductDetailComponent) }
];
```

- **All Products** (`/products`): Display all products with filtering and sorting options
- **Category Products** (`/products/category/:categorySlug`): Display products filtered by category (e.g., `/products/category/men` or `/products/category/women`)
- **Search Results** (`/products/search?q=query`): Display search results based on query parameter
- **Product Details** (`/products/:productId`): Display detailed information for a specific product

### Cart Routes

```typescript
// cart.routes.ts
export const CART_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./cart-page/cart-page.component').then(m => m.CartPageComponent) }
];
```

- **Cart Page** (`/cart`): Display cart items, quantities, prices, and total

## Protected User Routes (Authenticated Users)

### Checkout Routes

```typescript
// checkout.routes.ts
export const CHECKOUT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./checkout-page/checkout-page.component').then(m => m.CheckoutPageComponent) },
  { path: 'shipping', loadComponent: () => import('./shipping-form/shipping-form.component').then(m => m.ShippingFormComponent) },
  { path: 'payment', loadComponent: () => import('./payment-form/payment-form.component').then(m => m.PaymentFormComponent) },
  { path: 'confirmation/:orderId', loadComponent: () => import('./confirmation/confirmation.component').then(m => m.ConfirmationComponent) }
];
```

- **Checkout** (`/checkout`): Multi-step checkout process starting page
- **Shipping Information** (`/checkout/shipping`): Collect shipping address
- **Payment Information** (`/checkout/payment`): Collect payment details
- **Order Confirmation** (`/checkout/confirmation/:orderId`): Display order confirmation with details

### User Account Routes

```typescript
// user-account.routes.ts
export const USER_ACCOUNT_ROUTES: Routes = [
  { path: '', redirectTo: 'profile', pathMatch: 'full' },
  { path: 'profile', loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'orders', loadComponent: () => import('./orders/orders.component').then(m => m.OrdersComponent) },
  { path: 'orders/:orderId', loadComponent: () => import('./order-detail/order-detail.component').then(m => m.OrderDetailComponent) },
  { path: 'returns', loadComponent: () => import('./returns/returns.component').then(m => m.ReturnsComponent) },
  { path: 'reviews', loadComponent: () => import('./reviews/reviews.component').then(m => m.ReviewsComponent) }
];
```

- **User Profile** (`/account/profile`): View and edit user information
- **Order History** (`/account/orders`): View all past orders
- **Order Details** (`/account/orders/:orderId`): View specific order details
- **Returns/Refunds** (`/account/returns`): Manage return and refund requests
- **User Reviews** (`/account/reviews`): View and manage product reviews

## Admin Routes (Admin Users Only)

```typescript
// admin.routes.ts
export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'products', loadChildren: () => import('./products/admin-products.routes').then(m => m.ADMIN_PRODUCTS_ROUTES) },
  { path: 'categories', loadChildren: () => import('./categories/admin-categories.routes').then(m => m.ADMIN_CATEGORIES_ROUTES) },
  { path: 'orders', loadChildren: () => import('./orders/admin-orders.routes').then(m => m.ADMIN_ORDERS_ROUTES) },
  { path: 'users', loadChildren: () => import('./users/admin-users.routes').then(m => m.ADMIN_USERS_ROUTES) },
  { path: 'promotions', loadChildren: () => import('./promotions/admin-promotions.routes').then(m => m.ADMIN_PROMOTIONS_ROUTES) }
];
```

### Admin Dashboard

- **Dashboard** (`/admin/dashboard`): Overview with sales statistics, recent orders, and user activity

### Admin Product Management

```typescript
// admin-products.routes.ts
export const ADMIN_PRODUCTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./product-list/admin-product-list.component').then(m => m.AdminProductListComponent) },
  { path: 'create', loadComponent: () => import('./product-form/admin-product-form.component').then(m => m.AdminProductFormComponent) },
  { path: 'edit/:productId', loadComponent: () => import('./product-form/admin-product-form.component').then(m => m.AdminProductFormComponent) },
  { path: 'images/:productId', loadComponent: () => import('./product-images/admin-product-images.component').then(m => m.AdminProductImagesComponent) }
];
```

- **Product List** (`/admin/products`): View and manage all products
- **Create Product** (`/admin/products/create`): Add new product
- **Edit Product** (`/admin/products/edit/:productId`): Edit existing product
- **Manage Product Images** (`/admin/products/images/:productId`): Upload and manage product images

### Admin Category Management

```typescript
// admin-categories.routes.ts
export const ADMIN_CATEGORIES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./category-list/admin-category-list.component').then(m => m.AdminCategoryListComponent) },
  { path: 'create', loadComponent: () => import('./category-form/admin-category-form.component').then(m => m.AdminCategoryFormComponent) },
  { path: 'edit/:categoryId', loadComponent: () => import('./category-form/admin-category-form.component').then(m => m.AdminCategoryFormComponent) }
];
```

- **Category List** (`/admin/categories`): View and manage all categories
- **Create Category** (`/admin/categories/create`): Add new category
- **Edit Category** (`/admin/categories/edit/:categoryId`): Edit existing category

### Admin Order Management

```typescript
// admin-orders.routes.ts
export const ADMIN_ORDERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./order-list/admin-order-list.component').then(m => m.AdminOrderListComponent) },
  { path: ':orderId', loadComponent: () => import('./order-detail/admin-order-detail.component').then(m => m.AdminOrderDetailComponent) },
  { path: 'refunds', loadComponent: () => import('./refund-requests/admin-refund-requests.component').then(m => m.AdminRefundRequestsComponent) },
  { path: 'replacements', loadComponent: () => import('./replacement-requests/admin-replacement-requests.component').then(m => m.AdminReplacementRequestsComponent) }
];
```

- **Order List** (`/admin/orders`): View and filter all orders
- **Order Details** (`/admin/orders/:orderId`): View and manage specific order
- **Refund Requests** (`/admin/orders/refunds`): Manage refund requests
- **Replacement Requests** (`/admin/orders/replacements`): Manage replacement requests

### Admin User Management

```typescript
// admin-users.routes.ts
export const ADMIN_USERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./user-list/admin-user-list.component').then(m => m.AdminUserListComponent) },
  { path: ':userId', loadComponent: () => import('./user-detail/admin-user-detail.component').then(m => m.AdminUserDetailComponent) },
  { path: 'invite', loadComponent: () => import('./invite-admin/admin-invite.component').then(m => m.AdminInviteComponent) }
];
```

- **User List** (`/admin/users`): View and manage all users
- **User Details** (`/admin/users/:userId`): View specific user details and orders
- **Invite Admin** (`/admin/users/invite`): Send invitation to create new admin account

### Admin Promotion Management

```typescript
// admin-promotions.routes.ts
export const ADMIN_PROMOTIONS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./promotion-list/admin-promotion-list.component').then(m => m.AdminPromotionListComponent) },
  { path: 'create', loadComponent: () => import('./promotion-form/admin-promotion-form.component').then(m => m.AdminPromotionFormComponent) },
  { path: 'edit/:promotionId', loadComponent: () => import('./promotion-form/admin-promotion-form.component').then(m => m.AdminPromotionFormComponent) },
  { path: 'analytics', loadComponent: () => import('./promotion-analytics/admin-promotion-analytics.component').then(m => m.AdminPromotionAnalyticsComponent) }
];
```

- **Promotion List** (`/admin/promotions`): View and manage all promotions
- **Create Promotion** (`/admin/promotions/create`): Add new promotion
- **Edit Promotion** (`/admin/promotions/edit/:promotionId`): Edit existing promotion
- **Promotion Analytics** (`/admin/promotions/analytics`): View promotion usage statistics

## Route Guards

The application uses two main route guards to protect routes based on authentication and role:

### Auth Guard

```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  // Store the attempted URL for redirecting after login
  authService.redirectUrl = state.url;
  
  // Navigate to the login page
  return router.parseUrl('/auth/login');
};
```

- Protects routes that require authentication
- Redirects to login page if user is not authenticated
- Stores attempted URL for redirect after successful login

### Admin Guard

```typescript
// admin.guard.ts
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAdmin()) {
    return true;
  }
  
  // Navigate to the home page with an error message
  return router.parseUrl('/home?error=unauthorized');
};
```

- Protects routes that require admin privileges
- Redirects to home page with error message if user is not an admin

## Navigation Flow

### User Flow

1. **Initial Landing**: User arrives at the home page (`/home`)
2. **Browsing Products**:
   - Navigate to all products (`/products`)
   - Filter by category (`/products/category/men` or `/products/category/women`)
   - Search for products (`/products/search?q=shirt`)
   - View product details (`/products/123`)
3. **Shopping Cart**:
   - Add products to cart
   - View cart (`/cart`)
4. **Checkout Process** (requires authentication):
   - If not logged in, redirect to login (`/auth/login`)
   - Enter shipping information (`/checkout/shipping`)
   - Enter payment details (`/checkout/payment`)
   - View order confirmation (`/checkout/confirmation/456`)
5. **Account Management** (requires authentication):
   - View profile (`/account/profile`)
   - View order history (`/account/orders`)
   - View specific order (`/account/orders/456`)
   - Request returns or refunds (`/account/returns`)
   - Manage reviews (`/account/reviews`)

### Admin Flow

1. **Admin Login**: Admin logs in through the same login page (`/auth/login`)
2. **Dashboard**: Admin lands on the admin dashboard (`/admin/dashboard`)
3. **Product Management**:
   - View all products (`/admin/products`)
   - Create new product (`/admin/products/create`)
   - Edit product (`/admin/products/edit/123`)
   - Manage product images (`/admin/products/images/123`)
4. **Category Management**:
   - View all categories (`/admin/categories`)
   - Create new category (`/admin/categories/create`)
   - Edit category (`/admin/categories/edit/789`)
5. **Order Management**:
   - View all orders (`/admin/orders`)
   - View specific order (`/admin/orders/456`)
   - Update order status
   - Process refund requests (`/admin/orders/refunds`)
   - Process replacement requests (`/admin/orders/replacements`)
6. **User Management**:
   - View all users (`/admin/users`)
   - View specific user (`/admin/users/101`)
   - Invite new admin (`/admin/users/invite`)
7. **Promotion Management**:
   - View all promotions (`/admin/promotions`)
   - Create new promotion (`/admin/promotions/create`)
   - Edit promotion (`/admin/promotions/edit/202`)
   - View promotion analytics (`/admin/promotions/analytics`)

## Route Parameters and Query Parameters

### Route Parameters

- **Product ID** (`/products/:productId`): Used to identify specific product
- **Order ID** (`/account/orders/:orderId`, `/admin/orders/:orderId`): Used to identify specific order
- **User ID** (`/admin/users/:userId`): Used to identify specific user
- **Category Slug** (`/products/category/:categorySlug`): Used to filter products by category
- **Promotion ID** (`/admin/promotions/edit/:promotionId`): Used to identify specific promotion

### Query Parameters

- **Search Query** (`/products/search?q=query`): Used for product search
- **Filters** (`/products?category=men&color=blue&size=xl`): Used for product filtering
- **Sorting** (`/products?sort=price_asc`): Used for product sorting
- **Pagination** (`/products?page=2&limit=20`): Used for pagination
- **Date Range** (`/admin/orders?startDate=2023-01-01&endDate=2023-01-31`): Used for filtering orders by date
- **Status Filter** (`/admin/orders?status=processing`): Used for filtering orders by status

## Lazy Loading Strategy

All feature modules are lazy-loaded to improve initial load time and performance:

- **Auth Module**: Loaded when user navigates to authentication routes
- **Products Module**: Loaded when user navigates to product routes
- **Cart Module**: Loaded when user navigates to cart
- **Checkout Module**: Loaded when user navigates to checkout
- **User Account Module**: Loaded when user navigates to account routes
- **Admin Module**: Loaded when admin navigates to admin routes

Each admin sub-module (products, categories, orders, users, promotions) is also lazy-loaded within the admin module.

## Route Transition Animations

The application uses Angular's route transition animations to provide a smooth user experience when navigating between routes:

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
    // other providers
  ]
};
```

## Error Handling Routes

- **Not Found** (`**`): Catches all undefined routes and displays a 404 page
- **Unauthorized** (`/home?error=unauthorized`): Displays error message when user attempts to access admin routes
- **Authentication Error** (`/auth/login?error=session_expired`): Displays error when session expires

## Implementation Notes

1. **Route Data**: Additional data can be passed to routes using the `data` property:
   ```typescript
   { 
     path: 'products', 
     component: ProductListComponent, 
     data: { title: 'All Products', breadcrumb: 'Products' } 
   }
   ```

2. **Route Resolvers**: For routes that need to load data before displaying the component:
   ```typescript
   { 
     path: 'products/:productId', 
     component: ProductDetailComponent, 
     resolve: { product: productResolver } 
   }
   ```

3. **Child Routes**: For complex features with nested navigation:
   ```typescript
   { 
     path: 'account', 
     component: AccountLayoutComponent,
     children: [
       { path: 'profile', component: ProfileComponent },
       { path: 'orders', component: OrdersComponent }
     ] 
   }
   ```

4. **Route Guards**: Additional guards can be implemented for specific scenarios:
   - `canDeactivate`: Prevent leaving a route with unsaved changes
   - `resolve`: Pre-fetch data before activating a route
   - `canLoad`: Prevent lazy loading a module without proper permissions

5. **Deep Linking**: The application supports deep linking to any route, allowing users to bookmark or share specific pages.

6. **SEO Considerations**: Important routes should be configured with meta tags for better SEO:
   ```typescript
   { 
     path: 'products/:productId', 
     component: ProductDetailComponent,
     data: { 
       meta: { 
         title: 'Product Details', 
         description: 'View detailed product information' 
       } 
     } 
   }
   ```

7. **Breadcrumb Navigation**: Routes are structured to support hierarchical breadcrumb navigation.

8. **Mobile Navigation**: The routing structure supports responsive design with potentially different navigation patterns on mobile devices.