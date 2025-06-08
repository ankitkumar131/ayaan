import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordStrengthComponent } from '../../../shared/components/password-strength/password-strength.component';
import { PasswordToggleComponent } from '../../../shared/components/password-toggle/password-toggle.component';
import { passwordStrengthValidator } from '../../../shared/validators/password-strength.validator';
import { passwordMatchValidator } from '../../../shared/validators/password-match.validator';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PasswordStrengthComponent, PasswordToggleComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showPassword = false;
  showConfirmPassword = false;
  token: string | null = null;
  email: string | null = null;
  tokenValid = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Get token and email from URL query parameters
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.email = params['email'];

      // Validate token
      if (!this.token || !this.email) {
        this.tokenValid = false;
        this.errorMessage = 'Invalid or expired password reset link. Please request a new one.';
      } else {
        // Verify token validity with backend
        // Token verification is handled on the backend when resetting the password
      this.tokenValid = true;
      }
    });
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid || this.isSubmitting || !this.tokenValid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { password } = this.resetPasswordForm.value;

    if (this.token && this.email) {
      this.authService.resetPassword(this.token, password).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage = 'Your password has been reset successfully. You will be redirected to the login page shortly.';
          this.resetPasswordForm.reset();
          
          // Redirect to login page after a delay
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 3000);
        },
        error: (error) => {
          this.isSubmitting = false;
          if (error.status === 400) {
            this.errorMessage = 'Invalid or expired token. Please request a new password reset link.';
          } else {
            this.errorMessage = 'An error occurred. Please try again later.';
          }
          console.error('Reset password error', error);
        }
      });
    }
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Toggle confirm password visibility
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}