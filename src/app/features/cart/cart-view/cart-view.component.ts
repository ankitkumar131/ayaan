import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart.service';
import { CartItemComponent } from '../cart-item/cart-item.component';
import { Cart } from '../../../interfaces/cart.interface';

interface QuantityChangeEvent {
  itemId: string;
  quantity: number;
}

@Component({
  selector: 'app-cart-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CartItemComponent],
  templateUrl: './cart-view.component.html',
  styleUrls: ['./cart-view.component.scss']
})
export class CartViewComponent implements OnInit {
  cart: Cart | null = null;
  promotionCode = '';
  isApplyingPromotion = false;
  error: string | null = null;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.cartService.getCart().subscribe({
      next: (cart) => {
        if (!cart.items.length) {
          this.cart = null;
          return;
        }
        this.cart = cart;
      },
      error: (error) => {
        this.error = error.error?.message || 'Error loading cart';
      }
    });
  }

  updateItemQuantity(itemId: string, quantity: number): void {
    if (!this.cart) return;

    this.cartService.updateCartItemQuantity(itemId, quantity).subscribe({
      next: (cart) => {
        this.cart = cart;
      },
      error: (error) => {
        this.error = error.error?.message || 'Error updating quantity';
      }
    });
  }

  removeItem(itemId: string): void {
    if (!this.cart) return;

    this.cartService.removeCartItem(itemId).subscribe({
      next: (cart) => {
        this.cart = cart;
      },
      error: (error) => {
        this.error = error.error?.message || 'Error removing item';
      }
    });
  }

  clearCart(): void {
    if (!this.cart) return;

    this.cartService.clearCart().subscribe({
      next: () => {
        this.cart = null;
      },
      error: (error) => {
        this.error = error.error?.message || 'Error clearing cart';
      }
    });
  }

  getSubtotal(): number {
    if (!this.cart?.items.length) return 0;
    return this.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getTotal(): number {
    const subtotal = this.getSubtotal();
    if (!this.cart?.appliedPromotion) return subtotal;
    return subtotal - this.cart.appliedPromotion.discount;
  }

  applyPromotion(): void {
    if (!this.promotionCode || !this.cart) return;

    this.isApplyingPromotion = true;
    this.error = null;

    this.cartService.applyPromotion(this.promotionCode).subscribe({
      next: (cart) => {
        this.cart = cart;
        this.promotionCode = '';
        this.isApplyingPromotion = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Error applying promotion';
        this.isApplyingPromotion = false;
      }
    });
  }
}
