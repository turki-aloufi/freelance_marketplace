import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user/user.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-profile',
  imports: [RouterLink,RouterModule,CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  userId = '4rRsQ3t1gob0w3uIeTW4FCW62LG2'; // Replace with dynamic value later
  userProfile: any;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id'); // get user id from url
    if (userId) {
      this.userService.getUserProfile(userId).subscribe({
        next: (data) => this.userProfile = data,
        error: (err) => console.error('Error fetching profile:', err)
      });
    }
  }
}
