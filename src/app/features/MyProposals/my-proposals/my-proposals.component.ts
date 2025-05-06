import { Component, OnInit } from '@angular/core';
import { ProposalService } from '../../../core/services/MyProposals/my-proposals.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-proposals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-proposals.component.html',
  styleUrls: ['./my-proposals.component.css']
})
export class ProposalsComponent implements OnInit {
  proposals: any[] = [];
  freelancerId: string = '';

  constructor(private proposalService: ProposalService, private authService: AuthService) {}

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
      error: (err) => console.error('Error loading proposals', err)
    });
  }

  deleteProposal(proposalId: number) {
    if (confirm('Are you sure you want to delete this proposal?')) {
      this.proposalService.deleteProposal(proposalId, this.freelancerId).subscribe({
        next: () => {
          this.proposals = this.proposals.filter(p => p.proposalId !== proposalId);
          alert('Proposal deleted successfully');
        },
        error: (err) => console.error('Error deleting proposal', err)
      });
    }
  }
}


