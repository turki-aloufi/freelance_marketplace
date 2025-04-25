import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  menuOpen = false;
  loggedIn = true//✅ غيّرها لـ true لتجربة حالة المستخدم المسجل
  isClientDropdownOpen = false;

  toggleClientDropdown() {
    this.isClientDropdownOpen = !this.isClientDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.client-dropdown')) {
      this.isClientDropdownOpen = false;
    }
  }
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
