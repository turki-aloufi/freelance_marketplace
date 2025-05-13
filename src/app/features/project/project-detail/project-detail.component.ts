
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProposalCardComponent } from '../../../shared/components/proposal-card/proposal-card.component';
import { ProjectService, Project, Proposal,AssignProjectDto } from '../../../core/services/project/project.service';
import { AuthService } from '../../../core/services/auth.service'; 
import { NotificationService } from '../../../core/services/Notification/notification.service'; 
import { UserService } from '../../../core/services/user/user.service';
@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProposalCardComponent
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})

export class ProjectDetailComponent implements OnInit {
  comment: string = '';
  proposalDate: string = '';
  proposalPrice: number | null = null;
  projectId!: number;
  project?: Project;
  proposals: Proposal[] = [];
  requiredTasksArray: string[] = [];
  isProjectOwner: boolean = false;
  acceptedProposalId: number | null = null;
   // Add the isLoggedInNotOwner property
  isLoggedInNotOwner: boolean = false;
  assignMessage: 'success' | 'error' | 'warning'| null = null;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private userService :UserService,
  ) {}

  ngOnInit(): void {
    this.projectId = +this.route.snapshot.paramMap.get('id')!;

    this.projectService.getProjectById(this.projectId).subscribe(project => {
      this.project = project;
    
      console.log('Project Data:', project);
      const currentUser = this.authService.user$.value;
      const token = currentUser?.getIdToken();
      console.log('token:', token);  
      console.log('Current User:', currentUser);
      console.log('PostedBy:', project.clientId);


      
        if (currentUser && project.clientId && project.clientId === currentUser.uid) {
          this.isProjectOwner = true;
        } else {
          this.isProjectOwner = false;
        }
    
      console.log('isProjectOwner:', this.isProjectOwner);
      
    //Check if the user is logged in and is not the project owner
    this.isLoggedInNotOwner = currentUser && !this.isProjectOwner;
    console.log('isLoggedInNotOwner:', this.isLoggedInNotOwner);


      if (project.requiredTasks && typeof project.requiredTasks === 'string') {
        this.requiredTasksArray = project.requiredTasks.split(',').map(task => task.trim());
      } else if (Array.isArray(project.requiredTasks)) {
        this.requiredTasksArray = project.requiredTasks;
      } else {
        this.requiredTasksArray = [];
      }

      this.proposals = project.proposals.map(p => ({
        proposalId:p.proposalId,
        freelancerId:p.freelancerId,
        coverLetter: p.coverLetter,
        deadline: p.deadline,
        proposedAmount: p.proposedAmount,
        freelancerName: p.freelancerName || 'Unknown',
        freelancerAvatar: p.freelancerAvatar || 'https://www.svgrepo.com/show/384670/account-avatar-profile-user.svg',
        status: p['status'] || 'Pending',
        freelancerPhoneNumber:p.freelancerPhoneNumber
      }));
      const accepted = this.proposals.find(p => p.status === 'Accepted');
      if (accepted) {
    this.acceptedProposalId = accepted.proposalId;
  }
    });
  
  }

  sendProposal(): void {
    if (this.proposalDate && this.proposalPrice != null && this.comment) {
      const currentUser = this.authService.user$.value;

      if (!currentUser || !currentUser.uid) {
        alert("User not logged in. Please log in again.");
        return;
      }

      const newProposal = {
        freelancerId: currentUser.uid,
        proposedAmount: this.proposalPrice,
        deadline: this.proposalDate,
        coverLetter: this.comment
      };

      this.projectService.sendProposal(this.projectId, newProposal).subscribe(
        (response) => {
          this.proposals.push(response);
          this.comment = '';
          this.proposalDate = '';
          this.proposalPrice = null;
           this.assignMessage = 'success';
      setTimeout(() => {
        this.assignMessage = null;
      }, 5000);
        },
        (error) => {
          console.error('Error sending proposal:', error);
         
            this.assignMessage = 'error';
             setTimeout(() => {
            this.assignMessage = null;
      }, 5000);
        }
      );
    } else {
    
         // Show error message
      this.assignMessage = 'warning';
      setTimeout(() => {
        this.assignMessage = null;
      }, 5000);
      
  
    }
  }
//assign project
  acceptProposal(proposal: Proposal): void {
  
    const model: AssignProjectDto = {
     
      freelancerId:proposal.freelancerId,
      proposalId: proposal.proposalId,
      freelancerPhoneNumber:proposal.freelancerPhoneNumber, 
    };
    console.log("the body: ", model)
    this.projectService.assignProject(this.projectId, model).subscribe(
      () => {
        
        proposal.status = 'Accepted';

        this.acceptedProposalId = proposal.proposalId;  
      console.log('Proposal accepted and project assigned successfully.');

      // Show success message
      this.assignMessage = 'success';
      setTimeout(() => {
        this.assignMessage = null;
      }, 5000);

        this.notificationService.addNotification(
          `Congratulations! Your proposal has been accepted for Project No.${this.projectId}`,  
          proposal.freelancerId // <== This identifies the recipient.
        )
       // clear user cashed
        this.userService.clearCachedProfile(); 
        this.userService.refreshUserProfile();
      },
    
      (error) => {
        console.error('Error assigning project:', error);
       
         // Show error message
      this.assignMessage = 'error';
      setTimeout(() => {
        this.assignMessage = null;
      }, 5000);
      }
    );
  }
}
