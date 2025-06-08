import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Review } from '../../shared/models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  getProductReviews(productId: string, params?: { 
    page?: number; 
    limit?: number;
    sort?: 'newest' | 'highest' | 'lowest';
  }): Observable<{ reviews: Review[]; totalCount: number; totalPages: number }> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
    }

    return this.http.get<{ reviews: Review[]; totalCount: number; totalPages: number }>(`${this.apiUrl}/product/${productId}`, { params: httpParams });
  }

  getUserReviews(params?: { 
    page?: number; 
    limit?: number;
  }): Observable<{ reviews: Review[]; totalCount: number; totalPages: number }> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<{ reviews: Review[]; totalCount: number; totalPages: number }>(`${this.apiUrl}/user`, { params: httpParams });
  }

  addReview(productId: string, reviewData: { rating: number; comment: string; images?: File[] }): Observable<Review> {
    const formData = new FormData();
    formData.append('rating', reviewData.rating.toString());
    formData.append('comment', reviewData.comment);
    
    if (reviewData.images && reviewData.images.length > 0) {
      reviewData.images.forEach((image, index) => {
        formData.append('images', image);
      });
    }

    return this.http.post<Review>(`${this.apiUrl}/product/${productId}`, formData);
  }

  updateReview(reviewId: string, reviewData: { rating?: number; comment?: string; images?: File[] }): Observable<Review> {
    const formData = new FormData();
    
    if (reviewData.rating !== undefined) {
      formData.append('rating', reviewData.rating.toString());
    }
    
    if (reviewData.comment !== undefined) {
      formData.append('comment', reviewData.comment);
    }
    
    if (reviewData.images && reviewData.images.length > 0) {
      reviewData.images.forEach((image, index) => {
        formData.append('images', image);
      });
    }

    return this.http.put<Review>(`${this.apiUrl}/${reviewId}`, formData);
  }

  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${reviewId}`);
  }

  // Admin methods
  getAllReviews(params?: { 
    page?: number; 
    limit?: number;
    productId?: string;
    userId?: string;
    minRating?: number;
    maxRating?: number;
  }): Observable<{ reviews: Review[]; totalCount: number; totalPages: number }> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.productId) httpParams = httpParams.set('productId', params.productId);
      if (params.userId) httpParams = httpParams.set('userId', params.userId);
      if (params.minRating) httpParams = httpParams.set('minRating', params.minRating.toString());
      if (params.maxRating) httpParams = httpParams.set('maxRating', params.maxRating.toString());
    }

    return this.http.get<{ reviews: Review[]; totalCount: number; totalPages: number }>(`${environment.apiUrl}/admin/reviews`, { params: httpParams });
  }

  approveReview(reviewId: string): Observable<Review> {
    return this.http.patch<Review>(`${environment.apiUrl}/admin/reviews/${reviewId}/approve`, {});
  }

  rejectReview(reviewId: string, reason: string): Observable<Review> {
    return this.http.patch<Review>(`${environment.apiUrl}/admin/reviews/${reviewId}/reject`, { reason });
  }
}