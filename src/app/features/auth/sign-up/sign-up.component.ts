import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService, SkillDto } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { debounceTime, Subject, switchMap, takeUntil, retry } from 'rxjs';
import { SkillSelectorComponent } from '../../../shared/skill-selector/skill-selector.component';
import {environment} from '../../../../environment.prod'
interface Skill {
  SkillId: number;
  Skill: string;
  Category: string;
}

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SkillSelectorComponent],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
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
  isLoading: boolean = false; // New loading state for sign-up and Google login

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
      .pipe(debounceTime(300), takeUntil(this.destroy$))
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
      this.filteredSkills = [...this.availableSkills];
      return;
    }

    this.isLoadingSkills = true;
    this.http
      .get<Skill[]>(`${environment.apiUrl}/api/Skills`)
      .pipe(retry(2), takeUntil(this.destroy$))
      .subscribe({
        next: (skills) => {
          const validSkills = skills.filter(
            (skill): skill is Skill =>
              skill != null &&
              typeof skill.SkillId === 'number' &&
              typeof skill.Skill === 'string' &&
              skill.Skill.trim() !== '' &&
              typeof skill.Category === 'string'
          );
          this.availableSkills = validSkills;
          this.filteredSkills = [...validSkills];
          this.isLoadingSkills = false;
          this.retryCount = 0;
          if (validSkills.length === 0 && this.retryCount < this.maxRetries) {
            this.retryCount++;
            setTimeout(() => this.fetchSkills(), 1000);
          } else if (validSkills.length === 0) {
            this.error = 'No skills available. Please try again later.';
          }
        },
        error: () => {
          this.isLoadingSkills = false;
          this.error = 'Failed to load skills. Please try again later.';
        },
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
      skill =>
        skill?.Skill?.toLowerCase().includes(searchTerm) ||
        skill?.Category?.toLowerCase().includes(searchTerm)
    );
  }

  addSkill(skill: Skill) {
    if (skill && !this.skills.some(s => s.SkillId === skill.SkillId)) {
      this.skills.push(skill);
      this.skillSearch = '';
      this.filteredSkills = [...this.availableSkills];
    }
  }

  removeSkill(skill: Skill) {
    this.skills = this.skills.filter(s => s.SkillId !== skill.SkillId);
  }

  async signUp() {
    try {
      if (
        !this.firstName ||
        !this.lastName ||
        !this.email ||
        !this.contactNumber ||
        !this.password
      ) {
        this.error = 'Please fill in all required fields.';
        return;
      }
      this.isLoading = true; // Start loading
      const skillDtos: SkillDto[] = this.skills.map(skill => ({
        skillId: skill.SkillId,
        skill: skill.Skill,
        category: skill.Category,
      }));
      await this.authService.signUp({
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        contactNumber: this.contactNumber,
        skills: skillDtos,
        about: this.about,
        password: this.password,
      });
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
