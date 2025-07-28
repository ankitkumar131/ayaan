import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ProductService } from '../../../../core/services/product.service';
import { OrderService } from '../../../../core/services/order.service';
import { UserService } from '../../../../core/services/user.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  lowStockProducts: number;
  pendingOrders: number;
  newUsersThisMonth: number;
  revenueThisMonth: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  user: { name: string; email: string };
  total: number;
  status: string;
  createdAt: string;
}

interface TopProduct {
  _id: string;
  name: string;
  sales: number;
  revenue: number;
  image: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    ButtonComponent, 
    CardComponent, 
    LoadingComponent
  ],
  template: `
    <div class="admin-dashboard">
      <div class="container">
        <!-- Page Header -->
        <div class="page-header">
          <h1>Admin Dashboard</h1>
          <div class="header-actions">
            <app-button variant="outline" (click)="refreshData()">
              Refresh Data
            </app-button>
            <app-button variant="primary" routerLink="/admin/products">
              Manage Products
            </app-button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <app-loading type="skeleton"></app-loading>
        </div>

        <!-- Dashboard Content -->
        <div *ngIf="!loading" class="dashboard-content">
          <!-- Stats Cards -->
          <div class="stats-grid">
            <app-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon products">📦</div>
                <div class="stat-details">
                  <h3>{{ stats.totalProducts }}</h3>
                  <p>Total Products</p>
                  <span class="stat-change" [class.warning]="stats.lowStockProducts > 0">
                    {{ stats.lowStockProducts }} low stock
                  </span>
                </div>
              </div>
            </app-card>

            <app-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon orders">📋</div>
                <div class="stat-details">
                  <h3>{{ stats.totalOrders }}</h3>
                  <p>Total Orders</p>
                  <span class="stat-change" [class.warning]="stats.pendingOrders > 0">
                    {{ stats.pendingOrders }} pending
                  </span>
                </div>
              </div>
            </app-card>

            <app-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon users">👥</div>
                <div class="stat-details">
                  <h3>{{ stats.totalUsers }}</h3>
                  <p>Total Users</p>
                  <span class="stat-change positive">
                    +{{ stats.newUsersThisMonth }} this month
                  </span>
                </div>
              </div>
            </app-card>

            <app-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon revenue">💰</div>
                <div class="stat-details">
                  <h3>{{ formatPrice(stats.totalRevenue) }}</h3>
                  <p>Total Revenue</p>
                  <span class="stat-change positive">
                    {{ formatPrice(stats.revenueThisMonth) }} this month
                  </span>
                </div>
              </div>
            </app-card>
          </div>

          <!-- Charts and Analytics -->
          <div class="analytics-section">
            <div class="analytics-grid">
              <!-- Recent Orders -->
              <app-card class="analytics-card">
                <div class="card-header">
                  <h2>Recent Orders</h2>
                  <app-button variant="outline" size="sm" routerLink="/admin/orders">
                    View All
                  </app-button>
                </div>
                
                <div class="recent-orders">
                  <div *ngFor="let order of recentOrders" class="order-item">
                    <div class="order-info">
                      <div class="order-number">#{{ order.orderNumber }}</div>
                      <div class="order-customer">{{ order.user.name }}</div>
                      <div class="order-date">{{ formatDate(order.createdAt) }}</div>
                    </div>
                    <div class="order-details">
                      <div class="order-total">{{ formatPrice(order.total) }}</div>
                      <div class="order-status" [class]="getStatusClass(order.status)">
                        {{ order.status }}
                      </div>
                    </div>
                  </div>
                  
                  <div *ngIf="recentOrders.length === 0" class="no-data">
                    No recent orders found.
                  </div>
                </div>
              </app-card>

              <!-- Top Products -->
              <app-card class="analytics-card">
                <div class="card-header">
                  <h2>Top Selling Products</h2>
                  <app-button variant="outline" size="sm" routerLink="/admin/products">
                    Manage Products
                  </app-button>
                </div>
                
                <div class="top-products">
                  <div *ngFor="let product of topProducts" class="product-item">
                    <img 
                      [src]="product.image || '/assets/images/product-placeholder.jpg'" 
                      [alt]="product.name"
                      class="product-image"
                    />
                    <div class="product-info">
                      <div class="product-name">{{ product.name }}</div>
                      <div class="product-stats">
                        <span class="sales">{{ product.sales }} sold</span>
                        <span class="revenue">{{ formatPrice(product.revenue) }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div *ngIf="topProducts.length === 0" class="no-data">
                    No sales data available.
                  </div>
                </div>
              </app-card>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions-section">
            <app-card class="quick-actions-card">
              <h2>Quick Actions</h2>
              <div class="actions-grid">
                <app-button 
                  variant="primary" 
                  routerLink="/admin/products"
                  class="action-button"
                >
                  <span class="action-icon">📦</span>
                  <span class="action-text">
                    <strong>Manage Products</strong>
                    <small>Add, edit, or remove products</small>
                  </span>
                </app-button>

                <app-button 
                  variant="primary" 
                  routerLink="/admin/orders"
                  class="action-button"
                >
                  <span class="action-icon">📋</span>
                  <span class="action-text">
                    <strong>Process Orders</strong>
                    <small>View and manage customer orders</small>
                  </span>
                </app-button>

                <app-button 
                  variant="primary" 
                  routerLink="/admin/users"
                  class="action-button"
                >
                  <span class="action-icon">👥</span>
                  <span class="action-text">
                    <strong>Manage Users</strong>
                    <small>View and manage customer accounts</small>
                  </span>
                </app-button>

                <app-button 
                  variant="outline" 
                  (click)="exportData()"
                  class="action-button"
                >
                  <span class="action-icon">📊</span>
                  <span class="action-text">
                    <strong>Export Reports</strong>
                    <small>Download sales and analytics data</small>
                  </span>
                </app-button>
              </div>
            </app-card>
          </div>

          <!-- System Status -->
          <div class="system-status-section">
            <app-card class="system-status-card">
              <h2>System Status</h2>
              <div class="status-items">
                <div class="status-item">
                  <span class="status-indicator active"></span>
                  <span class="status-label">API Server</span>
                  <span class="status-value">Online</span>
                </div>
                <div class="status-item">
                  <span class="status-indicator active"></span>
                  <span class="status-label">Database</span>
                  <span class="status-value">Connected</span>
                </div>
                <div class="status-item">
                  <span class="status-indicator active"></span>
                  <span class="status-label">Payment Gateway</span>
                  <span class="status-value">Active</span>
                </div>
                <div class="status-item">
                  <span class="status-indicator warning"></span>
                  <span class="status-label">Email Service</span>
                  <span class="status-value">Limited</span>
                </div>
              </div>
            </app-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 2rem 0;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      padding: 1.5rem;
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-icon.products {
      background: #dbeafe;
    }

    .stat-icon.orders {
      background: #dcfce7;
    }

    .stat-icon.users {
      background: #fef3c7;
    }

    .stat-icon.revenue {
      background: #fce7f3;
    }

    .stat-details h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
    }

    .stat-details p {
      margin: 0 0 0.5rem 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .stat-change {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      background: #f3f4f6;
      color: #6b7280;
    }

    .stat-change.positive {
      background: #dcfce7;
      color: #16a34a;
    }

    .stat-change.warning {
      background: #fef3c7;
      color: #d97706;
    }

    .analytics-section {
      margin: 2rem 0;
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .analytics-card {
      padding: 1.5rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .card-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .recent-orders,
    .top-products {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 6px;
    }

    .order-number {
      font-weight: 600;
      color: #1f2937;
    }

    .order-customer {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .order-date {
      color: #9ca3af;
      font-size: 0.75rem;
    }

    .order-total {
      font-weight: 600;
      color: #1f2937;
    }

    .order-status {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;
    }

    .order-status.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .order-status.confirmed {
      background: #dbeafe;
      color: #2563eb;
    }

    .order-status.shipped {
      background: #dcfce7;
      color: #16a34a;
    }

    .order-status.delivered {
      background: #f0fdf4;
      color: #15803d;
    }

    .product-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 6px;
    }

    .product-image {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 6px;
    }

    .product-info {
      flex: 1;
    }

    .product-name {
      font-weight: 500;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .product-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
    }

    .sales {
      color: #6b7280;
    }

    .revenue {
      color: #16a34a;
      font-weight: 500;
    }

    .no-data {
      text-align: center;
      color: #6b7280;
      padding: 2rem;
      font-style: italic;
    }

    .quick-actions-card {
      padding: 1.5rem;
    }

    .quick-actions-card h2 {
      margin: 0 0 1.5rem 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      text-align: left;
      height: auto;
    }

    .action-icon {
      font-size: 1.5rem;
    }

    .action-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .action-text strong {
      font-weight: 600;
    }

    .action-text small {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .system-status-card {
      padding: 1.5rem;
    }

    .system-status-card h2 {
      margin: 0 0 1.5rem 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .status-items {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 6px;
    }

    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .status-indicator.active {
      background: #16a34a;
    }

    .status-indicator.warning {
      background: #d97706;
    }

    .status-indicator.error {
      background: #dc2626;
    }

    .status-label {
      flex: 1;
      font-weight: 500;
      color: #1f2937;
    }

    .status-value {
      font-size: 0.875rem;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }
      
      .header-actions {
        justify-content: center;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .analytics-grid {
        grid-template-columns: 1fr;
      }
      
      .actions-grid {
        grid-template-columns: 1fr;
      }
      
      .status-items {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  loading = true;
  
  stats: DashboardStats = {
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    newUsersThisMonth: 0,
    revenueThisMonth: 0
  };
  
  recentOrders: RecentOrder[] = [];
  topProducts: TopProduct[] = [];

  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Simulate loading dashboard data
    // In a real app, you'd make API calls to get this data
    setTimeout(() => {
      this.stats = {
        totalProducts: 156,
        totalOrders: 1247,
        totalUsers: 892,
        totalRevenue: 45678.90,
        lowStockProducts: 12,
        pendingOrders: 23,
        newUsersThisMonth: 67,
        revenueThisMonth: 8934.50
      };

      this.recentOrders = [
        {
          _id: '1',
          orderNumber: 'ORD-2024-001',
          user: { name: 'John Doe', email: 'john@example.com' },
          total: 129.99,
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          orderNumber: 'ORD-2024-002',
          user: { name: 'Jane Smith', email: 'jane@example.com' },
          total: 89.50,
          status: 'confirmed',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          _id: '3',
          orderNumber: 'ORD-2024-003',
          user: { name: 'Bob Johnson', email: 'bob@example.com' },
          total: 234.75,
          status: 'shipped',
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];

      this.topProducts = [
        {
          _id: '1',
          name: 'Premium T-Shirt',
          sales: 145,
          revenue: 2900,
          image: '/assets/images/product-placeholder.jpg'
        },
        {
          _id: '2',
          name: 'Designer Jeans',
          sales: 89,
          revenue: 4450,
          image: '/assets/images/product-placeholder.jpg'
        },
        {
          _id: '3',
          name: 'Casual Sneakers',
          sales: 67,
          revenue: 3350,
          image: '/assets/images/product-placeholder.jpg'
        }
      ];

      this.loading = false;
    }, 1000);
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  exportData(): void {
    alert('Export functionality would be implemented here. This would generate and download reports.');
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }
}