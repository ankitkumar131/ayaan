import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LoadingSize = 'sm' | 'md' | 'lg';
export type LoadingType = 'spinner' | 'dots' | 'pulse' | 'skeleton';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="loadingClasses">
      <!-- Spinner -->
      <div *ngIf="type === 'spinner'" class="spinner"></div>
      
      <!-- Dots -->
      <div *ngIf="type === 'dots'" class="dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      
      <!-- Pulse -->
      <div *ngIf="type === 'pulse'" class="pulse"></div>
      
      <!-- Skeleton -->
      <div *ngIf="type === 'skeleton'" class="skeleton">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
      
      <!-- Loading text -->
      <div *ngIf="text" class="loading-text">{{ text }}</div>
    </div>
  `,
  styleUrl: './loading.component.scss'
})
export class LoadingComponent {
  @Input() type: LoadingType = 'spinner';
  @Input() size: LoadingSize = 'md';
  @Input() text = '';
  @Input() overlay = false;
  @Input() customClass = '';

  get loadingClasses(): string {
    const classes = [
      'loading',
      `loading--${this.type}`,
      `loading--${this.size}`,
      this.overlay ? 'loading--overlay' : '',
      this.customClass
    ];

    return classes.filter(Boolean).join(' ');
  }
}