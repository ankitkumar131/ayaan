import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { Product, ProductResponse, CreateProductRequest } from '../../../interfaces/product.interface';
import { Category } from '../../../interfaces/category.interface';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './product-management.component.html',
 styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  searchQuery = '';
  categoryFilter = '';
  isLoading = false;
  error = '';
  successMessage = '';

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalProducts = 0;
  pageSize = 10;

  // Modal state
  showModal = false;
  isEditing = false;
  currentProduct: Product | null = null;
  productForm: FormGroup;
  isSaving = false;

  // Image handling
  selectedImages: File[] = [];
  imagePreviewUrls: string[] = [];
  currentProductImages: string[] = [];
  removedImageIndexes: number[] = [];

  // Available sizes
  availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  selectedSizes: string[] = [];

  // Delete modal state
  showDeleteModal = false;
  productToDelete: Product | null = null;
  isDeleting = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) {
    this.productForm = this.createProductForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  get colorControls() {
    return this.productForm.get('colors') as FormArray;
  }

  createProductForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      gender: ['unisex'],
      colors: this.fb.array([])
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.error = 'Failed to load categories. Please refresh the page.';
      }
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = '';

    const filters = {
      page: this.currentPage,
      limit: this.pageSize,
      category: this.categoryFilter || undefined,
      search: this.searchQuery || undefined
    };

    this.productService.getProducts(filters).subscribe({
      next: (response) => {
        this.products = response.products;
        this.filteredProducts = response.products;
        this.totalPages = response.totalPages;
        this.totalProducts = response.totalProducts;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load products. Please try again.';
        console.error('Error loading products:', err);
        this.isLoading = false;
      }
    });
  }

  filterProducts(): void {
    this.currentPage = 1; // Reset to first page when filtering
    this.loadProducts();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProducts();
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  showAddProductModal(): void {
    this.isEditing = false;
    this.currentProduct = null;
    this.productForm.reset({
      price: 0,
      stock: 0,
      gender: 'unisex'
    });
    this.selectedImages = [];
    this.imagePreviewUrls = [];
    this.currentProductImages = [];
    this.removedImageIndexes = [];
    this.selectedSizes = [];
    this.resetColorFormArray();
    this.showModal = true;
  }

  editProduct(product: Product): void {
    this.isEditing = true;
    this.currentProduct = { ...product };
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      gender: product.gender || 'unisex'
    });

    // Handle sizes
    this.selectedSizes = product.sizes || [];

    // Handle colors
    this.resetColorFormArray();
    if (product.colors && product.colors.length) {
      product.colors.forEach(color => this.addColor(color.name, color.code));
    }

    // Handle images
    this.selectedImages = [];
    this.imagePreviewUrls = [];
    this.currentProductImages = product.images || [];
    this.removedImageIndexes = [];

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  resetColorFormArray(): void {
    while (this.colorControls.length) {
      this.colorControls.removeAt(0);
    }
  }

  addColor(name: string = '', code: string = '#000000'): void {
    this.colorControls.push(
      this.fb.group({
        name: [name, Validators.required],
        code: [code, Validators.required]
      })
    );
  }

  removeColor(index: number): void {
    this.colorControls.removeAt(index);
  }

  onSizeChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const size = checkbox.value;

    if (checkbox.checked) {
      if (!this.selectedSizes.includes(size)) {
        this.selectedSizes.push(size);
      }
    } else {
      this.selectedSizes = this.selectedSizes.filter(s => s !== size);
    }
  }

  isSelectedSize(size: string): boolean {
    return this.selectedSizes.includes(size);
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    this.selectedImages = [...this.selectedImages, ...files];

    // Generate preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrls.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.imagePreviewUrls.splice(index, 1);
    this.selectedImages.splice(index, 1);
  }

  removeCurrentImage(index: number): void {
    this.removedImageIndexes.push(index);
    this.currentProductImages.splice(index, 1);
  }

  saveProduct(): void {
    if (this.productForm.invalid) return;

    this.isSaving = true;
    this.error = '';

    const formData = new FormData();
    const formValue = this.productForm.value;

    // Add basic product info
    formData.append('name', formValue.name);
    formData.append('description', formValue.description);
    formData.append('price', formValue.price);
    formData.append('stock', formValue.stock);
    formData.append('category', formValue.category);
    formData.append('gender', formValue.gender);

    // Add sizes
    if (this.selectedSizes.length) {
      this.selectedSizes.forEach(size => {
        formData.append('sizes[]', size);
      });
    }

    // Add colors
    if (formValue.colors && formValue.colors.length) {
      formData.append('colors', JSON.stringify(formValue.colors));
    }

    // Add new images
    if (this.selectedImages.length) {
      this.selectedImages.forEach(image => {
        formData.append('images', image);
      });
    }

    // Handle removed images if editing
    if (this.isEditing && this.currentProduct && this.removedImageIndexes.length) {
      formData.append('removedImageIndexes', JSON.stringify(this.removedImageIndexes));
    }

    if (this.isEditing && this.currentProduct) {
      // Update existing product
      this.productService.updateProduct(this.currentProduct._id, formData).subscribe({
        next: (updatedProduct) => {
          this.handleSaveSuccess('Product updated successfully');
        },
        error: (err) => {
          this.handleSaveError(err);
        }
      });
    } else {
      // Create new product
      this.productService.createProduct(formData).subscribe({
        next: (newProduct) => {
          this.handleSaveSuccess('Product created successfully');
        },
        error: (err) => {
          this.handleSaveError(err);
        }
      });
    }
  }

  handleSaveSuccess(message: string): void {
    this.successMessage = message;
    this.isSaving = false;
    this.showModal = false;
    this.loadProducts(); // Refresh the product list
    setTimeout(() => this.successMessage = '', 3000);
  }

  handleSaveError(err: any): void {
    this.error = 'Failed to save product. Please try again.';
    console.error('Error saving product:', err);
    this.isSaving = false;
  }

  confirmDeleteProduct(product: Product): void {
    this.productToDelete = product;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.productToDelete = null;
    this.showDeleteModal = false;
  }

  deleteProduct(): void {
    if (!this.productToDelete) return;

    this.isDeleting = true;
    this.error = '';

    this.productService.deleteProduct(this.productToDelete._id).subscribe({
      next: () => {
        this.successMessage = `Product "${this.productToDelete?.name}" deleted successfully`;
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.loadProducts(); // Refresh the product list
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = 'Failed to delete product. Please try again.';
        console.error('Error deleting product:', err);
        this.isDeleting = false;
      }
    });
  }
}
