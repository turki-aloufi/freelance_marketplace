import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  template: `
  <div class="p-4">
    <h2 class="text-2xl font-bold">Welcome, {{ authService.user$ | async | json }}</h2>
    <button (click)="authService.logout()" class="mt-4 bg-red-500 text-white py-2 px-4 rounded">
      Logout
    </button>
  </div>
`,
  styleUrl: './home.component.css'
})
export class HomeComponent {
  constructor(public authService: AuthService) {}
}
