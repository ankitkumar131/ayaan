import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  currentAdmin: User | null = null;

  // Dashboard statistics
  stats = {
    totalUsers: 0,
    totalAdmins: 0,
    totalOrders: 0,
    totalProducts: 0,
    recentActivity: [] as Array<{type: string, message: string, timestamp: Date}>
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentAdmin = this.authService.getCurrentUser();
    
    // In a real application, you would fetch these statistics from your backend
    // For now, we'll use placeholder data
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Simulate loading dashboard data
    // In a real application, this would be an API call
    setTimeout(() => {
      this.stats = {
        totalUsers: 120,
        totalAdmins: 3,
        totalOrders: 250,
        totalProducts: 75,
        recentActivity: [
          { type: 'user_registered', message: 'New user registered', timestamp: new Date(Date.now() - 3600000) },
          { type: 'order_placed', message: 'New order placed', timestamp: new Date(Date.now() - 7200000) },
          { type: 'product_added', message: 'New product added', timestamp: new Date(Date.now() - 10800000) }
        ]
      };
    }, 500);
  }
}