import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-feature-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="feature-nav">
      <h2>Available Features</h2>
      <div class="feature-sections">
        
        <!-- Authentication -->
        <div class="feature-section">
          <h3>Authentication</h3>
          <div class="feature-links">
            <a routerLink="/auth/login" class="nav-link">Login</a>
            <a routerLink="/auth/register" class="nav-link">Register</a>
            <a routerLink="/auth/admin-login" class="nav-link">Admin Login</a>
            <a routerLink="/auth/forgot-password" class="nav-link">Forgot Password</a>
            <a routerLink="/auth/reset-password" class="nav-link">Reset Password</a>
          </div>
        </div>

        <!-- Shopping -->
        <div class="feature-section">
          <h3>Shopping</h3>
          <div class="feature-links">
            <a routerLink="/products" class="nav-link">All Products</a>
            <a routerLink="/products/featured" class="nav-link">Featured Products</a>
            <a routerLink="/cart" class="nav-link">Shopping Cart</a>
            <a routerLink="/cart/checkout" class="nav-link">Checkout</a>
          </div>
        </div>

        <!-- Admin Panel -->
        <div class="feature-section">
          <h3>Admin Panel</h3>
          <div class="feature-links">
            <a routerLink="/admin/dashboard" class="nav-link">Dashboard</a>
            <a routerLink="/admin/products" class="nav-link">Manage Products</a>
            <a routerLink="/admin/orders" class="nav-link">Manage Orders</a>
            <a routerLink="/admin/users" class="nav-link">Manage Users</a>
          </div>
        </div>

        <!-- User Account -->
        <div class="feature-section">
          <h3>User Account</h3>
          <div class="feature-links">
            <a routerLink="/account" class="nav-link">My Account</a>
            <a routerLink="/account/orders" class="nav-link">Order History</a>
            <a routerLink="/account/profile" class="nav-link">Profile Settings</a>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .feature-nav {
      padding: 2rem;
      background: #f8fafc;
      border-radius: 12px;
      margin: 2rem 0;
      border: 1px solid #e2e8f0;
    }
    
    h2 {
      margin-bottom: 2rem;
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 600;
      text-align: center;
    }
    
    .feature-sections {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }
    
    .feature-section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .feature-section h3 {
      margin: 0 0 1rem 0;
      color: #1e293b;
      font-size: 1.125rem;
      font-weight: 600;
      text-align: center;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .feature-links {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .nav-link {
      display: block;
      padding: 0.75rem 1rem;
      background: #f9fafb;
      color: #374151;
      text-decoration: none;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      text-align: center;
      font-weight: 500;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }
    
    .nav-link:hover {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }
    
    @media (max-width: 768px) {
      .feature-sections {
        grid-template-columns: 1fr;
      }
      
      .feature-nav {
        padding: 1.5rem;
      }
    }
  `]
})
export class FeatureNavigationComponent {}