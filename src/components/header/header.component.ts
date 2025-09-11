import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserType } from '../../models/user.model';
import { isSupabaseConfigured } from '../../lib/supabase';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="container">
        <div class="nav-brand">
          <a routerLink="/" class="logo">
            <span class="logo-icon">🔧</span>
            <span class="logo-text">ServiPro</span>
          </a>
          @if (!isSupabaseConfigured()) {
            <div class="config-warning">
              ⚠️ Supabase no configurado
            </div>
          }
        </div>

        <nav class="nav-menu" [class.active]="isMenuOpen">
          <a routerLink="/services" routerLinkActive="active" class="nav-link">
            Servicios
          </a>
          @if (!authService.isAuthenticated()) {
            <a routerLink="/professionals" routerLinkActive="active" class="nav-link">
              Profesionales
            </a>
          }
          @if (authService.isAuthenticated()) {
            <a routerLink="/my-services" routerLinkActive="active" class="nav-link">
              Mis Servicios
            </a>
            <div class="user-menu">
              <button class="user-button" (click)="toggleUserMenu()">
                <img 
                  [src]="authService.currentUser()?.avatar || generateDefaultAvatar(authService.currentUser()?.name || 'Usuario')" 
                  [alt]="authService.currentUser()?.name"
                  class="user-avatar"
                >
                <span>{{ authService.currentUser()?.name }}</span>
                <span class="chevron" [class.rotated]="isUserMenuOpen">▼</span>
              </button>
              <div class="user-dropdown" [class.show]="isUserMenuOpen">
                <a routerLink="/profile" class="dropdown-item" (click)="closeUserMenu()">
                  Mi Perfil
                </a>
                <button class="dropdown-item" (click)="logout()">
                  Cerrar Sesión
                </button>
              </div>
            </div>
          } @else {
            <a routerLink="/auth/login" class="nav-link login-btn">
              Iniciar Sesión
            </a>
          }
        </nav>

        <button class="mobile-menu-btn" (click)="toggleMenu()">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 70px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: #1f2937;
      font-weight: bold;
      font-size: 1.5rem;
    }

    .logo-icon {
      font-size: 2rem;
    }

    .config-warning {
      background: #fef3c7;
      color: #92400e;
      padding: 0.25rem 0.75rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      margin-left: 1rem;
    }

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .nav-link {
      text-decoration: none;
      color: #6b7280;
      font-weight: 500;
      transition: color 0.2s ease;
      position: relative;
    }

    .nav-link:hover,
    .nav-link.active {
      color: #3b82f6;
    }

    .nav-link.active::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      right: 0;
      height: 2px;
      background: #3b82f6;
    }

    .login-btn {
      background: #3b82f6;
      color: white !important;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      transition: background 0.2s ease;
    }

    .login-btn:hover {
      background: #2563eb;
    }

    .user-menu {
      position: relative;
    }

    .user-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: background 0.2s ease;
    }

    .user-button:hover {
      background: #f3f4f6;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .chevron {
      font-size: 0.8rem;
      transition: transform 0.2s ease;
    }

    .chevron.rotated {
      transform: rotate(180deg);
    }

    .user-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      min-width: 150px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
    }

    .user-dropdown.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-item {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: #374151;
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .dropdown-item:hover {
      background: #f3f4f6;
    }

    .dropdown-item:first-child {
      border-radius: 0.5rem 0.5rem 0 0;
    }

    .dropdown-item:last-child {
      border-radius: 0 0 0.5rem 0.5rem;
    }

    .mobile-menu-btn {
      display: none;
      flex-direction: column;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
    }

    .mobile-menu-btn span {
      width: 25px;
      height: 3px;
      background: #374151;
      border-radius: 2px;
      transition: all 0.3s ease;
    }

    @media (max-width: 768px) {
      .nav-menu {
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        background: white;
        flex-direction: column;
        padding: 1rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        transform: translateY(-100%);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .nav-menu.active {
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
      }

      .mobile-menu-btn {
        display: flex;
      }

      .user-dropdown {
        position: static;
        box-shadow: none;
        border: none;
        background: #f9fafb;
        margin-top: 1rem;
        opacity: 1;
        visibility: visible;
        transform: none;
      }
    }
  `]
})
export class HeaderComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  UserType = UserType;
  isMenuOpen = false;
  isUserMenuOpen = false;
  isSupabaseConfigured = isSupabaseConfigured;

  constructor() {
    // Subscribe to auth changes to update UI
    this.authService.session$.subscribe(session => {
      // Force change detection when auth state changes
      if (session) {
        console.log('User logged in:', this.authService.currentUser()?.name);
      } else {
        console.log('User logged out');
      }
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
    this.isMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    this.closeUserMenu();
  }

  generateDefaultAvatar(name: string): string {
    const cleanName = encodeURIComponent(name.trim());
    return `https://ui-avatars.com/api/?name=${cleanName}&background=3b82f6&color=ffffff&size=32&rounded=true&bold=true`;
  }
}