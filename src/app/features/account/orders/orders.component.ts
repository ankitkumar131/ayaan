import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  constructor() {}

  ngOnInit(): void {
    // Simulate loading orders
    setTimeout(() => {
      this.isLoading = false;
      // For now, just use empty orders array
      // In a real app, you would call an order service here
    }, 1000);
  }
}