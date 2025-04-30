import { Component,ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FooterComponent } from "../../shared/footer/footer.component";
import { HomeProjectService, HomeProject } from "../../services/home-project.service";
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, FooterComponent, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('projectCards') projectCards!: ElementRef;
  projects: HomeProject[] = [];
  filteredProjects: HomeProject[] = [];
  searchTerm: string = '';
  selectedCategory: string = '';
  isLoggedIn = false;

  private destroy$ = new Subject<void>(); 
  constructor(
    public authService: AuthService,
    private homeProjectService: HomeProjectService
  ) {}

  ngOnInit() {
    // 
    this.homeProjectService.getAllAvailableProjects().subscribe((data) => {
      this.projects = data;
      this.filteredProjects = data;
    });

    // 
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        console.log('User authentication state:', this.isLoggedIn);
      });
  }
  scrollToProjects() {
    this.projectCards.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredProjects = this.projects.filter(project => {
      const matchTitle = this.searchTerm
        ? project.title.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;

      const matchCategory = this.selectedCategory
        ? project.skills.some(skill => skill.category === this.selectedCategory)
        : true;

      return matchTitle && matchCategory;
    });
  }
}
