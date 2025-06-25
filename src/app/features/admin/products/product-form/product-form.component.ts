import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { Product } from '../../../../shared/models/product.model';
import { Category } from '../../../../shared/models/category.model';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
  productForm!: FormGroup;
  categories: Category[] = [];
  loading = false;
  submitting = false;
  error: string | null = null;
  productId: string | null = null;
  isEditMode = false;
  imagePreviewUrls: string[] = [];
  imageFiles: File[] = [];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    
    this.productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.productId;
    
    if (this.isEditMode && this.productId) {
      this.loadProduct(this.productId);
    }
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      discountPrice: [null],
      category: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      features: this.fb.array([]),
      specifications: this.fb.array([]),
      isFeatured: [false],
      isNewArrival: [false]
    });
  }

  loadCategories(): void {
    this.adminService.getAllCategories()
      .pipe(
        catchError(err => {
          this.error = 'Failed to load categories. Please try again.';
          console.error('Error loading categories:', err);
          return of([]);
        })
      )
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.error = null;

    this.adminService.getProductById(id)
      .pipe(
        catchError(err => {
          this.error = 'Failed to load product. Please try again.';
          console.error('Error loading product:', err);
          return of(null as unknown as Product);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(product => {
        if (product) {
          this.populateForm(product);
          if (product.images && product.images.length > 0) {
            this.imagePreviewUrls = [...product.images];
          }
        }
      });
  }

  populateForm(product: Product): void {
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice,
      category: product.category.id || product.category,
      stock: product.stock,
      isFeatured: product.isFeatured || false,
      isNewArrival: product.isNewArrival || false
    });

    // Clear and repopulate features
    this.features.clear();
    if (product.features && product.features.length > 0) {
      product.features.forEach(feature => {
        this.addFeature(feature);
      });
    }

    // Clear and repopulate specifications
    this.specifications.clear();
    if (product.specifications) {
      Object.entries(product.specifications).forEach(([key, value]) => {
        this.addSpecification(key, value);
      });
    }
  }

  get features(): FormArray {
    return this.productForm.get('features') as FormArray;
  }

  get specifications(): FormArray {
    return this.productForm.get('specifications') as FormArray;
  }

  addFeature(value: string = ''): void {
    this.features.push(this.fb.control(value, Validators.required));
  }

  removeFeature(index: number): void {
    this.features.removeAt(index);
  }

  addSpecification(key: string = '', value: string = ''): void {
    this.specifications.push(
      this.fb.group({
        key: [key, Validators.required],
        value: [value, Validators.required]
      })
    );
  }

  removeSpecification(index: number): void {
    this.specifications.removeAt(index);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const files = Array.from(input.files);
      this.imageFiles = [...this.imageFiles, ...files];
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number): void {
    this.imagePreviewUrls.splice(index, 1);
    if (index < this.imageFiles.length) {
      this.imageFiles.splice(index, 1);
    }
  }

  prepareFormData(): FormData | Record<string, any> {
    const formValue = this.productForm.value;

    // For image uploads, use FormData
    if (this.imageFiles.length > 0 || this.imagePreviewUrls.some(url => url.startsWith('http'))) {
      const formData = new FormData();

      // Append basic product information
      formData.append('name', formValue.name);
      formData.append('description', formValue.description);
      formData.append('price', formValue.price.toString());
      formData.append('stock', formValue.stock.toString());
      formData.append('category', formValue.category);
      
      if (formValue.discountPrice) {
        formData.append('discountPrice', formValue.discountPrice.toString());
      }
      
      formData.append('isFeatured', formValue.isFeatured.toString());
      formData.append('isNewArrival', formValue.isNewArrival.toString());

      // Append features
      if (formValue.features && formValue.features.length > 0) {
        formValue.features.forEach((feature: string) => {
          formData.append('features[]', feature);
        });
      }

      // Append specifications
      if (formValue.specifications && formValue.specifications.length > 0) {
        formValue.specifications.forEach((spec: { key: string; value: string }) => {
          formData.append('specifications[]', JSON.stringify(spec));
        });
      }

      // Append image files
      this.imageFiles.forEach((file: File) => {
        formData.append('images', file);
      });

      // Append existing image URLs for edit mode
      this.imagePreviewUrls.forEach((url: string) => {
        if (url.startsWith('http')) {
          formData.append('existingImages[]', url);
        }
      });

      return formData;
    }

    // For regular updates without images, use JSON
    const specObj: Record<string, string> = {};
    formValue.specifications.forEach((spec: {key: string, value: string}) => {
      specObj[spec.key] = spec.value;
    });

    // Ensure category is a string ID
    let categoryId = formValue.category;
    if (typeof categoryId === 'object' && categoryId?.id) {
      categoryId = categoryId.id;
    }

    return {
      name: formValue.name,
      description: formValue.description,
      price: formValue.price,
      discountPrice: formValue.discountPrice || null,
      category: categoryId,
      stock: formValue.stock,
      features: formValue.features,
      specifications: specObj,
      isFeatured: formValue.isFeatured,
      isNewArrival: formValue.isNewArrival
    };
  }

  async onSubmit(): Promise<void> {
    if (!this.productForm || !this.productForm.valid) {
      this.productForm?.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    try {
      const formData = this.prepareFormData();
      
      if (this.isEditMode && this.productId) {
        await this.updateProduct(this.productId, formData);
      } else {
        await this.createProduct(formData);
      }
    } catch (err) {
      this.error = `Failed to ${this.isEditMode ? 'update' : 'create'} product. Please try again.`;
      console.error(`Error ${this.isEditMode ? 'updating' : 'creating'} product:`, err);
    } finally {
      this.submitting = false;
    }
  }

  async createProduct(productData: any): Promise<void> {
    this.adminService.createProduct(productData)
      .pipe(
        switchMap(product => {
          if (this.imageFiles.length > 0) {
            return this.uploadImages(product.id);
          }
          return of(product);
        }),
        catchError(err => {
          this.error = 'Failed to create product. Please try again.';
          console.error('Error creating product:', err);
          return of(null);
        })
      )
      .subscribe(result => {
        if (result) {
          this.router.navigate(['/admin/products']);
        }
      });
  }

  async updateProduct(id: string, productData: any): Promise<void> {
    this.adminService.updateProduct(id, productData)
      .pipe(
        switchMap(product => {
          if (this.imageFiles.length > 0) {
            return this.uploadImages(product.id);
          }
          return of(product);
        }),
        catchError(err => {
          this.error = 'Failed to update product. Please try again.';
          console.error('Error updating product:', err);
          return of(null);
        })
      )
      .subscribe(result => {
        if (result) {
          this.router.navigate(['/admin/products']);
        }
      });
  }

  async uploadImages(productId: string): Promise<any> {
    const uploadPromises = this.imageFiles.map(file => {
      const formData = new FormData();
      formData.append('image', file);
      
      return this.adminService.uploadProductImage(productId, formData).toPromise();
    });

    try {
      await Promise.all(uploadPromises);
      return this.adminService.getProductById(productId).toPromise();
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  }
}