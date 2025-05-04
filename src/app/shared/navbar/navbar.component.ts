import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../core/services/user/user.service';
import { PaymentComponent } from '../../features/payment/payment.component';
import { FormsModule } from '@angular/forms';
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
  userBalance: number = 0;
  userId: string | null = null;
  isBalanceDropdownOpen = false;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService,private userService: UserService) {}

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
  }
  

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  





  toggleBalanceDropdown() {
    this.isBalanceDropdownOpen = !this.isBalanceDropdownOpen;
    // close other dropdowns
    this.isClientDropdownOpen = false;
    this.isProfileDropdownOpen = false;
  }
  toggleClientDropdown() {
    this.isClientDropdownOpen = !this.isClientDropdownOpen;
    this.isProfileDropdownOpen = false;
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
    this.isClientDropdownOpen = false;
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

  logout() {
    this.authService.logout().then(() => {
      console.log('User logged out');
    }).catch(error => {
      console.error('Logout error:', error);
    });
  }
}
