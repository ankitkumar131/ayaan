import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordToggleComponent } from '../../../shared/components/password-toggle/password-toggle.component';

@Component({
  selector: 'app-register-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PasswordToggleComponent],
  templateUrl: './register-admin.component.html',
  styleUrls: ['./register-admin.component.scss']
})
export class RegisterAdminComponent {
  registerAdminForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerAdminForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: ['', [Validators.pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)]],
      adminKey: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      form.get('confirmPassword')?.setErrors(null);
      return null;
    }
  }

  onSubmit(): void {
    if (this.registerAdminForm.invalid || this.isSubmitting) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.registerAdminForm.controls).forEach(key => {
        const control = this.registerAdminForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formData = { ...this.registerAdminForm.value };
    delete formData.confirmPassword; // Remove confirmPassword before sending to API

    this.authService.registerAdmin(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Admin registration successful! You will be redirected to the admin dashboard shortly.';
        this.registerAdminForm.reset();
        
        // Login with the newly registered admin credentials
        const { email, password } = formData;
        this.authService.adminLogin(email, password).subscribe({
          next: () => {
            // Redirect to admin dashboard after a delay
            setTimeout(() => {
              this.router.navigate(['/admin/dashboard']);
            }, 3000);
          },
          error: (loginError) => {
            this.errorMessage = 'Registration successful, but automatic login failed. Please login manually.';
            console.error('Auto login error after admin registration', loginError);
            // Redirect to admin login after a delay
            setTimeout(() => {
              this.router.navigate(['/auth/admin-login']);
            }, 3000);
          }
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.error && error.error.errors && error.error.errors.length > 0) {
          this.errorMessage = error.error.errors.map((err: any) => err.msg).join(', ');
        } else {
          this.errorMessage = 'An error occurred during registration. Please try again.';
        }
        console.error('Admin registration error', error);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}