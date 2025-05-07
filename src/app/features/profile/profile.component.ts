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
export class ProfileComponent implements OnInit {
  userId: string | null = null;
  userProfile: any;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    
    this.userId = this.route.snapshot.paramMap.get('id');
    console.log('Profile user ID from URL:', this.userId);
    
    if (this.userId) {
      this.userService.getUserProfile(this.userId).subscribe({
        next: (data) => this.userProfile = data,
        error: (err) => console.error('Error fetching profile:', err)
      });
    }
  }
}