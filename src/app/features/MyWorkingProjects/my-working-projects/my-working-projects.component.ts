import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService, ProjectSummary } from '../../../core/services/WorkingProjects/my-working-projectsproject.service';

@Component({
  selector: 'app-my-working-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-working-projects.component.html',
  styleUrls: ['./my-working-projects.component.css']
})
export class MyWorkingProjectsComponent implements OnInit {
  projects: ProjectSummary[] = [];
  freelancerId: string = '';

  constructor(private projectService: ProjectService, private authService: AuthService) {}

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
      next: (data) => this.projects = data,
      error: (err) => console.error('Error loading projects', err)
    });
  }
}

