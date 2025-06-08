import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LayoutComponent } from './features/shared/layout/layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'StyleStore';
}
