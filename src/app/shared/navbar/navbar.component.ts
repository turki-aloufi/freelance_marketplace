import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../core/services/user/user.service';
import { PaymentComponent } from '../../features/payment/payment.component';
import { FormsModule } from '@angular/forms';
import { NotificationService, Notification } from '../../core/services/Notification/notification.service';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule,PaymentComponent,FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuOpen = false;
  isLoggedIn = false;
  isClientDropdownOpen = false;
  isProfileDropdownOpen = false;
  isFreelanceDropdownOpen=false;
  isBalanceDropdownOpen = false;
  userBalance: number = 0;
  userId: string | null = null;
  notifications: Notification[] = [];
  unreadCount = 0;
  showNotifications = false;
  
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService,private userService: UserService,private notificationService: NotificationService) {}

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
              this.userBalance = userData.balance; //get user balance
            },
            error: (err) => {
              console.error('Error fetching user profile:', err);
            }
          });
        }
      });
      // this.notificationService.notifications$.subscribe(notifications => {
      //   this.notifications = notifications;
      // });
 
         // Subscribe to notifications and filter based on userId
         this.notificationService.notifications$
         .pipe(takeUntil(this.destroy$))
         .subscribe((notifications) => {
           if (this.userId) {  // Ensure userId is not null before processing notifications
             const userNotifications = notifications.get(this.userId) || [];
             this.notifications = userNotifications;
             // Update unread count
             this.unreadCount = this.notificationService.getUnreadCount(this.userId);
           }
         });
     }
 
   


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  



  toggleFreelanceDropdown(){
    this.isFreelanceDropdownOpen = !this.isFreelanceDropdownOpen;
    // close other dropdowns
    this.isClientDropdownOpen = false;
    this.isProfileDropdownOpen = false;
    this.isBalanceDropdownOpen=false;
  }

  toggleBalanceDropdown() {
    this.isBalanceDropdownOpen = !this.isBalanceDropdownOpen;
    // close other dropdowns
    this.isClientDropdownOpen = false;
    this.isProfileDropdownOpen = false;
    this.isFreelanceDropdownOpen =false;
  }
  toggleClientDropdown() {
    this.isClientDropdownOpen = !this.isClientDropdownOpen;
    this.isProfileDropdownOpen = false;
    this.isBalanceDropdownOpen=false;
    this.isFreelanceDropdownOpen =false;
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
    this.isClientDropdownOpen = false;
    this.isBalanceDropdownOpen=false;
    this.isFreelanceDropdownOpen =false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.client-dropdown') && !target.closest('.profile-dropdown')) {
      this.isClientDropdownOpen = false;
      this.isProfileDropdownOpen = false;
      this.isBalanceDropdownOpen = false;
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
  // toggleNotifications() {
  //   this.showNotifications = !this.showNotifications;
  //   if (this.showNotifications) {
  //     this.markAllAsRead();
  //   }
  // }
  
  // markAllAsRead() {
  //   this.notificationService.markAllAsRead();
  // }
  // toggleNotifications() {
  //   this.showNotifications = !this.showNotifications;
  //   if (this.showNotifications) {
  //     this.markAllAsRead();
  //   }
  // }

  // markAllAsRead() {
  //   if (this.userId) {
  //     this.notificationService.markAllAsRead(this.userId);
  //   }
  // }



  toggleNotifications() {
  this.showNotifications = !this.showNotifications;
  if (this.showNotifications) {
    // هنا يمكن أن تضع شرطًا إذا أردت تعيين إشعار معين كـ "مقروء"
    // على سبيل المثال، يمكن أن تختار أول إشعار لمعرفه
    if (this.notifications.length > 0) {
      this.markAsRead(this.notifications[0].id);  // يمكن اختيار أول إشعار أو إشعار معين
    }
  }
}

markAsRead(notificationId: number) {
  if (this.userId) {
    this.notificationService.markNotificationAsRead(this.userId, notificationId);
  }
}

  logout() {
    this.authService.logout().then(() => {
      console.log('User logged out');
    }).catch(error => {
      console.error('Logout error:', error);
    });
  }
  
}
