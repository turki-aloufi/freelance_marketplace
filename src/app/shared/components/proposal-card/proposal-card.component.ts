import { Component,Input,Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-proposal-card',
  imports: [],
  templateUrl: './proposal-card.component.html',
  styleUrl: './proposal-card.component.css'
})
export class ProposalCardComponent {

  @Input() proposal!: {
    coverLetter: string;
    deadline: string;
    proposedAmount: number;
    freelancerName: string;
    freelancerAvatar: string;
    freelancerId: string;
    proposalId: number;
  };
  constructor (
    private router:Router

  ){}
  @Output() accept = new EventEmitter<void>();
  navigateToUserProfile(freelancerId: string) {
    if (freelancerId) {
      this.router.navigate(['/profile', freelancerId]);
    }
  }
}
