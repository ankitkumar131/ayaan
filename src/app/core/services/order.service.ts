import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../interfaces/order.interface';

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentDetails: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly API_URL = 'http://localhost:3000/api/orders';

  constructor(private http: HttpClient) {}

  createOrder(data: CreateOrderRequest): Observable<{ orderId: string }> {
    return this.http.post<{ orderId: string }>(this.API_URL, data);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.API_URL}/${id}`);
  }

  getUserOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/user`);
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/admin`);
  }

  updateOrderStatus(orderId: string, status: Order['status']): Observable<Order> {
    return this.http.patch<Order>(`${this.API_URL}/${orderId}/status`, { status });
  }

  cancelOrder(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.API_URL}/${id}/cancel`, {});
  }
} 