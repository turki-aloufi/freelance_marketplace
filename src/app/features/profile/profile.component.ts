import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user/user.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, RouterModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
<<<<<<< HEAD
export class ProfileComponent implements OnInit {
  userId: string | null = null;
=======
export class ProfileComponent {
  userId = ''; // Replace it later
>>>>>>> origin/dev
  userProfile: any;
  currentUserId:any;
  constructor(
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
<<<<<<< HEAD
    
    this.userId = this.route.snapshot.paramMap.get('id');
    console.log('Profile user ID from URL:', this.userId);
    
    if (this.userId) {
      this.userService.getUserProfile(this.userId).subscribe({
=======
    const userId = this.route.snapshot.paramMap.get('id'); // get user id from url
    this.currentUserId =  this.userService.getCurrentUserId();
    if (userId) {
      this.userId = userId;
      this.userService.getUserProfile(userId).subscribe({
>>>>>>> origin/dev
        next: (data) => this.userProfile = data,
        error: (err) => console.error('Error fetching profile:', err)
      });
    }
  }
<<<<<<< HEAD
}
=======
  isOwnProfile(): boolean {
    return this.userId === this.currentUserId;
  }
}
>>>>>>> origin/dev
