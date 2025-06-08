import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductsResponse, CreateProductRequest } from '../../../core/interfaces/product.interface';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  selectedCategory = '';
  searchQuery = '';
  showAddForm = false;
  editingProduct: Product | null = null;
  isLoading = false;
  error = '';
  successMessage = '';
  productForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      stock: ['', [Validators.required, Validators.min(0)]],
      sizes: [''],
      images: [null]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (response: ProductsResponse) => {
        this.products = response.products;
        this.filteredProducts = response.products;
        this.categories = [...new Set(response.products.map((p: Product) => p.category))];
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load products';
        this.isLoading = false;
        console.error('Error loading products:', error);
      }
    });
  }

  filterProducts(): void {
    let filtered = [...this.products];

    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    this.filteredProducts = filtered;
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.productForm.patchValue({
        images: Array.from(input.files)
      });
    }
  }

  startEdit(product: Product): void {
    this.editingProduct = product;
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      sizes: product.sizes?.join(', ') || ''
    });
  }

  cancelEdit(): void {
    this.showAddForm = false;
    this.editingProduct = null;
    this.productForm.reset();
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    this.isLoading = true;
    this.error = '';

    const formData = new FormData();
    const values = this.productForm.value;

    // Append basic fields
    formData.append('name', values.name);
    formData.append('description', values.description);
    formData.append('price', values.price.toString());
    formData.append('category', values.category);
    formData.append('stock', values.stock.toString());

    // Append sizes if provided
    if (values.sizes) {
      const sizes = values.sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
      formData.append('sizes', JSON.stringify(sizes));
    }

    // Append images if provided
    if (values.images) {
      const files = Array.isArray(values.images) ? values.images : [values.images];
      files.forEach((file: File) => {
        formData.append('images', file);
      });
    }

    if (this.editingProduct) {
      this.productService.updateProduct(this.editingProduct._id, formData).subscribe({
        next: () => {
          this.successMessage = 'Product updated successfully';
          this.loadProducts();
          this.cancelEdit();
        },
        error: (error) => {
          this.error = 'Failed to update product';
          console.error('Error updating product:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.productService.createProduct(formData).subscribe({
        next: () => {
          this.successMessage = 'Product added successfully';
          this.loadProducts();
          this.cancelEdit();
        },
        error: (error) => {
          this.error = 'Failed to add product';
          console.error('Error adding product:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;

    this.isLoading = true;
    this.productService.deleteProduct(product._id).subscribe({
      next: () => {
        this.successMessage = 'Product deleted successfully';
        this.loadProducts();
      },
      error: (error) => {
        this.error = 'Failed to delete product';
        console.error('Error deleting product:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
