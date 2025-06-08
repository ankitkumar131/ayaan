import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  user: User | null = null;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }],
      phone: ['', [Validators.pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.userService.getUserProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          username: user.username,
          email: user.email,
          phone: user.phone || ''
        });
      },
      error: (error) => {
        this.errorMessage = 'Failed to load profile. Please try again.';
        console.error('Error loading profile:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const userData = {
      username: this.profileForm.get('username')?.value,
      phone: this.profileForm.get('phone')?.value
    };

    this.userService.updateUserProfile(userData).subscribe({
      next: (updatedUser) => {
        this.isSubmitting = false;
        this.user = updatedUser;
        this.successMessage = 'Profile updated successfully!';
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error.message || 'Failed to update profile. Please try again.';
      }
    });
  }
}