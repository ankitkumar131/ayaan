import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfile, UpdateProfileRequest } from '../../../core/interfaces/auth.interface';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = false;
  error = '';
  successMessage = '';
  isEditing = false;
  user: UserProfile | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        zipCode: [''],
        country: ['']
      })
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.authService.currentUser$.subscribe({
      next: (user: UserProfile | null) => {
        if (user) {
          this.user = user;
          this.profileForm.patchValue({
            username: user.username,
            email: user.email,
            phone: user.phone || '',
            address: {
              street: user.address?.street || '',
              city: user.address?.city || '',
              state: user.address?.state || '',
              zipCode: user.address?.zipCode || '',
              country: user.address?.country || ''
            }
          });
        } else {
          this.error = 'No user profile found';
        }
      },
      error: (err: HttpErrorResponse) => {
        this.error = 'Failed to load profile data';
        console.error('Error loading profile:', err);
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      this.error = '';
      this.successMessage = '';

      const updateData: UpdateProfileRequest = this.profileForm.value;

      this.authService.updateProfile(updateData).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Profile updated successfully';
          this.isEditing = false;
          this.loadUserProfile(); // Reload the profile after update
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.error = err.message || 'Failed to update profile';
          console.error('Error updating profile:', err);
        }
      });
    }
  }
}