import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/interfaces/order.interface';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  searchQuery = '';
  selectedStatus = '';
  error = '';
  successMessage = '';
  isLoading = false;

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
      error: (error) => {
        this.error = 'Failed to load orders';
        this.isLoading = false;
        console.error('Error loading orders:', error);
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
        o.shippingAddress.addressLine1.toLowerCase().includes(query) ||
        o.shippingAddress.fullName.toLowerCase().includes(query)
      );
    }

    this.filteredOrders = filtered;
  }

  updateOrderStatus(order: Order, newStatus: Order['status']): void {
    this.isLoading = true;
    this.error = '';
    this.successMessage = '';

    this.orderService.updateOrderStatus(order._id, newStatus).subscribe({
      next: () => {
        order.status = newStatus;
        this.successMessage = `Order ${order._id} status updated to ${newStatus}`;
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.error = 'Failed to update order status';
        this.isLoading = false;
        console.error('Error updating order status:', error);
      }
    });
  }
}
