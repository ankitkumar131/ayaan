import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Product, 
  ProductsResponse, 
  ProductFilters, 
  CreateProductRequest 
} from '../interfaces/product.interface';

interface ColorData {
  name: string;
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_URL = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) {}

  getProducts(filters?: ProductFilters): Observable<ProductsResponse> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ProductsResponse>(this.API_URL, { params });
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/${id}`);
  }

  createProduct(data: CreateProductRequest | FormData): Observable<Product> {
    if (!(data instanceof FormData)) {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'images' && Array.isArray(value)) {
            (value as File[]).forEach((file: File) => {
              formData.append('images', file);
            });
          } else if (key === 'colors' && Array.isArray(value)) {
            (value as ColorData[]).forEach((color, index) => {
              formData.append(`colors[${index}][name]`, color.name);
              formData.append(`colors[${index}][code]`, color.code);
            });
          } else if (key === 'sizes' && Array.isArray(value)) {
            (value as string[]).forEach(size => {
              formData.append('sizes[]', size);
            });
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      return this.http.post<Product>(this.API_URL, formData);
    }
    
    return this.http.post<Product>(this.API_URL, data);
  }

  updateProduct(id: string, data: Partial<CreateProductRequest> | FormData): Observable<Product> {
    if (!(data instanceof FormData)) {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'images' && Array.isArray(value)) {
            (value as File[]).forEach((file: File) => {
              formData.append('images', file);
            });
          } else if (key === 'colors' && Array.isArray(value)) {
            (value as ColorData[]).forEach((color, index) => {
              formData.append(`colors[${index}][name]`, color.name);
              formData.append(`colors[${index}][code]`, color.code);
            });
          } else if (key === 'sizes' && Array.isArray(value)) {
            (value as string[]).forEach(size => {
              formData.append('sizes[]', size);
            });
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      return this.http.put<Product>(`${this.API_URL}/${id}`, formData);
    }
    
    return this.http.put<Product>(`${this.API_URL}/${id}`, data);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}