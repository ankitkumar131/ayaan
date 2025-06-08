import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { UserProfile } from '../../../core/interfaces/auth.interface';
import { Cart } from '../../../core/interfaces/cart.interface';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="header-container">
        <div class="logo">
          <a routerLink="/">
            <h1>Fashion Store</h1>
          </a>
        </div>

        <nav class="nav-menu">
          <a routerLink="/products" routerLinkActive="active">Shop</a>
          <a routerLink="/categories" routerLinkActive="active">Categories</a>
          <a routerLink="/about" routerLinkActive="active">About</a>
          <a routerLink="/contact" routerLinkActive="active">Contact</a>
        </nav>

        <div class="header-actions">
          <div class="search-bar">
            <input 
              type="text" 
              placeholder="Search products..."
              (keyup.enter)="onSearch($event)"
            >
            <button class="search-btn">
              <i class="fas fa-search"></i>
            </button>
          </div>

          <div class="user-actions">
            <a routerLink="/cart" class="cart-icon">
              <i class="fas fa-shopping-cart"></i>
              <span class="cart-count" *ngIf="cartItemCount > 0">
                {{ cartItemCount }}
              </span>
            </a>

            <div class="user-menu" *ngIf="currentUser; else authButtons">
              <button class="user-btn" (click)="toggleUserDropdown()">
                <span>{{ currentUser.username }}</span>
                <i class="fas fa-chevron-down"></i>
              </button>

              <div class="dropdown-menu" *ngIf="showUserDropdown">
                <a routerLink="/user/profile">My Profile</a>
                <a routerLink="/user/orders">My Orders</a>
                <a routerLink="/user/wishlist">Wishlist</a>
                <ng-container *ngIf="isAdmin">
                  <div class="dropdown-divider"></div>
                  <a routerLink="/admin/dashboard">Admin Dashboard</a>
                  <a routerLink="/admin/products">Manage Products</a>
                  <a routerLink="/admin/orders">Manage Orders</a>
                </ng-container>
                <div class="dropdown-divider"></div>
                <button (click)="logout()">Sign Out</button>
              </div>
            </div>

            <ng-template #authButtons>
              <div class="auth-buttons">
                <a routerLink="/auth/login" class="login-btn">Sign In</a>
                <a routerLink="/auth/register" class="register-btn">Sign Up</a>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo a {
      text-decoration: none;
      color: #111827;
    }

    .logo h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .nav-menu {
      display: flex;
      gap: 2rem;
    }

    .nav-menu a {
      text-decoration: none;
      color: #4b5563;
      font-weight: 500;
      transition: color 0.15s ease-in-out;
    }

    .nav-menu a:hover,
    .nav-menu a.active {
      color: #3b82f6;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .search-bar {
      display: flex;
      align-items: center;
      background: #f3f4f6;
      border-radius: 4px;
      padding: 0.5rem;
    }

    .search-bar input {
      border: none;
      background: transparent;
      padding: 0.25rem 0.5rem;
      outline: none;
      min-width: 200px;
    }

    .search-btn {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 0.25rem;
    }

    .user-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .cart-icon {
      position: relative;
      color: #4b5563;
      text-decoration: none;
      padding: 0.5rem;
    }

    .cart-count {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ef4444;
      color: white;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 999px;
      min-width: 1.5rem;
      text-align: center;
    }

    .user-menu {
      position: relative;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: none;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      min-width: 200px;
      margin-top: 0.5rem;
    }

    .dropdown-menu a,
    .dropdown-menu button {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      text-align: left;
      color: #374151;
      text-decoration: none;
      transition: background-color 0.15s ease-in-out;
    }

    .dropdown-menu a:hover,
    .dropdown-menu button:hover {
      background-color: #f3f4f6;
    }

    .dropdown-menu button {
      border: none;
      background: none;
      cursor: pointer;
      font-size: 1rem;
    }

    .dropdown-divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 0.5rem 0;
    }

    .auth-buttons {
      display: flex;
      gap: 1rem;
    }

    .login-btn,
    .register-btn {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
    }

    .login-btn {
      color: #3b82f6;
      border: 1px solid #3b82f6;
    }

    .register-btn {
      background-color: #3b82f6;
      color: white;
    }

    @media (max-width: 768px) {
      .nav-menu {
        display: none;
      }

      .search-bar {
        display: none;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  currentUser: UserProfile | null = null;
  isAdmin = false;
  cartItemCount = 0;
  showUserDropdown = false;

  constructor(
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'admin';
    });

    this.cartService.cart$.subscribe((cart: Cart | null) => {
      this.cartItemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;
    });
  }

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  onSearch(event: Event): void {
    const searchQuery = (event.target as HTMLInputElement).value;
    // Implement search functionality
    console.log('Search query:', searchQuery);
  }

  logout(): void {
    this.authService.logout();
    this.showUserDropdown = false;
  }
}