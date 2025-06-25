import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { User } from '../../../../shared/models/user.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  // Add Math property for template usage
  Math = Math;
  users: User[] = [];
  // Add isActive property to track user status
  isActive: {[key: string]: boolean} = {};
  filteredUsers: User[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';
  roleFilter = 'all';
  statusFilter = 'all';
  sortField = 'createdAt';
  sortDirection = 'desc';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalUsers = 0;
  totalPages = 0;
  
  private searchSubject = new Subject<string>();

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadUsers();
  }

  setupSearchSubscription(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1; // Reset to first page on new search
      this.loadUsers();
    });
  }

  onSearch(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(searchValue);
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getAllUsers(this.currentPage, this.pageSize).subscribe({

      next: (response: any) => {
        this.users = response.users;
        this.filteredUsers = response.users;
        this.totalUsers = response.total;
        // Initialize isActive property for each user
        this.users.forEach(user => {
          this.isActive[user.id] = true; // Default to active
        });
        this.totalPages = Math.ceil(this.totalUsers / this.pageSize);
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load users. ' + (err.error?.message || err.message || 'Unknown error');
        this.loading = false;
      }
    });
  }

  onRoleFilterChange(event: Event): void {
    this.roleFilter = (event.target as HTMLSelectElement).value;
    this.currentPage = 1; // Reset to first page
    this.loadUsers();
  }

  onStatusFilterChange(event: Event): void {
    this.statusFilter = (event.target as HTMLSelectElement).value;
    this.currentPage = 1; // Reset to first page
    this.loadUsers();
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
    this.loadUsers();
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
    this.loadUsers();
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

  updateUserStatus(userId: string, isActive: boolean): void {
    this.adminService.updateUserStatus(userId, isActive ? 'active' : 'inactive').subscribe({
      next: () => {
        // Update the user in the local array
        const userIndex = this.users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
          this.isActive[userId] = isActive;
        }
      },
      error: (err: any) => {
        this.error = `Failed to update user status. ${err.error?.message || err.message || 'Unknown error'}`;
      }
    });
  }

  updateUserRole(userId: string, role: 'user' | 'admin'): void {
    this.adminService.updateUserRole(userId, role).subscribe({
      next: () => {
        // Update the user in the local array
        const userIndex = this.users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
          this.users[userIndex].role = role;
        }
      },
      error: (err: any) => {
        this.error = `Failed to update user role. ${err.error?.message || err.message || 'Unknown error'}`;
      }
    });
  }
}