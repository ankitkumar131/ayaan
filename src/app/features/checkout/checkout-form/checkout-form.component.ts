import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { OrderSummaryComponent } from '../order-summary/order-summary.component';
import { CartService } from '../../../core/services/cart.service';
import { OrderService, CreateOrderRequest } from '../../../core/services/order.service';

@Component({
  selector: 'app-checkout-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    OrderSummaryComponent
  ],
  templateUrl: './checkout-form.component.html',
  styleUrls: ['./checkout-form.component.scss']
})
export class CheckoutFormComponent implements OnInit {
  checkoutForm: FormGroup;
  cart: any = { items: [] };
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {
    this.checkoutForm = this.fb.group({
      shippingAddress: this.fb.group({
        fullName: ['', [Validators.required]],
        addressLine1: ['', [Validators.required]],
        addressLine2: [''],
        city: ['', [Validators.required]],
        state: ['', [Validators.required]],
        zipCode: ['', [Validators.required, Validators.pattern('^[0-9]{5}(?:-[0-9]{4})?$')]],
        country: ['', [Validators.required]]
      }),
      paymentDetails: this.fb.group({
        cardNumber: ['', [Validators.required, Validators.pattern('^[0-9]{16}$')]],
        expiryDate: ['', [Validators.required, Validators.pattern('^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$')]],
        cvv: ['', [Validators.required, Validators.pattern('^[0-9]{3,4}$')]]
      })
    });
  }

  ngOnInit(): void {
    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cart = cart;
      },
      error: (error: Error) => {
        this.errorMessage = 'Failed to load cart details';
        console.error('Error loading cart:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.checkoutForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const orderData: CreateOrderRequest = {
        ...this.checkoutForm.value,
        items: this.cart.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      this.orderService.createOrder(orderData).subscribe({
        next: (response: { orderId: string }) => {
          this.router.navigate(['/user/orders', response.orderId]);
        },
        error: (error: Error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'An error occurred during checkout';
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.checkoutForm.markAllAsTouched();
    }
  }

  getErrorMessage(controlPath: string): string {
    const control = this.checkoutForm.get(controlPath);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'This field is required';
      }
      if (control.errors['pattern']) {
        switch (controlPath) {
          case 'shippingAddress.zipCode':
            return 'Please enter a valid ZIP code';
          case 'paymentDetails.cardNumber':
            return 'Please enter a valid 16-digit card number';
          case 'paymentDetails.expiryDate':
            return 'Please enter a valid expiry date (MM/YY)';
          case 'paymentDetails.cvv':
            return 'Please enter a valid CVV';
          default:
            return 'Invalid format';
        }
      }
    }
    return '';
  }
}
