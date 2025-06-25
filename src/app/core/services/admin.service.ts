import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user.model';
import { Product } from '../../shared/models/product.model';
import { Order, RefundRequest, ReplacementRequest } from '../../shared/models/order.model';
import { Promotion } from '../../shared/models/promotion.model';
import { Category } from '../../shared/models/category.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) { }

  // User Management
  getAllAdmins(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/admins`);
  }

  getAdminById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  getAllUsers(page: number = 1, limit: number = 10): Observable<{users: User[], total: number}> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<{users: User[], total: number}>(`${this.apiUrl}/users`, { params });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  updateUserStatus(id: string, status: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}/status`, { status });
  }

  updateUserRole(id: string, role: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}/role`, { role });
  }

  // Product Management
  getAllProducts(page: number = 1, limit: number = 10, filters?: any): Observable<{products: Product[], total: number}> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    }
    
    return this.http.get<{products: Product[], total: number}>(`${this.apiUrl}/products`, { params });
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    // Make a copy of the product to avoid modifying the original
    const productToSend = { ...product };
    
    // Handle the category property for the API
    if (productToSend.category) {
      // If category is an object with an id property
      if (typeof productToSend.category === 'object' && productToSend.category.id) {
        // Create a new object without modifying the original productToSend
        const apiProduct = { 
          ...productToSend,
          // Send only the category ID as a string to the API
          category: productToSend.category.id 
        };
        return this.http.post<Product>(`${this.apiUrl}/products`, apiProduct);
      }
    }
    
    // If no category or category is already a string
    return this.http.post<Product>(`${this.apiUrl}/products`, productToSend);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    // Make a copy of the product to avoid modifying the original
    const productToSend = { ...product };
    
    // Handle the category property for the API
    if (productToSend.category) {
      // If category is an object with an id property
      if (typeof productToSend.category === 'object' && productToSend.category.id) {
        // Create a new object without modifying the original productToSend
        const apiProduct = { 
          ...productToSend,
          // Send only the category ID as a string to the API
          category: productToSend.category.id 
        };
        return this.http.put<Product>(`${this.apiUrl}/products/${id}`, apiProduct);
      }
    }
    
    // If no category or category is already a string
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, productToSend);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }

  uploadProductImage(id: string, formData: FormData): Observable<{imageUrl: string}> {
    return this.http.post<{imageUrl: string}>(`${this.apiUrl}/products/${id}/images`, formData);
  }

  // Category Management
  getAllCategories(): Observable<Category[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`).pipe(
      map((categories: any[]) => categories.map((c: any) => ({
        id: c._id,  // Map backend's _id to frontend's id
        name: c.name,
        description: c.description,
        // ... other fields
      })))
    );
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, category);
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, category);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }

  // Order Management
  getAllOrders(page: number = 1, limit: number = 10, filters?: any): Observable<{orders: Order[], total: number}> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    }
    
    return this.http.get<{orders: Order[], total: number}>(`${this.apiUrl}/orders`, { params });
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`);
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/orders/${id}/status`, { status });
  }

  updateTrackingInfo(id: string, trackingNumber: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/orders/${id}/tracking`, { trackingNumber });
  }

  // Refund and Replacement Requests
  getAllRefundRequests(page: number = 1, limit: number = 10): Observable<{refunds: RefundRequest[], total: number}> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<{refunds: RefundRequest[], total: number}>(`${this.apiUrl}/refunds`, { params });
  }

  getRefundRequestById(id: string): Observable<RefundRequest> {
    return this.http.get<RefundRequest>(`${this.apiUrl}/refunds/${id}`);
  }

  updateRefundStatus(id: string, status: string, note?: string): Observable<RefundRequest> {
    return this.http.patch<RefundRequest>(`${this.apiUrl}/refunds/${id}/status`, { status, note });
  }

  getAllReplacementRequests(page: number = 1, limit: number = 10): Observable<{replacements: ReplacementRequest[], total: number}> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<{replacements: ReplacementRequest[], total: number}>(`${this.apiUrl}/replacements`, { params });
  }

  getReplacementRequestById(id: string): Observable<ReplacementRequest> {
    return this.http.get<ReplacementRequest>(`${this.apiUrl}/replacements/${id}`);
  }

  updateReplacementStatus(id: string, status: string, note?: string): Observable<ReplacementRequest> {
    return this.http.patch<ReplacementRequest>(`${this.apiUrl}/replacements/${id}/status`, { status, note });
  }

  // Promotion Management
  getAllPromotions(page: number = 1, limit: number = 10): Observable<{promotions: Promotion[], total: number}> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<{promotions: Promotion[], total: number}>(`${this.apiUrl}/promotions`, { params });
  }

  getPromotionById(id: string): Observable<Promotion> {
    return this.http.get<Promotion>(`${this.apiUrl}/promotions/${id}`);
  }

  createPromotion(promotion: Partial<Promotion>): Observable<Promotion> {
    // Map frontend field names to backend field names
    const backendPromotion = {
      code: promotion.code,
      type: promotion.discountType,
      value: promotion.discountValue,
      description: promotion.description,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      minimumPurchase: promotion.minPurchase,
      maximumDiscount: promotion.maxDiscount,
      usageLimit: promotion.usageLimit,
      applicableProducts: promotion.applicableProducts,
      applicableCategories: promotion.applicableCategories,
      isActive: promotion.isActive
    };
    
    return this.http.post<Promotion>(`${this.apiUrl}/promotions`, backendPromotion);
  }

  updatePromotion(id: string, promotion: Partial<Promotion>): Observable<Promotion> {
    return this.http.put<Promotion>(`${this.apiUrl}/promotions/${id}`, promotion);
  }

  deletePromotion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/promotions/${id}`);
  }

  // Dashboard Statistics
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/stats`);
  }

  getRecentOrders(limit: number = 5): Observable<Order[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Order[]>(`${this.apiUrl}/dashboard/recent-orders`, { params });
  }

  getTopSellingProducts(limit: number = 5): Observable<Product[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Product[]>(`${this.apiUrl}/dashboard/top-products`, { params });
  }
}