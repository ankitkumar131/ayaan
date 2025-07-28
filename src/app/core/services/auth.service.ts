import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { BaseApiService } from './base-api.service';
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  PasswordChangeRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../interfaces/user.interface';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseApiService {
  private readonly TOKEN_KEY = 'ecommerce_token';
  private readonly USER_KEY = 'ecommerce_user';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private router: Router, http: HttpClient) {
    super(http);
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();
    
    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  // Authentication Methods
  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/auth/login', credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data.token, response.data.user);
          }
        })
      );
  }

  adminLogin(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/admin/auth/login', credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data.token, response.data.user);
          }
        })
      );
  }

  register(userData: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/auth/register', userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data.token, response.data.user);
          }
        })
      );
  }

  registerAdmin(userData: RegisterRequest & { adminKey: string }): Observable<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/auth/register-admin', userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data.token, response.data.user);
          }
        })
      );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<ApiResponse<any>> {
    return this.post('/auth/forgot-password', request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<ApiResponse<any>> {
    return this.put('/auth/reset-password', request);
  }

  changePassword(request: PasswordChangeRequest): Observable<ApiResponse<any>> {
    return this.put('/user/password', request);
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/auth/login']);
  }

  // Token Management
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setAuthData(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // User State Management
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  isUser(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'user';
  }

  // Token Validation
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  // Auto-logout on token expiration
  checkTokenExpiration(): void {
    if (this.isAuthenticated() && this.isTokenExpired()) {
      this.logout();
    }
  }
}