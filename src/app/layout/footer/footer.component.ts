import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent, InputComponent],
  template: `
    <footer class="footer">
      <div class="container">
        <!-- Main Footer Content -->
        <div class="footer-content">
          <!-- Company Info -->
          <div class="footer-section">
            <div class="footer-logo">
              <img src="/assets/images/logo.svg" alt="StyleHub" class="logo-image" />
              <span class="logo-text">StyleHub</span>
            </div>
            <p class="footer-description">
              Your premier destination for fashion-forward clothing. 
              Discover the latest trends and timeless classics.
            </p>
            <div class="social-links">
              <a href="#" class="social-link" aria-label="Facebook">📘</a>
              <a href="#" class="social-link" aria-label="Twitter">🐦</a>
              <a href="#" class="social-link" aria-label="Instagram">📷</a>
              <a href="#" class="social-link" aria-label="YouTube">📺</a>
            </div>
          </div>

          <!-- Quick Links -->
          <div class="footer-section">
            <h3 class="footer-title">Quick Links</h3>
            <ul class="footer-links">
              <li><a routerLink="/products">All Products</a></li>
              <li><a routerLink="/products/category/men">Men's Fashion</a></li>
              <li><a routerLink="/products/category/women">Women's Fashion</a></li>
              <li><a routerLink="/products/featured">Featured Items</a></li>
              <li><a routerLink="/products/sale">Sale</a></li>
              <li><a routerLink="/about">About Us</a></li>
            </ul>
          </div>

          <!-- Customer Service -->
          <div class="footer-section">
            <h3 class="footer-title">Customer Service</h3>
            <ul class="footer-links">
              <li><a routerLink="/help/contact">Contact Us</a></li>
              <li><a routerLink="/help/shipping">Shipping Info</a></li>
              <li><a routerLink="/help/returns">Returns & Exchanges</a></li>
              <li><a routerLink="/help/size-guide">Size Guide</a></li>
              <li><a routerLink="/help/faq">FAQ</a></li>
              <li><a routerLink="/help/track-order">Track Your Order</a></li>
            </ul>
          </div>

          <!-- Account -->
          <div class="footer-section">
            <h3 class="footer-title">My Account</h3>
            <ul class="footer-links">
              <li><a routerLink="/auth/login">Sign In</a></li>
              <li><a routerLink="/auth/register">Create Account</a></li>
              <li><a routerLink="/account/profile">My Profile</a></li>
              <li><a routerLink="/account/orders">Order History</a></li>
              <li><a routerLink="/account/wishlist">Wishlist</a></li>
              <li><a routerLink="/cart">Shopping Cart</a></li>
            </ul>
          </div>

          <!-- Newsletter -->
          <div class="footer-section">
            <h3 class="footer-title">Stay Connected</h3>
            <p class="newsletter-description">
              Subscribe to our newsletter for exclusive offers and latest updates.
            </p>
            <form class="newsletter-form" (ngSubmit)="onNewsletterSubmit()">
              <div class="newsletter-input">
                <app-input
                  type="email"
                  placeholder="Enter your email"
                  [(ngModel)]="newsletterEmail"
                  name="newsletterEmail"
                  [required]="true"
                ></app-input>
              </div>
              <app-button 
                type="submit" 
                variant="primary"
                [loading]="isSubscribing"
                [disabled]="!newsletterEmail"
              >
                Subscribe
              </app-button>
            </form>
            <div class="contact-info">
              <div class="contact-item">
                <span class="contact-icon">📞</span>
                <span>1-800-STYLE-HUB</span>
              </div>
              <div class="contact-item">
                <span class="contact-icon">✉️</span>
                <span>support&#64;stylehub.com</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Bottom -->
        <div class="footer-bottom">
          <div class="footer-bottom-content">
            <div class="copyright">
              <p>&copy; {{ currentYear }} StyleHub. All rights reserved.</p>
            </div>
            
            <div class="legal-links">
              <a routerLink="/legal/privacy">Privacy Policy</a>
              <a routerLink="/legal/terms">Terms of Service</a>
              <a routerLink="/legal/cookies">Cookie Policy</a>
            </div>

            <div class="payment-methods">
              <span class="payment-text">We Accept:</span>
              <div class="payment-icons">
                <span class="payment-icon">💳</span>
                <span class="payment-icon">🏦</span>
                <span class="payment-icon">💰</span>
                <span class="payment-icon">📱</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  newsletterEmail = '';
  isSubscribing = false;

  onNewsletterSubmit(): void {
    if (!this.newsletterEmail) return;

    this.isSubscribing = true;

    // Simulate API call
    setTimeout(() => {
      console.log('Newsletter subscription:', this.newsletterEmail);
      this.isSubscribing = false;
      this.newsletterEmail = '';
      // Show success message
    }, 1000);
  }
}