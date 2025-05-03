import { Component,Input,Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
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

  @Output() accept = new EventEmitter<void>();
}
