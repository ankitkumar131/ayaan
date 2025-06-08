import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Cart, CartItem } from '../../shared/models/cart.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();
  private localStorageKey = 'cart_data';

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadCart();
  }

  private loadCart(): void {
    if (this.authService.isAuthenticated()) {
      this.fetchCart().subscribe();
    } else {
      const localCart = localStorage.getItem(this.localStorageKey);
      if (localCart) {
        try {
          this.cartSubject.next(JSON.parse(localCart));
        } catch (error) {
          console.error('Error parsing cart data from localStorage', error);
          this.clearCart();
        }
      }
    }
  }

  fetchCart(): Observable<Cart> {
    return this.http.get<Cart>(this.apiUrl).pipe(
      tap(cart => {
        this.cartSubject.next(cart);
      }),
      catchError(error => {
        console.error('Error fetching cart', error);
        return of({ items: [], totalItems: 0, totalPrice: 0 });
      })
    );
  }

  addToCart(productId: string, quantity: number = 1): Observable<Cart> {
    if (this.authService.isAuthenticated()) {
      return this.http.post<Cart>(`${this.apiUrl}/add`, { productId, quantity }).pipe(
        tap(cart => {
          this.cartSubject.next(cart);
        })
      );
    } else {
      // Handle guest cart in localStorage
      return this.addToLocalCart(productId, quantity);
    }
  }

  private addToLocalCart(productId: string, quantity: number): Observable<Cart> {
    const currentCart = this.cartSubject.value || { items: [], totalItems: 0, totalPrice: 0 };
    
    // Check if item already exists in cart
    const existingItemIndex = currentCart.items.findIndex(item => item.product.id === productId);
    
    if (existingItemIndex > -1) {
      // Update quantity if item exists
      currentCart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      // Note: In a real app, you would fetch product details from an API
      // This is a simplified version
      currentCart.items.push({
        product: { id: productId, name: 'Product', price: 0, image: '' },
        quantity: quantity
      });
    }
    
    // Update cart totals
    this.updateCartTotals(currentCart);
    
    // Save to localStorage
    localStorage.setItem(this.localStorageKey, JSON.stringify(currentCart));
    this.cartSubject.next(currentCart);
    
    return of(currentCart);
  }

  updateCartItem(productId: string, quantity: number): Observable<Cart> {
    if (this.authService.isAuthenticated()) {
      return this.http.put<Cart>(`${this.apiUrl}/update`, { productId, quantity }).pipe(
        tap(cart => {
          this.cartSubject.next(cart);
        })
      );
    } else {
      // Handle guest cart in localStorage
      return this.updateLocalCartItem(productId, quantity);
    }
  }

  private updateLocalCartItem(productId: string, quantity: number): Observable<Cart> {
    const currentCart = this.cartSubject.value || { items: [], totalItems: 0, totalPrice: 0 };
    
    const existingItemIndex = currentCart.items.findIndex(item => item.product.id === productId);
    
    if (existingItemIndex > -1) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        currentCart.items.splice(existingItemIndex, 1);
      } else {
        // Update quantity
        currentCart.items[existingItemIndex].quantity = quantity;
      }
      
      // Update cart totals
      this.updateCartTotals(currentCart);
      
      // Save to localStorage
      localStorage.setItem(this.localStorageKey, JSON.stringify(currentCart));
      this.cartSubject.next(currentCart);
    }
    
    return of(currentCart);
  }

  removeFromCart(productId: string): Observable<Cart> {
    if (this.authService.isAuthenticated()) {
      return this.http.delete<Cart>(`${this.apiUrl}/remove/${productId}`).pipe(
        tap(cart => {
          this.cartSubject.next(cart);
        })
      );
    } else {
      // Handle guest cart in localStorage
      return this.removeFromLocalCart(productId);
    }
  }

  private removeFromLocalCart(productId: string): Observable<Cart> {
    const currentCart = this.cartSubject.value || { items: [], totalItems: 0, totalPrice: 0 };
    
    const existingItemIndex = currentCart.items.findIndex(item => item.product.id === productId);
    
    if (existingItemIndex > -1) {
      // Remove item
      currentCart.items.splice(existingItemIndex, 1);
      
      // Update cart totals
      this.updateCartTotals(currentCart);
      
      // Save to localStorage
      localStorage.setItem(this.localStorageKey, JSON.stringify(currentCart));
      this.cartSubject.next(currentCart);
    }
    
    return of(currentCart);
  }

  clearCart(): Observable<Cart> {
    if (this.authService.isAuthenticated()) {
      return this.http.delete<Cart>(`${this.apiUrl}/clear`).pipe(
        tap(cart => {
          this.cartSubject.next(cart);
        })
      );
    } else {
      // Handle guest cart in localStorage
      localStorage.removeItem(this.localStorageKey);
      const emptyCart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
      this.cartSubject.next(emptyCart);
      return of(emptyCart);
    }
  }

  private updateCartTotals(cart: Cart): void {
    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }

  getCartCount(): Observable<number> {
    return this.cart$.pipe(
      map(cart => cart ? cart.totalItems : 0)
    );
  }

  getCartTotal(): Observable<number> {
    return this.cart$.pipe(
      map(cart => cart ? cart.totalPrice : 0)
    );
  }

  // Method to sync guest cart with user cart after login
  syncCart(): Observable<Cart> {
    const localCart = localStorage.getItem(this.localStorageKey);
    if (!localCart) {
      return this.fetchCart();
    }

    try {
      const parsedCart = JSON.parse(localCart) as Cart;
      if (parsedCart.items.length === 0) {
        return this.fetchCart();
      }

      // Convert local cart items to format expected by API
      const cartItems = parsedCart.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      // Sync with server
      return this.http.post<Cart>(`${this.apiUrl}/sync`, { items: cartItems }).pipe(
        tap(cart => {
          this.cartSubject.next(cart);
          // Clear local storage cart after sync
          localStorage.removeItem(this.localStorageKey);
        })
      );
    } catch (error) {
      console.error('Error syncing cart', error);
      return this.fetchCart();
    }
  }
}