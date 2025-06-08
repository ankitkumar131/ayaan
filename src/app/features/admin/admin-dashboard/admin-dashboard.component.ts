import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';

interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  recentOrders: any[];
  lowStockProducts: any[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    recentOrders: [],
    lowStockProducts: []
  };

  constructor(
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    // Load orders
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.stats.totalOrders = orders.length;
        this.stats.totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        this.stats.recentOrders = orders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map(order => ({
            id: order._id,
            customerName: order.shippingAddress.fullName,
            total: order.total,
            status: order.status,
            date: order.createdAt
          }));
      },
      error: (error) => console.error('Error loading orders:', error)
    });

    // Load products
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.stats.totalProducts = response.products.length;
        this.stats.lowStockProducts = response.products
          .filter(product => product.stock < 10)
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 5);
      },
      error: (error) => console.error('Error loading products:', error)
    });
  }
}
