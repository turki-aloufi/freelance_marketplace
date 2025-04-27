import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// Interface for the API response
interface Skill {
  skillId: number;
  skill: string;
  category: string;
}

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- Header -->
      <header class="bg-black text-white p-4 flex justify-between items-center">
        <div class="text-2xl font-bold">FREELANCER</div>
        <nav class="space-x-4">
          <a routerLink="/" class="hover:underline">Home</a>
          <a routerLink="/sign-in" class="hover:underline">Sign In</a>
          <a routerLink="/sign-up" class="hover:underline">Sign Up</a>
        </nav>
      </header>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col items-center justify-center py-10">
        <h2 class="text-3xl font-bold mb-6">SIGN UP</h2>

        <!-- Google Sign Up -->
        <button (click)="loginWithGoogle()" class="flex items-center space-x-2 border border-gray-300 rounded-full p-2 hover:shadow-md mb-4">
          <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_32x32dp.png" alt="Google Logo" class="w-6 h-6">
        </button>

        <div class="flex items-center w-full max-w-md mb-6">
          <div class="flex-grow border-t border-gray-300"></div>
          <span class="px-2 text-gray-500 text-sm">Or sign up with</span>
          <div class="flex-grow border-t border-gray-300"></div>
        </div>

        <!-- Sign Up Form -->
        <form class="w-full max-w-md space-y-4">
          <!-- First Name and Last Name -->
          <div class="flex space-x-4">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700">*First Name</label>
              <input
                type="text"
                [(ngModel)]="firstName"
                name="firstName"
                placeholder="First Name"
                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700">*Last Name</label>
              <input
                type="text"
                [(ngModel)]="lastName"
                name="lastName"
                placeholder="Last Name"
                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700">*Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="Email"
              class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
          </div>

          <!-- Contact Number -->
          <div>
            <label class="block text-sm font-medium text-gray-700">*Contact Number</label>
            <input
              type="tel"
              [(ngModel)]="contactNumber"
              name="contactNumber"
              placeholder="Contact Number"
              class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700">*Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Password"
              class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
          </div>

          <!-- Required Skills -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Required Skills</label>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="skillSearch"
                name="skillSearch"
                (input)="filterSkills()"
                placeholder="Search skills..."
                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
              <!-- Dropdown for filtered skills -->
              <ul *ngIf="filteredSkills.length > 0 && skillSearch" class="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-40 overflow-y-auto">
                <li
                  *ngFor="let skill of filteredSkills"
                  (click)="addSkill(skill.skill)"
                  class="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {{ skill.skill }} ({{ skill.category }})
                </li>
              </ul>
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <span *ngFor="let skill of skills" class="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm flex items-center">
                {{ skill }}
                <button (click)="removeSkill(skill)" class="ml-1 text-red-500">×</button>
              </span>
            </div>
          </div>

          <!-- About Experience -->
          <div>
            <label class="block text-sm font-medium text-gray-700">About Your Experience</label>
            <textarea
              [(ngModel)]="about"
              name="about"
              placeholder="Write your experience"
              class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows="4"
            ></textarea>
          </div>

          <!-- Error Message -->
          <p *ngIf="error" class="text-red-500 text-sm">{{ error }}</p>

          <!-- Sign Up Button -->
          <button
            type="submit"
            (click)="signUp()"
            class="w-full bg-black text-white py-2 rounded hover:bg-gray-800 font-semibold"
          >
            SIGN UP
          </button>

          <!-- Sign In Link -->
          <p class="text-center text-sm text-gray-600">
            Already have an account? <a routerLink="/sign-in" class="underline">Sign In</a>
          </p>
        </form>
      </main>

      <!-- Footer -->
      <footer class="bg-black text-white text-center p-4">
        <p>2025 Freelancer. All right reserved.</p>
      </footer>
    </div>
  `,
  styles: []
})
export class SignUpComponent implements OnInit {
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  contactNumber: string = '';
  password: string = '';
  skills: string[] = [];
  about: string = '';
  error: string = '';

  skillSearch: string = '';
  availableSkills: Skill[] = [];
  filteredSkills: Skill[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.fetchSkills();
  }

  fetchSkills() {
    // Replace with your API endpoint
    this.http.get<Skill[]>('http://localhost:5021/api/Skills')
      .subscribe({
        next: (skills) => {
          this.availableSkills = skills;
          this.filteredSkills = skills;
        },
        error: (err) => {
          console.error('Error fetching skills:', err);
          this.error = 'Failed to load skills. Please try again later.';
        }
      });
  }

  filterSkills() {
    if (!this.skillSearch) {
      this.filteredSkills = this.availableSkills;
      return;
    }
    this.filteredSkills = this.availableSkills.filter(skill =>
      skill.skill.toLowerCase().includes(this.skillSearch.toLowerCase())
    );
  }

  addSkill(skill: string) {
    if (skill && !this.skills.includes(skill)) {
      this.skills.push(skill);
      this.skillSearch = ''; // Clear search input
      this.filteredSkills = this.availableSkills; // Reset filtered list
    }
  }

  removeSkill(skill: string) {
    this.skills = this.skills.filter(s => s !== skill);
  }

  async signUp() {
    try {
      if (!this.firstName || !this.lastName || !this.email || !this.contactNumber || !this.password) {
        this.error = 'Please fill in all required fields.';
        return;
      }
      await this.authService.signUp({
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        contactNumber: this.contactNumber,
        skills: this.skills,
        about: this.about,
        password: this.password
      });
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