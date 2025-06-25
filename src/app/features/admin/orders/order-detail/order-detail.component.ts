import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { Order } from '../../../../shared/models/order.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = false;
  error: string | null = null;
  trackingNumber = '';
  updatingStatus = false;
  updatingTracking = false;

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    } else {
      this.error = 'Order ID not provided';
    }
  }

  loadOrder(id: string): void {
    this.loading = true;
    this.error = null;

    this.adminService.getOrderById(id)
      .pipe(
        catchError(err => {
          this.error = 'Failed to load order details. Please try again.';
          console.error('Error loading order:', err);
          return of(null);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(order => {
        this.order = order;
        if (order?.trackingNumber) {
          this.trackingNumber = order.trackingNumber;
        }
      });
  }

  updateOrderStatus(status: string): void {
    if (!this.order) return;
    
    this.updatingStatus = true;
    this.error = null;

    this.adminService.updateOrderStatus(this.order.id, status)
      .pipe(
        catchError(err => {
          this.error = 'Failed to update order status. Please try again.';
          console.error('Error updating order status:', err);
          return of(null);
        }),
        finalize(() => this.updatingStatus = false)
      )
      .subscribe(result => {
        if (result) {
          this.order = result;
        }
      });
  }

  updateTrackingInfo(): void {
    if (!this.order || !this.trackingNumber.trim()) return;
    
    this.updatingTracking = true;
    this.error = null;

    this.adminService.updateTrackingInfo(this.order.id, this.trackingNumber.trim())
      .pipe(
        catchError(err => {
          this.error = 'Failed to update tracking information. Please try again.';
          console.error('Error updating tracking info:', err);
          return of(null);
        }),
        finalize(() => this.updatingTracking = false)
      )
      .subscribe(result => {
        if (result) {
          this.order = result;
        }
      });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-warning text-dark';
      case 'processing':
        return 'bg-info text-dark';
      case 'shipped':
        return 'bg-primary';
      case 'delivered':
        return 'bg-success';
      case 'cancelled':
        return 'bg-danger';
      case 'refunded':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  }

  canUpdateStatus(currentStatus: string, newStatus: string): boolean {
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    
    // Special case for cancelled and refunded
    if (newStatus === 'cancelled') {
      return ['pending', 'processing'].includes(currentStatus);
    }
    
    if (newStatus === 'refunded') {
      return ['delivered', 'cancelled'].includes(currentStatus);
    }
    
    // For normal flow, check if new status is next in sequence
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(newStatus);
    
    return currentIndex !== -1 && newIndex !== -1 && newIndex === currentIndex + 1;
  }
}