import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/interfaces/order.interface';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.scss']
})
export class OrderManagementComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  searchQuery = '';
  selectedStatus = '';
  isLoading = false;
  error = '';
  successMessage = '';
  selectedOrder: Order | null = null;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = '';

    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.filteredOrders = orders;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load orders. Please try again.';
        console.error('Error loading orders:', err);
        this.isLoading = false;
      }
    });
  }

  filterOrders(): void {
    let filtered = [...this.orders];

    if (this.selectedStatus) {
      filtered = filtered.filter(o => o.status === this.selectedStatus);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(o => 
        o._id.toLowerCase().includes(query) ||
        o.shippingAddress.fullName.toLowerCase().includes(query)
      );
    }

    this.filteredOrders = filtered;
  }

  updateOrderStatus(order: Order): void {
    this.isLoading = true;
    this.error = '';
    this.successMessage = '';

    this.orderService.updateOrderStatus(order._id, order.status).subscribe({
      next: (updatedOrder) => {
        this.successMessage = `Order ${order._id} status updated to ${order.status}`;
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = 'Failed to update order status. Please try again.';
        console.error('Error updating order status:', err);
        this.isLoading = false;
      }
    });
  }

  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
  }

  closeOrderDetails(): void {
    this.selectedOrder = null;
  }
}
