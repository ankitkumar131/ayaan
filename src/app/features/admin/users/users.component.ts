import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfile } from '../../../core/interfaces/auth.interface';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-management">
      <header class="page-header">
        <h1>User Management</h1>
        <div class="filters">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="filterUsers()"
            placeholder="Search users..."
            class="search-input"
          >
          <select [(ngModel)]="selectedRole" (ngModelChange)="filterUsers()">
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </header>

      <div class="alert error" *ngIf="error">{{ error }}</div>
      <div class="alert success" *ngIf="successMessage">{{ successMessage }}</div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of filteredUsers">
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>
                <select
                  [(ngModel)]="user.role"
                  (change)="updateUserRole(user)"
                  [disabled]="user.email === currentUserEmail"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <span [class]="'status-badge ' + (user.isActive ? 'active' : 'inactive')">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="actions">
                <button
                  class="toggle-btn"
                  (click)="toggleUserStatus(user)"
                  [disabled]="user.email === currentUserEmail"
                >
                  {{ user.isActive ? 'Deactivate' : 'Activate' }}
                </button>
                <button
                  class="delete-btn"
                  (click)="deleteUser(user)"
                  [disabled]="user.email === currentUserEmail"
                >
                  Delete
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredUsers.length === 0">
              <td colspan="5" class="no-data">
                No users found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .users-management {
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .filters {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .search-input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }

    select {
      padding: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      min-width: 150px;
    }

    .alert {
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .alert.error {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .alert.success {
      background-color: #d1fae5;
      color: #059669;
    }

    .table-responsive {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }

    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    th {
      background: #f8f9fa;
      font-weight: 600;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-badge.active {
      background: #d1fae5;
      color: #059669;
    }

    .status-badge.inactive {
      background: #f3f4f6;
      color: #6b7280;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    button {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .toggle-btn {
      background: #3b82f6;
      color: white;
    }

    .delete-btn {
      background: #ef4444;
      color: white;
    }

    .no-data {
      text-align: center;
      color: #6b7280;
      font-style: italic;
    }
  `]
})
export class UsersComponent implements OnInit {
  users: Array<UserProfile & { isActive: boolean }> = [];
  filteredUsers: Array<UserProfile & { isActive: boolean }> = [];
  searchQuery = '';
  selectedRole = '';
  error = '';
  successMessage = '';
  currentUserEmail = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUsers();
  }

  loadCurrentUser(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserEmail = user.email;
      }
    });
  }

  loadUsers(): void {
    // In a real application, you would call an API to get all users
    // For now, we'll use mock data
    this.users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        isActive: true
      },
      {
        username: 'user1',
        email: 'user1@example.com',
        role: 'user',
        isActive: true
      },
      {
        username: 'user2',
        email: 'user2@example.com',
        role: 'user',
        isActive: false
      }
    ];
    this.filteredUsers = this.users;
  }

  filterUsers(): void {
    let filtered = [...this.users];

    if (this.selectedRole) {
      filtered = filtered.filter(u => u.role === this.selectedRole);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(u => 
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    this.filteredUsers = filtered;
  }

  updateUserRole(user: UserProfile & { isActive: boolean }): void {
    if (user.email === this.currentUserEmail) return;

    // In a real application, you would call an API to update the user's role
    this.successMessage = `Updated ${user.username}'s role to ${user.role}`;
    setTimeout(() => this.successMessage = '', 3000);
  }

  toggleUserStatus(user: UserProfile & { isActive: boolean }): void {
    if (user.email === this.currentUserEmail) return;

    user.isActive = !user.isActive;
    this.successMessage = `${user.username} has been ${user.isActive ? 'activated' : 'deactivated'}`;
    setTimeout(() => this.successMessage = '', 3000);
  }

  deleteUser(user: UserProfile & { isActive: boolean }): void {
    if (user.email === this.currentUserEmail) return;

    if (!confirm(`Are you sure you want to delete ${user.username}?`)) return;

    const index = this.users.findIndex(u => u.email === user.email);
    if (index !== -1) {
      this.users.splice(index, 1);
      this.filterUsers();
      this.successMessage = `${user.username} has been deleted`;
      setTimeout(() => this.successMessage = '', 3000);
    }
  }
}
