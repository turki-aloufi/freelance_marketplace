import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, SkillDto } from '../../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { debounceTime, Subject, switchMap, takeUntil, retry } from 'rxjs';

// Interface for the API response
interface Skill {
  SkillId: number;
  Skill: string;
  Category: string;
}

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
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
                (ngModelChange)="onSkillSearchChange()"
                placeholder="Search skills..."
                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                [disabled]="isLoadingSkills"
              >
              <!-- Loading Indicator -->
              <div *ngIf="isLoadingSkills" class="absolute right-2 top-2">
                <svg class="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </div>
              <!-- Dropdown for filtered skills -->
              <ul *ngIf="filteredSkills.length > 0 && skillSearch && !isLoadingSkills" class="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-40 overflow-y-auto">
                <li
                  *ngFor="let skill of filteredSkills"
                  (click)="addSkill(skill)"
                  class="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {{ skill.Skill }} ({{ skill.Category }})
                </li>
              </ul>
            </div>
            <div *ngIf="error && !isLoadingSkills" class="mt-2 text-red-500 text-sm">
              {{ error }}
              <button (click)="fetchSkills()" class="ml-2 underline">Retry</button>
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <span *ngFor="let skill of skills" class="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm flex items-center">
                {{ skill.Skill }}
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
    </div>
  `,
  styles: []
})
export class SignUpComponent implements OnInit, OnDestroy {
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  contactNumber: string = '';
  password: string = '';
  skills: Skill[] = [];
  about: string = '';
  error: string = '';

  skillSearch: string = '';
  availableSkills: Skill[] = [];
  filteredSkills: Skill[] = [];
  isLoadingSkills: boolean = false;
  private skillSearchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private maxRetries: number = 3;
  private retryCount: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.fetchSkills();
    this.skillSearchSubject
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.filterSkills();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchSkills() {
    if (this.availableSkills.length > 0) {
      console.log('Using cached skills:', this.availableSkills);
      this.filteredSkills = [...this.availableSkills];
      return;
    }

    this.isLoadingSkills = true;
    console.log('Fetching skills from API: http://localhost:5021/api/Skills');
    this.http.get<Skill[]>('http://localhost:5021/api/Skills', { observe: 'response' })
      .pipe(
        retry(2),
        switchMap(response => {
          console.log('Raw HTTP response:', {
            status: response.status,
            headers: response.headers,
            body: response.body
          });
          const skills = response.body || [];
          const validSkills = skills.filter(
            (skill): skill is Skill =>
              skill != null &&
              typeof skill.SkillId === 'number' &&
              typeof skill.Skill === 'string' &&
              skill.Skill.trim() !== '' &&
              typeof skill.Category === 'string'
          );
          console.log('Validated skills:', validSkills);
          return [validSkills];
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (skills) => {
          this.availableSkills = skills;
          this.filteredSkills = [...this.availableSkills];
          this.isLoadingSkills = false;
          this.retryCount = 0; // Reset retry count on success
          console.log('Fetched skills:', this.availableSkills);
          if (skills.length === 0 && this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.warn(`Skills array is empty. Retry ${this.retryCount}/${this.maxRetries}`);
            setTimeout(() => this.fetchSkills(), 1000);
          } else if (skills.length === 0) {
            this.error = 'No skills available. Please try again later.';
          }
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingSkills = false;
          console.error('Error fetching skills:', {
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            error: err.error
          });
          this.error = 'Failed to load skills. Please try again later.';
        }
      });
  }

  onSkillSearchChange() {
    this.skillSearchSubject.next(this.skillSearch);
  }

  filterSkills() {
    if (this.isLoadingSkills) {
      this.filteredSkills = [];
      return;
    }
    if (!this.skillSearch) {
      this.filteredSkills = [...this.availableSkills];
      return;
    }
    const searchTerm = this.skillSearch.toLowerCase().trim();
    this.filteredSkills = this.availableSkills.filter(
      (skill) =>
        skill?.Skill?.toLowerCase().includes(searchTerm) ||
        skill?.Category?.toLowerCase().includes(searchTerm)
    );
  }

  addSkill(skill: Skill) {
    if (skill && !this.skills.some((s) => s.SkillId === skill.SkillId)) {
      this.skills.push(skill);
      this.skillSearch = '';
      this.filteredSkills = [...this.availableSkills];
    }
  }

  removeSkill(skill: Skill) {
    this.skills = this.skills.filter((s) => s.SkillId !== skill.SkillId);
  }

  async signUp() {
    try {
      if (!this.firstName || !this.lastName || !this.email || !this.contactNumber || !this.password) {
        this.error = 'Please fill in all required fields.';
        return;
      }
      // Map Skill[] to SkillDto[]
      const skillDtos: SkillDto[] = this.skills.map(skill => ({
        skillId: skill.SkillId,
        skill: skill.Skill,
        category: skill.Category
      }));
      await this.authService.signUp({
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        contactNumber: this.contactNumber,
        skills: skillDtos,
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
