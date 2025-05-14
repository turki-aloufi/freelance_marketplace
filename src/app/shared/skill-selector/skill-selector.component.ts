import { Component, EventEmitter, Input, Output, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, retry, takeUntil } from 'rxjs';
import { environment } from '../../../environment.prod';
interface Skill {
  SkillId: number;
  Skill: string;
  Category: string;
}

@Component({
  selector: 'app-skill-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './skill-selector.component.html',
})
export class SkillSelectorComponent implements OnInit, OnDestroy {
  @Input() isDisabled: boolean = false;

  // ✅ Proper input/output for two-way binding
  @Input() selectedSkills: Skill[] = [];
  @Output() selectedSkillsChange = new EventEmitter<Skill[]>();

  skillSearch: string = '';
  availableSkills: Skill[] = [];
  filteredSkills: Skill[] = [];
  skills: Skill[] = [];

  error: string = '';
  isLoadingSkills: boolean = false;

  private skillSearchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.skills = [...this.selectedSkills]; // ✅ initialize internal state from input
    this.fetchSkills();

    this.skillSearchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterSkills();
      });
  }

  ngOnDestroy(): void {
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
          this.availableSkills = skills.filter(skill =>
            skill && typeof skill.Skill === 'string' && typeof skill.Category === 'string'
          );
          this.filteredSkills = [...this.availableSkills];
          this.isLoadingSkills = false;
        },
        error: () => {
          this.isLoadingSkills = false;
          this.error = 'Failed to load skills. Please try again later.';
        }
      });
  }

  onSkillSearchChange() {
    this.skillSearchSubject.next(this.skillSearch);
  }

  filterSkills() {
    const term = this.skillSearch.toLowerCase().trim();
    this.filteredSkills = this.availableSkills.filter(
      s => s.Skill.toLowerCase().includes(term) || s.Category.toLowerCase().includes(term)
    );
  }

  addSkill(skill: Skill) {
    if (!this.skills.find(s => s.SkillId === skill.SkillId)) {
      this.skills.push(skill);
      this.selectedSkillsChange.emit(this.skills); // ✅ emit change
    }
    this.skillSearch = '';
    this.filteredSkills = [...this.availableSkills];
  }

  removeSkill(skill: Skill) {
    this.skills = this.skills.filter(s => s.SkillId !== skill.SkillId);
    this.selectedSkillsChange.emit(this.skills); // ✅ emit change
  }

  retryFetch() {
    this.error = '';
    this.fetchSkills();
  }
}
