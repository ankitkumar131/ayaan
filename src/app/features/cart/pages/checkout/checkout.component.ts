import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CartService } from '../../../../core/services/cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../../core/services/product.service';
import { CartItem } from '../../../../core/interfaces/cart.interface';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule,
    ButtonComponent, 
    CardComponent, 
    LoadingComponent
  ],
  template: `
    <div class="checkout-page">
      <div class="container">
        <!-- Page Header -->
        <div class="page-header">
          <div class="breadcrumb">
            <a routerLink="/home">Home</a>
            <span>/</span>
            <a routerLink="/cart">Cart</a>
            <span>/</span>
            <span>Checkout</span>
          </div>
          <h1>Checkout</h1>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <app-loading type="skeleton"></app-loading>
        </div>

        <!-- Empty Cart -->
        <div *ngIf="!loading && cartItems.length === 0" class="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart before checking out.</p>
          <app-button variant="primary" routerLink="/products">
            Continue Shopping
          </app-button>
        </div>

        <!-- Checkout Form -->
        <div *ngIf="!loading && cartItems.length > 0" class="checkout-content">
          <div class="checkout-form">
            <form [formGroup]="checkoutForm" (ngSubmit)="onSubmit()">
              
              <!-- Step Indicator -->
              <div class="step-indicator">
                <div class="step" [class.active]="currentStep >= 1" [class.completed]="currentStep > 1">
                  <span class="step-number">1</span>
                  <span class="step-label">Shipping</span>
                </div>
                <div class="step" [class.active]="currentStep >= 2" [class.completed]="currentStep > 2">
                  <span class="step-number">2</span>
                  <span class="step-label">Payment</span>
                </div>
                <div class="step" [class.active]="currentStep >= 3">
                  <span class="step-number">3</span>
                  <span class="step-label">Review</span>
                </div>
              </div>

              <!-- Step 1: Shipping Information -->
              <app-card *ngIf="currentStep === 1" class="checkout-step">
                <h2>Shipping Information</h2>
                
                <div class="form-grid">
                  <div class="form-group">
                    <label for="firstName">First Name *</label>
                    <input 
                      id="firstName"
                      type="text" 
                      formControlName="firstName"
                      placeholder="Enter first name"
                    />
                    <div class="error" *ngIf="checkoutForm.get('firstName')?.invalid && checkoutForm.get('firstName')?.touched">
                      First name is required
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="lastName">Last Name *</label>
                    <input 
                      id="lastName"
                      type="text" 
                      formControlName="lastName"
                      placeholder="Enter last name"
                    />
                    <div class="error" *ngIf="checkoutForm.get('lastName')?.invalid && checkoutForm.get('lastName')?.touched">
                      Last name is required
                    </div>
                  </div>

                  <div class="form-group full-width">
                    <label for="email">Email Address *</label>
                    <input 
                      id="email"
                      type="email" 
                      formControlName="email"
                      placeholder="Enter email address"
                    />
                    <div class="error" *ngIf="checkoutForm.get('email')?.invalid && checkoutForm.get('email')?.touched">
                      Valid email is required
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="phone">Phone Number *</label>
                    <input 
                      id="phone"
                      type="tel" 
                      formControlName="phone"
                      placeholder="Enter phone number"
                    />
                    <div class="error" *ngIf="checkoutForm.get('phone')?.invalid && checkoutForm.get('phone')?.touched">
                      Phone number is required
                    </div>
                  </div>

                  <div class="form-group full-width">
                    <label for="address">Street Address *</label>
                    <input 
                      id="address"
                      type="text" 
                      formControlName="address"
                      placeholder="Enter street address"
                    />
                    <div class="error" *ngIf="checkoutForm.get('address')?.invalid && checkoutForm.get('address')?.touched">
                      Address is required
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="city">City *</label>
                    <input 
                      id="city"
                      type="text" 
                      formControlName="city"
                      placeholder="Enter city"
                    />
                    <div class="error" *ngIf="checkoutForm.get('city')?.invalid && checkoutForm.get('city')?.touched">
                      City is required
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="state">State *</label>
                    <input 
                      id="state"
                      type="text" 
                      formControlName="state"
                      placeholder="Enter state"
                    />
                    <div class="error" *ngIf="checkoutForm.get('state')?.invalid && checkoutForm.get('state')?.touched">
                      State is required
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="zipCode">ZIP Code *</label>
                    <input 
                      id="zipCode"
                      type="text" 
                      formControlName="zipCode"
                      placeholder="Enter ZIP code"
                    />
                    <div class="error" *ngIf="checkoutForm.get('zipCode')?.invalid && checkoutForm.get('zipCode')?.touched">
                      ZIP code is required
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="country">Country *</label>
                    <select id="country" formControlName="country">
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                    <div class="error" *ngIf="checkoutForm.get('country')?.invalid && checkoutForm.get('country')?.touched">
                      Country is required
                    </div>
                  </div>
                </div>

                <div class="shipping-options">
                  <h3>Shipping Method</h3>
                  <div class="shipping-method">
                    <label class="radio-label">
                      <input 
                        type="radio" 
                        formControlName="shippingMethod"
                        value="standard"
                      />
                      <div class="method-info">
                        <span class="method-name">Standard Shipping</span>
                        <span class="method-time">5-7 business days</span>
                        <span class="method-price">{{ getSubtotal() >= 50 ? 'FREE' : '$5.00' }}</span>
                      </div>
                    </label>
                  </div>

                  <div class="shipping-method">
                    <label class="radio-label">
                      <input 
                        type="radio" 
                        formControlName="shippingMethod"
                        value="express"
                      />
                      <div class="method-info">
                        <span class="method-name">Express Shipping</span>
                        <span class="method-time">2-3 business days</span>
                        <span class="method-price">$9.99</span>
                      </div>
                    </label>
                  </div>

                  <div class="shipping-method">
                    <label class="radio-label">
                      <input 
                        type="radio" 
                        formControlName="shippingMethod"
                        value="overnight"
                      />
                      <div class="method-info">
                        <span class="method-name">Overnight Shipping</span>
                        <span class="method-time">Next business day</span>
                        <span class="method-price">$19.99</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div class="step-actions">
                  <app-button 
                    type="button"
                    variant="primary"
                    (click)="nextStep()"
                    [disabled]="!isStepValid(1)"
                  >
                    Continue to Payment
                  </app-button>
                </div>
              </app-card>

              <!-- Step 2: Payment Information -->
              <app-card *ngIf="currentStep === 2" class="checkout-step">
                <h2>Payment Information</h2>
                
                <div class="payment-methods">
                  <div class="payment-method">
                    <label class="radio-label">
                      <input 
                        type="radio" 
                        formControlName="paymentMethod"
                        value="card"
                      />
                      <span>Credit/Debit Card</span>
                    </label>
                  </div>

                  <div class="payment-method">
                    <label class="radio-label">
                      <input 
                        type="radio" 
                        formControlName="paymentMethod"
                        value="paypal"
                      />
                      <span>PayPal</span>
                    </label>
                  </div>

                  <div class="payment-method">
                    <label class="radio-label">
                      <input 
                        type="radio" 
                        formControlName="paymentMethod"
                        value="apple"
                      />
                      <span>Apple Pay</span>
                    </label>
                  </div>
                </div>

                <div *ngIf="checkoutForm.get('paymentMethod')?.value === 'card'" class="card-form">
                  <div class="form-grid">
                    <div class="form-group full-width">
                      <label for="cardNumber">Card Number *</label>
                      <input 
                        id="cardNumber"
                        type="text" 
                        formControlName="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        maxlength="19"
                      />
                      <div class="error" *ngIf="checkoutForm.get('cardNumber')?.invalid && checkoutForm.get('cardNumber')?.touched">
                        Valid card number is required
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="expiryDate">Expiry Date *</label>
                      <input 
                        id="expiryDate"
                        type="text" 
                        formControlName="expiryDate"
                        placeholder="MM/YY"
                        maxlength="5"
                      />
                      <div class="error" *ngIf="checkoutForm.get('expiryDate')?.invalid && checkoutForm.get('expiryDate')?.touched">
                        Expiry date is required
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="cvv">CVV *</label>
                      <input 
                        id="cvv"
                        type="text" 
                        formControlName="cvv"
                        placeholder="123"
                        maxlength="4"
                      />
                      <div class="error" *ngIf="checkoutForm.get('cvv')?.invalid && checkoutForm.get('cvv')?.touched">
                        CVV is required
                      </div>
                    </div>

                    <div class="form-group full-width">
                      <label for="cardName">Name on Card *</label>
                      <input 
                        id="cardName"
                        type="text" 
                        formControlName="cardName"
                        placeholder="Enter name as it appears on card"
                      />
                      <div class="error" *ngIf="checkoutForm.get('cardName')?.invalid && checkoutForm.get('cardName')?.touched">
                        Name on card is required
                      </div>
                    </div>
                  </div>
                </div>

                <div class="step-actions">
                  <app-button 
                    type="button"
                    variant="outline"
                    (click)="previousStep()"
                  >
                    Back to Shipping
                  </app-button>
                  <app-button 
                    type="button"
                    variant="primary"
                    (click)="nextStep()"
                    [disabled]="!isStepValid(2)"
                  >
                    Review Order
                  </app-button>
                </div>
              </app-card>

              <!-- Step 3: Order Review -->
              <app-card *ngIf="currentStep === 3" class="checkout-step">
                <h2>Review Your Order</h2>
                
                <div class="order-review">
                  <div class="review-section">
                    <h3>Shipping Address</h3>
                    <div class="address-display">
                      <p>{{ checkoutForm.get('firstName')?.value }} {{ checkoutForm.get('lastName')?.value }}</p>
                      <p>{{ checkoutForm.get('address')?.value }}</p>
                      <p>{{ checkoutForm.get('city')?.value }}, {{ checkoutForm.get('state')?.value }} {{ checkoutForm.get('zipCode')?.value }}</p>
                      <p>{{ checkoutForm.get('country')?.value }}</p>
                      <p>{{ checkoutForm.get('phone')?.value }}</p>
                    </div>
                  </div>

                  <div class="review-section">
                    <h3>Shipping Method</h3>
                    <p>{{ getShippingMethodName() }} - {{ getShippingMethodPrice() }}</p>
                  </div>

                  <div class="review-section">
                    <h3>Payment Method</h3>
                    <p>{{ getPaymentMethodName() }}</p>
                  </div>

                  <div class="review-section">
                    <h3>Order Items</h3>
                    <div class="review-items">
                      <div *ngFor="let item of cartItems" class="review-item">
                        <img 
                          [src]="item.product.images[0]?.url || '/assets/images/product-placeholder.jpg'" 
                          [alt]="item.product.name"
                        />
                        <div class="item-details">
                          <h4>{{ item.product.name }}</h4>
                          <p>Quantity: {{ item.quantity }}</p>
                          <p class="item-price">{{ formatPrice(getItemTotal(item)) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="step-actions">
                  <app-button 
                    type="button"
                    variant="outline"
                    (click)="previousStep()"
                  >
                    Back to Payment
                  </app-button>
                  <app-button 
                    type="submit"
                    variant="primary"
                    [disabled]="submittingOrder"
                  >
                    {{ submittingOrder ? 'Placing Order...' : 'Place Order' }}
                  </app-button>
                </div>
              </app-card>
            </form>
          </div>

          <!-- Order Summary Sidebar -->
          <div class="order-summary">
            <app-card class="summary-card">
              <h3>Order Summary</h3>
              
              <div class="summary-items">
                <div *ngFor="let item of cartItems" class="summary-item">
                  <div class="item-info">
                    <span class="item-name">{{ item.product.name }}</span>
                    <span class="item-qty">x{{ item.quantity }}</span>
                  </div>
                  <span class="item-total">{{ formatPrice(getItemTotal(item)) }}</span>
                </div>
              </div>
              
              <div class="summary-calculations">
                <div class="summary-line">
                  <span>Subtotal:</span>
                  <span>{{ formatPrice(getSubtotal()) }}</span>
                </div>
                
                <div class="summary-line">
                  <span>Shipping:</span>
                  <span>{{ formatPrice(getShippingCost()) }}</span>
                </div>
                
                <div class="summary-line">
                  <span>Tax:</span>
                  <span>{{ formatPrice(getTax()) }}</span>
                </div>
                
                <hr class="summary-divider">
                
                <div class="summary-line total">
                  <span>Total:</span>
                  <span>{{ formatPrice(getTotal()) }}</span>
                </div>
              </div>

              <div class="security-info">
                <p>🔒 Your payment information is secure and encrypted</p>
              </div>
            </app-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-page {
      padding: 2rem 0;
      min-height: 80vh;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .breadcrumb a {
      color: #3b82f6;
      text-decoration: none;
    }

    .breadcrumb a:hover {
      text-decoration: underline;
    }

    .page-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .empty-cart {
      text-align: center;
      padding: 3rem;
    }

    .empty-cart h2 {
      margin: 0 0 1rem 0;
      color: #1f2937;
    }

    .empty-cart p {
      margin: 0 0 2rem 0;
      color: #6b7280;
    }

    .checkout-content {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 2rem;
    }

    .step-indicator {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
      padding: 1rem 0;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      flex: 1;
      max-width: 150px;
    }

    .step:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 15px;
      right: -50%;
      width: 100%;
      height: 2px;
      background: #e5e7eb;
      z-index: 1;
    }

    .step.completed:not(:last-child)::after {
      background: #3b82f6;
    }

    .step-number {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #e5e7eb;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      position: relative;
      z-index: 2;
    }

    .step.active .step-number,
    .step.completed .step-number {
      background: #3b82f6;
      color: white;
    }

    .step-label {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }

    .step.active .step-label,
    .step.completed .step-label {
      color: #3b82f6;
    }

    .checkout-step {
      padding: 2rem;
      margin-bottom: 1rem;
    }

    .checkout-step h2 {
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .error {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .shipping-options {
      margin-bottom: 2rem;
    }

    .shipping-options h3 {
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .shipping-method {
      margin-bottom: 1rem;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      transition: border-color 0.2s ease;
    }

    .radio-label:hover {
      border-color: #3b82f6;
    }

    .radio-label input[type="radio"] {
      margin: 0;
    }

    .method-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 1;
    }

    .method-name {
      font-weight: 500;
    }

    .method-time {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .method-price {
      font-weight: 600;
      color: #1f2937;
    }

    .payment-methods {
      margin-bottom: 2rem;
    }

    .payment-method {
      margin-bottom: 0.75rem;
    }

    .card-form {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 8px;
    }

    .step-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    .order-review {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .review-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
    }

    .address-display {
      background: #f9fafb;
      padding: 1rem;
      border-radius: 6px;
    }

    .address-display p {
      margin: 0 0 0.25rem 0;
      color: #374151;
    }

    .review-items {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .review-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 6px;
    }

    .review-item img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
    }

    .item-details h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .item-details p {
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .item-price {
      font-weight: 600 !important;
      color: #1f2937 !important;
    }

    .summary-card {
      padding: 1.5rem;
      position: sticky;
      top: 2rem;
    }

    .summary-card h3 {
      margin: 0 0 1.5rem 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .summary-items {
      margin-bottom: 1.5rem;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .item-name {
      font-weight: 500;
    }

    .item-qty {
      color: #6b7280;
      font-size: 0.75rem;
    }

    .item-total {
      font-weight: 600;
    }

    .summary-calculations {
      margin-bottom: 1.5rem;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .summary-line.total {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
    }

    .summary-divider {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 1rem 0;
    }

    .security-info {
      text-align: center;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .security-info p {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .checkout-content {
        grid-template-columns: 1fr;
      }
      
      .form-grid {
        grid-template-columns: 1fr;
      }
      
      .step-actions {
        flex-direction: column;
      }
      
      .method-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  loading = true;
  submittingOrder = false;
  currentStep = 1;
  
  checkoutForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cartService: CartService,
    private orderService: OrderService,
    private productService: ProductService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCart();
  }

  private initializeForm(): void {
    this.checkoutForm = this.fb.group({
      // Shipping Information
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      country: ['', Validators.required],
      shippingMethod: ['standard', Validators.required],
      
      // Payment Information
      paymentMethod: ['card', Validators.required],
      cardNumber: [''],
      expiryDate: [''],
      cvv: [''],
      cardName: ['']
    });

    // Add conditional validators for card payment
    this.checkoutForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      const cardFields = ['cardNumber', 'expiryDate', 'cvv', 'cardName'];
      
      if (method === 'card') {
        cardFields.forEach(field => {
          this.checkoutForm.get(field)?.setValidators([Validators.required]);
        });
      } else {
        cardFields.forEach(field => {
          this.checkoutForm.get(field)?.clearValidators();
        });
      }
      
      cardFields.forEach(field => {
        this.checkoutForm.get(field)?.updateValueAndValidity();
      });
    });
  }

  loadCart(): void {
    this.cartService.getCart().subscribe({
      next: (response) => {
        if (response.success) {
          this.cartItems = response.data.items || [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.loading = false;
      }
    });
  }

  nextStep(): void {
    if (this.isStepValid(this.currentStep)) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        const shippingFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country', 'shippingMethod'];
        return shippingFields.every(field => this.checkoutForm.get(field)?.valid);
      
      case 2:
        const paymentMethod = this.checkoutForm.get('paymentMethod')?.value;
        if (paymentMethod === 'card') {
          const cardFields = ['cardNumber', 'expiryDate', 'cvv', 'cardName'];
          return cardFields.every(field => this.checkoutForm.get(field)?.valid);
        }
        return this.checkoutForm.get('paymentMethod')?.valid || false;
      
      case 3:
        return this.checkoutForm.valid;
      
      default:
        return false;
    }
  }

  onSubmit(): void {
    if (this.checkoutForm.valid && this.cartItems.length > 0) {
      this.submittingOrder = true;
      
      const shippingAddress = {
        firstName: this.checkoutForm.get('firstName')?.value,
        lastName: this.checkoutForm.get('lastName')?.value,
        email: this.checkoutForm.get('email')?.value,
        phone: this.checkoutForm.get('phone')?.value,
        address: this.checkoutForm.get('address')?.value,
        city: this.checkoutForm.get('city')?.value,
        state: this.checkoutForm.get('state')?.value,
        zipCode: this.checkoutForm.get('zipCode')?.value,
        country: this.checkoutForm.get('country')?.value
      };

      const orderData = {
        items: this.cartItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price.sale || item.product.price.regular
        })),
        shippingAddress: shippingAddress,
        billingAddress: shippingAddress, // Use same address for billing
        shippingMethod: this.checkoutForm.get('shippingMethod')?.value,
        paymentMethod: this.checkoutForm.get('paymentMethod')?.value,
        totals: {
          subtotal: this.getSubtotal(),
          shipping: this.getShippingCost(),
          tax: this.getTax(),
          total: this.getTotal()
        }
      };

      this.orderService.createOrder(orderData).subscribe({
        next: (response) => {
          if (response.success) {
            // Clear cart after successful order
            this.cartService.clearCart().subscribe();
            
            // Redirect to order confirmation
            alert('Order placed successfully!');
            this.router.navigate(['/account/orders']);
          }
          this.submittingOrder = false;
        },
        error: (error) => {
          console.error('Error placing order:', error);
          alert('Error placing order. Please try again.');
          this.submittingOrder = false;
        }
      });
    }
  }

  getItemTotal(item: CartItem): number {
    const price = item.product.price.sale || item.product.price.regular;
    return price * item.quantity;
  }

  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + this.getItemTotal(item), 0);
  }

  getShippingCost(): number {
    const method = this.checkoutForm.get('shippingMethod')?.value;
    const subtotal = this.getSubtotal();
    
    switch (method) {
      case 'standard':
        return subtotal >= 50 ? 0 : 5;
      case 'express':
        return 9.99;
      case 'overnight':
        return 19.99;
      default:
        return 0;
    }
  }

  getTax(): number {
    return this.getSubtotal() * 0.08; // 8% tax rate
  }

  getTotal(): number {
    return this.getSubtotal() + this.getShippingCost() + this.getTax();
  }

  getShippingMethodName(): string {
    const method = this.checkoutForm.get('shippingMethod')?.value;
    switch (method) {
      case 'standard': return 'Standard Shipping (5-7 business days)';
      case 'express': return 'Express Shipping (2-3 business days)';
      case 'overnight': return 'Overnight Shipping (Next business day)';
      default: return '';
    }
  }

  getShippingMethodPrice(): string {
    const cost = this.getShippingCost();
    return cost === 0 ? 'FREE' : this.formatPrice(cost);
  }

  getPaymentMethodName(): string {
    const method = this.checkoutForm.get('paymentMethod')?.value;
    switch (method) {
      case 'card': return 'Credit/Debit Card';
      case 'paypal': return 'PayPal';
      case 'apple': return 'Apple Pay';
      default: return '';
    }
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }
}