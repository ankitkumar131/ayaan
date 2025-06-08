import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { Category } from '../../models/category.model';
import { Cart } from '../../models/cart.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  categories: Category[] = [];
  isAuthenticated = false;
  isAdmin = false;
  cart: Cart | null = null;
  isMobileMenuOpen = false;
  isSearchOpen = false;
  searchQuery = '';

  constructor(
    private categoryService: CategoryService,
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.setupAuthListener();
    this.setupCartListener();
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories', error);
      }
    });
  }

  setupAuthListener(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.isAdmin = user?.role === 'admin';
    });
  }

  setupCartListener(): void {
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
    });
  }

  logout(): void {
    this.authService.logout();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
  }
}