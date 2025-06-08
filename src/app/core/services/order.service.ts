import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, OrderRequest } from '../../shared/models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;
  private adminApiUrl = `${environment.apiUrl}/admin/orders`;

  constructor(private http: HttpClient) {}

  // User methods
  placeOrder(orderData: OrderRequest): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, orderData);
  }

  getUserOrders(params?: { page?: number; limit?: number }): Observable<{ orders: Order[]; totalCount: number; totalPages: number }> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<{ orders: Order[]; totalCount: number; totalPages: number }>(this.apiUrl, { params: httpParams });
  }

  getOrderById(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${orderId}`);
  }

  requestRefund(orderId: string, data: { reason: string; items: { productId: string; quantity: number }[] }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${orderId}/refund-request`, data);
  }

  requestReplacement(orderId: string, data: { reason: string; items: { productId: string; quantity: number }[] }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${orderId}/replacement-request`, data);
  }

  getRequestStatus(requestId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/requests/${requestId}`);
  }

  // Admin methods
  getAllOrders(params?: { 
    page?: number; 
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Observable<{ orders: Order[]; totalCount: number; totalPages: number }> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
      if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
      if (params.search) httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<{ orders: Order[]; totalCount: number; totalPages: number }>(this.adminApiUrl, { params: httpParams });
  }

  updateOrderStatus(orderId: string, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.adminApiUrl}/${orderId}/status`, { status });
  }

  processRefundRequest(requestId: string, approved: boolean, note?: string): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/admin/requests/refund/${requestId}`, { approved, note });
  }

  processReplacementRequest(requestId: string, approved: boolean, note?: string): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/admin/requests/replacement/${requestId}`, { approved, note });
  }
}