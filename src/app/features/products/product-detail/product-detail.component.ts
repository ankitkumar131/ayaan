import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { Product } from '../../../interfaces/product.interface';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  selectedImageIndex = signal<number>(0);
  selectedImage = computed(() => this.product?.images?.[this.selectedImageIndex()] || 'assets/images/placeholder.jpg');
  selectedSize: string | undefined = undefined;
  selectedColor: { name: string; code: string; } | undefined = undefined;
  quantity = 1;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    } else {
      this.router.navigate(['/products']);
    }
  }

  loadProduct(id: string): void {
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product = product;
        // Set default size and color if available
        if (product.sizes?.length) {
          this.selectedSize = product.sizes[0];
        }
        if (product.colors?.length) {
          this.selectedColor = product.colors[0];
        }
      },
      error: (error: any) => {
        console.error('Error loading product:', error);
        this.router.navigate(['/products']);
      }
    });
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  selectSize(size: string): void {
    this.selectedSize = size;
  }

  selectColor(color: { name: string; code: string }): void {
    this.selectedColor = color;
  }

  incrementQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  canAddToCart(): boolean {
    if (!this.product) return false;
    if (this.product.stock === 0) return false;
    if (this.product.sizes?.length && !this.selectedSize) return false;
    if (this.product.colors?.length && !this.selectedColor) return false;
    return true;
  }

  addToCartButtonText(): string {
    if (!this.product) return 'Loading...';
    if (this.product.stock === 0) return 'Out of Stock';
    if (this.product.sizes?.length && !this.selectedSize) return 'Select Size';
    if (this.product.colors?.length && !this.selectedColor) return 'Select Color';
    return 'Add to Cart';
  }

  addToCart(): void {
    if (!this.product || !this.canAddToCart()) return;

    this.cartService.addToCart({
      productId: this.product._id,
      quantity: this.quantity,
      size: this.selectedSize,
      color: this.selectedColor
    }).subscribe({
      next: () => {
        this.router.navigate(['/cart']);
      },
      error: (error: any) => {
        this.error = error.error?.message || 'Error adding to cart';
      }
    });
  }
}
