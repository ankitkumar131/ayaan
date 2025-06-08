import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/interfaces/order.interface';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  styles: [`
    .orders-page {
      padding: 2rem;
      background-color: #f9fafb;
      min-height: calc(100vh - 4rem);
    }

    .orders-container {
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .alert.error {
      padding: 1rem;
      background-color: #fee2e2;
      color: #dc2626;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .order-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e5e7eb;
    }

    .order-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .order-id {
      font-weight: 500;
      color: #111827;
    }

    .order-date {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-badge.pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-badge.processing {
      background: #cce5ff;
      color: #004085;
    }

    .status-badge.shipped {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.delivered {
      background: #d1fae5;
      color: #059669;
    }

    .status-badge.cancelled {
      background: #f8d7da;
      color: #721c24;
    }

    .order-items {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .item-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }

    .item-image {
      width: 80px;
      height: 80px;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
    }

    .item-details {
      flex: 1;
    }

    .item-details h3 {
      margin: 0 0 0.5rem;
      color: #111827;
    }

    .item-meta {
      display: flex;
      gap: 1rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .color-dot {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      margin-right: 0.25rem;
      vertical-align: middle;
    }

    .item-price {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-top: 1px solid #e5e7eb;
    }

    .order-total {
      font-weight: 500;
    }

    .total-amount {
      font-size: 1.125rem;
      color: #111827;
      margin-left: 0.5rem;
    }

    .order-actions {
      display: flex;
      gap: 1rem;
    }

    .view-btn,
    .cancel-btn,
    .shop-btn {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
    }

    .view-btn {
      background: #3b82f6;
      color: white;
    }

    .cancel-btn {
      background: #ef4444;
      color: white;
      border: none;
    }

    .shop-btn {
      background: #10b981;
      color: white;
    }

    .no-orders {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .no-orders p {
      color: #6b7280;
      margin-bottom: 1rem;
    }

    .loading {
      text-align: center;
      color: #6b7280;
      padding: 2rem;
    }

    @media (max-width: 640px) {
      .order-header,
      .order-footer {
        flex-direction: column;
        gap: 1rem;
      }

      .order-actions {
        width: 100%;
      }

      .view-btn,
      .cancel-btn {
        flex: 1;
        text-align: center;
      }
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;
  error = '';

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = '';

    this.orderService.getUserOrders().subscribe({
      next: (orders: Order[]) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load orders';
        this.isLoading = false;
        console.error('Error loading orders:', err);
      }
    });
  }

  cancelOrder(order: Order): void {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    this.orderService.cancelOrder(order._id).subscribe({
      next: (updatedOrder) => {
        const index = this.orders.findIndex(o => o._id === updatedOrder._id);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
        }
      },
      error: (error) => {
        this.error = 'Failed to cancel order';
        console.error('Error cancelling order:', error);
      }
    });
  }
}
