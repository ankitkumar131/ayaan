import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { Product, Category } from '../../../../core/interfaces/product.interface';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule,
    ButtonComponent, 
    CardComponent, 
    LoadingComponent
  ],
  template: `
    <div class="product-list-page">
      <div class="container">
        <!-- Page Header -->
        <div class="page-header">
          <div class="breadcrumb">
            <a routerLink="/home">Home</a>
            <span>/</span>
            <span *ngIf="currentCategory">{{ currentCategory.name }}</span>
            <span *ngIf="!currentCategory">All Products</span>
          </div>
          <h1>
            {{ currentCategory?.name || 'All Products' }}
            <span class="product-count" *ngIf="!loading">({{ totalProducts }} items)</span>
          </h1>
          <p *ngIf="currentCategory?.description" class="category-description">
            {{ currentCategory?.description }}
          </p>
        </div>

        <div class="content-wrapper">
          <!-- Sidebar Filters -->
          <aside class="filters-sidebar">
            <div class="filter-section">
              <h3>Categories</h3>
              <div class="category-filters">
                <label class="filter-option">
                  <input 
                    type="radio" 
                    name="category" 
                    value=""
                    [checked]="!selectedCategoryId"
                    (change)="onCategoryChange('')"
                  />
                  All Categories
                </label>
                <label 
                  *ngFor="let category of categories" 
                  class="filter-option"
                >
                  <input 
                    type="radio" 
                    name="category" 
                    [value]="category._id"
                    [checked]="selectedCategoryId === category._id"
                    (change)="onCategoryChange(category._id)"
                  />
                  {{ category.name }}
                </label>
              </div>
            </div>

            <div class="filter-section">
              <h3>Price Range</h3>
              <form [formGroup]="filterForm" (ngSubmit)="applyFilters()">
                <div class="price-inputs">
                  <input 
                    type="number" 
                    formControlName="minPrice"
                    placeholder="Min"
                    min="0"
                  />
                  <span>to</span>
                  <input 
                    type="number" 
                    formControlName="maxPrice"
                    placeholder="Max"
                    min="0"
                  />
                </div>
                <app-button type="submit" variant="outline" size="sm">
                  Apply
                </app-button>
              </form>
            </div>

            <div class="filter-section">
              <h3>Sort By</h3>
              <select (change)="onSortChange($event)" [value]="currentSort">
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
                <option value="newest">Newest First</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            <div class="filter-section">
              <h3>Filters</h3>
              <label class="filter-option">
                <input 
                  type="checkbox" 
                  [checked]="showOnlyInStock"
                  (change)="toggleInStockFilter()"
                />
                In Stock Only
              </label>
              <label class="filter-option">
                <input 
                  type="checkbox" 
                  [checked]="showOnlyOnSale"
                  (change)="toggleOnSaleFilter()"
                />
                On Sale Only
              </label>
              <label class="filter-option">
                <input 
                  type="checkbox" 
                  [checked]="showOnlyFeatured"
                  (change)="toggleFeaturedFilter()"
                />
                Featured Only
              </label>
            </div>
          </aside>

          <!-- Products Grid -->
          <main class="products-main">
            <div class="products-header">
              <div class="view-options">
                <button 
                  class="view-btn"
                  [class.active]="viewMode === 'grid'"
                  (click)="viewMode = 'grid'"
                >
                  Grid
                </button>
                <button 
                  class="view-btn"
                  [class.active]="viewMode === 'list'"
                  (click)="viewMode = 'list'"
                >
                  List
                </button>
              </div>
              
              <div class="results-info" *ngIf="!loading">
                Showing {{ products.length }} of {{ totalProducts }} products
              </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="loading" class="loading-grid">
              <app-loading type="skeleton" *ngFor="let item of [1,2,3,4,5,6,7,8]"></app-loading>
            </div>

            <!-- Products Grid View -->
            <div 
              *ngIf="!loading && viewMode === 'grid'" 
              class="products-grid"
            >
              <app-card 
                *ngFor="let product of products" 
                variant="default"
                [hoverable]="true"
                [clickable]="true"
                customClass="product-card"
              >
                <div class="product-image" (click)="viewProduct(product._id)">
                  <img 
                    [src]="product.images[0]?.url || '/assets/images/product-placeholder.jpg'" 
                    [alt]="product.name"
                  />
                  <div class="product-badges">
                    <span class="badge sale" *ngIf="product.price.sale">
                      {{ getDiscountPercentage(product) }}% OFF
                    </span>
                    <span class="badge featured" *ngIf="product.isFeatured">
                      Featured
                    </span>
                    <span class="badge out-of-stock" *ngIf="product.inventory.stock === 0">
                      Out of Stock
                    </span>
                  </div>
                </div>
                
                <div class="product-info">
                  <h3 class="product-name" (click)="viewProduct(product._id)">
                    {{ product.name }}
                  </h3>
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

                  <div class="product-actions">
                    <app-button 
                      variant="primary" 
                      size="sm"
                      [disabled]="product.inventory.stock === 0"
                      (click)="addToCart(product)"
                    >
                      {{ product.inventory.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
                    </app-button>
                    <app-button 
                      variant="outline" 
                      size="sm"
                      (click)="viewProduct(product._id)"
                    >
                      View Details
                    </app-button>
                  </div>
                </div>
              </app-card>
            </div>

            <!-- Products List View -->
            <div 
              *ngIf="!loading && viewMode === 'list'" 
              class="products-list"
            >
              <div *ngFor="let product of products" class="product-list-item">
                <div class="product-image" (click)="viewProduct(product._id)">
                  <img 
                    [src]="product.images[0]?.url || '/assets/images/product-placeholder.jpg'" 
                    [alt]="product.name"
                  />
                </div>
                
                <div class="product-details">
                  <h3 class="product-name" (click)="viewProduct(product._id)">
                    {{ product.name }}
                  </h3>
                  <p class="product-brand" *ngIf="product.brand">{{ product.brand }}</p>
                  <p class="product-description">{{ product.description | slice:0:150 }}...</p>
                  
                  <div class="product-meta">
                    <div class="product-rating" *ngIf="product.ratings.count > 0">
                      <span class="rating-stars">
                        {{ '★'.repeat(Math.floor(product.ratings.average)) }}{{ '☆'.repeat(5 - Math.floor(product.ratings.average)) }}
                      </span>
                      <span class="rating-count">({{ product.ratings.count }})</span>
                    </div>
                    
                    <div class="product-badges">
                      <span class="badge sale" *ngIf="product.price.sale">
                        {{ getDiscountPercentage(product) }}% OFF
                      </span>
                      <span class="badge featured" *ngIf="product.isFeatured">Featured</span>
                    </div>
                  </div>
                </div>
                
                <div class="product-price-actions">
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
                  
                  <div class="product-actions">
                    <app-button 
                      variant="primary"
                      [disabled]="product.inventory.stock === 0"
                      (click)="addToCart(product)"
                    >
                      {{ product.inventory.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
                    </app-button>
                    <app-button 
                      variant="outline"
                      (click)="viewProduct(product._id)"
                    >
                      View Details
                    </app-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="!loading && products.length === 0" class="empty-state">
              <h3>No products found</h3>
              <p>Try adjusting your filters or search criteria.</p>
              <app-button variant="outline" (click)="clearFilters()">
                Clear Filters
              </app-button>
            </div>

            <!-- Pagination -->
            <div *ngIf="!loading && totalPages > 1" class="pagination">
              <app-button 
                variant="outline" 
                [disabled]="currentPage === 1"
                (click)="goToPage(currentPage - 1)"
              >
                Previous
              </app-button>
              
              <span class="page-info">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              
              <app-button 
                variant="outline" 
                [disabled]="currentPage === totalPages"
                (click)="goToPage(currentPage + 1)"
              >
                Next
              </app-button>
            </div>
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-list-page {
      padding: 2rem 0;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .breadcrumb a {
      color: #3b82f6;
      text-decoration: none;
    }

    .breadcrumb a:hover {
      text-decoration: underline;
    }

    .page-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .product-count {
      font-size: 1rem;
      font-weight: 400;
      color: #6b7280;
    }

    .category-description {
      color: #6b7280;
      margin: 0;
    }

    .content-wrapper {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 2rem;
    }

    .filters-sidebar {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 8px;
      height: fit-content;
      position: sticky;
      top: 2rem;
    }

    .filter-section {
      margin-bottom: 2rem;
    }

    .filter-section:last-child {
      margin-bottom: 0;
    }

    .filter-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .category-filters {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .price-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .price-inputs input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .filter-section select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .products-main {
      flex: 1;
    }

    .products-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .view-options {
      display: flex;
      gap: 0.5rem;
    }

    .view-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .view-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .results-info {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .product-card {
      transition: transform 0.2s ease;
    }

    .product-card:hover {
      transform: translateY(-2px);
    }

    .product-image {
      position: relative;
      cursor: pointer;
      margin-bottom: 1rem;
    }

    .product-image img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 6px;
    }

    .product-badges {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge.sale {
      background: #dc2626;
      color: white;
    }

    .badge.featured {
      background: #f59e0b;
      color: white;
    }

    .badge.out-of-stock {
      background: #6b7280;
      color: white;
    }

    .product-info {
      padding: 0 1rem 1rem;
    }

    .product-name {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      color: #1f2937;
    }

    .product-name:hover {
      color: #3b82f6;
    }

    .product-brand {
      margin: 0 0 0.5rem 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .product-rating {
      margin-bottom: 0.5rem;
    }

    .rating-stars {
      color: #f59e0b;
      margin-right: 0.25rem;
    }

    .rating-count {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .product-price {
      margin-bottom: 1rem;
    }

    .current-price {
      font-weight: 600;
      color: #1f2937;
      font-size: 1.125rem;
    }

    .original-price {
      margin-left: 0.5rem;
      text-decoration: line-through;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .product-actions {
      display: flex;
      gap: 0.5rem;
    }

    .products-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .product-list-item {
      display: grid;
      grid-template-columns: 150px 1fr auto;
      gap: 1.5rem;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .product-list-item .product-image img {
      width: 150px;
      height: 150px;
    }

    .product-details {
      flex: 1;
    }

    .product-description {
      color: #6b7280;
      margin: 0.5rem 0;
      line-height: 1.5;
    }

    .product-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
    }

    .product-price-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: #1f2937;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .page-info {
      color: #6b7280;
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .content-wrapper {
        grid-template-columns: 1fr;
      }
      
      .filters-sidebar {
        position: static;
      }
      
      .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      }
      
      .product-list-item {
        grid-template-columns: 1fr;
        text-align: center;
      }
      
      .product-price-actions {
        align-items: center;
      }
    }
  `]
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  currentCategory: Category | null = null;
  
  loading = true;
  viewMode: 'grid' | 'list' = 'grid';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalProducts = 0;
  pageSize = 12;
  
  // Filters
  selectedCategoryId = '';
  currentSort = 'name_asc';
  showOnlyInStock = false;
  showOnlyOnSale = false;
  showOnlyFeatured = false;
  
  filterForm: FormGroup;
  
  // Expose Math to template
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private productService: ProductService,
    private cartService: CartService
  ) {
    this.filterForm = this.fb.group({
      minPrice: [''],
      maxPrice: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    
    // Handle route parameters
    this.route.params.subscribe(params => {
      if (params['slug']) {
        this.loadCategoryBySlug(params['slug']);
      } else {
        this.selectedCategoryId = '';
        this.currentCategory = null;
        this.loadProducts();
      }
    });
  }

  loadCategories(): void {
    this.productService.getAllCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.categories = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadCategoryBySlug(slug: string): void {
    this.productService.getCategoryBySlug(slug).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentCategory = response.data;
          this.selectedCategoryId = response.data._id;
          this.loadProducts();
        }
      },
      error: (error) => {
        console.error('Error loading category:', error);
        this.loadProducts();
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    
    const filters = {
      category: this.selectedCategoryId,
      minPrice: this.filterForm.get('minPrice')?.value,
      maxPrice: this.filterForm.get('maxPrice')?.value,
      inStock: this.showOnlyInStock,
      onSale: this.showOnlyOnSale,
      featured: this.showOnlyFeatured,
      sort: this.currentSort as any,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.productService.getProducts(filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.products = response.data;
          this.totalProducts = response.pagination?.total || 0;
          this.totalPages = response.pagination?.pages || 1;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    });
  }

  onCategoryChange(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    this.currentCategory = this.categories.find(c => c._id === categoryId) || null;
    this.currentPage = 1;
    this.loadProducts();
  }

  onSortChange(event: any): void {
    this.currentSort = event.target.value;
    this.currentPage = 1;
    this.loadProducts();
  }

  toggleInStockFilter(): void {
    this.showOnlyInStock = !this.showOnlyInStock;
    this.currentPage = 1;
    this.loadProducts();
  }

  toggleOnSaleFilter(): void {
    this.showOnlyOnSale = !this.showOnlyOnSale;
    this.currentPage = 1;
    this.loadProducts();
  }

  toggleFeaturedFilter(): void {
    this.showOnlyFeatured = !this.showOnlyFeatured;
    this.currentPage = 1;
    this.loadProducts();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  clearFilters(): void {
    this.selectedCategoryId = '';
    this.currentCategory = null;
    this.currentSort = 'name_asc';
    this.showOnlyInStock = false;
    this.showOnlyOnSale = false;
    this.showOnlyFeatured = false;
    this.filterForm.reset();
    this.currentPage = 1;
    this.loadProducts();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadProducts();
  }

  viewProduct(productId: string): void {
    // Navigate to product detail page
    window.location.href = `/products/${productId}`;
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1).subscribe({
      next: (response) => {
        if (response.success) {
          alert(`${product.name} added to cart!`);
        }
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        alert('Error adding product to cart. Please try again.');
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