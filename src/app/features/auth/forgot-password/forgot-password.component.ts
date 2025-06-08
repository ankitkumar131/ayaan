import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { email } = this.forgotPasswordForm.value;

    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Password reset instructions have been sent to your email. Please check your inbox.';
        this.forgotPasswordForm.reset();
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.status === 404) {
          this.errorMessage = 'Email not found. Please check your email address.';
        } else {
          this.errorMessage = 'An error occurred. Please try again later.';
        }
        console.error('Forgot password error', error);
      }
    });
  }
}