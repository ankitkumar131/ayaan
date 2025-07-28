import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { Product } from '../../../../core/interfaces/product.interface';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-product-detail',
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
    <div class="product-detail-page">
      <div class="container">
        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <app-loading type="skeleton"></app-loading>
        </div>

        <!-- Product Not Found -->
        <div *ngIf="!loading && !product" class="not-found">
          <h2>Product Not Found</h2>
          <p>The product you're looking for doesn't exist or has been removed.</p>
          <app-button variant="primary" routerLink="/products">
            Back to Products
          </app-button>
        </div>

        <!-- Product Details -->
        <div *ngIf="!loading && product" class="product-detail">
          <!-- Breadcrumb -->
          <div class="breadcrumb">
            <a routerLink="/home">Home</a>
            <span>/</span>
            <a routerLink="/products">Products</a>
            <span>/</span>
            <span>{{ product.name }}</span>
          </div>

          <div class="product-content">
            <!-- Product Images -->
            <div class="product-images">
              <div class="main-image">
                <img 
                  [src]="selectedImage || product.images[0]?.url || '/assets/images/product-placeholder.jpg'" 
                  [alt]="product.name"
                />
                <div class="image-badges">
                  <span class="badge sale" *ngIf="product.price.sale">
                    {{ getDiscountPercentage() }}% OFF
                  </span>
                  <span class="badge featured" *ngIf="product.isFeatured">
                    Featured
                  </span>
                  <span class="badge out-of-stock" *ngIf="product.inventory.stock === 0">
                    Out of Stock
                  </span>
                </div>
              </div>
              
              <div class="image-thumbnails" *ngIf="product.images.length > 1">
                <img 
                  *ngFor="let image of product.images" 
                  [src]="image.url"
                  [alt]="product.name"
                  [class.active]="selectedImage === image.url"
                  (click)="selectImage(image.url)"
                />
              </div>
            </div>

            <!-- Product Info -->
            <div class="product-info">
              <div class="product-header">
                <h1>{{ product.name }}</h1>
                <p class="brand" *ngIf="product.brand">{{ product.brand }}</p>
                
                <div class="rating" *ngIf="product.ratings.count > 0">
                  <span class="stars">
                    {{ '★'.repeat(Math.floor(product.ratings.average)) }}{{ '☆'.repeat(5 - Math.floor(product.ratings.average)) }}
                  </span>
                  <span class="rating-text">
                    {{ product.ratings.average.toFixed(1) }} ({{ product.ratings.count }} reviews)
                  </span>
                </div>
              </div>

              <div class="pricing">
                <div class="price">
                  <span class="current-price">
                    {{ formatPrice(product.price.sale || product.price.regular) }}
                  </span>
                  <span *ngIf="product.price.sale" class="original-price">
                    {{ formatPrice(product.price.regular) }}
                  </span>
                </div>
                <div class="savings" *ngIf="product.price.sale">
                  You save {{ formatPrice(product.price.regular - product.price.sale) }}
                </div>
              </div>

              <div class="availability">
                <div class="stock-info">
                  <span 
                    class="stock-status"
                    [class.in-stock]="product.inventory.stock > 0"
                    [class.low-stock]="product.inventory.stock > 0 && product.inventory.stock <= 5"
                    [class.out-of-stock]="product.inventory.stock === 0"
                  >
                    {{ getStockMessage() }}
                  </span>
                </div>
              </div>

              <div class="description">
                <h3>Description</h3>
                <p>{{ product.description }}</p>
              </div>

              <!-- Add to Cart Form -->
              <form [formGroup]="addToCartForm" (ngSubmit)="addToCart()" class="add-to-cart-form">
                <div class="quantity-selector">
                  <label for="quantity">Quantity:</label>
                  <div class="quantity-controls">
                    <button 
                      type="button"
                      class="quantity-btn"
                      (click)="decreaseQuantity()"
                      [disabled]="addToCartForm.get('quantity')?.value <= 1"
                    >
                      -
                    </button>
                    <input 
                      id="quantity"
                      type="number" 
                      formControlName="quantity"
                      min="1"
                      [max]="product.inventory.stock"
                      readonly
                    />
                    <button 
                      type="button"
                      class="quantity-btn"
                      (click)="increaseQuantity()"
                      [disabled]="addToCartForm.get('quantity')?.value >= product.inventory.stock"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div class="action-buttons">
                  <app-button 
                    type="submit"
                    variant="primary" 
                    size="lg"
                    [disabled]="product.inventory.stock === 0 || addingToCart"
                  >
                    {{ addingToCart ? 'Adding...' : (product.inventory.stock === 0 ? 'Out of Stock' : 'Add to Cart') }}
                  </app-button>
                  
                  <app-button 
                    type="button"
                    variant="outline" 
                    size="lg"
                    (click)="addToWishlist()"
                  >
                    Add to Wishlist
                  </app-button>
                </div>
              </form>

              <!-- Product Meta -->
              <div class="product-meta">
                <div class="meta-item">
                  <strong>SKU:</strong> {{ product.inventory.sku || 'N/A' }}
                </div>
                <div class="meta-item">
                  <strong>Category:</strong> {{ product.category?.name || 'Uncategorized' }}
                </div>
                <div class="meta-item" *ngIf="product.brand">
                  <strong>Brand:</strong> {{ product.brand }}
                </div>
              </div>
            </div>
          </div>

          <!-- Product Tabs -->
          <div class="product-tabs">
            <div class="tab-headers">
              <button 
                *ngFor="let tab of tabs" 
                class="tab-header"
                [class.active]="activeTab === tab.id"
                (click)="setActiveTab(tab.id)"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="tab-content">
              <!-- Description Tab -->
              <div *ngIf="activeTab === 'description'" class="tab-panel">
                <h3>Product Description</h3>
                <p>{{ product.description }}</p>
                
                <div class="specifications" *ngIf="product.specifications">
                  <h4>Specifications</h4>
                  <ul>
                    <li *ngFor="let spec of getSpecificationEntries(product.specifications)">
                      <strong>{{ spec.key }}:</strong> {{ spec.value }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Reviews Tab -->
              <div *ngIf="activeTab === 'reviews'" class="tab-panel">
                <div class="reviews-summary">
                  <h3>Customer Reviews</h3>
                  <div class="rating-overview" *ngIf="product.ratings.count > 0">
                    <div class="average-rating">
                      <span class="rating-number">{{ product.ratings.average.toFixed(1) }}</span>
                      <div class="rating-stars">
                        {{ '★'.repeat(Math.floor(product.ratings.average)) }}{{ '☆'.repeat(5 - Math.floor(product.ratings.average)) }}
                      </div>
                      <span class="review-count">Based on {{ product.ratings.count }} reviews</span>
                    </div>
                  </div>
                </div>

                <div class="reviews-list">
                  <div *ngIf="product.ratings.count === 0" class="no-reviews">
                    <p>No reviews yet. Be the first to review this product!</p>
                  </div>
                  
                  <!-- Sample reviews would go here -->
                  <div *ngIf="product.ratings.count > 0" class="review-placeholder">
                    <p>Reviews will be loaded from the backend API.</p>
                  </div>
                </div>
              </div>

              <!-- Shipping Tab -->
              <div *ngIf="activeTab === 'shipping'" class="tab-panel">
                <h3>Shipping Information</h3>
                <div class="shipping-info">
                  <div class="shipping-option">
                    <strong>Standard Shipping:</strong> 5-7 business days - FREE on orders over $50
                  </div>
                  <div class="shipping-option">
                    <strong>Express Shipping:</strong> 2-3 business days - $9.99
                  </div>
                  <div class="shipping-option">
                    <strong>Overnight Shipping:</strong> Next business day - $19.99
                  </div>
                </div>
                
                <div class="return-policy">
                  <h4>Return Policy</h4>
                  <p>30-day return policy. Items must be in original condition with tags attached.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Related Products -->
          <div class="related-products" *ngIf="relatedProducts.length > 0">
            <h3>Related Products</h3>
            <div class="related-grid">
              <app-card 
                *ngFor="let relatedProduct of relatedProducts" 
                variant="default"
                [hoverable]="true"
                [clickable]="true"
                customClass="related-product-card"
                (click)="viewProduct(relatedProduct._id)"
              >
                <div class="related-image">
                  <img 
                    [src]="relatedProduct.images[0]?.url || '/assets/images/product-placeholder.jpg'" 
                    [alt]="relatedProduct.name"
                  />
                </div>
                <div class="related-info">
                  <h4>{{ relatedProduct.name }}</h4>
                  <div class="related-price">
                    {{ formatPrice(relatedProduct.price.sale || relatedProduct.price.regular) }}
                  </div>
                </div>
              </app-card>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-detail-page {
      padding: 2rem 0;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .not-found {
      text-align: center;
      padding: 3rem;
    }

    .not-found h2 {
      margin: 0 0 1rem 0;
      color: #1f2937;
    }

    .not-found p {
      margin: 0 0 2rem 0;
      color: #6b7280;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
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

    .product-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      margin-bottom: 3rem;
    }

    .product-images {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .main-image {
      position: relative;
      background: #f9fafb;
      border-radius: 12px;
      overflow: hidden;
    }

    .main-image img {
      width: 100%;
      height: 500px;
      object-fit: cover;
    }

    .image-badges {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .badge {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .badge.sale {
      background: #dc2626;
      color: white;
    }

    .badge.featured {
      background: #f59e0b;
      color: white;
    }

    .badge.out-of-stock {
      background: #6b7280;
      color: white;
    }

    .image-thumbnails {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
    }

    .image-thumbnails img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 6px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: border-color 0.2s ease;
    }

    .image-thumbnails img:hover,
    .image-thumbnails img.active {
      border-color: #3b82f6;
    }

    .product-info {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .product-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
    }

    .brand {
      margin: 0 0 1rem 0;
      color: #6b7280;
      font-size: 1.125rem;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stars {
      color: #f59e0b;
      font-size: 1.25rem;
    }

    .rating-text {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .pricing {
      padding: 1.5rem 0;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }

    .price {
      display: flex;
      align-items: baseline;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .current-price {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
    }

    .original-price {
      font-size: 1.25rem;
      text-decoration: line-through;
      color: #6b7280;
    }

    .savings {
      color: #16a34a;
      font-weight: 600;
    }

    .stock-status {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .stock-status.in-stock {
      background: #f0fdf4;
      color: #16a34a;
    }

    .stock-status.low-stock {
      background: #fef3c7;
      color: #d97706;
    }

    .stock-status.out-of-stock {
      background: #fef2f2;
      color: #dc2626;
    }

    .description h3 {
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .description p {
      color: #6b7280;
      line-height: 1.6;
    }

    .add-to-cart-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 8px;
    }

    .quantity-selector {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .quantity-selector label {
      font-weight: 600;
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      overflow: hidden;
    }

    .quantity-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: #f9fafb;
      cursor: pointer;
      font-weight: 600;
      font-size: 1.125rem;
    }

    .quantity-btn:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .quantity-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quantity-controls input {
      width: 60px;
      height: 40px;
      border: none;
      text-align: center;
      font-weight: 600;
      background: white;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
    }

    .product-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem 0;
      border-top: 1px solid #e5e7eb;
      font-size: 0.875rem;
    }

    .product-tabs {
      margin: 3rem 0;
    }

    .tab-headers {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
    }

    .tab-header {
      padding: 1rem 1.5rem;
      border: none;
      background: none;
      cursor: pointer;
      font-weight: 500;
      color: #6b7280;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .tab-header.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .tab-header:hover {
      color: #3b82f6;
    }

    .tab-content {
      padding: 2rem 0;
    }

    .tab-panel h3 {
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .tab-panel h4 {
      margin: 1.5rem 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .specifications ul {
      list-style: none;
      padding: 0;
    }

    .specifications li {
      padding: 0.5rem 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .reviews-summary {
      margin-bottom: 2rem;
    }

    .rating-overview {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
    }

    .rating-number {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
    }

    .rating-stars {
      color: #f59e0b;
      font-size: 1.25rem;
    }

    .review-count {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .shipping-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .shipping-option {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 6px;
    }

    .return-policy {
      padding: 1rem;
      background: #fef3c7;
      border-radius: 6px;
    }

    .related-products {
      margin-top: 3rem;
    }

    .related-products h3 {
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .related-product-card {
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .related-product-card:hover {
      transform: translateY(-2px);
    }

    .related-image img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 6px;
      margin-bottom: 0.75rem;
    }

    .related-info h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .related-price {
      font-weight: 600;
      color: #1f2937;
    }

    @media (max-width: 768px) {
      .product-content {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      
      .main-image img {
        height: 300px;
      }
      
      .product-header h1 {
        font-size: 1.5rem;
      }
      
      .current-price {
        font-size: 1.5rem;
      }
      
      .action-buttons {
        flex-direction: column;
      }
      
      .tab-headers {
        overflow-x: auto;
      }
      
      .related-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  loading = true;
  addingToCart = false;

  selectedImage = '';
  activeTab = 'description';
  addToCartForm: FormGroup;

  tabs = [
    { id: 'description', label: 'Description' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'shipping', label: 'Shipping & Returns' }
  ];

  // Expose Math to template
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private productService: ProductService,
    private cartService: CartService
  ) {
    this.addToCartForm = this.fb.group({
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  loadProduct(productId: string): void {
    this.loading = true;
    this.productService.getProductById(productId).subscribe({
      next: (response) => {
        if (response.success) {
          this.product = response.data;
          this.selectedImage = this.product.images[0]?.url || '';
          this.loadRelatedProducts();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.loading = false;
      }
    });
  }

  loadRelatedProducts(): void {
    if (!this.product) return;

    // Load products from the same category
    this.productService.getProducts({
      category: this.product.category?._id,
      limit: 4
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Filter out the current product
          this.relatedProducts = response.data.filter(p => p._id !== this.product?._id);
        }
      },
      error: (error) => {
        console.error('Error loading related products:', error);
      }
    });
  }

  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  increaseQuantity(): void {
    const currentQuantity = this.addToCartForm.get('quantity')?.value || 1;
    const maxQuantity = this.product?.inventory.stock || 0;

    if (currentQuantity < maxQuantity) {
      this.addToCartForm.patchValue({ quantity: currentQuantity + 1 });
    }
  }

  decreaseQuantity(): void {
    const currentQuantity = this.addToCartForm.get('quantity')?.value || 1;

    if (currentQuantity > 1) {
      this.addToCartForm.patchValue({ quantity: currentQuantity - 1 });
    }
  }

  addToCart(): void {
    if (!this.product || this.addToCartForm.invalid) return;

    this.addingToCart = true;
    const quantity = this.addToCartForm.get('quantity')?.value || 1;

    this.cartService.addToCart(this.product, quantity).subscribe({
      next: (response) => {
        if (response.success) {
          alert(`${this.product!.name} added to cart!`);
        }
        this.addingToCart = false;
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        alert('Error adding product to cart. Please try again.');
        this.addingToCart = false;
      }
    });
  }

  addToWishlist(): void {
    if (!this.product) return;

    // Wishlist functionality would be implemented here
    alert(`${this.product.name} added to wishlist!`);
  }

  viewProduct(productId: string): void {
    window.location.href = `/products/${productId}`;
  }

  getDiscountPercentage(): number {
    if (!this.product?.price.sale) return 0;
    return this.productService.calculateDiscount(
      this.product.price.regular,
      this.product.price.sale
    );
  }

  getStockMessage(): string {
    if (!this.product) return '';

    const quantity = this.product.inventory.stock;

    if (quantity === 0) {
      return 'Out of Stock';
    } else if (quantity <= 5) {
      return `Only ${quantity} left in stock`;
    } else {
      return 'In Stock';
    }
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }

  getSpecificationEntries(specifications: any): Array<{key: string, value: any}> {
    if (!specifications) return [];
    return Object.entries(specifications).map(([key, value]) => ({ key, value }));
  }
}