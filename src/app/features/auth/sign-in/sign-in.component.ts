import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent {
  email: string = '';
  password: string = '';
  error: string = '';
  isLoading: boolean = false; // New loading state

  constructor(private authService: AuthService) {}

  async loginWithEmail() {
    try {
      if (!this.email || !this.password) {
        this.error = 'Please fill in all required fields.';
        return;
      }
      this.isLoading = true; // Start loading
      await this.authService.loginWithEmail(this.email, this.password);
    } catch (error: any) {
      this.error = error.message;
    } finally {
      this.isLoading = false; // Stop loading
    }
  }

  async loginWithGoogle() {
    try {
      this.isLoading = true; // Start loading
      await this.authService.loginWithGoogle();
    } catch (error: any) {
      this.error = error.message;
    } finally {
      this.isLoading = false; // Stop loading
    }
  }
}