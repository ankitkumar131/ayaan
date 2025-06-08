import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-toggle.component.html',
  styleUrls: ['./password-toggle.component.scss']
})
export class PasswordToggleComponent {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  toggleVisibility(): void {
    this.visible = !this.visible;
    this.visibleChange.emit(this.visible);
  }
}