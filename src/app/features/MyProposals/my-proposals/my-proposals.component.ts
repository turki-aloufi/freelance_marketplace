import { Component, OnInit } from '@angular/core';
import { ProposalService } from '../../../core/services/MyProposals/my-proposals.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDeleteDialogComponent } from '../../../core/custom_components/confirm-delete-dialog/confirm-delete-dialog.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-my-proposals',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatButtonModule
  ],
  templateUrl: './my-proposals.component.html',
  styleUrls: ['./my-proposals.component.css']
})
export class ProposalsComponent implements OnInit {
  proposals: any[] = [];
  freelancerId: string = '';
  deletingProposalId: number | null = null;

  constructor(
    private proposalService: ProposalService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.freelancerId = user.uid;
        this.loadProposals();
      }
    });
  }

  loadProposals() {
    this.proposalService.getMyProposals(this.freelancerId).subscribe({
      next: (data) => this.proposals = data,
      error: (err) => {
        console.error('Error loading proposals', err);
        this.snackBar.open('Failed to load proposals.', 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  confirmDelete(proposalId: number): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result === true) {
        this.deleteProposal(proposalId);
      }
    });
  }

  deleteProposal(proposalId: number) {
    this.deletingProposalId = proposalId;
    this.proposalService.deleteProposal(proposalId, this.freelancerId).subscribe({
      next: () => {
        this.proposals = this.proposals.filter(p => p.proposalId !== proposalId);
        this.snackBar.open('Proposal deleted successfully.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        console.error('Error deleting proposal:', err);
        let errorMessage = 'Failed to delete proposal.';
        if (err.status === 404) {
          errorMessage = 'Proposal not found.';
        } else if (err.status === 401) {
          errorMessage = 'You are not authorized.';
        } else if (err.status === 0) {
          errorMessage = 'Network error. Check your connection.';
        }
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      },
      complete: () => {
        this.deletingProposalId = null;
      }
    });
  }
}


