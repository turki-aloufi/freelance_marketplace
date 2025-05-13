import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientsProjectsService, Project as ServiceProject, Freelancer } from '../../core/services/clients-projects.service'; // Adjust path as needed

// Interface for UI display (mapped from service data)
interface Project {
  title: string;
  deliveryDate: string;
  price: number;
  status: 'In Progress' | 'Completed';
  assignedTo: {
    name: string;
    imageUrl: string;
  };
}

@Component({
  selector: 'app-client-approved-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-approved-projects.component.html',
  styleUrls: ['./client-approved-projects.component.css']
})
export class ClientApprovedProjectsComponent implements OnInit {
  filterBy: string = 'All';
  projects: Project[] = [];
  error: string | null = null;

  constructor(private clientsProjectsService: ClientsProjectsService) { }

  ngOnInit() {
    this.fetchProjects();
  }

  fetchProjects() {
    this.clientsProjectsService.getClientProjects().subscribe({
      next: (serviceProjects: ServiceProject[]) => {
        this.projects = serviceProjects
          .filter(sp => sp.status !== 'Open') // Exclude 'Open' projects
          .map((sp: ServiceProject) => ({
            title: sp.title,
            deliveryDate: sp.deadline,
            price: sp.budget,
            status: sp.status === 'In Progress' ? 'In Progress' : 'Completed', // Treat anything not "In Progress" as "Completed"
            assignedTo: {
              name: sp.freelancer?.freelancerName || 'Unassigned',
              imageUrl: 'https://www.svgrepo.com/show/384670/account-avatar-profile-user.svg'
            }
          }));
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
        this.error = 'Failed to load projects. Please try again later.';
      }
    });
  }


  get filteredProjects(): Project[] {
    if (this.filterBy === 'All') return this.projects;
    return this.projects.filter(p => p.status === this.filterBy);
  }
}