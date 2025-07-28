import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { 
  Order, 
  CreateOrderRequest, 
  OrderFilters,
  OrderTracking,
  ReviewRequest,
  ReturnRequest,
  RefundRequest
} from '../interfaces/order.interface';
import { ApiResponse, PaginatedResponse } from '../interfaces/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class OrderService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  private ordersSubject = new BehaviorSubject<Order[]>([]);
  private currentOrderSubject = new BehaviorSubject<Order | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public orders$ = this.ordersSubject.asObservable();
  public currentOrder$ = this.currentOrderSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Order Management
  createOrder(orderData: CreateOrderRequest): Observable<ApiResponse<Order>> {
    this.loadingSubject.next(true);
    return this.post<Order>('/orders', orderData)
      .pipe(
        tap(response => {
          this.loadingSubject.next(false);
          if (response.success && response.data) {
            this.currentOrderSubject.next(response.data);
            this.addOrderToList(response.data);
          }
        })
      );
  }

  getOrders(filters?: OrderFilters): Observable<PaginatedResponse<Order>> {
    this.loadingSubject.next(true);
    const params = filters ? this.buildParams(filters) : undefined;
    
    return this.getPaginated<Order>('/orders', params)
      .pipe(
        map(response => {
          this.loadingSubject.next(false);
          if (response.success && response.data) {
            this.ordersSubject.next(response.data);
          }
          return response;
        })
      );
  }

  getOrder(orderId: string): Observable<ApiResponse<Order>> {
    return this.get<Order>(`/orders/${orderId}`)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.currentOrderSubject.next(response.data);
          }
        })
      );
  }

  trackOrder(orderId: string): Observable<ApiResponse<OrderTracking>> {
    return this.get<OrderTracking>(`/orders/${orderId}/track`);
  }

  cancelOrder(orderId: string, reason?: string): Observable<ApiResponse<Order>> {
    const data = reason ? { reason } : {};
    return this.post<Order>(`/orders/${orderId}/cancel`, data)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateOrderInList(response.data);
          }
        })
      );
  }

  // Review Management
  submitReview(orderId: string, reviewData: ReviewRequest): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('productId', reviewData.productId);
    formData.append('rating', reviewData.rating.toString());
    formData.append('comment', reviewData.comment);
    
    if (reviewData.title) {
      formData.append('title', reviewData.title);
    }
    
    if (reviewData.images && reviewData.images.length > 0) {
      reviewData.images.forEach((image, index) => {
        formData.append('images', image);
      });
    }
    
    return this.post(`/orders/${orderId}/review`, formData);
  }

  // Return and Refund Management
  requestReplacement(orderId: string, returnData: ReturnRequest): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('reason', returnData.reason);
    formData.append('items', JSON.stringify(returnData.items));
    
    if (returnData.description) {
      formData.append('description', returnData.description);
    }
    
    if (returnData.images && returnData.images.length > 0) {
      returnData.images.forEach((image, index) => {
        formData.append('images', image);
      });
    }
    
    return this.post(`/orders/${orderId}/replacement`, formData);
  }

  requestRefund(orderId: string, refundData: RefundRequest): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('reason', refundData.reason);
    formData.append('items', JSON.stringify(refundData.items));
    
    if (refundData.description) {
      formData.append('description', refundData.description);
    }
    
    if (refundData.bankDetails) {
      formData.append('bankDetails', JSON.stringify(refundData.bankDetails));
    }
    
    if (refundData.images && refundData.images.length > 0) {
      refundData.images.forEach((image, index) => {
        formData.append('images', image);
      });
    }
    
    return this.post(`/orders/${orderId}/refund`, formData);
  }

  getReturnRequests(orderId: string): Observable<ApiResponse<any[]>> {
    return this.get<any[]>(`/orders/${orderId}/requests`);
  }

  // Admin Order Management
  getAllOrders(filters?: OrderFilters): Observable<PaginatedResponse<Order>> {
    this.loadingSubject.next(true);
    const params = filters ? this.buildParams(filters) : undefined;
    
    return this.getPaginated<Order>('/admin/orders', params)
      .pipe(
        map(response => {
          this.loadingSubject.next(false);
          return response;
        })
      );
  }

  updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Observable<ApiResponse<Order>> {
    const data: any = { status };
    if (trackingNumber) {
      data.trackingNumber = trackingNumber;
    }
    
    return this.put<Order>(`/admin/orders/${orderId}/status`, data)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateOrderInList(response.data);
          }
        })
      );
  }

  // State Management
  private addOrderToList(order: Order): void {
    const currentOrders = this.ordersSubject.value;
    this.ordersSubject.next([order, ...currentOrders]);
  }

  private updateOrderInList(updatedOrder: Order): void {
    const currentOrders = this.ordersSubject.value;
    const index = currentOrders.findIndex(order => order._id === updatedOrder._id);
    
    if (index !== -1) {
      const newOrders = [...currentOrders];
      newOrders[index] = updatedOrder;
      this.ordersSubject.next(newOrders);
    }
    
    // Update current order if it matches
    const currentOrder = this.currentOrderSubject.value;
    if (currentOrder && currentOrder._id === updatedOrder._id) {
      this.currentOrderSubject.next(updatedOrder);
    }
  }

  // Getters
  getCurrentOrders(): Order[] {
    return this.ordersSubject.value;
  }

  getCurrentOrder(): Order | null {
    return this.currentOrderSubject.value;
  }

  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  // Utility Methods
  getOrderStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'pending': '#f59e0b',
      'confirmed': '#3b82f6',
      'processing': '#8b5cf6',
      'shipped': '#06b6d4',
      'delivered': '#10b981',
      'cancelled': '#ef4444',
      'refunded': '#6b7280'
    };
    return statusColors[status] || '#6b7280';
  }

  getOrderStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'refunded': 'Refunded'
    };
    return statusTexts[status] || status;
  }

  canCancelOrder(order: Order): boolean {
    return ['pending', 'confirmed'].includes(order.status);
  }

  canTrackOrder(order: Order): boolean {
    return ['shipped', 'delivered'].includes(order.status) && !!order.shipping.trackingNumber;
  }

  canReviewOrder(order: Order): boolean {
    return order.status === 'delivered';
  }

  canReturnOrder(order: Order): boolean {
    if (order.status !== 'delivered') return false;
    
    // Check if order is within return window (e.g., 30 days)
    const deliveryDate = new Date(order.shipping.actualDelivery || order.updatedAt);
    const returnWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const now = new Date();
    
    return (now.getTime() - deliveryDate.getTime()) <= returnWindow;
  }

  // Price Formatting
  formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  // Date Formatting
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}