import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { AuthService } from './auth.service';
import { User, Address } from '../interfaces/user.interface';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseApiService {
  private userStatsSubject = new BehaviorSubject<any>(null);
  public userStats$ = this.userStatsSubject.asObservable();

  constructor(http: HttpClient, private authService: AuthService) {
    super(http);
  }

  // Profile Management
  getProfile(): Observable<ApiResponse<User>> {
    return this.get<User>('/user/profile')
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.authService.updateCurrentUser(response.data);
          }
        })
      );
  }

  updateProfile(profileData: Partial<User>, profileImage?: File): Observable<ApiResponse<User>> {
    const formData = new FormData();
    
    // Add profile data
    if (profileData.username) formData.append('username', profileData.username);
    if (profileData.profile?.firstName) formData.append('firstName', profileData.profile.firstName);
    if (profileData.profile?.lastName) formData.append('lastName', profileData.profile.lastName);
    if (profileData.profile?.phone) formData.append('phone', profileData.profile.phone);
    
    // Add address data if provided
    if (profileData.addresses && profileData.addresses.length > 0) {
      formData.append('addresses', JSON.stringify(profileData.addresses));
    }
    
    // Add preferences if provided
    if (profileData.preferences) {
      formData.append('preferences', JSON.stringify(profileData.preferences));
    }
    
    // Add profile image if provided
    if (profileImage) {
      formData.append('profilePicture', profileImage);
    }
    
    return this.put<User>('/user/profile', formData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.authService.updateCurrentUser(response.data);
          }
        })
      );
  }

  // Address Management
  updateAddress(addressData: Address): Observable<ApiResponse<User>> {
    return this.put<User>('/user/address', addressData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.authService.updateCurrentUser(response.data);
          }
        })
      );
  }

  addAddress(addressData: Omit<Address, '_id'>): Observable<ApiResponse<User>> {
    return this.post<User>('/user/address', addressData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.authService.updateCurrentUser(response.data);
          }
        })
      );
  }

  deleteAddress(addressId: string): Observable<ApiResponse<User>> {
    return this.delete<User>(`/user/address/${addressId}`)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.authService.updateCurrentUser(response.data);
          }
        })
      );
  }

  setDefaultAddress(addressId: string): Observable<ApiResponse<User>> {
    return this.put<User>(`/user/address/${addressId}/default`, {})
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.authService.updateCurrentUser(response.data);
          }
        })
      );
  }

  // Preferences Management
  getPreferences(): Observable<ApiResponse<any>> {
    return this.get('/user/preferences');
  }

  updatePreferences(preferences: any): Observable<ApiResponse<User>> {
    return this.put<User>('/user/preferences', preferences)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.authService.updateCurrentUser(response.data);
          }
        })
      );
  }

  // Account Management
  deleteAccount(password: string): Observable<ApiResponse<any>> {
    return this.delete('/user/account')
      .pipe(
        tap(response => {
          if (response.success) {
            this.authService.logout();
          }
        })
      );
  }

  // User Statistics
  getUserStats(): Observable<ApiResponse<any>> {
    return this.get('/user/stats')
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.userStatsSubject.next(response.data);
          }
        })
      );
  }

  // Admin User Management
  getAllUsers(filters?: any): Observable<ApiResponse<User[]>> {
    const params = filters ? this.buildParams(filters) : undefined;
    return this.get<User[]>('/admin/users', params);
  }

  getUserById(userId: string): Observable<ApiResponse<User>> {
    return this.get<User>(`/admin/users/${userId}`);
  }

  updateUserStatus(userId: string, isActive: boolean): Observable<ApiResponse<User>> {
    return this.put<User>(`/admin/users/${userId}/status`, { isActive });
  }

  deleteUser(userId: string): Observable<ApiResponse<any>> {
    return this.delete(`/admin/users/${userId}`);
  }

  // Utility Methods
  getCurrentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  getCurrentUserStats(): any {
    return this.userStatsSubject.value;
  }

  // Address Utilities
  getDefaultAddress(type?: 'shipping' | 'billing'): Address | null {
    const user = this.getCurrentUser();
    if (!user || !user.addresses) return null;

    if (type) {
      return user.addresses.find(addr => addr.type === type && addr.isDefault) || null;
    }

    return user.addresses.find(addr => addr.isDefault) || null;
  }

  getAddressesByType(type: 'shipping' | 'billing'): Address[] {
    const user = this.getCurrentUser();
    if (!user || !user.addresses) return [];

    return user.addresses.filter(addr => addr.type === type);
  }

  formatAddress(address: Address): string {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;
  }

  validateZipCode(zipCode: string, country: string = 'US'): boolean {
    const zipPatterns: { [key: string]: RegExp } = {
      'US': /^\d{5}(-\d{4})?$/,
      'CA': /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
      'UK': /^[A-Za-z]{1,2}\d[A-Za-z\d]? \d[A-Za-z]{2}$/,
      // Add more patterns as needed
    };

    const pattern = zipPatterns[country] || /^\d{5,6}$/;
    return pattern.test(zipCode);
  }

  // Profile Utilities
  getFullName(): string {
    const user = this.getCurrentUser();
    if (!user || !user.profile) return '';

    return `${user.profile.firstName} ${user.profile.lastName}`.trim();
  }

  getInitials(): string {
    const user = this.getCurrentUser();
    if (!user || !user.profile) return '';

    const firstName = user.profile.firstName || '';
    const lastName = user.profile.lastName || '';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getAvatarUrl(): string | null {
    const user = this.getCurrentUser();
    return user?.profile?.avatar || null;
  }

  // Validation Utilities
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Preferences Utilities
  getLanguage(): string {
    const user = this.getCurrentUser();
    return user?.preferences?.language || 'en';
  }

  getCurrency(): string {
    const user = this.getCurrentUser();
    return user?.preferences?.currency || 'USD';
  }

  isNewsletterSubscribed(): boolean {
    const user = this.getCurrentUser();
    return user?.preferences?.newsletter || false;
  }

  areNotificationsEnabled(): boolean {
    const user = this.getCurrentUser();
    return user?.preferences?.notifications || false;
  }
}