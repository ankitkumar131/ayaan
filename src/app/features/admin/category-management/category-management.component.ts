import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/interfaces/category.interface';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss'],
})


export class CategoryManagementComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  searchQuery = '';
  isLoading = false;
  error = '';
  successMessage = '';

  // Modal state
  showModal = false;
  isEditing = false;
  currentCategory: Category | null = null;
  categoryForm: FormGroup;
  isSaving = false;

  // Delete modal state
  showDeleteModal = false;
  categoryToDelete: Category | null = null;
  isDeleting = false;

  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) {
    this.categoryForm = this.createCategoryForm();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  createCategoryForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  loadCategories(): void {
    this.isLoading = true;
    this.error = '';

    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.filteredCategories = categories;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load categories. Please try again.';
        console.error('Error loading categories:', err);
        this.isLoading = false;
      }
    });
  }

  filterCategories(): void {
    if (!this.searchQuery.trim()) {
      this.filteredCategories = [...this.categories];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredCategories = this.categories.filter(c => 
      c.name.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
    );
  }

  showAddCategoryModal(): void {
    this.isEditing = false;
    this.currentCategory = null;
    this.categoryForm.reset();
    this.showModal = true;
  }

  editCategory(category: Category): void {
    this.isEditing = true;
    this.currentCategory = { ...category };
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;

    this.isSaving = true;
    this.error = '';

    const categoryData = this.categoryForm.value;

    if (this.isEditing && this.currentCategory) {
      // Update existing category
      this.categoryService.updateCategory(this.currentCategory.id, categoryData).subscribe({
        next: (updatedCategory) => {
          this.handleSaveSuccess('Category updated successfully');
        },
        error: (err) => {
          this.handleSaveError(err);
        }
      });
    } else {
      // Create new category
      this.categoryService.createCategory(categoryData).subscribe({
        next: (newCategory) => {
          this.handleSaveSuccess('Category created successfully');
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
    this.loadCategories(); // Refresh the category list
    setTimeout(() => this.successMessage = '', 3000);
  }

  handleSaveError(err: any): void {
    this.error = 'Failed to save category. Please try again.';
    console.error('Error saving category:', err);
    this.isSaving = false;
  }

  confirmDeleteCategory(category: Category): void {
    this.categoryToDelete = category;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.categoryToDelete = null;
    this.showDeleteModal = false;
  }

  deleteCategory(): void {
    if (!this.categoryToDelete) return;

    this.isDeleting = true;
    this.error = '';

    this.categoryService.deleteCategory(this.categoryToDelete.id).subscribe({
      next: () => {
        this.successMessage = `Category "${this.categoryToDelete?.name}" deleted successfully`;
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.loadCategories(); // Refresh the category list
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = 'Failed to delete category. Please try again.';
        console.error('Error deleting category:', err);
        this.isDeleting = false;
      }
    });
  }
}
