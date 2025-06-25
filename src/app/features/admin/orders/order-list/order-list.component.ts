import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { Order } from '../../../../shared/models/order.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  totalOrders = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;
  error: string | null = null;
  searchTerm = '';
  statusFilter = '';
  startDate: string | null = null;
  endDate: string | null = null;
  sortBy = 'createdAt';
  sortOrder = 'desc';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    const filters = {
      search: this.searchTerm || undefined,
      status: this.statusFilter || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    this.adminService.getAllOrders(this.currentPage, this.pageSize, filters)
      .pipe(
        catchError(err => {
          this.error = 'Failed to load orders. Please try again.';
          console.error('Error loading orders:', err);
          return of({ orders: [], total: 0 });
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(response => {
        this.orders = response.orders;
        this.totalOrders = response.total;
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadOrders();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  onDateFilterChange(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  onSortChange(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.loadOrders();
  }

  updateOrderStatus(orderId: string, status: string): void {
    this.adminService.updateOrderStatus(orderId, status)
      .pipe(
        catchError(err => {
          alert('Failed to update order status. Please try again.');
          console.error('Error updating order status:', err);
          return of(null);
        })
      )
      .subscribe(result => {
        if (result) {
          this.loadOrders();
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

  getSortIcon(column: string): string {
    if (this.sortBy !== column) {
      return 'fa-sort';
    }
    return this.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  get totalPages(): number {
    return Math.ceil(this.totalOrders / this.pageSize);
  }

  get pages(): number[] {
    const totalPages = this.totalPages;
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (this.currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }
    
    if (this.currentPage >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
    }
    
    return Array.from({ length: 5 }, (_, i) => this.currentPage - 2 + i);
  }
}