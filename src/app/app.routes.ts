import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { map } from 'rxjs/operators';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        canActivate: [() => inject(AuthService).isNotAuthenticated()]
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
        canActivate: [() => inject(AuthService).isNotAuthenticated()]
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        canActivate: [() => inject(AuthService).isNotAuthenticated()]
      }
    ]
  },
  {
    path: 'products',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      }
    ]
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart-view/cart-view.component').then(m => m.CartViewComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout-form/checkout-form.component').then(m => m.CheckoutFormComponent),
    canActivate: [() => inject(AuthService).isAuthenticated()]
  },
  {
    path: 'user',
    canActivate: [() => inject(AuthService).isAuthenticated()],
    children: [
      {
        path: 'profile',
        loadComponent: () => import('./features/user/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/user/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/user/order-detail/order-detail.component').then(m => m.OrderDetailComponent)
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./features/user/wishlist/wishlist.component').then(m => m.WishlistComponent)
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [() => inject(AuthService).isAdmin()],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/admin/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/admin/categories/categories.component').then(m => m.CategoriesComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent)
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./features/shared/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
