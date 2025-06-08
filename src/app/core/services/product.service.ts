import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../../shared/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Observable<{ products: Product[]; totalCount: number; totalPages: number }> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.category) httpParams = httpParams.set('category', params.category);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
      if (params.minPrice) httpParams = httpParams.set('minPrice', params.minPrice.toString());
      if (params.maxPrice) httpParams = httpParams.set('maxPrice', params.maxPrice.toString());
    }

    return this.http.get<{ products: Product[]; totalCount: number; totalPages: number }>(this.apiUrl, { params: httpParams });
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  getFeaturedProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/featured`);
  }

  getNewArrivals(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/new-arrivals`);
  }

  getRelatedProducts(productId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/${productId}/related`);
  }

  // Admin methods
  createProduct(productData: FormData): Observable<Product> {
    return this.http.post<Product>(`${environment.apiUrl}/admin/products`, productData);
  }

  updateProduct(id: string, productData: FormData): Observable<Product> {
    return this.http.put<Product>(`${environment.apiUrl}/admin/products/${id}`, productData);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/admin/products/${id}`);
  }
}