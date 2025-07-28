import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CartService } from '../../../../core/services/cart.service';
import { ProductService } from '../../../../core/services/product.service';
import { CartItem } from '../../../../core/interfaces/cart.interface';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    ButtonComponent, 
    CardComponent, 
    LoadingComponent
  ],
  template: `
    <div class="cart-page">
      <div class="container">
        <!-- Page Header -->
        <div class="page-header">
          <div class="breadcrumb">
            <a routerLink="/home">Home</a>
            <span>/</span>
            <span>Shopping Cart</span>
          </div>
          <h1>Shopping Cart</h1>
        </div>

        <div *ngIf="loading" class="loading-container">
          <app-loading type="skeleton"></app-loading>
        </div>

        <div *ngIf="!loading && cartItems.length === 0" class="empty-cart">
          <div class="empty-cart-content">
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any items to your cart yet.</p>
            <app-button variant="primary" routerLink="/products">
              Continue Shopping
            </app-button>
          </div>
        </div>

        <div *ngIf="!loading && cartItems.length > 0" class="cart-content">
          <div class="cart-items">
            <app-card class="cart-items-card">
              <div class="cart-header">
                <h2>Cart Items ({{ getTotalItems() }})</h2>
                <app-button 
                  variant="outline" 
                  size="sm"
                  (click)="clearCart()"
                >
                  Clear Cart
                </app-button>
              </div>

              <div class="cart-items-list">
                <div *ngFor="let item of cartItems" class="cart-item">
                  <div class="item-image">
                    <img 
                      [src]="item.product.images[0]?.url || '/assets/images/product-placeholder.jpg'" 
                      [alt]="item.product.name"
                    />
                  </div>

                  <div class="item-details">
                    <h3 class="item-name">{{ item.product.name }}</h3>
                    <p class="item-brand" *ngIf="item.product.brand">{{ item.product.brand }}</p>
                    
                    <div class="item-price">
                      <span class="current-price">
                        {{ formatPrice(item.product.price.sale || item.product.price.regular) }}
                      </span>
                      <span 
                        *ngIf="item.product.price.sale" 
                        class="original-price"
                      >
                        {{ formatPrice(item.product.price.regular) }}
                      </span>
                    </div>

                    <div class="item-availability">
                      <span 
                        class="stock-status"
                        [class.in-stock]="item.product.inventory.stock > 0"
                        [class.out-of-stock]="item.product.inventory.stock === 0"
                      >
                        {{ item.product.inventory.stock > 0 ? 'In Stock' : 'Out of Stock' }}
                      </span>
                    </div>
                  </div>

                  <div class="item-quantity">
                    <label>Quantity:</label>
                    <div class="quantity-controls">
                      <button 
                        class="quantity-btn"
                        (click)="updateQuantity(item, item.quantity - 1)"
                        [disabled]="item.quantity <= 1"
                      >
                        -
                      </button>
                      <span class="quantity-value">{{ item.quantity }}</span>
                      <button 
                        class="quantity-btn"
                        (click)="updateQuantity(item, item.quantity + 1)"
                        [disabled]="item.quantity >= item.product.inventory.stock"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div class="item-total">
                    <div class="total-price">
                      {{ formatPrice(getItemTotal(item)) }}
                    </div>
                    <app-button 
                      variant="outline" 
                      size="sm"
                      (click)="removeFromCart(item)"
                    >
                      Remove
                    </app-button>
                  </div>
                </div>
              </div>
            </app-card>
          </div>

          <div class="cart-summary">
            <app-card class="summary-card">
              <h3>Order Summary</h3>
              
              <div class="summary-line">
                <span>Subtotal ({{ getTotalItems() }} items):</span>
                <span>{{ formatPrice(getSubtotal()) }}</span>
              </div>
              
              <div class="summary-line">
                <span>Shipping:</span>
                <span>{{ formatPrice(getShippingCost()) }}</span>
              </div>
              
              <div class="summary-line discount" *ngIf="getDiscount() > 0">
                <span>Discount:</span>
                <span>-{{ formatPrice(getDiscount()) }}</span>
              </div>
              
              <div class="summary-line tax">
                <span>Tax:</span>
                <span>{{ formatPrice(getTax()) }}</span>
              </div>
              
              <hr class="summary-divider">
              
              <div class="summary-line total">
                <span>Total:</span>
                <span>{{ formatPrice(getTotal()) }}</span>
              </div>

              <div class="checkout-actions">
                <app-button 
                  variant="primary" 
                  size="lg"
                  routerLink="/cart/checkout"
                  [disabled]="!canCheckout()"
                >
                  Proceed to Checkout
                </app-button>
                
                <app-button 
                  variant="outline" 
                  routerLink="/products"
                >
                  Continue Shopping
                </app-button>
              </div>

              <div class="payment-methods">
                <p>We accept:</p>
                <div class="payment-icons">
                  <span class="payment-icon">💳</span>
                  <span class="payment-icon">🏦</span>
                  <span class="payment-icon">📱</span>
                </div>
              </div>
            </app-card>

            <!-- Recommended Products -->
            <app-card class="recommendations-card" *ngIf="recommendedProducts.length > 0">
              <h3>You might also like</h3>
              <div class="recommended-products">
                <div *ngFor="let product of recommendedProducts" class="recommended-item">
                  <img 
                    [src]="product.images[0]?.url || '/assets/images/product-placeholder.jpg'" 
                    [alt]="product.name"
                    (click)="viewProduct(product._id)"
                  />
                  <div class="recommended-info">
                    <h4 (click)="viewProduct(product._id)">{{ product.name }}</h4>
                    <div class="recommended-price">
                      {{ formatPrice(product.price.sale || product.price.regular) }}
                    </div>
                    <app-button 
                      variant="outline" 
                      size="sm"
                      (click)="addRecommendedToCart(product)"
                    >
                      Add to Cart
                    </app-button>
                  </div>
                </div>
              </div>
            </app-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart-page {
      padding: 2rem 0;
      min-height: 60vh;
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
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .empty-cart-content {
      text-align: center;
      max-width: 400px;
    }

    .empty-cart-content h2 {
      margin: 0 0 1rem 0;
      color: #1f2937;
    }

    .empty-cart-content p {
      margin: 0 0 2rem 0;
      color: #6b7280;
    }

    .cart-content {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 2rem;
    }

    .cart-items-card {
      padding: 1.5rem;
    }

    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .cart-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .cart-items-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .cart-item {
      display: grid;
      grid-template-columns: 100px 1fr auto auto;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .item-image img {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 6px;
    }

    .item-details {
      flex: 1;
    }

    .item-name {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
    }

    .item-brand {
      margin: 0 0 0.5rem 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .item-price {
      margin-bottom: 0.5rem;
    }

    .current-price {
      font-weight: 600;
      color: #1f2937;
    }

    .original-price {
      margin-left: 0.5rem;
      text-decoration: line-through;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .stock-status {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .stock-status.in-stock {
      background: #f0fdf4;
      color: #16a34a;
    }

    .stock-status.out-of-stock {
      background: #fef2f2;
      color: #dc2626;
    }

    .item-quantity {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .item-quantity label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      border: 1px solid #d1d5db;
      border-radius: 6px;
    }

    .quantity-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f9fafb;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .quantity-btn:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .quantity-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quantity-value {
      width: 40px;
      text-align: center;
      font-weight: 500;
    }

    .item-total {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }

    .total-price {
      font-weight: 600;
      font-size: 1.125rem;
      color: #1f2937;
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

    .summary-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }

    .summary-line.discount {
      color: #16a34a;
    }

    .summary-line.tax {
      color: #6b7280;
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

    .checkout-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin: 1.5rem 0;
    }

    .payment-methods {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .payment-methods p {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .payment-icons {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }

    .payment-icon {
      font-size: 1.5rem;
    }

    .recommendations-card {
      padding: 1.5rem;
      margin-top: 1.5rem;
    }

    .recommendations-card h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .recommended-products {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .recommended-item {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .recommended-item img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
      cursor: pointer;
    }

    .recommended-info {
      flex: 1;
    }

    .recommended-info h4 {
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      color: #1f2937;
    }

    .recommended-info h4:hover {
      color: #3b82f6;
    }

    .recommended-price {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    @media (max-width: 768px) {
      .cart-content {
        grid-template-columns: 1fr;
      }
      
      .cart-item {
        grid-template-columns: 80px 1fr;
        gap: 0.75rem;
      }
      
      .item-quantity,
      .item-total {
        grid-column: 1 / -1;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }
  `]
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  recommendedProducts: any[] = [];
  loading = true;

  constructor(
    private cartService: CartService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadCart();
    this.loadRecommendedProducts();
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

  loadRecommendedProducts(): void {
    // Load some featured products as recommendations
    this.productService.getFeaturedProducts(3).subscribe({
      next: (response) => {
        if (response.success) {
          this.recommendedProducts = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading recommendations:', error);
      }
    });
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1 || newQuantity > item.product.inventory.stock) {
      return;
    }

    this.cartService.updateCartItem(item.product._id, newQuantity).subscribe({
      next: (response) => {
        if (response.success) {
          item.quantity = newQuantity;
        }
      },
      error: (error) => {
        console.error('Error updating quantity:', error);
        alert('Error updating quantity. Please try again.');
      }
    });
  }

  removeFromCart(item: CartItem): void {
    if (confirm(`Remove ${item.product.name} from cart?`)) {
      this.cartService.removeFromCart(item.product._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.cartItems = this.cartItems.filter(i => i.product._id !== item.product._id);
          }
        },
        error: (error) => {
          console.error('Error removing item:', error);
          alert('Error removing item. Please try again.');
        }
      });
    }
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart().subscribe({
        next: (response) => {
          if (response.success) {
            this.cartItems = [];
          }
        },
        error: (error) => {
          console.error('Error clearing cart:', error);
          alert('Error clearing cart. Please try again.');
        }
      });
    }
  }

  addRecommendedToCart(product: any): void {
    this.cartService.addToCart(product, 1).subscribe({
      next: (response) => {
        if (response.success) {
          alert(`${product.name} added to cart!`);
          this.loadCart(); // Refresh cart
        }
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        alert('Error adding product to cart. Please try again.');
      }
    });
  }

  viewProduct(productId: string): void {
    window.location.href = `/products/${productId}`;
  }

  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  getItemTotal(item: CartItem): number {
    const price = item.product.price.sale || item.product.price.regular;
    return price * item.quantity;
  }

  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + this.getItemTotal(item), 0);
  }

  getShippingCost(): number {
    // Free shipping over $50, otherwise $5
    return this.getSubtotal() >= 50 ? 0 : 5;
  }

  getDiscount(): number {
    // Calculate discount from sale prices
    return this.cartItems.reduce((total, item) => {
      if (item.product.price.sale) {
        const discount = (item.product.price.regular - item.product.price.sale) * item.quantity;
        return total + discount;
      }
      return total;
    }, 0);
  }

  getTax(): number {
    // 8% tax rate
    return this.getSubtotal() * 0.08;
  }

  getTotal(): number {
    return this.getSubtotal() + this.getShippingCost() + this.getTax();
  }

  canCheckout(): boolean {
    return this.cartItems.length > 0 && 
           this.cartItems.every(item => item.product.inventory.stock > 0);
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }
}