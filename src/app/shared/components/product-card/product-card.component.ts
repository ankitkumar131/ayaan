import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;
  isAddingToCart = false;

  constructor(private cartService: CartService) {}

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.isAddingToCart) return;
    
    this.isAddingToCart = true;
    
    this.cartService.addToCart(this.product.id, 1).subscribe({
      next: () => {
        this.isAddingToCart = false;
      },
      error: (error) => {
        console.error('Error adding product to cart', error);
        this.isAddingToCart = false;
      }
    });
  }

  getDiscountPercentage(): number {
    if (this.product.discountPrice && this.product.price > this.product.discountPrice) {
      return Math.round(((this.product.price - this.product.discountPrice) / this.product.price) * 100);
    }
    return 0;
  }
}