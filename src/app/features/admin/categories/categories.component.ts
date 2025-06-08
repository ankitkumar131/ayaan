import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../interfaces/category.interface';
import { HttpErrorResponse } from '@angular/common/http';

interface CategoryWithCount extends Category {
  count: number;
  isEditing?: boolean;
  editName?: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  categories: CategoryWithCount[] = [];
  showAddForm = false;
  newCategory = '';
  error = '';
  successMessage = '';

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories: Category[]) => {
        this.categories = categories.map(category => ({
          ...category,
          count: 0, // Initialize count to 0, you might want to get this from a separate API call
          isActive: true // Set default value for required property
        }));
      },
      error: (error: HttpErrorResponse) => {
        this.error = 'Failed to load categories';
        console.error('Error loading categories:', error);
      }
    });
  }

  addCategory(): void {
    if (!this.newCategory.trim()) return;

    const exists = this.categories.some(c => c.name.toLowerCase() === this.newCategory.toLowerCase());
    
    if (exists) {
      this.error = 'Category already exists';
      return;
    }

    const newCategoryData: Partial<Category> = {
      name: this.newCategory,
      description: `Category for ${this.newCategory}`,
      isActive: true
    };

    this.categoryService.createCategory(newCategoryData).subscribe({
      next: (category: Category) => {
        this.categories.push({
          ...category,
          count: 0,
          isActive: true
        });
        this.newCategory = '';
        this.showAddForm = false;
        this.successMessage = 'Category added successfully';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.message || 'Failed to add category';
        console.error('Error adding category:', error);
      }
    });
  }

  startEdit(category: CategoryWithCount): void {
    category.isEditing = true;
    category.editName = category.name;
  }

  cancelEdit(category: CategoryWithCount): void {
    category.isEditing = false;
    category.editName = undefined;
  }

  updateCategory(category: CategoryWithCount): void {
    if (!category.editName?.trim()) return;

    const exists = this.categories.some(
      c => c.name.toLowerCase() === category.editName?.toLowerCase() && c.name !== category.name
    );

    if (exists) {
      this.error = 'Category name already exists';
      return;
    }

    const updateData: Partial<Category> = {
      name: category.editName,
      description: category.description
    };

    if (category._id) {
      this.categoryService.updateCategory(category._id, updateData).subscribe({
        next: (updatedCategory: Category) => {
          Object.assign(category, {
            ...updatedCategory,
            count: category.count,
            isEditing: false
          });
          this.successMessage = 'Category updated successfully';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error: HttpErrorResponse) => {
          this.error = error.message || 'Failed to update category';
          console.error('Error updating category:', error);
        }
      });
    } else {
      this.error = 'Category ID is missing';
    }
  }

  deleteCategory(category: CategoryWithCount): void {
    if (category.count > 0) {
      this.error = 'Cannot delete category with associated products';
      return;
    }

    if (category._id) {
      this.categoryService.deleteCategory(category._id).subscribe({
        next: () => {
          const index = this.categories.findIndex(c => c._id === category._id);
          if (index !== -1) {
            this.categories.splice(index, 1);
            this.successMessage = 'Category deleted successfully';
            setTimeout(() => this.successMessage = '', 3000);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.error = error.message || 'Failed to delete category';
          console.error('Error deleting category:', error);
        }
      });
    } else {
      this.error = 'Category ID is missing';
    }
  }
}
