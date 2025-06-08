import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse, 
  UserProfile, 
  UpdateProfileRequest 
} from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));
  isAdmin$ = this.currentUser$.pipe(map(user => user?.role === 'admin'));

  constructor(private http: HttpClient) {
    this.loadUser();
  }

  private loadUser(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.getProfile().subscribe();
    }
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, data)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this.getProfile().subscribe();
        })
      );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, data)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this.getProfile().subscribe();
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/user/profile`)
      .pipe(
        tap(user => this.currentUserSubject.next(user))
      );
  }

  updateProfile(data: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API_URL}/user/profile`, data)
      .pipe(
        tap(user => this.currentUserSubject.next(user))
      );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticated$;
  }

  isNotAuthenticated(): Observable<boolean> {
    return this.isAuthenticated$.pipe(map(isAuth => !isAuth));
  }
} 