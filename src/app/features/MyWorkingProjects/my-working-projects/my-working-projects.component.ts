import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService, ProjectSummary } from '../../../core/services/WorkingProjects/my-working-projectsproject.service';
import { FormsModule } from '@angular/forms';
import { ProjectDetailComponent } from '../../project/project-detail/project-detail.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-working-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectDetailComponent, RouterLink],
  templateUrl: './my-working-projects.component.html',
  styleUrls: ['./my-working-projects.component.css']
})
export class MyWorkingProjectsComponent implements OnInit {
  projects: ProjectSummary[] = [];
  filteredProjects: ProjectSummary[] = [];
  freelancerId: string = '';
  selectedStatus: string = '';  // Bind this to the dropdown
  loading = true;
  constructor(private projectService: ProjectService, private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.freelancerId = user.uid;
        this.loadProjects();
      }
    });
  }

  loadProjects() {
    this.projectService.getMyWorkingProjects(this.freelancerId).subscribe({
      next: (data) => {
        this.projects = data;
        this.filteredProjects = data; // Initially, show all projects
        this.loading=false;
      },
      error: (err) => console.error('Error loading projects', err)
    });
  }

  filterProjects() {
    if (this.selectedStatus) {
      this.filteredProjects = this.projects.filter(project => project.status === this.selectedStatus);
    } else {
      this.filteredProjects = this.projects; // Show all projects if no filter is applied
    }
  }
}


