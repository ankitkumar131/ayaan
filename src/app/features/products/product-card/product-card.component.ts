import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../interfaces/product.interface';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;

  constructor(private cartService: CartService) {}

  onAddToCart(): void {
    if (this.product.stock === 0) return;

    this.cartService.addToCart({
      productId: this.product._id,
      quantity: 1
    }).subscribe({
      error: (error) => {
        console.error('Error adding to cart:', error);
      }
    });
  }
}
