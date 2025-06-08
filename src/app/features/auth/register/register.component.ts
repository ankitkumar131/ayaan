import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordStrengthComponent } from '../../../shared/components/password-strength/password-strength.component';
import { PasswordToggleComponent } from '../../../shared/components/password-toggle/password-toggle.component';
import { passwordStrengthValidator } from '../../../shared/validators/password-strength.validator';
import { passwordMatchValidator } from '../../../shared/validators/password-match.validator';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    RouterLink,
    PasswordStrengthComponent,
    PasswordToggleComponent
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isSubmitting = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage: string | null = null;
  registrationSuccess = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]],
      agreeTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: passwordMatchValidator
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.isSubmitting) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const { firstName, lastName, email, password } = this.registerForm.value;
    
    const userData = {
      firstName,
      lastName,
      email,
      password
    };

    this.authService.register(userData).subscribe({
      next: () => {
        this.registrationSuccess = true;
        // Reset the form
        this.registerForm.reset();
        // Redirect to login after a delay
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.status === 409) {
          this.errorMessage = 'Email already exists. Please use a different email or try logging in.';
        } else {
          this.errorMessage = 'Registration failed. Please try again later.';
        }
        console.error('Registration error', error);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordStrength(): { strength: string, color: string } {
    const password = this.registerForm.get('password')?.value;
    if (!password) {
      return { strength: 'None', color: '#cbd5e0' };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const length = password.length;

    let score = 0;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasNumeric) score++;
    if (hasSpecialChar) score++;
    if (length >= 8) score++;

    switch (score) {
      case 0:
      case 1:
        return { strength: 'Very Weak', color: '#e53e3e' };
      case 2:
        return { strength: 'Weak', color: '#ed8936' };
      case 3:
        return { strength: 'Medium', color: '#ecc94b' };
      case 4:
        return { strength: 'Strong', color: '#48bb78' };
      case 5:
        return { strength: 'Very Strong', color: '#38a169' };
      default:
        return { strength: 'None', color: '#cbd5e0' };
    }
  }
}