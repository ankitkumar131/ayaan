import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Cart, CartItem, AddToCartRequest } from '../interfaces/cart.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  private cartItemsSubject = new BehaviorSubject<number>(0);
  cartItems$ = this.cartItemsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  private loadCart() {
    this.getCart().subscribe({
      next: (cart) => {
        this.updateCartItemsCount(cart);
      },
      error: (error) => {
        console.error('Error loading cart:', error);
      }
    });
  }

  private updateCartItemsCount(cart: Cart) {
    const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    this.cartItemsSubject.next(itemCount);
  }

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(this.apiUrl);
  }

  addToCart(data: { productId: string; quantity: number; size?: string; color?: { name: string; code: string } }): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/add`, data);
  }

  updateCartItemQuantity(itemId: string, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.apiUrl}/items/${itemId}`, { quantity });
  }

  removeCartItem(itemId: string): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/items/${itemId}`);
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clear`);
  }

  applyPromotion(code: string): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/promotion`, { code });
  }

  getCartTotal(cart: Cart): number {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getCartItemsCount(): number {
    return this.cartItemsSubject.value;
  }
}
