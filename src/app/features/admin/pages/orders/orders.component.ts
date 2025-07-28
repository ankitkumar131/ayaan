import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../../core/services/product.service';
import { Order } from '../../../../core/interfaces/order.interface';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule,
    ButtonComponent, 
    CardComponent, 
    LoadingComponent
  ],
  template: `
    <div class="admin-orders">
      <div class="container">
        <!-- Page Header -->
        <div class="page-header">
          <h1>Order Management</h1>
          <div class="header-actions">
            <app-button variant="outline" (click)="refreshOrders()">
              Refresh
            </app-button>
            <app-button variant="primary" (click)="exportOrders()">
              Export Orders
            </app-button>
          </div>
        </div>

        <!-- Filters -->
        <app-card class="filters-card">
          <form [formGroup]="filterForm" class="filters-form">
            <div class="filter-group">
              <label for="status">Status</label>
              <select id="status" formControlName="status" (change)="applyFilters()">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="dateRange">Date Range</label>
              <select id="dateRange" formControlName="dateRange" (change)="applyFilters()">
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="search">Search Orders</label>
              <input 
                id="search"
                type="text" 
                formControlName="search"
                placeholder="Order number, customer name..."
                (input)="onSearchChange()"
              />
            </div>

            <div class="filter-actions">
              <app-button type="button" variant="outline" size="sm" (click)="clearFilters()">
                Clear Filters
              </app-button>
            </div>
          </form>
        </app-card>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <app-loading type="skeleton"></app-loading>
        </div>

        <!-- Orders List -->
        <div *ngIf="!loading" class="orders-section">
          <div class="orders-header">
            <div class="results-info">
              Showing {{ orders.length }} of {{ totalOrders }} orders
            </div>
            <div class="view-options">
              <button 
                class="view-btn"
                [class.active]="viewMode === 'list'"
                (click)="viewMode = 'list'"
              >
                List View
              </button>
              <button 
                class="view-btn"
                [class.active]="viewMode === 'cards'"
                (click)="viewMode = 'cards'"
              >
                Card View
              </button>
            </div>
          </div>

          <!-- List View -->
          <div *ngIf="viewMode === 'list'" class="orders-table">
            <div class="table-header">
              <div class="col-order">Order</div>
              <div class="col-customer">Customer</div>
              <div class="col-date">Date</div>
              <div class="col-status">Status</div>
              <div class="col-total">Total</div>
              <div class="col-actions">Actions</div>
            </div>

            <div *ngFor="let order of orders" class="table-row">
              <div class="col-order">
                <div class="order-number">#{{ order.orderNumber }}</div>
                <div class="order-items">{{ getOrderItemsCount(order) }} items</div>
              </div>
              
              <div class="col-customer">
                <div class="customer-name">{{ getCustomerName(order) }}</div>
                <div class="customer-email">{{ getCustomerEmail(order) }}</div>
              </div>
              
              <div class="col-date">
                <div class="order-date">{{ formatDate(order.createdAt) }}</div>
                <div class="order-time">{{ formatTime(order.createdAt) }}</div>
              </div>
              
              <div class="col-status">
                <select 
                  [value]="order.status" 
                  (change)="updateOrderStatus(order, $event)"
                  class="status-select"
                  [class]="getStatusClass(order.status)"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              
              <div class="col-total">
                <div class="order-total">{{ formatPrice(order.pricing.total) }}</div>
                <div class="payment-status" [class]="order.payment.status">
                  {{ order.payment.status }}
                </div>
              </div>
              
              <div class="col-actions">
                <app-button variant="outline" size="sm" (click)="viewOrderDetails(order)">
                  View
                </app-button>
                <app-button 
                  variant="outline" 
                  size="sm" 
                  (click)="printOrder(order)"
                  *ngIf="order.status !== 'cancelled'"
                >
                  Print
                </app-button>
              </div>
            </div>
          </div>

          <!-- Card View -->
          <div *ngIf="viewMode === 'cards'" class="orders-grid">
            <app-card *ngFor="let order of orders" class="order-card">
              <div class="order-card-header">
                <div class="order-info">
                  <h3>#{{ order.orderNumber }}</h3>
                  <p>{{ formatDate(order.createdAt) }}</p>
                </div>
                <div class="order-status-badge" [class]="getStatusClass(order.status)">
                  {{ order.status }}
                </div>
              </div>

              <div class="order-card-content">
                <div class="customer-info">
                  <strong>{{ getCustomerName(order) }}</strong>
                  <span>{{ getCustomerEmail(order) }}</span>
                </div>

                <div class="order-summary">
                  <div class="summary-item">
                    <span>Items:</span>
                    <span>{{ getOrderItemsCount(order) }}</span>
                  </div>
                  <div class="summary-item">
                    <span>Total:</span>
                    <strong>{{ formatPrice(order.pricing.total) }}</strong>
                  </div>
                  <div class="summary-item">
                    <span>Payment:</span>
                    <span class="payment-status" [class]="order.payment.status">
                      {{ order.payment.status }}
                    </span>
                  </div>
                </div>

                <div class="order-items-preview">
                  <div *ngFor="let item of getOrderItems(order).slice(0, 2)" class="item-preview">
                    <img 
                      [src]="item.product.images[0]?.url || '/assets/images/product-placeholder.jpg'" 
                      [alt]="item.product.name"
                    />
                    <div class="item-info">
                      <span class="item-name">{{ item.product.name }}</span>
                      <span class="item-qty">x{{ item.quantity }}</span>
                    </div>
                  </div>
                  <div *ngIf="getOrderItems(order).length > 2" class="more-items">
                    +{{ getOrderItems(order).length - 2 }} more items
                  </div>
                </div>
              </div>

              <div class="order-card-actions">
                <app-button variant="outline" size="sm" (click)="viewOrderDetails(order)">
                  View Details
                </app-button>
                <select 
                  [value]="order.status" 
                  (change)="updateOrderStatus(order, $event)"
                  class="status-select-card"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </app-card>
          </div>

          <!-- Empty State -->
          <div *ngIf="orders.length === 0" class="empty-state">
            <h3>No orders found</h3>
            <p>No orders match your current filters.</p>
            <app-button variant="outline" (click)="clearFilters()">
              Clear Filters
            </app-button>
          </div>

          <!-- Pagination -->
          <div *ngIf="totalPages > 1" class="pagination">
            <app-button 
              variant="outline" 
              [disabled]="currentPage === 1"
              (click)="goToPage(currentPage - 1)"
            >
              Previous
            </app-button>
            
            <span class="page-info">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            
            <app-button 
              variant="outline" 
              [disabled]="currentPage === totalPages"
              (click)="goToPage(currentPage + 1)"
            >
              Next
            </app-button>
          </div>
        </div>

        <!-- Order Details Modal (would be a separate component in real app) -->
        <div *ngIf="selectedOrder" class="modal-overlay" (click)="closeOrderDetails()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Order Details - #{{ selectedOrder.orderNumber }}</h2>
              <button class="close-btn" (click)="closeOrderDetails()">×</button>
            </div>
            
            <div class="modal-body">
              <div class="order-details-grid">
                <div class="detail-section">
                  <h3>Customer Information</h3>
                  <p><strong>Name:</strong> {{ getCustomerName(selectedOrder) }}</p>
                  <p><strong>Email:</strong> {{ getCustomerEmail(selectedOrder) }}</p>
                  <p><strong>Phone:</strong> {{ selectedOrder.addresses.shipping.phone || 'N/A' }}</p>
                </div>

                <div class="detail-section">
                  <h3>Shipping Address</h3>
                  <p>{{ selectedOrder.addresses.shipping.address }}</p>
                  <p>{{ selectedOrder.addresses.shipping.city }}, {{ selectedOrder.addresses.shipping.state }} {{ selectedOrder.addresses.shipping.zipCode }}</p>
                  <p>{{ selectedOrder.addresses.shipping.country }}</p>
                </div>

                <div class="detail-section">
                  <h3>Order Items</h3>
                  <div class="order-items-detail">
                    <div *ngFor="let item of getOrderItems(selectedOrder)" class="item-detail">
                      <img 
                        [src]="item.product.images[0]?.url || '/assets/images/product-placeholder.jpg'" 
                        [alt]="item.product.name"
                      />
                      <div class="item-info">
                        <h4>{{ item.product.name }}</h4>
                        <p>Quantity: {{ item.quantity }}</p>
                        <p>Price: {{ formatPrice(item.price) }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="detail-section">
                  <h3>Order Summary</h3>
                  <div class="order-totals">
                    <div class="total-line">
                      <span>Subtotal:</span>
                      <span>{{ formatPrice(selectedOrder.pricing.subtotal) }}</span>
                    </div>
                    <div class="total-line">
                      <span>Shipping:</span>
                      <span>{{ formatPrice(selectedOrder.pricing.shipping) }}</span>
                    </div>
                    <div class="total-line">
                      <span>Tax:</span>
                      <span>{{ formatPrice(selectedOrder.pricing.tax) }}</span>
                    </div>
                    <div class="total-line total">
                      <span>Total:</span>
                      <span>{{ formatPrice(selectedOrder.pricing.total) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <app-button variant="outline" (click)="closeOrderDetails()">
                Close
              </app-button>
              <app-button variant="primary" (click)="printOrder(selectedOrder)">
                Print Order
              </app-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-orders {
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

    .filters-card {
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .filters-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .filter-group input,
    .filter-group select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .orders-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .results-info {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .view-options {
      display: flex;
      gap: 0.5rem;
    }

    .view-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .view-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .orders-table {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 2fr 1.5fr 1.5fr 1.5fr 2fr;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 2fr 1.5fr 1.5fr 1.5fr 2fr;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #f3f4f6;
      align-items: center;
    }

    .table-row:hover {
      background: #f9fafb;
    }

    .order-number {
      font-weight: 600;
      color: #1f2937;
    }

    .order-items {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .customer-name {
      font-weight: 500;
      color: #1f2937;
    }

    .customer-email {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .order-date {
      color: #1f2937;
    }

    .order-time {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .status-select {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      border: 1px solid #d1d5db;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-select.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .status-select.confirmed {
      background: #dbeafe;
      color: #2563eb;
    }

    .status-select.processing {
      background: #e0e7ff;
      color: #6366f1;
    }

    .status-select.shipped {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-select.delivered {
      background: #f0fdf4;
      color: #15803d;
    }

    .status-select.cancelled {
      background: #fef2f2;
      color: #dc2626;
    }

    .order-total {
      font-weight: 600;
      color: #1f2937;
    }

    .payment-status {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .payment-status.completed {
      background: #dcfce7;
      color: #16a34a;
    }

    .payment-status.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .payment-status.failed {
      background: #fef2f2;
      color: #dc2626;
    }

    .col-actions {
      display: flex;
      gap: 0.5rem;
    }

    .orders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .order-card {
      padding: 1.5rem;
    }

    .order-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .order-card-header h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .order-card-header p {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .order-status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;
    }

    .order-status-badge.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .order-status-badge.confirmed {
      background: #dbeafe;
      color: #2563eb;
    }

    .order-status-badge.shipped {
      background: #dcfce7;
      color: #16a34a;
    }

    .customer-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 1rem;
    }

    .customer-info strong {
      color: #1f2937;
    }

    .customer-info span {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .order-summary {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 6px;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .order-items-preview {
      margin-bottom: 1rem;
    }

    .item-preview {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .item-preview img {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .item-name {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .item-qty {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .more-items {
      font-size: 0.875rem;
      color: #6b7280;
      font-style: italic;
    }

    .order-card-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .status-select-card {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: #1f2937;
    }

    .empty-state p {
      margin: 0 0 2rem 0;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .page-info {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      width: 90%;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .order-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .detail-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
    }

    .detail-section p {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .order-items-detail {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .item-detail {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 6px;
    }

    .item-detail img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
    }

    .item-detail .item-info h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .item-detail .item-info p {
      margin: 0 0 0.25rem 0;
      font-size: 0.75rem;
    }

    .order-totals {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .total-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .total-line.total {
      font-weight: 600;
      font-size: 1rem;
      padding-top: 0.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
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
      
      .filters-form {
        grid-template-columns: 1fr;
      }
      
      .orders-table {
        overflow-x: auto;
      }
      
      .table-header,
      .table-row {
        grid-template-columns: 150px 150px 120px 120px 100px 150px;
        min-width: 800px;
      }
      
      .orders-grid {
        grid-template-columns: 1fr;
      }
      
      .order-details-grid {
        grid-template-columns: 1fr;
      }
      
      .modal-content {
        width: 95%;
        margin: 1rem;
      }
    }
  `]
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  selectedOrder: Order | null = null;
  loading = true;
  viewMode: 'list' | 'cards' = 'list';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalOrders = 0;
  pageSize = 20;
  
  filterForm: FormGroup;
  searchTimeout: any;

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private productService: ProductService
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      dateRange: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    
    // Simulate loading orders data
    setTimeout(() => {
      this.orders = this.generateMockOrders();
      this.totalOrders = this.orders.length;
      this.totalPages = Math.ceil(this.totalOrders / this.pageSize);
      this.loading = false;
    }, 1000);
  }

  private generateMockOrders(): Order[] {
    // Generate mock orders for demonstration
    const mockOrders: Order[] = [];
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const paymentStatuses = ['pending', 'completed', 'failed'];
    
    for (let i = 1; i <= 25; i++) {
      mockOrders.push({
        _id: `order-${i}`,
        orderNumber: `ORD-2024-${String(i).padStart(3, '0')}`,
        user: `user-${i}`,
        items: [
          {
            product: {
              _id: `product-${i}`,
              name: `Product ${i}`,
              images: [{ url: '/assets/images/product-placeholder.jpg', alt: `Product ${i}`, isPrimary: true }]
            } as any,
            quantity: Math.floor(Math.random() * 3) + 1,
            price: Math.floor(Math.random() * 100) + 20,
            total: Math.floor(Math.random() * 300) + 60,
            variant: null
          }
        ],
        pricing: {
          subtotal: Math.floor(Math.random() * 200) + 50,
          tax: Math.floor(Math.random() * 20) + 5,
          shipping: Math.floor(Math.random() * 15) + 5,
          discount: 0,
          total: Math.floor(Math.random() * 250) + 75
        },
        addresses: {
          shipping: {
            firstName: `Customer ${i}`,
            lastName: 'Doe',
            email: `customer${i}@example.com`,
            phone: '+1234567890',
            address: `${i} Main Street`,
            city: 'Anytown',
            state: 'CA',
            zipCode: '12345',
            country: 'US'
          } as any,
          billing: {
            firstName: `Customer ${i}`,
            lastName: 'Doe',
            email: `customer${i}@example.com`,
            phone: '+1234567890',
            address: `${i} Main Street`,
            city: 'Anytown',
            state: 'CA',
            zipCode: '12345',
            country: 'US'
          } as any
        },
        payment: {
          method: 'card',
          status: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)] as any,
          transactionId: `txn_${i}`,
          gateway: 'stripe'
        },
        shipping: {
          method: 'standard',
          carrier: 'UPS',
          trackingNumber: `1Z999AA1${String(i).padStart(8, '0')}`,
          estimatedDelivery: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        status: statuses[Math.floor(Math.random() * statuses.length)] as any,
        statusHistory: [],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return mockOrders;
  }

  refreshOrders(): void {
    this.loadOrders();
  }

  applyFilters(): void {
    // In a real app, this would filter the orders based on the form values
    console.log('Applying filters:', this.filterForm.value);
    this.loadOrders();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.loadOrders();
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 500);
  }

  updateOrderStatus(order: Order, event: any): void {
    const newStatus = event.target.value;
    order.status = newStatus;
    
    // In a real app, you'd call the API to update the order status
    console.log(`Updating order ${order.orderNumber} status to ${newStatus}`);
    alert(`Order ${order.orderNumber} status updated to ${newStatus}`);
  }

  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
  }

  closeOrderDetails(): void {
    this.selectedOrder = null;
  }

  printOrder(order: Order): void {
    alert(`Printing order ${order.orderNumber}...`);
    // In a real app, this would generate and print/download a PDF
  }

  exportOrders(): void {
    alert('Exporting orders to CSV...');
    // In a real app, this would generate and download a CSV file
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadOrders();
  }

  // Helper methods
  getOrderItemsCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  getCustomerName(order: Order): string {
    return `${order.addresses.shipping.firstName} ${order.addresses.shipping.lastName}`;
  }

  getCustomerEmail(order: Order): string {
    return order.addresses.shipping.email || 'N/A';
  }

  getOrderItems(order: Order): any[] {
    return order.items;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}