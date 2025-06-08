import { Routes } from '@angular/router';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { AccountLayoutComponent } from './account-layout/account-layout.component';

export const accountRoutes: Routes = [
  {
    path: '',
    component: AccountLayoutComponent,
    children: [
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./orders/orders.component').then(m => m.OrdersComponent),
      },
      {
        path: 'addresses',
        loadComponent: () => import('./addresses/addresses.component').then(m => m.AddressesComponent),
      },
      {
        path: 'change-password',
        component: ChangePasswordComponent,
      },
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      }
    ]
  }
];