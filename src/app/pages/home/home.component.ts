import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { ProductService } from '../../core/services/product.service';
import { Product, Category } from '../../core/interfaces/product.interface';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { FeatureNavigationComponent } from '../../shared/components/feature-navigation/feature-navigation.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ButtonComponent, 
    CardComponent, 
    LoadingComponent,
    FeatureNavigationComponent
  ],
  template: `
    <div class="home-page">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="container">
          <div class="hero-content">
            <div class="hero-text">
              <h1 class="hero-title">
                Discover Your Perfect Style
              </h1>
              <p class="hero-description">
                Explore our curated collection of premium fashion for men and women. 
                From casual wear to formal attire, find everything you need to express your unique style.
              </p>
              <div class="hero-actions">
                <app-button 
                  variant="primary" 
                  size="lg"
                  routerLink="/products"
                >
                  Shop Now
                </app-button>
                <app-button 
                  variant="outline" 
                  size="lg"
                  routerLink="/products/featured"
                >
                  View Featured
                </app-button>
              </div>
            </div>
            <div class="hero-image">
              <img 
                src="/assets/images/hero-fashion.jpg" 
                alt="Fashion Collection"
                class="hero-img"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Feature Navigation Section -->
      <section class="feature-nav-section">
        <div class="container">
          <app-feature-navigation></app-feature-navigation>
        </div>
      </section>

      <!-- Categories Section -->
      <section class="categories-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Shop by Category</h2>
            <p class="section-description">
              Discover our diverse range of fashion categories
            </p>
          </div>

          <div class="categories-grid" *ngIf="!loadingCategories; else categoriesLoading">
            <div 
              *ngFor="let category of featuredCategories" 
              class="category-card"
              [routerLink]="['/products/category', category.slug]"
            >
              <div class="category-image">
                <img 
                  [src]="category.image || '/assets/images/category-placeholder.jpg'" 
                  [alt]="category.name"
                />
              </div>
              <div class="category-info">
                <h3 class="category-name">{{ category.name }}</h3>
                <p class="category-description">{{ category.description }}</p>
              </div>
            </div>
          </div>

          <ng-template #categoriesLoading>
            <div class="loading-grid">
              <app-loading type="skeleton" *ngFor="let item of [1,2,3,4]"></app-loading>
            </div>
          </ng-template>
        </div>
      </section>

      <!-- Featured Products Section -->
      <section class="featured-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Featured Products</h2>
            <p class="section-description">
              Hand-picked items from our latest collection
            </p>
          </div>

          <div class="products-grid" *ngIf="!loadingProducts; else productsLoading">
            <app-card 
              *ngFor="let product of featuredProducts" 
              variant="default"
              [hoverable]="true"
              [clickable]="true"
              customClass="product-card"
              [routerLink]="['/products', product._id]"
            >
              <div class="product-image">
                <img 
                  [src]="product.images[0]?.url || '/assets/images/product-placeholder.jpg'" 
                  [alt]="product.name"
                />
                <div class="product-badge" *ngIf="product.price.sale">
                  {{ getDiscountPercentage(product) }}% OFF
                </div>
              </div>
              
              <div class="product-info">
                <h3 class="product-name">{{ product.name }}</h3>
                <p class="product-brand" *ngIf="product.brand">{{ product.brand }}</p>
                
                <div class="product-rating" *ngIf="product.ratings.count > 0">
                  <span class="rating-stars">
                    {{ '★'.repeat(Math.floor(product.ratings.average)) }}{{ '☆'.repeat(5 - Math.floor(product.ratings.average)) }}
                  </span>
                  <span class="rating-count">({{ product.ratings.count }})</span>
                </div>
                
                <div class="product-price">
                  <span class="current-price">
                    {{ formatPrice(product.price.sale || product.price.regular) }}
                  </span>
                  <span 
                    *ngIf="product.price.sale" 
                    class="original-price"
                  >
                    {{ formatPrice(product.price.regular) }}
                  </span>
                </div>
              </div>
            </app-card>
          </div>

          <ng-template #productsLoading>
            <div class="loading-grid">
              <app-loading type="skeleton" *ngFor="let item of [1,2,3,4,5,6,7,8]"></app-loading>
            </div>
          </ng-template>

          <div class="section-footer">
            <app-button 
              variant="outline" 
              size="lg"
              routerLink="/products"
            >
              View All Products
            </app-button>
          </div>
        </div>
      </section>

      <!-- Newsletter Section -->
      <section class="newsletter-section">
        <div class="container">
          <div class="newsletter-content">
            <div class="newsletter-text">
              <h2 class="newsletter-title">Stay in Style</h2>
              <p class="newsletter-description">
                Subscribe to our newsletter and be the first to know about new arrivals, 
                exclusive offers, and fashion tips.
              </p>
            </div>
            <div class="newsletter-form">
              <app-button 
                variant="primary" 
                size="lg"
                routerLink="/newsletter"
              >
                Subscribe Now
              </app-button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  featuredCategories: Category[] = [];
  loadingProducts = true;
  loadingCategories = true;

  // Expose Math to template
  Math = Math;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
    this.loadFeaturedCategories();
  }

  private loadFeaturedProducts(): void {
    this.productService.getFeaturedProducts(8).subscribe({
      next: (response) => {
        if (response.success) {
          this.featuredProducts = response.data;
        }
        this.loadingProducts = false;
      },
      error: (error) => {
        console.error('Error loading featured products:', error);
        this.loadingProducts = false;
      }
    });
  }

  private loadFeaturedCategories(): void {
    this.productService.getFeaturedCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.featuredCategories = response.data.slice(0, 4);
        }
        this.loadingCategories = false;
      },
      error: (error) => {
        console.error('Error loading featured categories:', error);
        this.loadingCategories = false;
      }
    });
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }

  getDiscountPercentage(product: Product): number {
    if (!product.price.sale) return 0;
    return this.productService.calculateDiscount(product.price.regular, product.price.sale);
  }
}