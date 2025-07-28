import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ProductService } from '../../../../core/services/product.service';
import { Product, Category } from '../../../../core/interfaces/product.interface';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    CardComponent,
    LoadingComponent
  ],
  template: `
    <div class="admin-products">
      <div class="container">
        <!-- Header -->
        <div class="page-header">
          <h1>Product Management</h1>
          <div class="header-actions">
            <app-button 
              variant="outline" 
              (click)="showCategoryForm = !showCategoryForm"
            >
              {{ showCategoryForm ? 'Hide' : 'Add Category' }}
            </app-button>
            <app-button 
              variant="primary" 
              (click)="showProductForm = !showProductForm"
            >
              {{ showProductForm ? 'Hide' : 'Add Product' }}
            </app-button>
          </div>
        </div>

        <!-- Category Form -->
        <app-card *ngIf="showCategoryForm" class="form-card">
          <h2>Add New Category</h2>
          <form [formGroup]="categoryForm" (ngSubmit)="onSubmitCategory()">
            <div class="form-grid">
              <div class="form-group">
                <label for="categoryName">Category Name *</label>
                <input 
                  id="categoryName"
                  type="text" 
                  formControlName="name"
                  placeholder="Enter category name"
                />
                <div class="error" *ngIf="categoryForm.get('name')?.invalid && categoryForm.get('name')?.touched">
                  Category name is required
                </div>
              </div>

              <div class="form-group">
                <label for="categorySlug">Slug</label>
                <input 
                  id="categorySlug"
                  type="text" 
                  formControlName="slug"
                  placeholder="Auto-generated from name"
                />
              </div>

              <div class="form-group full-width">
                <label for="categoryDescription">Description</label>
                <textarea 
                  id="categoryDescription"
                  formControlName="description"
                  placeholder="Enter category description"
                  rows="3"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="categoryImage">Image URL</label>
                <input 
                  id="categoryImage"
                  type="url" 
                  formControlName="image"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    formControlName="isActive"
                  />
                  Active Category
                </label>
              </div>
            </div>

            <div class="form-actions">
              <app-button 
                type="button" 
                variant="outline" 
                (click)="resetCategoryForm()"
              >
                Reset
              </app-button>
              <app-button 
                type="submit" 
                variant="primary"
                [disabled]="categoryForm.invalid || submittingCategory"
              >
                {{ submittingCategory ? 'Adding...' : 'Add Category' }}
              </app-button>
            </div>
          </form>
        </app-card>

        <!-- Product Form -->
        <app-card *ngIf="showProductForm" class="form-card">
          <h2>Add New Product</h2>
          <form [formGroup]="productForm" (ngSubmit)="onSubmitProduct()">
            <div class="form-grid">
              <!-- Basic Info -->
              <div class="form-group">
                <label for="productName">Product Name *</label>
                <input 
                  id="productName"
                  type="text" 
                  formControlName="name"
                  placeholder="Enter product name"
                />
                <div class="error" *ngIf="productForm.get('name')?.invalid && productForm.get('name')?.touched">
                  Product name is required
                </div>
              </div>

              <div class="form-group">
                <label for="productBrand">Brand</label>
                <input 
                  id="productBrand"
                  type="text" 
                  formControlName="brand"
                  placeholder="Enter brand name"
                />
              </div>

              <div class="form-group">
                <label for="productCategory">Category *</label>
                <select id="productCategory" formControlName="category">
                  <option value="">Select Category</option>
                  <option *ngFor="let category of categories" [value]="category._id">
                    {{ category.name }}
                  </option>
                </select>
                <div class="error" *ngIf="productForm.get('category')?.invalid && productForm.get('category')?.touched">
                  Category is required
                </div>
              </div>

              <div class="form-group full-width">
                <label for="productDescription">Description *</label>
                <textarea 
                  id="productDescription"
                  formControlName="description"
                  placeholder="Enter product description"
                  rows="4"
                ></textarea>
                <div class="error" *ngIf="productForm.get('description')?.invalid && productForm.get('description')?.touched">
                  Description is required
                </div>
              </div>

              <!-- Pricing -->
              <div class="form-group">
                <label for="regularPrice">Regular Price *</label>
                <input 
                  id="regularPrice"
                  type="number" 
                  formControlName="regularPrice"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <div class="error" *ngIf="productForm.get('regularPrice')?.invalid && productForm.get('regularPrice')?.touched">
                  Regular price is required
                </div>
              </div>

              <div class="form-group">
                <label for="salePrice">Sale Price</label>
                <input 
                  id="salePrice"
                  type="number" 
                  formControlName="salePrice"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <!-- Inventory -->
              <div class="form-group">
                <label for="stockQuantity">Stock Quantity *</label>
                <input 
                  id="stockQuantity"
                  type="number" 
                  formControlName="stockQuantity"
                  placeholder="0"
                  min="0"
                />
                <div class="error" *ngIf="productForm.get('stockQuantity')?.invalid && productForm.get('stockQuantity')?.touched">
                  Stock quantity is required
                </div>
              </div>

              <div class="form-group">
                <label for="sku">SKU</label>
                <input 
                  id="sku"
                  type="text" 
                  formControlName="sku"
                  placeholder="Enter SKU"
                />
              </div>

              <!-- Images -->
              <div class="form-group full-width">
                <label>Product Images</label>
                <div formArrayName="images">
                  <div 
                    *ngFor="let imageControl of getImageControls(); let i = index" 
                    class="image-input-group"
                  >
                    <input 
                      type="url" 
                      [formControlName]="i"
                      placeholder="https://example.com/image.jpg"
                    />
                    <app-button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      (click)="removeImage(i)"
                      *ngIf="getImageControls().length > 1"
                    >
                      Remove
                    </app-button>
                  </div>
                  <app-button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    (click)="addImage()"
                  >
                    Add Image
                  </app-button>
                </div>
              </div>

              <!-- Status -->
              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    formControlName="isActive"
                  />
                  Active Product
                </label>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    formControlName="isFeatured"
                  />
                  Featured Product
                </label>
              </div>
            </div>

            <div class="form-actions">
              <app-button 
                type="button" 
                variant="outline" 
                (click)="resetProductForm()"
              >
                Reset
              </app-button>
              <app-button 
                type="submit" 
                variant="primary"
                [disabled]="productForm.invalid || submittingProduct"
              >
                {{ submittingProduct ? 'Adding...' : 'Add Product' }}
              </app-button>
            </div>
          </form>
        </app-card>

        <!-- Categories List -->
        <app-card class="list-card">
          <div class="card-header">
            <h2>Categories</h2>
            <app-button variant="outline" size="sm" (click)="loadCategories()">
              Refresh
            </app-button>
          </div>
          
          <div class="categories-list" *ngIf="!loadingCategories; else categoriesLoading">
            <div *ngFor="let category of categories" class="category-item">
              <div class="category-info">
                <img 
                  [src]="category.image || '/assets/images/category-placeholder.jpg'" 
                  [alt]="category.name"
                  class="category-image"
                />
                <div class="category-details">
                  <h3>{{ category.name }}</h3>
                  <p>{{ category.description }}</p>
                  <span class="category-status" [class.active]="category.isActive">
                    {{ category.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
              <div class="category-actions">
                <app-button variant="outline" size="sm">Edit</app-button>
                <app-button variant="danger" size="sm">Delete</app-button>
              </div>
            </div>
          </div>

          <ng-template #categoriesLoading>
            <app-loading type="skeleton"></app-loading>
          </ng-template>
        </app-card>

        <!-- Products List -->
        <app-card class="list-card">
          <div class="card-header">
            <h2>Products</h2>
            <app-button variant="outline" size="sm" (click)="loadProducts()">
              Refresh
            </app-button>
          </div>
          
          <div class="products-list" *ngIf="!loadingProducts; else productsLoading">
            <div *ngFor="let product of products" class="product-item">
              <div class="product-info">
                <img 
                  [src]="product.images[0]?.url || '/assets/images/product-placeholder.jpg'" 
                  [alt]="product.name"
                  class="product-image"
                />
                <div class="product-details">
                  <h3>{{ product.name }}</h3>
                  <p>{{ product.brand }}</p>
                  <div class="product-price">
                    <span class="current-price">{{ formatPrice(product.price.sale || product.price.regular) }}</span>
                    <span *ngIf="product.price.sale" class="original-price">{{ formatPrice(product.price.regular) }}</span>
                  </div>
                  <div class="product-meta">
                    <span class="stock">Stock: {{ product.inventory.stock }}</span>
                    <span class="status" [class.active]="product.isActive">
                      {{ product.isActive ? 'Active' : 'Inactive' }}
                    </span>
                    <span *ngIf="product.isFeatured" class="featured">Featured</span>
                  </div>
                </div>
              </div>
              <div class="product-actions">
                <app-button variant="outline" size="sm">Edit</app-button>
                <app-button variant="danger" size="sm">Delete</app-button>
              </div>
            </div>
          </div>

          <ng-template #productsLoading>
            <app-loading type="skeleton"></app-loading>
          </ng-template>
        </app-card>
      </div>
    </div>
  `,
  styles: [`
    .admin-products {
      padding: 2rem 0;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .form-card {
      margin-bottom: 2rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: auto;
    }

    .error {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .image-input-group {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      align-items: center;
    }

    .image-input-group input {
      flex: 1;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .list-card {
      margin-bottom: 2rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .categories-list,
    .products-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .category-item,
    .product-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .category-info,
    .product-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .category-image,
    .product-image {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
    }

    .category-details h3,
    .product-details h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .category-details p,
    .product-details p {
      margin: 0 0 0.5rem 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .category-status,
    .status {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #fef2f2;
      color: #dc2626;
    }

    .category-status.active,
    .status.active {
      background: #f0fdf4;
      color: #16a34a;
    }

    .product-price {
      margin-bottom: 0.5rem;
    }

    .current-price {
      font-weight: 600;
      color: #1f2937;
    }

    .original-price {
      margin-left: 0.5rem;
      text-decoration: line-through;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .product-meta {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .stock,
    .featured {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .featured {
      background: #fef3c7;
      color: #d97706;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .category-actions,
    .product-actions {
      display: flex;
      gap: 0.5rem;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      
      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }
      
      .header-actions {
        justify-content: center;
      }
    }
  `]
})
export class AdminProductsComponent implements OnInit {
  showProductForm = false;
  showCategoryForm = false;

