import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-strength.component.html',
  styleUrls: ['./password-strength.component.scss']
})
export class PasswordStrengthComponent implements OnChanges {
  @Input() password: string = '';
  strength: number = 0;
  strengthText: string = '';
  strengthClass: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password']) {
      this.calculateStrength();
    }
  }

  private calculateStrength(): void {
    if (!this.password) {
      this.strength = 0;
      this.strengthText = '';
      this.strengthClass = '';
      return;
    }

    let score = 0;

    // Length check
    if (this.password.length >= 8) {
      score += 1;
    }

    // Lowercase check
    if (/[a-z]/.test(this.password)) {
      score += 1;
    }

    // Uppercase check
    if (/[A-Z]/.test(this.password)) {
      score += 1;
    }

    // Number check
    if (/[0-9]/.test(this.password)) {
      score += 1;
    }

    // Special character check
    if (/[^A-Za-z0-9]/.test(this.password)) {
      score += 1;
    }

    this.strength = score;

    // Set text and class based on score
    switch (score) {
      case 0:
      case 1:
        this.strengthText = 'Weak';
        this.strengthClass = 'weak';
        break;
      case 2:
      case 3:
        this.strengthText = 'Medium';
        this.strengthClass = 'medium';
        break;
      case 4:
        this.strengthText = 'Strong';
        this.strengthClass = 'strong';
        break;
      case 5:
        this.strengthText = 'Very Strong';
        this.strengthClass = 'very-strong';
        break;
      default:
        this.strengthText = '';
        this.strengthClass = '';
    }
  }
}