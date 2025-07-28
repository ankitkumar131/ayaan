import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { User } from '../../core/interfaces/user.interface';
import { CartSummary } from '../../core/interfaces/cart.interface';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent],
  template: `
    <header class="header">
      <div class="container">
        <div class="header-content">
          <!-- Logo -->
          <div class="header-logo">
            <a routerLink="/" class="logo-link">
              <img src="/assets/images/logo.svg" alt="E-Commerce Store" class="logo-image" />
              <span class="logo-text">StyleHub</span>
            </a>
          </div>

          <!-- Navigation -->
          <nav class="header-nav desktop-only">
            <ul class="nav-list">
              <li class="nav-item">
                <a routerLink="/products" routerLinkActive="active" class="nav-link">
                  All Products
                </a>
              </li>
              <li class="nav-item">
                <a routerLink="/products/category/men" routerLinkActive="active" class="nav-link">
                  Men
                </a>
              </li>
              <li class="nav-item">
                <a routerLink="/products/category/women" routerLinkActive="active" class="nav-link">
                  Women
                </a>
              </li>
              <li class="nav-item">
                <a routerLink="/products/featured" routerLinkActive="active" class="nav-link">
                  Featured
                </a>
              </li>
              <li class="nav-item">
                <a routerLink="/products/sale" routerLinkActive="active" class="nav-link">
                  Sale
                </a>
              </li>
            </ul>
          </nav>

          <!-- Search Bar -->
          <div class="header-search desktop-only">
            <div class="search-container">
              <input 
                type="search" 
                placeholder="Search products..." 
                class="search-input"
                [(ngModel)]="searchQuery"
                (keyup.enter)="onSearch()"
              />
              <button class="search-button" (click)="onSearch()">
                🔍
              </button>
            </div>
          </div>

          <!-- User Actions -->
          <div class="header-actions">
            <!-- Cart -->
            <div class="cart-container">
              <a routerLink="/cart" class="cart-link">
                <span class="cart-icon">🛒</span>
                <span *ngIf="cartSummary.itemCount > 0" class="cart-badge">
                  {{ cartSummary.itemCount }}
                </span>
              </a>
            </div>

            <!-- User Menu -->
            <div class="user-menu" *ngIf="isAuthenticated; else guestActions">
              <div class="user-avatar" (click)="toggleUserMenu()">
                <img 
                  *ngIf="currentUser?.profile?.avatar; else avatarPlaceholder"
                  [src]="currentUser?.profile?.avatar" 
                  [alt]="getFullName()"
                  class="avatar-image"
                />
                <ng-template #avatarPlaceholder>
                  <span class="avatar-initials">{{ getInitials() }}</span>
                </ng-template>
              </div>

              <!-- User Dropdown -->
              <div class="user-dropdown" [class.show]="showUserMenu">
                <div class="user-info">
                  <div class="user-name">{{ getFullName() }}</div>
                  <div class="user-email">{{ currentUser?.email }}</div>
                </div>
                
                <div class="dropdown-divider"></div>
                
                <ul class="dropdown-menu">
                  <li><a routerLink="/account/profile" class="dropdown-link">Profile</a></li>
                  <li><a routerLink="/account/orders" class="dropdown-link">Orders</a></li>
                  <li><a routerLink="/account/wishlist" class="dropdown-link">Wishlist</a></li>
                  <li *ngIf="isAdmin">
                    <a routerLink="/admin/dashboard" class="dropdown-link">Admin Dashboard</a>
                  </li>
                  <li class="dropdown-divider"></li>
                  <li>
                    <button class="dropdown-link logout-btn" (click)="logout()">
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Guest Actions -->
            <ng-template #guestActions>
              <div class="guest-actions">
                <app-button 
                  variant="ghost" 
                  size="sm"
                  routerLink="/auth/login"
                >
                  Login
                </app-button>
                <app-button 
                  variant="primary" 
                  size="sm"
                  routerLink="/auth/register"
                >
                  Sign Up
                </app-button>
              </div>
            </ng-template>

            <!-- Mobile Menu Toggle -->
            <button class="mobile-menu-toggle mobile-only" (click)="toggleMobileMenu()">
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div class="mobile-menu" [class.show]="showMobileMenu">
          <div class="mobile-search">
            <input 
              type="search" 
              placeholder="Search products..." 
              class="search-input"
              [(ngModel)]="searchQuery"
              (keyup.enter)="onSearch()"
            />
          </div>

          <nav class="mobile-nav">
            <ul class="mobile-nav-list">
              <li><a routerLink="/products" (click)="closeMobileMenu()">All Products</a></li>
              <li><a routerLink="/products/category/men" (click)="closeMobileMenu()">Men</a></li>
              <li><a routerLink="/products/category/women" (click)="closeMobileMenu()">Women</a></li>
              <li><a routerLink="/products/featured" (click)="closeMobileMenu()">Featured</a></li>
              <li><a routerLink="/products/sale" (click)="closeMobileMenu()">Sale</a></li>
            </ul>
          </nav>

          <div class="mobile-user-actions" *ngIf="!isAuthenticated">
            <app-button 
              variant="outline" 
              [fullWidth]="true"
              routerLink="/auth/login"
              (click)="closeMobileMenu()"
            >
              Login
            </app-button>
            <app-button 
              variant="primary" 
              [fullWidth]="true"
              routerLink="/auth/register"
              (click)="closeMobileMenu()"
            >
              Sign Up
            </app-button>
          </div>
        </div>
      </div>
    </header>
  `,
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  isAuthenticated = false;
  isAdmin = false;
  cartSummary: CartSummary = { itemCount: 0, subtotal: 0, total: 0 };
  
  searchQuery = '';
  showUserMenu = false;
  showMobileMenu = false;

  constructor(
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
        this.isAdmin = user?.role === 'admin';
      });

    // Subscribe to cart state
    this.cartService.cartSummary$
      .pipe(takeUntil(this.destroy$))
      .subscribe(summary => {
        this.cartSummary = summary;
      });

    // Load initial cart data if authenticated
    if (this.isAuthenticated) {
      this.cartService.getCartSummary().subscribe();
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      // Navigate to search results
      // this.router.navigate(['/products'], { queryParams: { search: this.searchQuery } });
      console.log('Searching for:', this.searchQuery);
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showMobileMenu = false;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    this.showUserMenu = false;
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }

  logout(): void {
    this.authService.logout();
    this.showUserMenu = false;
  }

  getFullName(): string {
    if (!this.currentUser?.profile) return '';
    return `${this.currentUser.profile.firstName} ${this.currentUser.profile.lastName}`.trim();
  }

  getInitials(): string {
    if (!this.currentUser?.profile) return '';
    const firstName = this.currentUser.profile.firstName || '';
    const lastName = this.currentUser.profile.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  private onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Close user menu if clicking outside
    if (!target.closest('.user-menu')) {
      this.showUserMenu = false;
    }
    
    // Close mobile menu if clicking outside
    if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-toggle')) {
      this.showMobileMenu = false;
    }
  }
}