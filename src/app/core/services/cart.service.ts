import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { 
  Cart, 
  AddToCartRequest, 
  ApplyPromotionRequest 
} from '../interfaces/cart.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly API_URL = 'http://localhost:3000/api/cart';
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  cart$ = this.cartSubject.asObservable();
  cartItemCount$ = this.cart$.pipe(
    map(cart => cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0)
  );

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  private loadCart(): void {
    if (localStorage.getItem('token')) {
      this.getCart().subscribe();
    }
  }

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(this.API_URL)
      .pipe(
        tap(cart => this.cartSubject.next(cart))
      );
  }

  addToCart(data: AddToCartRequest): Observable<Cart> {
    return this.http.post<Cart>(`${this.API_URL}/add`, data)
      .pipe(
        tap(cart => this.cartSubject.next(cart))
      );
  }

  updateQuantity(productId: string, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.API_URL}/quantity`, { productId, quantity })
      .pipe(
        tap(cart => this.cartSubject.next(cart))
      );
  }

  removeFromCart(productId: string): Observable<Cart> {
    return this.http.delete<Cart>(`${this.API_URL}/item/${productId}`)
      .pipe(
        tap(cart => this.cartSubject.next(cart))
      );
  }

  clearCart(): Observable<Cart> {
    return this.http.delete<Cart>(this.API_URL)
      .pipe(
        tap(cart => this.cartSubject.next(cart))
      );
  }

  applyPromotion(data: ApplyPromotionRequest): Observable<Cart> {
    return this.http.post<Cart>(`${this.API_URL}/apply-promotion`, data)
      .pipe(
        tap(cart => this.cartSubject.next(cart))
      );
  }

  removePromotion(): Observable<Cart> {
    return this.http.delete<Cart>(`${this.API_URL}/promotion`)
      .pipe(
        tap(cart => this.cartSubject.next(cart))
      );
  }
} 