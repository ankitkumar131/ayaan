import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const cartRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent),
    canActivate: [authGuard]
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [authGuard]
  }
];