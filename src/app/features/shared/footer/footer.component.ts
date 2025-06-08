import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-section">
            <h3>Fashion Store</h3>
            <p class="about-text">
              Your one-stop destination for trendy and fashionable clothing. 
              We bring you the latest styles at affordable prices.
            </p>
            <div class="social-links">
              <a href="#" target="_blank" title="Facebook">
                <i class="fab fa-facebook"></i>
              </a>
              <a href="#" target="_blank" title="Instagram">
                <i class="fab fa-instagram"></i>
              </a>
              <a href="#" target="_blank" title="Twitter">
                <i class="fab fa-twitter"></i>
              </a>
              <a href="#" target="_blank" title="Pinterest">
                <i class="fab fa-pinterest"></i>
              </a>
            </div>
          </div>

          <div class="footer-section">
            <h3>Quick Links</h3>
            <ul class="footer-links">
              <li><a routerLink="/products">Shop</a></li>
              <li><a routerLink="/categories">Categories</a></li>
              <li><a routerLink="/about">About Us</a></li>
              <li><a routerLink="/contact">Contact</a></li>
              <li><a routerLink="/blog">Blog</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h3>Customer Service</h3>
            <ul class="footer-links">
              <li><a routerLink="/shipping">Shipping Information</a></li>
              <li><a routerLink="/returns">Returns & Exchanges</a></li>
              <li><a routerLink="/size-guide">Size Guide</a></li>
              <li><a routerLink="/privacy">Privacy Policy</a></li>
              <li><a routerLink="/terms">Terms & Conditions</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h3>Newsletter</h3>
            <p>Subscribe to receive updates, access to exclusive deals, and more.</p>
            <form [formGroup]="newsletterForm" (ngSubmit)="onSubscribe()" class="newsletter-form">
              <div class="form-group">
                <input 
                  type="email" 
                  formControlName="email" 
                  placeholder="Enter your email"
                  [class.error]="newsletterForm.get('email')?.errors && newsletterForm.get('email')?.touched"
                >
                <button type="submit" [disabled]="newsletterForm.invalid || isLoading">
                  {{ isLoading ? 'Subscribing...' : 'Subscribe' }}
                </button>
              </div>
              <div class="error-message" *ngIf="newsletterForm.get('email')?.errors?.['required'] && newsletterForm.get('email')?.touched">
                Email is required
              </div>
              <div class="error-message" *ngIf="newsletterForm.get('email')?.errors?.['email'] && newsletterForm.get('email')?.touched">
                Please enter a valid email
              </div>
            </form>
            <div class="success-message" *ngIf="subscriptionSuccess">
              Thank you for subscribing!
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="payment-methods">
            <span>We Accept:</span>
            <img src="assets/images/payment-visa.png" alt="Visa">
            <img src="assets/images/payment-mastercard.png" alt="Mastercard">
            <img src="assets/images/payment-amex.png" alt="American Express">
            <img src="assets/images/payment-paypal.png" alt="PayPal">
          </div>
          <p class="copyright">
            © {{ currentYear }} Fashion Store. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #1f2937;
      color: #f3f4f6;
      padding: 4rem 0 2rem;
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .footer-section h3 {
      color: white;
      font-size: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .about-text {
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .social-links {
      display: flex;
      gap: 1rem;
    }

    .social-links a {
      color: #f3f4f6;
      font-size: 1.25rem;
      transition: color 0.15s ease-in-out;
    }

    .social-links a:hover {
      color: #3b82f6;
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-links li {
      margin-bottom: 0.75rem;
    }

    .footer-links a {
      color: #f3f4f6;
      text-decoration: none;
      transition: color 0.15s ease-in-out;
    }

    .footer-links a:hover {
      color: #3b82f6;
    }

    .newsletter-form {
      margin-top: 1rem;
    }

    .form-group {
      display: flex;
      gap: 0.5rem;
    }

    .form-group input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #374151;
      border-radius: 4px;
      background: #374151;
      color: white;
    }

    .form-group input::placeholder {
      color: #9ca3af;
    }

    .form-group input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .form-group input.error {
      border-color: #ef4444;
    }

    .form-group button {
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s ease-in-out;
    }

    .form-group button:hover {
      background: #2563eb;
    }

    .form-group button:disabled {
      background: #60a5fa;
      cursor: not-allowed;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .success-message {
      color: #34d399;
      margin-top: 0.5rem;
    }

    .footer-bottom {
      padding-top: 2rem;
      border-top: 1px solid #374151;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .payment-methods {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .payment-methods span {
      color: #9ca3af;
    }

    .payment-methods img {
      height: 24px;
    }

    .copyright {
      color: #9ca3af;
    }

    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
      }

      .footer-bottom {
        flex-direction: column;
        text-align: center;
      }

      .payment-methods {
        justify-content: center;
      }
    }
  `]
})
export class FooterComponent {
  newsletterForm: FormGroup;
  isLoading = false;
  subscriptionSuccess = false;
  currentYear = new Date().getFullYear();

  constructor(private fb: FormBuilder) {
    this.newsletterForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubscribe(): void {
    if (this.newsletterForm.invalid) return;

    this.isLoading = true;

    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.subscriptionSuccess = true;
      this.newsletterForm.reset();

      // Hide success message after 3 seconds
      setTimeout(() => {
        this.subscriptionSuccess = false;
      }, 3000);
    }, 1500);
  }
}