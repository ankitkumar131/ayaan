import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { CardComponent } from '../../../../shared/components/card/card.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    CardComponent
  ],
  template: `
    <div class="auth-page">
      <div class="container">
        <div class="auth-container">
          <app-card customClass="auth-card">
            <div slot="header" class="auth-header">
              <h1 class="auth-title">Welcome Back</h1>
              <p class="auth-subtitle">Sign in to your account to continue shopping</p>
            </div>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
              <app-input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                formControlName="email"
                [error]="getFieldError('email')"
                [required]="true"
              ></app-input>

              <app-input
                label="Password"
                type="password"
                placeholder="Enter your password"
                formControlName="password"
                [error]="getFieldError('password')"
                [showPasswordToggle]="true"
                [required]="true"
              ></app-input>

              <div class="form-options">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="rememberMe" />
                  <span>Remember me</span>
                </label>
                <a routerLink="/auth/forgot-password" class="forgot-link">
                  Forgot password?
                </a>
              </div>

              <div class="form-error" *ngIf="errorMessage">
                {{ errorMessage }}
              </div>

              <app-button
                type="submit"
                variant="primary"
                size="lg"
                [fullWidth]="true"
                [loading]="isLoading"
                [disabled]="loginForm.invalid"
              >
                Sign In
              </app-button>
            </form>

            <div slot="footer" class="auth-footer">
              <p class="auth-switch">
                Don't have an account?
                <a routerLink="/auth/register" class="auth-link">Sign up</a>
              </p>
              <div class="divider">
                <span>or</span>
              </div>
              <a routerLink="/auth/admin-login" class="admin-link">
                Admin Login
              </a>
            </div>
          </app-card>
        </div>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Get return URL from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login({ email, password }).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate([this.returnUrl]);
          } else {
            this.errorMessage = response.message || 'Login failed';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'An error occurred during login';
          this.isLoading = false;
        }
      });
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      password: 'Password'
    };
    return labels[fieldName] || fieldName;
  }
}