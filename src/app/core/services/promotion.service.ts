import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Promotion } from '../../shared/models/promotion.model';

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private apiUrl = `${environment.apiUrl}/promotions`;
  private adminApiUrl = `${environment.apiUrl}/admin/promotions`;

  constructor(private http: HttpClient) {}

  // Public methods
  getActivePromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.apiUrl}/active`);
  }

  validatePromoCode(code: string): Observable<{ valid: boolean; discount?: number; message?: string }> {
    return this.http.post<{ valid: boolean; discount?: number; message?: string }>(`${this.apiUrl}/validate`, { code });
  }

  // Admin methods
  getAllPromotions(params?: { 
    page?: number; 
    limit?: number;
    status?: 'active' | 'inactive' | 'expired';
    search?: string;
  }): Observable<{ promotions: Promotion[]; totalCount: number; totalPages: number }> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.search) httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<{ promotions: Promotion[]; totalCount: number; totalPages: number }>(this.adminApiUrl, { params: httpParams });
  }

  getPromotionById(id: string): Observable<Promotion> {
    return this.http.get<Promotion>(`${this.adminApiUrl}/${id}`);
  }

  createPromotion(promotionData: Promotion): Observable<Promotion> {
    return this.http.post<Promotion>(this.adminApiUrl, promotionData);
  }

  updatePromotion(id: string, promotionData: Partial<Promotion>): Observable<Promotion> {
    return this.http.put<Promotion>(`${this.adminApiUrl}/${id}`, promotionData);
  }

  deletePromotion(id: string): Observable<any> {
    return this.http.delete<any>(`${this.adminApiUrl}/${id}`);
  }

  togglePromotionStatus(id: string, active: boolean): Observable<Promotion> {
    return this.http.patch<Promotion>(`${this.adminApiUrl}/${id}/status`, { active });
  }
}