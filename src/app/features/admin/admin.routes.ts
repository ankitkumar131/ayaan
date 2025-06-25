import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard],
    title: 'Admin Dashboard'
  },
  {
    path: 'admins',
    loadComponent: () => import('./admins/admin-list.component').then(m => m.AdminListComponent),
    canActivate: [adminGuard],
    title: 'Admin Management'
  },
  {
    path: 'products',
    loadComponent: () => import('./products/product-list/product-list.component').then(m => m.ProductListComponent),
    canActivate: [adminGuard],
    title: 'Product Management'
  },
  {
    path: 'products/add',
    loadComponent: () => import('./products/product-form/product-form.component').then(m => m.ProductFormComponent),
    canActivate: [adminGuard],
    title: 'Add Product'
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./products/product-form/product-form.component').then(m => m.ProductFormComponent),
    canActivate: [adminGuard],
    title: 'Edit Product'
  },
  {
    path: 'categories',
    loadComponent: () => import('./categories/category-management/category-management.component').then(m => m.CategoryManagementComponent),
    canActivate: [adminGuard],
    title: 'Category Management'
  },
  {
    path: 'orders',
    loadComponent: () => import('./orders/order-list/order-list.component').then(m => m.OrderListComponent),
    canActivate: [adminGuard],
    title: 'Order Management'
  },
  {
    path: 'orders/:id',
    loadComponent: () => import('./orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
    canActivate: [adminGuard],
    title: 'Order Details'
  },
  {
    path: 'users',
    loadComponent: () => import('./users/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [adminGuard],
    title: 'User Management'
  },
  {
    path: 'promotions',
    loadComponent: () => import('./promotions/promotion-management/promotion-management.component').then(m => m.PromotionManagementComponent),
    canActivate: [adminGuard],
    title: 'Promotion Management'
  }
];