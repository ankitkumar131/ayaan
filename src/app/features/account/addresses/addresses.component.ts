import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss']
})
export class AddressesComponent implements OnInit {
  addressForm: FormGroup;
  user: User | null = null;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isEditing = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.addressForm = this.fb.group({
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      country: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.userService.getUserProfile().subscribe({
      next: (user) => {
        this.user = user;
        if (user.address) {
          this.addressForm.patchValue({
            street: user.address.street || '',
            city: user.address.city || '',
            state: user.address.state || '',
            zipCode: user.address.zipCode || '',
            country: user.address.country || ''
          });
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to load address information. Please try again.';
        console.error('Error loading profile:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.addressForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const addressData = {
      address: this.addressForm.value
    };

    this.userService.updateUserAddress(addressData).subscribe({
      next: (updatedUser) => {
        this.isSubmitting = false;
        this.user = updatedUser;
        this.successMessage = 'Address updated successfully!';
        this.isEditing = false;
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error.message || 'Failed to update address. Please try again.';
      }
    });
  }

  startEditing(): void {
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.errorMessage = null;
    
    // Reset form to current user address
    if (this.user?.address) {
      this.addressForm.patchValue({
        street: this.user.address.street || '',
        city: this.user.address.city || '',
        state: this.user.address.state || '',
        zipCode: this.user.address.zipCode || '',
        country: this.user.address.country || ''
      });
    } else {
      this.addressForm.reset();
    }
  }
}