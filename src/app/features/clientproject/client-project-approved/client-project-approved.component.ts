import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { ApprovedProjectService } from '../../../core/services/clientProjects/approved-project.service';
import { UserService } from '../../../core/services/user/user.service';
import { NotificationService } from '../../../core/services/Notification/notification.service'; 
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
  initialLoading: boolean = true;

  searchTerm: string = '';
  selectedStatus: string = 'All';
  allProjects: any[] = [];

  constructor(
    private http: HttpClient,
    private approvedProjectService: ApprovedProjectService,
    private router: Router,
    private userService :UserService,
    private notificationService: NotificationService,
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
    this.initialLoading = true;
    this.approvedProjectService.getApprovedProjects(this.userID).subscribe({
      next: (data) => {
        this.allProjects = data;
        this.initialLoading = false;
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
        this.initialLoading = false;
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
  
  const project = this.allProjects.find(p => String(p.projectId) === String(projectID));
  const freelancerId = project?.freelancer?.freelancerId;
  console.log('Marking project done:', projectID);

  if (!project) {
    console.error('Project not found with ID:', projectID);
    return;
  }

  this.approvedProjectService.markProjectAsCompleted(projectID).subscribe({
    next: (response) => {
      console.log('Project marked as completed:', response);
      this.message = true;

      setTimeout(() => this.message = false, 5000);

      if (freelancerId) {
        this.notificationService.addNotification(
          `Congratulations! The project #${projectID} has been marked as completed. Well done! `,
          freelancerId
        );
      }

      this.loadApprovedProjects();
      this.userService.getUserProfile(this.userID);
    },
    error: (err) => {
      console.error('Failed to mark the project as complete', err);
      alert('Error: Could not mark project as completed.');
    }
  });
}


  contactFreelancer(freelancerId: string) {
    if (!freelancerId) {
      console.error('No freelancer ID provided');
      return;
    }
    this.router.navigate(['/messages'], { 
      queryParams: { userId: freelancerId }
    });
  }

navigateToUserProfile(freelancerId: string) {
  if (freelancerId) {
    this.router.navigate(['/profile', freelancerId]);
  }
}
}

