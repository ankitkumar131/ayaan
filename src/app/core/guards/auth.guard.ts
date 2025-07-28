import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && !authService.isTokenExpired()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  router.navigate(['/auth/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  
  return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && !authService.isTokenExpired() && authService.isAdmin()) {
    return true;
  }

  if (authService.isAuthenticated() && !authService.isAdmin()) {
    // User is authenticated but not admin
    router.navigate(['/']);
    return false;
  }

  // User is not authenticated
  router.navigate(['/auth/admin-login'], { 
    queryParams: { returnUrl: state.url } 
  });
  
  return false;
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated() || authService.isTokenExpired()) {
    return true;
  }

  // User is already authenticated, redirect to home
  router.navigate(['/']);
  return false;
};