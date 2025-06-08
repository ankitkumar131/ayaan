import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartItem } from '../../../interfaces/cart.interface';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-item.component.html',
  styleUrls: ['./cart-item.component.scss']
})
export class CartItemComponent {
  @Input() item!: CartItem;
  @Output() quantityChange = new EventEmitter<{ itemId: string; quantity: number }>();
  @Output() remove = new EventEmitter<string>();

  updateQuantity(newQuantity: number): void {
    if (!this.item || newQuantity < 1 || newQuantity > this.item.maxQuantity) return;
    this.quantityChange.emit({ itemId: this.item._id, quantity: newQuantity });
  }

  onRemove(): void {
    if (!this.item) return;
    this.remove.emit(this.item._id);
  }
}
