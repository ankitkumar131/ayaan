import { Component } from '@angular/core';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainLayoutComponent],
  template: `
    <app-main-layout></app-main-layout>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'StyleHub - E-Commerce Store';
}
