import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ApprovedProjectService } from '../../../core/services/clientProjects/approved-project.service';
@Component({
  selector: 'app-client-project-approved',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './client-project-approved.component.html',
  styleUrl: './client-project-approved.component.css'
})
export class ClientProjectApprovedComponent implements OnInit {
  userData: any;
  userID: string = '';
  apiUrl: string = '';
  message = false;

  searchTerm: string = '';
  selectedStatus: string = 'All';
  allProjects: any[] = [];

  constructor(
    private http: HttpClient,
    private approvedProjectService: ApprovedProjectService
  ) { }

  ngOnInit() {
    // Get user ID
    this.userData = JSON.parse(localStorage.getItem('user') || '{}');
    this.userID = this.userData.uid || '';
    console.log("User data:", this.userID);

    this.loadApprovedProjects();
  }

  // Fetch all client approved project
  loadApprovedProjects() {
    this.approvedProjectService.getApprovedProjects(this.userID).subscribe({
      next: (data) => {
        this.allProjects = data;
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
      }
    });
  }

  get filteredProjects() {
    let projects = this.allProjects;

    if (this.selectedStatus !== 'All') {
      projects = projects.filter(p => p.status === this.selectedStatus);
    }

    if (this.searchTerm.trim() !== '') {
      const lowerSearch = this.searchTerm.toLowerCase();
      projects = projects.filter(p => p.title.toLowerCase().includes(lowerSearch));
    }

    return projects;
  }

  onDoneClick(projectID: string) {
    this.approvedProjectService.markProjectAsCompleted(projectID).subscribe({
      next: (response) => {
        console.log('Project marked as completed:', response);
        this.message = true;
        // Hide the message after 5 seconds
        setTimeout(() => {
          this.message = false;
        }, 5000);

        // Fetch all client approved project after update
        this.loadApprovedProjects();
      },
      error: (err) => {
        console.error('Failed to mark the project as complete', err);
        alert('Error: Could not mark project as completed.');
      }
    });
  }
}

