import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="forgot-password-page">
      <div class="forgot-password-container">
        <h1>Reset Password</h1>
        
        <div *ngIf="!emailSent">
          <p class="description">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          <div class="alert error" *ngIf="error">{{ error }}</div>

          <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="reset-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                formControlName="email"
                [class.error]="resetForm.get('email')?.errors && resetForm.get('email')?.touched"
              >
              <div class="error-message" *ngIf="resetForm.get('email')?.errors?.['required'] && resetForm.get('email')?.touched">
                Email is required
              </div>
              <div class="error-message" *ngIf="resetForm.get('email')?.errors?.['email'] && resetForm.get('email')?.touched">
                Please enter a valid email
              </div>
            </div>

            <button 
              type="submit" 
              class="submit-btn"
              [disabled]="resetForm.invalid || isLoading"
            >
              {{ isLoading ? 'Sending...' : 'Send Reset Instructions' }}
            </button>
          </form>
        </div>

        <div class="success-message" *ngIf="emailSent">
          <div class="icon">✓</div>
          <h2>Check Your Email</h2>
          <p>
            We've sent password reset instructions to {{ resetForm.get('email')?.value }}.
            Please check your email and follow the instructions to reset your password.
          </p>
          <p class="note">
            If you don't see the email in your inbox, please check your spam folder.
          </p>
        </div>

        <div class="form-footer">
          Remember your password? 
          <a routerLink="/auth/login">Sign In</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f9fafb;
      padding: 2rem;
    }

    .forgot-password-container {
      width: 100%;
      max-width: 400px;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    h1 {
      text-align: center;
      color: #111827;
      margin-bottom: 1rem;
    }

    .description {
      text-align: center;
      color: #6b7280;
      margin-bottom: 2rem;
    }

    .alert.error {
      padding: 1rem;
      background-color: #fee2e2;
      color: #dc2626;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .reset-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    label {
      color: #374151;
      font-weight: 500;
    }

    input {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.15s ease-in-out;
    }

    input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    input.error {
      border-color: #dc2626;
    }

    .error-message {
      color: #dc2626;
      font-size: 0.875rem;
    }

    .submit-btn {
      padding: 0.75rem;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s ease-in-out;
    }

    .submit-btn:hover {
      background-color: #2563eb;
    }

    .submit-btn:disabled {
      background-color: #93c5fd;
      cursor: not-allowed;
    }

    .success-message {
      text-align: center;
      padding: 2rem 0;
    }

    .success-message .icon {
      width: 48px;
      height: 48px;
      background-color: #34d399;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin: 0 auto 1rem;
    }

    .success-message h2 {
      color: #059669;
      margin-bottom: 1rem;
    }

    .success-message p {
      color: #374151;
      margin-bottom: 1rem;
    }

    .success-message .note {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .form-footer {
      text-align: center;
      color: #6b7280;
      margin-top: 2rem;
    }

    .form-footer a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }

    .form-footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class ForgotPasswordComponent {
  resetForm: FormGroup;
  isLoading = false;
  error = '';
  emailSent = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.resetForm.invalid) return;

    this.isLoading = true;
    this.error = '';

    // In a real application, you would call an API endpoint to handle password reset
    // For now, we'll simulate the API call with a timeout
    setTimeout(() => {
      this.isLoading = false;
      this.emailSent = true;
    }, 1500);
  }
}
