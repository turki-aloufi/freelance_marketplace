import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ClientsProjectsService, Project } from '../../core/services/clients-projects.service';
import { ConfirmDeleteDialogComponent } from '../../core/custom_components/confirm-delete-dialog/confirm-delete-dialog.component';
import { AddProjectComponent } from '../add-project/add-project.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-client-projects',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
    RouterModule],
  templateUrl: './client-projects.component.html',
  styleUrls: ['./client-projects.component.css']
})
export class ClientProjectsComponent implements OnInit {
  projects: Project[] = [];
  openProjects: Project[] = [];
  freelancingProjects: Project[] = [];
  loading: boolean = false;
  deletingProjectId: number | null = null;

  constructor(
    public clientProjects: ClientsProjectsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.clientProjects.getClientProjects().subscribe((data) => {
      this.projects = data;
      this.openProjects = data.filter(p => p.status === 'Open');
      this.freelancingProjects = data.filter(p => p.status !== 'Open');
    });
  }

  deleteProject(id: number): void {
    this.deletingProjectId = id;
    this.clientProjects.deleteClientProjects(id).subscribe({
      next: (response) => {
        console.log('Delete response:', response);
        // Update the local state after successful deletion
        this.openProjects = this.openProjects.filter(p => p.projectId !== id);
        this.freelancingProjects = this.freelancingProjects.filter(p => p.projectId !== id);
        // Show success notification
        this.snackBar.open('Project deleted successfully.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        console.error('Failed to delete project:', err);
        console.log('Status:', err.status);
        console.log('Status Text:', err.statusText);
        console.log('Error Message:', err.message);
        console.log('Error Details:', err.error);
        let errorMessage = 'Failed to delete project. Please try again.';
        if (err.status === 404) {
          errorMessage = 'Project not found.';
        } else if (err.status === 401) {
          errorMessage = 'You are not authorized to delete this project.';
        } else if (err.status === 0) {
          errorMessage = 'Network error. Please check your connection.';
        }
        // Show error notification
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.deletingProjectId = null;
      },
      complete: () => {
        this.deletingProjectId = null;
      }
    });
  }

  confirmDelete(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result === true) {
        this.deleteProject(id);
      }
    });
  }
}