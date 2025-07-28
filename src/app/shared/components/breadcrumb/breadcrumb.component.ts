import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  active?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li class="breadcrumb-item">
          <a routerLink="/" class="breadcrumb-link">
            🏠 Home
          </a>
        </li>
        
        <li 
          *ngFor="let item of items; let last = last" 
          class="breadcrumb-item"
          [class.active]="item.active || last"
        >
          <span class="breadcrumb-separator">›</span>
          
          <a 
            *ngIf="item.url && !item.active && !last; else textOnly"
            [routerLink]="item.url" 
            class="breadcrumb-link"
          >
            {{ item.label }}
          </a>
          
          <ng-template #textOnly>
            <span class="breadcrumb-text">{{ item.label }}</span>
          </ng-template>
        </li>
      </ol>
    </nav>
  `,
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}