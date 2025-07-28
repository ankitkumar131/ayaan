import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { UserService } from '../../../../core/services/user.service';
import { ProductService } from '../../../../core/services/product.service';
import { User } from '../../../../core/interfaces/user.interface';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule,
    ButtonComponent, 
    CardComponent, 
    LoadingComponent
  ],
  template: `
    <div class="admin-users">
      <div class="container">
        <!-- Page Header -->
        <div class="page-header">
          <h1>User Management</h1>
          <div class="header-actions">
            <app-button variant="outline" (click)="refreshUsers()">
              Refresh
            </app-button>
            <app-button variant="primary" (click)="exportUsers()">
              Export Users
            </app-button>
          </div>
        </div>

        <!-- Filters -->
        <app-card class="filters-card">
          <form [formGroup]="filterForm" class="filters-form">
            <div class="filter-group">
              <label for="role">Role</label>
              <select id="role" formControlName="role" (change)="applyFilters()">
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="status">Status</label>
              <select id="status" formControlName="status" (change)="applyFilters()">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="search">Search Users</label>
              <input 
                id="search"
                type="text" 
                formControlName="search"
                placeholder="Name, email, username..."
                (input)="onSearchChange()"
              />
            </div>

            <div class="filter-actions">
              <app-button type="button" variant="outline" size="sm" (click)="clearFilters()">
                Clear Filters
              </app-button>
            </div>
          </form>
        </app-card>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-container">
          <app-loading type="skeleton"></app-loading>
        </div>

        <!-- Users List -->
        <div *ngIf="!loading" class="users-section">
          <div class="users-header">
            <div class="results-info">
              Showing {{ users.length }} of {{ totalUsers }} users
            </div>
          </div>

          <!-- Users Table -->
          <div class="users-table">
            <div class="table-header">
              <div class="col-user">User</div>
              <div class="col-email">Email</div>
              <div class="col-role">Role</div>
              <div class="col-status">Status</div>
              <div class="col-joined">Joined</div>
              <div class="col-actions">Actions</div>
            </div>

            <div *ngFor="let user of users" class="table-row">
              <div class="col-user">
                <div class="user-info">
                  <div class="user-avatar">
                    <img 
                      [src]="user.profile?.avatar || '/assets/images/default-avatar.png'" 
                      [alt]="getUserDisplayName(user)"
                    />
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ getUserDisplayName(user) }}</div>
                    <div class="username">&#64;{{ user.username }}</div>
                  </div>
                </div>
              </div>
              
              <div class="col-email">
                <div class="email">{{ user.email }}</div>
                <div class="phone" *ngIf="user.profile?.phone">{{ user.profile.phone }}</div>
              </div>
              
              <div class="col-role">
                <select 
                  [value]="user.role" 
                  (change)="updateUserRole(user, $event)"
                  class="role-select"
                  [class]="getRoleClass(user.role)"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div class="col-status">
                <div class="status-toggle">
                  <input 
                    type="checkbox" 
                    [checked]="user.isActive"
                    (change)="toggleUserStatus(user)"
                    class="status-checkbox"
                  />
                  <span class="status-label" [class.active]="user.isActive">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
              
              <div class="col-joined">
                <div class="join-date">{{ formatDate(user.createdAt) }}</div>
                <div class="last-login" *ngIf="user.lastLogin">
                  Last: {{ formatDate(user.lastLogin) }}
                </div>
              </div>
              
              <div class="col-actions">
                <app-button variant="outline" size="sm" (click)="viewUserDetails(user)">
                  View
                </app-button>
                <app-button 
                  variant="outline" 
                  size="sm" 
                  (click)="editUser(user)"
                >
                  Edit
                </app-button>
                <app-button 
                  variant="danger" 
                  size="sm" 
                  (click)="deleteUser(user)"
                  *ngIf="!user.isActive"
                >
                  Delete
                </app-button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="users.length === 0" class="empty-state">
            <h3>No users found</h3>
            <p>No users match your current filters.</p>
            <app-button variant="outline" (click)="clearFilters()">
              Clear Filters
            </app-button>
          </div>

          <!-- Pagination -->
          <div *ngIf="totalPages > 1" class="pagination">
            <app-button 
              variant="outline" 
              [disabled]="currentPage === 1"
              (click)="goToPage(currentPage - 1)"
            >
              Previous
            </app-button>
            
            <span class="page-info">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            
            <app-button 
              variant="outline" 
              [disabled]="currentPage === totalPages"
              (click)="goToPage(currentPage + 1)"
            >
              Next
            </app-button>
          </div>
        </div>

        <!-- User Details Modal -->
        <div *ngIf="selectedUser" class="modal-overlay" (click)="closeUserDetails()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>User Details - {{ getUserDisplayName(selectedUser) }}</h2>
              <button class="close-btn" (click)="closeUserDetails()">×</button>
            </div>
            
            <div class="modal-body">
              <div class="user-details-grid">
                <div class="detail-section">
                  <h3>Personal Information</h3>
                  <p><strong>Name:</strong> {{ getUserDisplayName(selectedUser) }}</p>
                  <p><strong>Username:</strong> &#64;{{ selectedUser.username }}</p>
                  <p><strong>Email:</strong> {{ selectedUser.email }}</p>
                  <p><strong>Phone:</strong> {{ selectedUser.profile?.phone || 'N/A' }}</p>
                  <p><strong>Role:</strong> {{ selectedUser.role }}</p>
                  <p><strong>Status:</strong> {{ selectedUser.isActive ? 'Active' : 'Inactive' }}</p>
                </div>

                <div class="detail-section">
                  <h3>Account Information</h3>
                  <p><strong>Joined:</strong> {{ formatDate(selectedUser.createdAt) }}</p>
                  <p><strong>Last Login:</strong> {{ selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never' }}</p>
                  <p><strong>Total Addresses:</strong> {{ selectedUser.addresses?.length || 0 }}</p>
                </div>

                <div class="detail-section">
                  <h3>Preferences</h3>
                  <p><strong>Newsletter:</strong> {{ selectedUser.preferences?.newsletter ? 'Subscribed' : 'Not subscribed' }}</p>
                  <p><strong>Notifications:</strong> {{ selectedUser.preferences?.notifications ? 'Enabled' : 'Disabled' }}</p>
                  <p><strong>Language:</strong> {{ selectedUser.preferences?.language || 'English' }}</p>
                  <p><strong>Currency:</strong> {{ selectedUser.preferences?.currency || 'USD' }}</p>
                </div>

                <div class="detail-section">
                  <h3>Addresses</h3>
                  <div *ngIf="selectedUser.addresses && selectedUser.addresses.length > 0" class="addresses-list">
                    <div *ngFor="let address of selectedUser.addresses" class="address-item">
                      <div class="address-type">{{ address.type }} Address</div>
                      <div class="address-details">
                        <p>{{ address.street }}</p>
                        <p>{{ address.city }}, {{ address.state }} {{ address.zipCode }}</p>
                        <p>{{ address.country }}</p>
                      </div>
                    </div>
                  </div>
                  <p *ngIf="!selectedUser.addresses || selectedUser.addresses.length === 0">No addresses added</p>
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <app-button variant="outline" (click)="closeUserDetails()">
                Close
              </app-button>
              <app-button variant="primary" (click)="editUser(selectedUser)">
                Edit User
              </app-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-users {
      padding: 2rem 0;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .filters-card {
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .filters-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .filter-group input,
    .filter-group select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .users-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .results-info {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .users-table {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 2fr 1fr 1fr 1.5fr 1.5fr;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 2fr 1fr 1fr 1.5fr 1.5fr;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #f3f4f6;
      align-items: center;
    }

    .table-row:hover {
      background: #f9fafb;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-name {
      font-weight: 600;
      color: #1f2937;
    }

    .username {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .email {
      color: #1f2937;
      font-weight: 500;
    }

    .phone {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .role-select {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      border: 1px solid #d1d5db;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .role-select.user {
      background: #f3f4f6;
      color: #374151;
    }

    .role-select.admin {
      background: #fef3c7;
      color: #d97706;
    }

    .status-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-checkbox {
      width: 16px;
      height: 16px;
    }

    .status-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .status-label.active {
      color: #16a34a;
      font-weight: 500;
    }

    .join-date {
      color: #1f2937;
      font-size: 0.875rem;
    }

    .last-login {
      color: #6b7280;
      font-size: 0.75rem;
    }

    .col-actions {
      display: flex;
      gap: 0.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: #1f2937;
    }

    .empty-state p {
      margin: 0 0 2rem 0;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .page-info {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      width: 90%;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .user-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .detail-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
    }

    .detail-section p {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .addresses-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .address-item {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 6px;
    }

    .address-type {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .address-details p {
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }
      
      .header-actions {
        justify-content: center;
      }
      
      .filters-form {
        grid-template-columns: 1fr;
      }
      
      .users-table {
        overflow-x: auto;
      }
      
      .table-header,
      .table-row {
        grid-template-columns: 200px 200px 100px 100px 150px 150px;
        min-width: 900px;
      }
      
      .user-details-grid {
        grid-template-columns: 1fr;
      }
      
      .modal-content {
        width: 95%;
        margin: 1rem;
      }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  selectedUser: User | null = null;
  loading = true;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalUsers = 0;
  pageSize = 20;
  
  filterForm: FormGroup;
  searchTimeout: any;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private productService: ProductService
  ) {
    this.filterForm = this.fb.group({
      role: [''],
      status: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    
    // Simulate loading users data
    setTimeout(() => {
      this.users = this.generateMockUsers();
      this.totalUsers = this.users.length;
      this.totalPages = Math.ceil(this.totalUsers / this.pageSize);
      this.loading = false;
    }, 1000);
  }

  private generateMockUsers(): User[] {
    const mockUsers: User[] = [];
    const roles = ['user', 'admin'];
    
    for (let i = 1; i <= 15; i++) {
      mockUsers.push({
        _id: `user-${i}`,
        username: `user${i}`,
        email: `user${i}@example.com`,
        role: roles[Math.floor(Math.random() * roles.length)] as 'user' | 'admin',
        profile: {
          firstName: `User ${i}`,
          lastName: 'Doe',
          phone: `+1234567${String(i).padStart(3, '0')}`,
          avatar: '/assets/images/default-avatar.png'
        },
        addresses: [],
        preferences: {
          newsletter: Math.random() > 0.5,
          notifications: Math.random() > 0.5,
          language: 'en',
          currency: 'USD'
        },
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        isActive: Math.random() > 0.2
      });
    }
    
    return mockUsers;
  }

  refreshUsers(): void {
    this.loadUsers();
  }

  applyFilters(): void {
    console.log('Applying filters:', this.filterForm.value);
    this.loadUsers();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.loadUsers();
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 500);
  }

  updateUserRole(user: User, event: any): void {
    const newRole = event.target.value;
    user.role = newRole;
    
    console.log(`Updating user ${user.username} role to ${newRole}`);
    alert(`User ${user.username} role updated to ${newRole}`);
  }

  toggleUserStatus(user: User): void {
    user.isActive = !user.isActive;
    
    console.log(`User ${user.username} status changed to ${user.isActive ? 'active' : 'inactive'}`);
    alert(`User ${user.username} is now ${user.isActive ? 'active' : 'inactive'}`);
  }

  viewUserDetails(user: User): void {
    this.selectedUser = user;
  }

  closeUserDetails(): void {
    this.selectedUser = null;
  }

  editUser(user: User): void {
    alert(`Edit user functionality would be implemented here for ${user.username}`);
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user ${user.username}?`)) {
      console.log(`Deleting user ${user.username}`);
      alert(`User ${user.username} deleted successfully`);
      this.loadUsers();
    }
  }

  exportUsers(): void {
    alert('Exporting users to CSV...');
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  // Helper methods
  getUserDisplayName(user: User): string {
    return `${user.profile.firstName} ${user.profile.lastName}`;
  }

  getRoleClass(role: string): string {
    return role.toLowerCase();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}