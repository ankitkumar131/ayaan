import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordToggleComponent } from '../../../shared/components/password-toggle/password-toggle.component';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PasswordToggleComponent],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent {
  adminLoginForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.adminLoginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.adminLoginForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const { email, password } = this.adminLoginForm.value;

    this.authService.adminLogin(email, password).subscribe({
      next: () => {
        // Navigate to admin dashboard
        this.router.navigate(['/admin/dashboard']);
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password';
        } else if (error.status === 403) {
          this.errorMessage = 'You do not have admin privileges';
        } else {
          this.errorMessage = 'An error occurred during login. Please try again.';
        }
        console.error('Admin login error', error);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}