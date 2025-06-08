import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CartItem {
  price: number;
  quantity: number;
  name: string;
}

interface Cart {
  items: CartItem[];
  appliedPromotion?: {
    discount: number;
  };
}

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="order-summary">
      <h2>Order Summary</h2>
      <div class="items">
        <div *ngFor="let item of cart.items" class="item">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-quantity">x{{ item.quantity }}</span>
          <span class="item-price">{{ (item.price * item.quantity).toFixed(2) }}</span>
        </div>
      </div>
      <div class="summary">
        <div class="subtotal">
          <span>Subtotal:</span>
          <span>{{ getSubtotal().toFixed(2) }}</span>
        </div>
        <div class="discount" *ngIf="cart.appliedPromotion">
          <span>Discount:</span>
          <span>-{{ cart.appliedPromotion.discount.toFixed(2) }}</span>
        </div>
        <div class="total">
          <span>Total:</span>
          <span>{{ getTotal().toFixed(2) }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./order-summary.component.scss']
})
export class OrderSummaryComponent {
  @Input() cart!: Cart;

  getSubtotal(): number {
    return this.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getTotal(): number {
    const subtotal = this.getSubtotal();
    return subtotal - (this.cart.appliedPromotion?.discount || 0);
  }
}
