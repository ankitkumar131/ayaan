import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public redirectUrl: string | null = null;
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userData = localStorage.getItem(this.userKey);
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData) as User;
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing user data from localStorage', error);
        this.logout();
      }
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, userData)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  adminLogin(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/admin/login`, { email, password })
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  private setSession(authResult: any): void {
    if (authResult.token && authResult.user) {
      localStorage.setItem(this.tokenKey, authResult.token);
      localStorage.setItem(this.userKey, JSON.stringify(authResult.user));
      this.currentUserSubject.next(authResult.user);
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.role === 'admin';
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/request-password-reset`, { email })
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/reset-password`, { token, newPassword })
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }
}