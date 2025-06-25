import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-admin-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-list.component.html',
  styleUrls: ['./admin-list.component.scss']
})
export class AdminListComponent implements OnInit {
  admins: User[] = [];
  isLoading = true;
  error: string | null = null;

  private adminService = inject(AdminService);

  ngOnInit(): void {
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.isLoading = true;
    this.error = null;

    this.adminService.getAllAdmins().subscribe({
      next: (admins) => {
        this.admins = admins;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load admin users. Please try again.';
        this.isLoading = false;
        console.error('Error loading admins:', error);
      }
    });
  }
}