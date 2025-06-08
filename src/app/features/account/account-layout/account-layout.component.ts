import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './account-layout.component.html',
  styleUrls: ['./account-layout.component.scss']
})
export class AccountLayoutComponent {
  navLinks = [
    { path: '/account/profile', label: 'Profile', icon: 'person' },
    { path: '/account/orders', label: 'Orders', icon: 'shopping_bag' },
    { path: '/account/addresses', label: 'Addresses', icon: 'home' },
    { path: '/account/change-password', label: 'Change Password', icon: 'lock' }
  ];
}