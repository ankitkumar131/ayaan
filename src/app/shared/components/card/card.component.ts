import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses">
      <div *ngIf="hasHeader" class="card-header">
        <ng-content select="[slot=header]"></ng-content>
      </div>
      
      <div class="card-body">
        <ng-content></ng-content>
      </div>
      
      <div *ngIf="hasFooter" class="card-footer">
        <ng-content select="[slot=footer]"></ng-content>
      </div>
    </div>
  `,
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input() variant: CardVariant = 'default';
  @Input() padding = true;
  @Input() hoverable = false;
  @Input() clickable = false;
  @Input() customClass = '';

  hasHeader = false;
  hasFooter = false;

  ngAfterContentInit() {
    // Check if header and footer content is provided
    // This is a simplified check - in a real implementation you might use ContentChild
    this.hasHeader = true; // Simplified for now
    this.hasFooter = true; // Simplified for now
  }

  get cardClasses(): string {
    const classes = [
      'card',
      `card--${this.variant}`,
      this.padding ? 'card--padded' : '',
      this.hoverable ? 'card--hoverable' : '',
      this.clickable ? 'card--clickable' : '',
      this.customClass
    ];

    return classes.filter(Boolean).join(' ');
  }
}