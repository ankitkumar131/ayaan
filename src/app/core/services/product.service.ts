import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { 
  Product, 
  ProductFilters, 
  ProductCreateRequest,
  Category 
} from '../interfaces/product.interface';
import { ApiResponse, PaginatedResponse } from '../interfaces/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public products$ = this.productsSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Product Management
  getProducts(filters?: ProductFilters): Observable<PaginatedResponse<Product>> {
    this.loadingSubject.next(true);
    const params = filters ? this.buildParams(filters) : undefined;
    
    return this.getPaginated<Product>('/products', params)
      .pipe(
        map(response => {
          this.loadingSubject.next(false);
          if (response.success && response.data) {
            this.productsSubject.next(response.data);
          }
          return response;
        })
      );
  }

  getProduct(id: string): Observable<ApiResponse<Product>> {
    return this.get<Product>(`/products/${id}`);
  }

  // Alias methods for backward compatibility
  getProductById(id: string): Observable<ApiResponse<Product>> {
    return this.getProduct(id);
  }

  getAllProducts(): Observable<ApiResponse<Product[]>> {
    return this.get<Product[]>('/products/all');
  }

  getAllCategories(): Observable<ApiResponse<Category[]>> {
    return this.getCategories();
  }

  getProductBySlug(slug: string): Observable<ApiResponse<Product>> {
    return this.get<Product>(`/products/slug/${slug}`);
  }

  getFeaturedProducts(limit: number = 8): Observable<ApiResponse<Product[]>> {
    const params = this.buildParams({ limit });
    return this.get<Product[]>('/products/featured', params);
  }

  getOnSaleProducts(limit: number = 8): Observable<ApiResponse<Product[]>> {
    const params = this.buildParams({ limit });
    return this.get<Product[]>('/products/on-sale', params);
  }

  searchProducts(query: string, filters?: ProductFilters): Observable<PaginatedResponse<Product>> {
    this.loadingSubject.next(true);
    const searchFilters = { ...filters, search: query };
    const params = this.buildParams(searchFilters);
    
    return this.getPaginated<Product>('/products/search', params)
      .pipe(
        map(response => {
          this.loadingSubject.next(false);
          return response;
        })
      );
  }

  getRelatedProducts(productId: string, limit: number = 4): Observable<ApiResponse<Product[]>> {
    const params = this.buildParams({ limit });
    return this.get<Product[]>(`/products/${productId}/related`, params);
  }

  // Admin Product Management
  createProduct(productData: ProductCreateRequest, images?: File[]): Observable<ApiResponse<Product>> {
    const formData = new FormData();
    
    // Append each field directly instead of wrapping in productData
    Object.keys(productData).forEach(key => {
      if (productData[key as keyof ProductCreateRequest] !== null && productData[key as keyof ProductCreateRequest] !== undefined) {
        const value = productData[key as keyof ProductCreateRequest];
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        formData.append(`images`, image);
      });
    }
    
    return this.post<Product>('/products', formData);
  }

  updateProduct(id: string, productData: Partial<ProductCreateRequest>, images?: File[]): Observable<ApiResponse<Product>> {
    const formData = new FormData();
    formData.append('productData', JSON.stringify(productData));
    
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        formData.append(`images`, image);
      });
    }
    
    return this.put<Product>(`/products/${id}`, formData);
  }

  deleteProduct(id: string): Observable<ApiResponse<any>> {
    return this.delete(`/products/${id}`);
  }

  // Category Management
  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.get<Category[]>('/categories')
      .pipe(
        map(response => {
          if (response.success && response.data) {
            this.categoriesSubject.next(response.data);
          }
          return response;
        })
      );
  }

  getCategory(id: string): Observable<ApiResponse<Category>> {
    return this.get<Category>(`/categories/${id}`);
  }

  getCategoryBySlug(slug: string): Observable<ApiResponse<Category>> {
    return this.get<Category>(`/categories/slug/${slug}`);
  }

  getMainCategories(): Observable<ApiResponse<Category[]>> {
    return this.get<Category[]>('/categories/main');
  }

  getFeaturedCategories(): Observable<ApiResponse<Category[]>> {
    return this.get<Category[]>('/categories/featured');
  }

  getCategoriesByGender(gender: 'men' | 'women'): Observable<ApiResponse<Category[]>> {
    return this.get<Category[]>(`/categories/gender/${gender}`);
  }

  getProductsByCategory(categoryId: string, filters?: ProductFilters): Observable<PaginatedResponse<Product>> {
    const params = filters ? this.buildParams(filters) : undefined;
    return this.getPaginated<Product>(`/categories/${categoryId}/products`, params);
  }

  // Admin Category Management
  createCategory(categoryData: any, image?: File): Observable<ApiResponse<Category>> {
    const formData = new FormData();
    
    // Append each field directly instead of wrapping in categoryData
    Object.keys(categoryData).forEach(key => {
      if (categoryData[key] !== null && categoryData[key] !== undefined) {
        formData.append(key, categoryData[key]);
      }
    });
    
    if (image) {
      formData.append('image', image);
    }
    
    return this.post<Category>('/categories', formData);
  }

  updateCategory(id: string, categoryData: any, image?: File): Observable<ApiResponse<Category>> {
    const formData = new FormData();
    formData.append('categoryData', JSON.stringify(categoryData));
    
    if (image) {
      formData.append('image', image);
    }
    
    return this.put<Category>(`/categories/${id}`, formData);
  }

  deleteCategory(id: string): Observable<ApiResponse<any>> {
    return this.delete(`/categories/${id}`);
  }

  // Utility Methods
  getCurrentProducts(): Product[] {
    return this.productsSubject.value;
  }

  getCurrentCategories(): Category[] {
    return this.categoriesSubject.value;
  }

  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  // Price Formatting
  formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  // Discount Calculation
  calculateDiscount(regularPrice: number, salePrice: number): number {
    if (!salePrice || salePrice >= regularPrice) return 0;
    return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
  }

  // Stock Status
  getStockStatus(product: Product, selectedVariant?: any): 'in-stock' | 'low-stock' | 'out-of-stock' {
    let stock = product.inventory.stock;
    
    if (selectedVariant) {
      const variant = product.variants.find(v => 
        v.size === selectedVariant.size && v.color.name === selectedVariant.color
      );
      stock = variant?.stock || 0;
    }
    
    if (stock === 0) return 'out-of-stock';
    if (stock <= product.inventory.lowStockThreshold) return 'low-stock';
    return 'in-stock';
  }
}