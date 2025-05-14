import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user/user.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-profile',
  imports: [RouterLink,RouterModule,CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  userId = ''; // Replace it later
  userProfile: any;
  currentUserId:any;
   private routeSub!: Subscription;
  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    
  ) {}

  ngOnInit(): void {
    //const userId = this.route.snapshot.paramMap.get('id'); // get user id from url
    this.currentUserId =  this.userService.getCurrentUserId();
    this.routeSub = this.route.paramMap.subscribe(params => {
      const userId = params.get('id');
      if (userId) {
        this.userId = userId;

        //get user profile
        this.userService.getUserProfile(userId).subscribe({
          next: data => this.userProfile = data,
          error: err => console.error('Error fetching profile:', err)
        });
      }
    });
  }
  isOwnProfile(): boolean {
    this.currentUserId =  this.userService.getCurrentUserId();
    return this.userId === this.currentUserId;
  }
}
