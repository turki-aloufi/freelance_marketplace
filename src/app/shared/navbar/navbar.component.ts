import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { UserService,UserProfileDto } from '../../core/services/user/user.service';
import { PaymentComponent } from '../../features/payment/payment.component';
import { FormsModule } from '@angular/forms';
import { NotificationService, Notification } from '../../core/services/Notification/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, PaymentComponent, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuOpen = false;
  isLoggedIn = false;
  isClientDropdownOpen = false;
  isProfileDropdownOpen = false;
  isFreelanceDropdownOpen = false;
  isBalanceDropdownOpen = false;
  userProfile: UserProfileDto | null = null;
  userId: string | null = null;
  notifications: Notification[] = [];
  isnotificationsshowDropdown = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        this.userId = user?.uid ?? null; // get uid
        console.log('User authentication state:', this.isLoggedIn);

         if (this.userId) {
        
        this.userService.getUserProfile(this.userId).subscribe({
          next: (userData) => {
            this.userProfile = userData;
          },
          error: (err) => {
            console.error('Error fetching user profile:', err);
          }
        });
 // Subscribe to profile data
         this.userService.userProfile$
          .pipe(takeUntil(this.destroy$))
          .subscribe(profile => {
            if (profile) {
              this.userProfile = profile;
            }
          });

          // Subscribe to notifications and update the notifications array
        this.notificationService.notifications$
          .pipe(takeUntil(this.destroy$))
          .subscribe((notificationsMap) => {
            if (this.userId) {
              this.notifications = notificationsMap.get(this.userId) || [];
            }
          });
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleFreelanceDropdown() {
    this.isFreelanceDropdownOpen = !this.isFreelanceDropdownOpen;
    this.isClientDropdownOpen = false;
    this.isProfileDropdownOpen = false;
    this.isBalanceDropdownOpen = false;
    this.isnotificationsshowDropdown=false;
  }

  toggleBalanceDropdown() {
    this.isBalanceDropdownOpen = !this.isBalanceDropdownOpen;
    this.isClientDropdownOpen = false;
    this.isProfileDropdownOpen = false;
    this.isFreelanceDropdownOpen = false;
    this.isnotificationsshowDropdown=false;
  }

  toggleClientDropdown() {
    this.isClientDropdownOpen = !this.isClientDropdownOpen;
    this.isProfileDropdownOpen = false;
    this.isBalanceDropdownOpen = false;
    this.isFreelanceDropdownOpen = false;
    this.isnotificationsshowDropdown=false;
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
    this.isClientDropdownOpen = false;
    this.isBalanceDropdownOpen = false;
    this.isFreelanceDropdownOpen = false;
    this.isnotificationsshowDropdown=false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (
      !target.closest('.client-dropdown') &&
      !target.closest('.profile-dropdown')&&
      !target.closest('.notifications-dropdown') &&
      !target.closest('.freelance-dropdown') 
        
    ) {
      this.isClientDropdownOpen = false;
      this.isProfileDropdownOpen = false;
      this.isBalanceDropdownOpen = false;
      this.isnotificationsshowDropdown = false; 
      this.isFreelanceDropdownOpen = false; 
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleNotificationsDropdown() {
    this.isProfileDropdownOpen = false;
    this.isClientDropdownOpen = false;
    this.isBalanceDropdownOpen = false;
    this.isFreelanceDropdownOpen = false;
    this.isnotificationsshowDropdown = !this.isnotificationsshowDropdown;
  }

 markAllAsRead() {
  if (this.userId) {
    this.notificationService.markAllAsRead(this.userId);
    // Update notification state to reflect read status
    this.notifications = this.notifications.map(notification => ({
      ...notification,
      read: true
    }));
  }
}

getUnreadCount(): number {
  if (this.userId) {
    return this.notificationService.getUnreadCount(this.userId);
  }
  return 0;  // Return 0 if userId is null
}



  logout() {
    this.authService.logout().then(() => {
      console.log('User logged out');
    }).catch(error => {
      console.error('Logout error:', error);
    });
  }
}
