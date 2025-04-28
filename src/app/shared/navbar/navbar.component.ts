import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service'; // Adjust path as needed
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuOpen = false;
  isLoggedIn = false;
  isClientDropdownOpen = false;
  isProfileDropdownOpen = false;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        console.log('User authentication state:', this.isLoggedIn);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
