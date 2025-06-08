import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product, ProductResponse } from '../../../interfaces/product.interface';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss'],
  styles: [`
    .wishlist-page {
      padding: 2rem;
      background-color: #f9fafb;
      min-height: calc(100vh - 4rem);
    }

    .wishlist-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .alert {
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .alert.error {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .alert.success {
      background-color: #d1fae5;
      color: #059669;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .product-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .product-image {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
    }

    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .product-image:hover img {
      transform: scale(1.05);
    }

    .product-actions {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1rem;
      background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
      display: flex;
      gap: 0.5rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .product-image:hover .product-actions {
      opacity: 1;
    }

    .action-btn {
      flex: 1;
      padding: 0.5rem;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .action-btn.add-to-cart {
      background: #3b82f6;
      color: white;
    }

    .action-btn.add-to-cart:hover {
      background: #2563eb;
    }

    .action-btn.add-to-cart:disabled {
      background: #93c5fd;
      cursor: not-allowed;
    }

    .action-btn.remove {
      background: #ef4444;
      color: white;
    }

    .action-btn.remove:hover {
      background: #dc2626;
    }

    .product-info {
      padding: 1rem;
    }

    .product-info h3 {
      margin: 0 0 0.5rem;
      color: #111827;
    }

    .price {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .product-meta {
      display: flex;
      justify-content: space-between;
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .stock.low-stock {
      color: #dc2626;
    }

    .product-variants {
      margin-top: 0.5rem;
    }

    .variant-label {
      display: block;
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .size-options {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .size-option {
      padding: 0.25rem 0.5rem;
      background: #f3f4f6;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #374151;
    }

    .empty-wishlist {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .empty-wishlist p {
      color: #6b7280;
      margin-bottom: 1rem;
    }

    .shop-btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: #10b981;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
    }

    .loading {
      text-align: center;
      color: #6b7280;
      padding: 2rem;
    }

    @media (max-width: 640px) {
      .products-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WishlistComponent implements OnInit {
  wishlistItems: Product[] = [];
  isLoading = true;
  error = '';
  successMessage = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    const wishlistIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
    
    if (wishlistIds.length === 0) {
      this.isLoading = false;
      return;
    }

    this.productService.getProducts().subscribe({
      next: (response: ProductResponse) => {
        this.wishlistItems = response.products.filter(
          (product: Product) => wishlistIds.includes(product._id)
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load wishlist';
        this.isLoading = false;
        console.error('Error loading wishlist:', error);
      }
    });
  }

  addToCart(product: Product): void {
    if (product.stock === 0) return;

    this.cartService.addToCart({
      productId: product._id,
      quantity: 1
    }).subscribe({
      next: () => {
        this.successMessage = 'Added to cart successfully';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.error = 'Failed to add to cart';
        console.error('Error adding to cart:', error);
      }
    });
  }

  removeFromWishlist(product: Product): void {
    const wishlistIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const updatedIds = wishlistIds.filter((id: string) => id !== product._id);
    localStorage.setItem('wishlist', JSON.stringify(updatedIds));

    this.wishlistItems = this.wishlistItems.filter(item => item._id !== product._id);
    this.successMessage = 'Removed from wishlist';
    setTimeout(() => this.successMessage = '', 3000);
  }
}
