import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-page">
      <div class="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div class="actions">
          <a routerLink="/" class="home-btn">Go to Homepage</a>
          <button class="back-btn" (click)="goBack()">Go Back</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f9fafb;
      padding: 2rem;
    }

    .not-found-content {
      text-align: center;
      max-width: 400px;
    }

    h1 {
      font-size: 6rem;
      font-weight: 700;
      color: #3b82f6;
      line-height: 1;
      margin: 0;
    }

    h2 {
      font-size: 2rem;
      color: #111827;
      margin: 1rem 0;
    }

    p {
      color: #6b7280;
      margin-bottom: 2rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .home-btn,
    .back-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s ease-in-out;
    }

    .home-btn {
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
    }

    .home-btn:hover {
      background-color: #2563eb;
    }

    .back-btn {
      background-color: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .back-btn:hover {
      background-color: #e5e7eb;
    }
  `]
})
export class NotFoundComponent {
  goBack(): void {
    window.history.back();
  }
}
