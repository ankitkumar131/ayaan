import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { Promotion } from '../../../../shared/models/promotion.model';
import { Product } from '../../../../shared/models/product.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-promotion-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './promotion-management.component.html',
  styleUrls: ['./promotion-management.component.scss']
})
export class PromotionManagementComponent implements OnInit {
  // Add Math property to make it available in the template
  Math = Math;
  promotions: Promotion[] = [];
  products: Product[] = [];
  categories: any[] = [];
  promotionForm: FormGroup;
  loading = false;
  submitting = false;
  error: string | null = null;
  success: string | null = null;
  editMode = false;
  currentPromotionId: string | null = null;
  searchTerm = '';
  statusFilter = 'all';
  sortField = 'createdAt';
  sortDirection = 'desc';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPromotions = 0;
  totalPages = 0;
  
  private searchSubject = new Subject<string>();

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.promotionForm = this.createPromotionForm();
  }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadPromotions();
    this.loadProducts();
    this.loadCategories();
  }

  createPromotionForm(): FormGroup {
    return this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      discountType: ['percentage', Validators.required],
      discountValue: [null, [Validators.required, Validators.min(0)]],
      minPurchase: [null, Validators.min(0)],
      maxDiscount: [null, Validators.min(0)],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      isActive: [true],
      usageLimit: [null, Validators.min(0)],
      applicableProducts: [[]],
      applicableCategories: [[]]
    }, { validators: this.dateRangeValidator });
  }

  dateRangeValidator(formGroup: FormGroup) {
    const startDate = formGroup.get('startDate')?.value;
    const endDate = formGroup.get('endDate')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        return { dateRange: true };
      }
    }

    return null;
  }

  setupSearchSubscription(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1; // Reset to first page on new search
      this.loadPromotions();
    });
  }

  onSearch(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(searchValue);
  }

  loadPromotions(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getAllPromotions(this.currentPage, this.pageSize).subscribe({

      next: (response: any) => {
        this.promotions = response.promotions;
        this.totalPromotions = response.total;
        this.totalPages = Math.ceil(this.totalPromotions / this.pageSize);
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load promotions. ' + (err.error?.message || err.message || 'Unknown error');
        this.loading = false;
      }
    });
  }

  loadProducts(): void {
    this.adminService.getAllProducts(1, 100).subscribe({
      next: (response: any) => {
        this.products = response.products;
      },
      error: (err: any) => {
        console.error('Failed to load products:', err);
      }
    });
  }

  loadCategories(): void {
    this.adminService.getAllCategories().subscribe({
      next: (response: any) => {
        this.categories = response;
      },
      error: (err: any) => {
        console.error('Failed to load categories:', err);
      }
    });
  }

  onStatusFilterChange(event: Event): void {
    this.statusFilter = (event.target as HTMLSelectElement).value;
    this.currentPage = 1; // Reset to first page
    this.loadPromotions();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      // Toggle sort direction if clicking the same field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Default to descending for a new sort field
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.loadPromotions();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.loadPromotions();
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show a subset of pages with current page in the middle if possible
      const halfWay = Math.floor(maxPagesToShow / 2);
      
      // Start page calculation
      let startPage = this.currentPage - halfWay;
      if (startPage < 1) {
        startPage = 1;
      }
      
      // End page calculation
      let endPage = startPage + maxPagesToShow - 1;
      if (endPage > this.totalPages) {
        endPage = this.totalPages;
        // Adjust start page if we're at the end
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  onSubmit(): void {
    if (this.promotionForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.promotionForm.controls).forEach(key => {
        const control = this.promotionForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    this.error = null;
    this.success = null;

    const promotionData = this.prepareFormData();

    if (this.editMode && this.currentPromotionId) {
      this.updatePromotion(this.currentPromotionId, promotionData);
    } else {
      this.createPromotion(promotionData);
    }
  }

  prepareFormData(): any {
    const formValue = { ...this.promotionForm.value };
    
    // Format dates to ISO strings
    if (formValue.startDate) {
      formValue.startDate = new Date(formValue.startDate).toISOString();
    }
    
    if (formValue.endDate) {
      formValue.endDate = new Date(formValue.endDate).toISOString();
    }
    
    return formValue;
  }

  createPromotion(promotionData: any): void {
    this.adminService.createPromotion(promotionData).subscribe({
      next: (response: any) => {
        this.success = 'Promotion created successfully!';
        this.submitting = false;
        this.resetForm();
        this.loadPromotions(); // Refresh the list
      },
      error: (err: any) => {
        this.error = 'Failed to create promotion. ' + (err.error?.message || err.message || 'Unknown error');
        this.submitting = false;
      }
    });
  }

  updatePromotion(id: string, promotionData: any): void {
    this.adminService.updatePromotion(id, promotionData).subscribe({
      next: (response: any) => {
        this.success = 'Promotion updated successfully!';
        this.submitting = false;
        this.resetForm();
        this.loadPromotions(); // Refresh the list
      },
      error: (err: any) => {
        this.error = 'Failed to update promotion. ' + (err.error?.message || err.message || 'Unknown error');
        this.submitting = false;
      }
    });
  }

  editPromotion(promotion: Promotion): void {
    this.editMode = true;
    this.currentPromotionId = promotion.id;
    
    // Format dates for the form
    const startDate = promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : null;
    const endDate = promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : null;
    
    this.promotionForm.patchValue({
      code: promotion.code,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      minPurchase: promotion.minPurchase,
      maxDiscount: promotion.maxDiscount,
      startDate: startDate,
      endDate: endDate,
      isActive: promotion.isActive,
      usageLimit: promotion.usageLimit,
      applicableProducts: promotion.applicableProducts || [],
      applicableCategories: promotion.applicableCategories || []
    });
    
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deletePromotion(id: string): void {
    if (confirm('Are you sure you want to delete this promotion? This action cannot be undone.')) {
      this.adminService.deletePromotion(id).subscribe({
        next: () => {
          this.success = 'Promotion deleted successfully!';
          this.loadPromotions(); // Refresh the list
        },
        error: (err: any) => {
          this.error = 'Failed to delete promotion. ' + (err.error?.message || err.message || 'Unknown error');
        }
      });
    }
  }

  resetForm(): void {
    this.promotionForm.reset({
      discountType: 'percentage',
      isActive: true,
      applicableProducts: [],
      applicableCategories: []
    });
    this.editMode = false;
    this.currentPromotionId = null;
  }

  cancelEdit(): void {
    this.resetForm();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.promotionForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.promotionForm.get(fieldName);
    if (!field || !field.errors || !(field.dirty || field.touched)) {
      return '';
    }
    
    if (field.errors['required']) {
      return 'This field is required';
    }
    if (field.errors['minlength']) {
      return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['maxlength']) {
      return `Maximum length is ${field.errors['maxlength'].requiredLength} characters`;
    }
    if (field.errors['min']) {
      return `Value must be at least ${field.errors['min'].min}`;
    }
    
    return 'Invalid value';
  }

  hasDateRangeError(): boolean {
    return this.promotionForm.errors?.['dateRange'] && 
           (this.promotionForm.get('startDate')?.touched || this.promotionForm.get('endDate')?.touched);
  }

  toggleProductSelection(productId: string): void {
    const applicableProducts = [...(this.promotionForm.get('applicableProducts')?.value || [])];
    const index = applicableProducts.indexOf(productId);
    
    if (index === -1) {
      applicableProducts.push(productId);
    } else {
      applicableProducts.splice(index, 1);
    }
    
    this.promotionForm.patchValue({ applicableProducts });
  }

  isProductSelected(productId: string): boolean {
    const applicableProducts = this.promotionForm.get('applicableProducts')?.value || [];
    return applicableProducts.includes(productId);
  }

  toggleCategorySelection(categoryId: string): void {
    const applicableCategories = [...(this.promotionForm.get('applicableCategories')?.value || [])];
    const index = applicableCategories.indexOf(categoryId);
    
    if (index === -1) {
      applicableCategories.push(categoryId);
    } else {
      applicableCategories.splice(index, 1);
    }
    
    this.promotionForm.patchValue({ applicableCategories });
  }

  isCategorySelected(categoryId: string): boolean {
    const applicableCategories = this.promotionForm.get('applicableCategories')?.value || [];
    return applicableCategories.includes(categoryId);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  isPromotionActive(promotion: Promotion): boolean {
    if (!promotion.isActive) return false;
    
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    return now >= startDate && now <= endDate;
  }

  getPromotionStatusText(promotion: Promotion): string {
    if (!promotion.isActive) return 'Inactive';
    
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    if (now < startDate) return 'Scheduled';
    if (now > endDate) return 'Expired';
    return 'Active';
  }

  getPromotionStatusClass(promotion: Promotion): string {
    const status = this.getPromotionStatusText(promotion);
    
    switch (status) {
      case 'Active': return 'bg-success';
      case 'Scheduled': return 'bg-info';
      case 'Expired': return 'bg-warning';
      case 'Inactive': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }
}