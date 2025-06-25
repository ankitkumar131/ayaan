import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { Category } from '../../../../shared/models/category.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  submitting = false;
  error: string | null = null;
  success: string | null = null;
  categoryForm!: FormGroup;
  editMode = false;
  currentCategoryId: string | null = null;
  imageFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      image: ['']
    });
  }

  loadCategories(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getAllCategories()
      .pipe(
        catchError(err => {
          this.error = 'Failed to load categories. Please try again.';
          console.error('Error loading categories:', err);
          return of([]);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;
    this.success = null;

    const formData = this.categoryForm.value;
    const categoryData: Partial<Category> = {
      name: formData.name,
      description: formData.description || ''
    };

    if (this.editMode && this.currentCategoryId) {
      this.updateCategory(this.currentCategoryId, categoryData);
    } else {
      this.createCategory(categoryData);
    }
  }

  createCategory(categoryData: Partial<Category>): void {
    this.adminService.createCategory(categoryData)
      .pipe(
        catchError(err => {
          this.error = 'Failed to create category. Please try again.';
          console.error('Error creating category:', err);
          return of(null);
        }),
        finalize(() => this.submitting = false)
      )
      .subscribe(result => {
        if (result) {
          this.success = 'Category created successfully!';
          this.resetForm();
          this.loadCategories();
        }
      });
  }

  updateCategory(id: string, categoryData: Partial<Category>): void {
    this.adminService.updateCategory(id, categoryData)
      .pipe(
        catchError(err => {
          this.error = 'Failed to update category. Please try again.';
          console.error('Error updating category:', err);
          return of(null);
        }),
        finalize(() => this.submitting = false)
      )
      .subscribe(result => {
        if (result) {
          this.success = 'Category updated successfully!';
          this.resetForm();
          this.loadCategories();
        }
      });
  }

  editCategory(category: Category): void {
    this.editMode = true;
    this.currentCategoryId = category.id;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description || ''
    });
    
    if (category.image) {
      this.imagePreview = category.image;
    }
  }

  deleteCategory(id: string): void {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      this.adminService.deleteCategory(id)
        .pipe(
          catchError(err => {
            this.error = 'Failed to delete category. Please try again.';
            console.error('Error deleting category:', err);
            return of(null);
          })
        )
        .subscribe(() => {
          this.success = 'Category deleted successfully!';
          this.loadCategories();
        });
    }
  }

  resetForm(): void {
    this.categoryForm.reset();
    this.editMode = false;
    this.currentCategoryId = null;
    this.imageFile = null;
    this.imagePreview = null;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.imageFile = input.files[0];
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(this.imageFile);
    }
  }

  removeImage(): void {
    this.imageFile = null;
    this.imagePreview = null;
    this.categoryForm.get('image')?.setValue('');
  }
}