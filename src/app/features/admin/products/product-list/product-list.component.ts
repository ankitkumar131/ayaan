import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { Product } from '../../../../shared/models/product.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  totalProducts = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;
  error: string | null = null;
  searchTerm = '';
  categoryFilter = '';
  categories: any[] = [];
  sortBy = 'createdAt';
  sortOrder = 'desc';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;

    const filters = {
      search: this.searchTerm || undefined,
      category: this.categoryFilter || undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    this.adminService.getAllProducts(this.currentPage, this.pageSize, filters)
      .pipe(
        catchError(err => {
          this.error = 'Failed to load products. Please try again.';
          console.error('Error loading products:', err);
          return of({ products: [], total: 0 });
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(response => {
        this.products = response.products;
        this.totalProducts = response.total;
      });
  }

  loadCategories(): void {
    this.adminService.getAllCategories()
      .pipe(
        catchError(err => {
          console.error('Error loading categories:', err);
          return of([]);
        })
      )
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProducts();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  onSortChange(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.loadProducts();
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.adminService.deleteProduct(id)
        .pipe(
          catchError(err => {
            alert('Failed to delete product. Please try again.');
            console.error('Error deleting product:', err);
            return of(null);
          })
        )
        .subscribe(() => {
          this.loadProducts();
        });
    }
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) {
      return 'fa-sort';
    }
    return this.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  get totalPages(): number {
    return Math.ceil(this.totalProducts / this.pageSize);
  }

  get pages(): number[] {
    const totalPages = this.totalPages;
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (this.currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }
    
    if (this.currentPage >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
    }
    
    return Array.from({ length: 5 }, (_, i) => this.currentPage - 2 + i);
  }
}