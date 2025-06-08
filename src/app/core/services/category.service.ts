import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../../shared/models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;
  private adminApiUrl = `${environment.apiUrl}/admin/categories`;

  constructor(private http: HttpClient) {}

  // Public methods
  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  // Admin methods
  createCategory(categoryData: FormData): Observable<Category> {
    return this.http.post<Category>(this.adminApiUrl, categoryData);
  }

  updateCategory(id: string, categoryData: FormData): Observable<Category> {
    return this.http.put<Category>(`${this.adminApiUrl}/${id}`, categoryData);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete<any>(`${this.adminApiUrl}/${id}`);
  }
}