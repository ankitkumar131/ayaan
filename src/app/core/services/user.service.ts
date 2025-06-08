import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private adminApiUrl = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  // User methods
  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  updateUserProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, userData);
  }

  updateUserPassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/password`, data);
  }

  updateUserAddress(addressData: any): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/address`, addressData);
  }

  uploadProfileImage(imageData: FormData): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/profile-image`, imageData);
  }

  // Admin methods
  getAllUsers(params?: { 
    page?: number; 
    limit?: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Observable<{ users: User[]; totalCount: number; totalPages: number }> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.role) httpParams = httpParams.set('role', params.role);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.http.get<{ users: User[]; totalCount: number; totalPages: number }>(this.adminApiUrl, { params: httpParams });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.adminApiUrl}/${id}`);
  }

  updateUserStatus(id: string, status: 'active' | 'inactive'): Observable<User> {
    return this.http.patch<User>(`${this.adminApiUrl}/${id}/status`, { status });
  }

  updateUserRole(id: string, role: 'user' | 'admin'): Observable<User> {
    return this.http.patch<User>(`${this.adminApiUrl}/${id}/role`, { role });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.adminApiUrl}/${id}`);
  }
}