  productForm!: FormGroup;
  categoryForm!: FormGroup;

  products: Product[] = [];
  categories: Category[] = [];

  loadingProducts = true;
  loadingCategories = true;
  submittingProduct = false;
  submittingCategory = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  private initializeForms(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      slug: [''],
      description: [''],
      image: [''],
      isActive: [true]
    });

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      brand: [''],
      category: ['', Validators.required],
      description: ['', Validators.required],
      regularPrice: [0, [Validators.required, Validators.min(0)]],
      salePrice: [0, Validators.min(0)],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      sku: [''],
      images: this.fb.array([this.fb.control('')]),
      isActive: [true],
      isFeatured: [false]
    });

    // Auto-generate slug from category name
    this.categoryForm.get('name')?.valueChanges.subscribe(name => {
      if (name) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        this.categoryForm.patchValue({ slug }, { emitEvent: false });
      }
    });
  }

  get imageFormArray() {
    return this.productForm.get('images') as FormArray;
  }

  getImageControls() {
    return this.imageFormArray.controls;
  }

  addImage(): void {
    this.imageFormArray.push(this.fb.control(''));
  }

  removeImage(index: number): void {
    this.imageFormArray.removeAt(index);
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        if (response.success) {
          this.products = response.data;
        }
        this.loadingProducts = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loadingProducts = false;
      }
    });
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.productService.getAllCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.categories = response.data;
        }
        this.loadingCategories = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loadingCategories = false;
      }
    });
  }

  onSubmitCategory(): void {
    if (this.categoryForm.valid) {
      this.submittingCategory = true;
      const formData = this.categoryForm.value;
      
      // Remove slug since it's auto-generated by the backend
      const categoryData = {
        name: formData.name,
        description: formData.description,
        image: formData.image,
        isActive: formData.isActive
      };

      this.productService.createCategory(categoryData).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Category created successfully!');
            this.resetCategoryForm();
            this.loadCategories();
            this.showCategoryForm = false;
          }
          this.submittingCategory = false;
        },
        error: (error) => {
          console.error('Error creating category:', error);
          alert('Error creating category. Please try again.');
          this.submittingCategory = false;
        }
      });
    }
  }

  onSubmitProduct(): void {
    if (this.productForm.valid) {
      this.submittingProduct = true;
      const formData = this.productForm.value;

      const productData = {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        description: formData.description,
        price: {
          regular: formData.regularPrice,
          sale: formData.salePrice || undefined,
          currency: 'USD'
        },
        inventory: {
          quantity: formData.stockQuantity,
          stock: formData.stockQuantity,
          lowStockThreshold: 5,
          trackQuantity: true
        },
        sku: formData.sku || `SKU-${Date.now()}`,
        images: formData.images.filter((url: string) => url.trim()).map((url: string) => ({ url })),
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        variants: [],
        specifications: {},
        tags: []
      };

      this.productService.createProduct(productData).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Product created successfully!');
            this.resetProductForm();
            this.loadProducts();
            this.showProductForm = false;
          }
          this.submittingProduct = false;
        },
        error: (error) => {
          console.error('Error creating product:', error);
          alert('Error creating product. Please try again.');
          this.submittingProduct = false;
        }
      });
    }
  }

  resetCategoryForm(): void {
    this.categoryForm.reset({
      isActive: true
    });
  }

  resetProductForm(): void {
    this.productForm.reset({
      isActive: true,
      isFeatured: false
    });
    // Reset images array to single empty control
    while (this.imageFormArray.length > 1) {
      this.imageFormArray.removeAt(1);
    }
    this.imageFormArray.at(0).setValue('');
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }
}