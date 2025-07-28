import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { 
  Cart, 
  CartItem, 
  AddToCartRequest, 
  UpdateCartItemRequest,
  ApplyPromotionRequest,
  CartSummary,
  ShippingEstimate
} from '../interfaces/cart.interface';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  private cartSubject = new BehaviorSubject<Cart | null>(null);
  private cartSummarySubject = new BehaviorSubject<CartSummary>({
    itemCount: 0,
    subtotal: 0,
    total: 0
  });

  public cart$ = this.cartSubject.asObservable();
  public cartSummary$ = this.cartSummarySubject.asObservable();

  // Cart Management
  getCart(): Observable<ApiResponse<Cart>> {
    return this.get<Cart>('/cart')
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateCartState(response.data);
          }
        })
      );
  }

  addToCart(request: AddToCartRequest): Observable<ApiResponse<Cart>>;
  addToCart(product: any, quantity: number): Observable<ApiResponse<Cart>>;
  addToCart(requestOrProduct: AddToCartRequest | any, quantity?: number): Observable<ApiResponse<Cart>> {
    let request: AddToCartRequest;
    
    if (quantity !== undefined) {
      // Called with product and quantity
      request = {
        productId: requestOrProduct._id,
        quantity: quantity,
        variant: requestOrProduct.selectedVariant || null
      };
    } else {
      // Called with AddToCartRequest
      request = requestOrProduct;
    }

    return this.post<Cart>('/cart/add', request)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateCartState(response.data);
          }
        })
      );
  }

  updateCartItem(itemId: string, request: UpdateCartItemRequest): Observable<ApiResponse<Cart>>;
  updateCartItem(itemId: string, quantity: number): Observable<ApiResponse<Cart>>;
  updateCartItem(itemId: string, requestOrQuantity: UpdateCartItemRequest | number): Observable<ApiResponse<Cart>> {
    let request: UpdateCartItemRequest;
    
    if (typeof requestOrQuantity === 'number') {
      request = { quantity: requestOrQuantity };
    } else {
      request = requestOrQuantity;
    }

    return this.put<Cart>(`/cart/update/${itemId}`, request)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateCartState(response.data);
          }
        })
      );
  }

  removeFromCart(itemId: string): Observable<ApiResponse<Cart>> {
    return this.delete<Cart>(`/cart/remove/${itemId}`)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateCartState(response.data);
          }
        })
      );
  }

  clearCart(): Observable<ApiResponse<any>> {
    return this.delete('/cart/clear')
      .pipe(
        tap(response => {
          if (response.success) {
            this.clearCartState();
          }
        })
      );
  }

  // Promotion Management
  applyPromotion(request: ApplyPromotionRequest): Observable<ApiResponse<Cart>> {
    return this.post<Cart>('/cart/apply-promotion', request)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateCartState(response.data);
          }
        })
      );
  }

  removePromotion(): Observable<ApiResponse<Cart>> {
    return this.delete<Cart>('/cart/remove-promotion')
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateCartState(response.data);
          }
        })
      );
  }

  // Cart Validation
  validateCart(): Observable<ApiResponse<any>> {
    return this.post('/cart/validate', {});
  }

  // Cart Summary
  getCartSummary(): Observable<ApiResponse<CartSummary>> {
    return this.get<CartSummary>('/cart/summary')
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.cartSummarySubject.next(response.data);
          }
        })
      );
  }

  getCartCount(): Observable<ApiResponse<{ count: number }>> {
    return this.get<{ count: number }>('/cart/count');
  }

  // Shipping Estimation
  estimateShipping(address: any): Observable<ApiResponse<ShippingEstimate[]>> {
    return this.post<ShippingEstimate[]>('/cart/estimate-shipping', address);
  }

  // State Management
  private updateCartState(cart: Cart): void {
    this.cartSubject.next(cart);
    this.updateCartSummary(cart);
  }

  private updateCartSummary(cart: Cart): void {
    const summary: CartSummary = {
      itemCount: cart.items.reduce((total, item) => total + item.quantity, 0),
      subtotal: cart.pricing.subtotal,
      total: cart.pricing.total
    };
    this.cartSummarySubject.next(summary);
  }

  private clearCartState(): void {
    this.cartSubject.next(null);
    this.cartSummarySubject.next({
      itemCount: 0,
      subtotal: 0,
      total: 0
    });
  }

  // Getters
  getCurrentCart(): Cart | null {
    return this.cartSubject.value;
  }

  getCurrentCartSummary(): CartSummary {
    return this.cartSummarySubject.value;
  }

  getItemCount(): number {
    const cart = this.getCurrentCart();
    return cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
  }

  getSubtotal(): number {
    const cart = this.getCurrentCart();
    return cart ? cart.pricing.subtotal : 0;
  }

  getTotal(): number {
    const cart = this.getCurrentCart();
    return cart ? cart.pricing.total : 0;
  }

  // Utility Methods
  isItemInCart(productId: string, variant?: any): boolean {
    const cart = this.getCurrentCart();
    if (!cart) return false;

    return cart.items.some(item => {
      const productMatch = item.product._id === productId;
      if (!variant) return productMatch;
      
      const variantMatch = item.variant?.size === variant.size && 
                          item.variant?.color.name === variant.color;
      return productMatch && variantMatch;
    });
  }

  getCartItem(productId: string, variant?: any): CartItem | undefined {
    const cart = this.getCurrentCart();
    if (!cart) return undefined;

    return cart.items.find(item => {
      const productMatch = item.product._id === productId;
      if (!variant) return productMatch;
      
      const variantMatch = item.variant?.size === variant.size && 
                          item.variant?.color.name === variant.color;
      return productMatch && variantMatch;
    });
  }

  getItemQuantity(productId: string, variant?: any): number {
    const item = this.getCartItem(productId, variant);
    return item ? item.quantity : 0;
  }

  hasPromotion(): boolean {
    const cart = this.getCurrentCart();
    return cart ? !!cart.promotion : false;
  }

  getPromotionCode(): string | null {
    const cart = this.getCurrentCart();
    return cart?.promotion?.code || null;
  }

  getDiscountAmount(): number {
    const cart = this.getCurrentCart();
    return cart ? cart.pricing.discount : 0;
  }

  // Price Formatting
  formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  // Cart Persistence (for guest users)
  saveCartToLocalStorage(): void {
    const cart = this.getCurrentCart();
    if (cart) {
      localStorage.setItem('guest_cart', JSON.stringify(cart));
    }
  }

  loadCartFromLocalStorage(): Cart | null {
    const cartStr = localStorage.getItem('guest_cart');
    return cartStr ? JSON.parse(cartStr) : null;
  }

  clearLocalStorageCart(): void {
    localStorage.removeItem('guest_cart');
  }
}