import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Home'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'account',
    loadChildren: () => import('./features/account/account.routes').then(m => m.accountRoutes),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
