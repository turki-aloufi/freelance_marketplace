import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col items-center space-y-6">
      <h2 class="text-2xl font-bold">Sign In</h2>

      <!-- Google Sign In -->
      <button (click)="loginWithGoogle()" class="flex items-center space-x-2 border border-gray-300 rounded-full p-2 hover:shadow-md">
        <img src="assets/images/download.png" alt="Google Logo" class="w-6 h-6">
      </button>

      <div class="flex items-center w-full max-w-sm">
        <div class="flex-grow border-t border-gray-300"></div>
        <span class="px-2 text-gray-500 text-sm">Or sign In with</span>
        <div class="flex-grow border-t border-gray-300"></div>
      </div>

      <!-- Email Input -->
      <input
        type="email"
        [(ngModel)]="email"
        placeholder="*Email"
        class="w-full max-w-sm p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      >

      <!-- Password Input -->
      <input
        type="password"
        [(ngModel)]="password"
        placeholder="*Password"
        class="w-full max-w-sm p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      >

      <!-- Error Message -->
      <p *ngIf="error" class="text-red-500 text-sm">{{ error }}</p>

      <!-- Sign In Button -->
      <button
        (click)="loginWithEmail()"
        class="w-full max-w-sm bg-black text-white py-2 rounded hover:bg-gray-800 font-semibold"
      >
        Sign In
      </button>

      <!-- Create Account Link -->
      <p class="text-sm text-gray-600">
        <a href="/sign-up" class="underline">Create Account?</a>
      </p>
    </div>
  `,
  styles: []
})
export class SignInComponent {
  email: string = '';
  password: string = '';
  error: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  async loginWithEmail() {
    try {
      await this.authService.loginWithEmail(this.email, this.password);
    } catch (error: any) {
      this.error = error.message;
    }
  }

  async loginWithGoogle() {
    try {
      await this.authService.loginWithGoogle();
    } catch (error: any) {
      this.error = error.message;
    }
  }
}