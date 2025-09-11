import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="profile-page">
      <div class="container">
        <div class="page-header">
          <h1>Mi Perfil</h1>
          <p>Gestiona tu información personal</p>
        </div>

        <div class="profile-content">
          <div class="profile-card">
            <!-- Avatar Section -->
            <div class="avatar-section">
              <div class="avatar-container">
                <img 
                  [src]="currentUser?.avatar || '/assets/default-avatar.png'" 
                  [alt]="currentUser?.name"
                  class="profile-avatar"
                >
                <button class="avatar-edit-btn" (click)="changeAvatar()">
                  📷
                </button>
              </div>
              <div class="user-info">
                <h2>{{ currentUser?.name }}</h2>
                <p class="user-email">{{ currentUser?.email }}</p>
                <div class="user-meta">
                  <span>Miembro desde {{ formatDate(currentUser?.createdAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Profile Form -->
            <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="profile-form">
              <div class="form-section">
                <h3>Información Personal</h3>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="name">Nombre Completo</label>
                    <input
                      type="text"
                      id="name"
                      formControlName="name"
                      class="form-control"
                      [class.error]="profileForm.get('name')?.invalid && profileForm.get('name')?.touched"
                    >
                    @if (profileForm.get('name')?.invalid && profileForm.get('name')?.touched) {
                      <div class="error-message">
                        El nombre es requerido
                      </div>
                    }
                  </div>

                  <div class="form-group">
                    <label for="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      formControlName="email"
                      class="form-control"
                      [class.error]="profileForm.get('email')?.invalid && profileForm.get('email')?.touched"
                      readonly
                    >
                    <small class="form-help">El email no se puede modificar</small>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="phone">Teléfono</label>
                    <input
                      type="tel"
                      id="phone"
                      formControlName="phone"
                      class="form-control"
                      placeholder="+52 123 456 7890"
                    >
                  </div>

                  <div class="form-group">
                    <label for="address">Dirección</label>
                    <input
                      type="text"
                      id="address"
                      formControlName="address"
                      class="form-control"
                      placeholder="Tu dirección completa"
                    >
                  </div>
                </div>
              </div>

              @if (updateError) {
                <div class="alert alert-error">
                  {{ updateError }}
                </div>
              }

              @if (updateSuccess) {
                <div class="alert alert-success">
                  Perfil actualizado exitosamente
                </div>
              }

              <div class="form-actions">
                <button 
                  type="button" 
                  class="btn btn-secondary"
                  (click)="resetForm()"
                  [disabled]="authService.isLoading()"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  [disabled]="profileForm.invalid || !profileForm.dirty || authService.isLoading()"
                >
                  @if (authService.isLoading()) {
                    <app-loading-spinner></app-loading-spinner>
                  } @else {
                    Guardar Cambios
                  }
                </button>
              </div>
            </form>
          </div>

          <!-- Account Stats -->
          <div class="stats-card">
            <h3>Estadísticas de Cuenta</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-icon">📋</div>
                <div class="stat-info">
                  <div class="stat-number">{{ userStats.totalBookings }}</div>
                  <div class="stat-label">Servicios Contratados</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">✅</div>
                <div class="stat-info">
                  <div class="stat-number">{{ userStats.completedBookings }}</div>
                  <div class="stat-label">Servicios Completados</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">⭐</div>
                <div class="stat-info">
                  <div class="stat-number">{{ userStats.averageRating }}</div>
                  <div class="stat-label">Calificación Promedio</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">💰</div>
                <div class="stat-info">
                  <div class="stat-number">\${{ userStats.totalSpent }}</div>
                  <div class="stat-label">Total Gastado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Avatar Selection Modal -->
    @if (showAvatarModal) {
      <div class="modal-overlay" (click)="closeAvatarModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Cambiar Avatar</h3>
            <button class="modal-close" (click)="closeAvatarModal()">×</button>
          </div>
          
          <div class="modal-body">
            <div class="avatar-options">
              @for (avatar of avatarOptions; track avatar.id) {
                <button 
                  class="avatar-option"
                  [class.selected]="selectedAvatar === avatar.url"
                  (click)="selectAvatar(avatar.url)"
                >
                  <img [src]="avatar.url" [alt]="avatar.name">
                  <span>{{ avatar.name }}</span>
                </button>
              }
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAvatarModal()">
              Cancelar
            </button>
            <button 
              class="btn btn-primary"
              (click)="updateAvatar()"
              [disabled]="!selectedAvatar || authService.isLoading()"
            >
              @if (authService.isLoading()) {
                <app-loading-spinner></app-loading-spinner>
              } @else {
                Actualizar Avatar
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .profile-page {
      min-height: 100vh;
      background: #f9fafb;
      padding: 2rem 0;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .page-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .page-header h1 {
      font-size: 2.5rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .page-header p {
      font-size: 1.2rem;
      color: #6b7280;
    }

    .profile-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    .profile-card,
    .stats-card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .avatar-section {
      display: flex;
      gap: 2rem;
      align-items: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .avatar-container {
      position: relative;
    }

    .profile-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #e5e7eb;
    }

    .avatar-edit-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3b82f6;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    }

    .avatar-edit-btn:hover {
      background: #2563eb;
    }

    .user-info h2 {
      font-size: 2rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .user-email {
      color: #6b7280;
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }

    .user-meta {
      color: #9ca3af;
      font-size: 0.875rem;
    }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section h3 {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
    }

    .form-control {
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .form-control:read-only {
      background: #f9fafb;
      color: #6b7280;
    }

    .form-control.error {
      border-color: #ef4444;
    }

    .form-help {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
    }

    .alert {
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .alert-error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .alert-success {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4b5563;
    }

    .btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    /* Stats Card */
    .stats-card h3 {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 1.5rem;
    }

    .stats-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .stat-icon {
      font-size: 2rem;
      width: 50px;
      text-align: center;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1f2937;
    }

    .stat-label {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1f2937;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0.5rem;
    }

    .modal-close:hover {
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .avatar-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
    }

    .avatar-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #f9fafb;
      border: 2px solid transparent;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .avatar-option:hover {
      background: #f3f4f6;
    }

    .avatar-option.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .avatar-option img {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-option span {
      font-size: 0.875rem;
      color: #374151;
      text-align: center;
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    @media (max-width: 768px) {
      .profile-content {
        grid-template-columns: 1fr;
      }

      .avatar-section {
        flex-direction: column;
        text-align: center;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .avatar-options {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);

  profileForm: FormGroup;
  currentUser: User | null = null;
  updateError = '';
  updateSuccess = false;

  // Avatar modal
  showAvatarModal = false;
  selectedAvatar = '';
  avatarOptions = [
    { id: 1, name: 'Avatar 1', url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1' },
    { id: 2, name: 'Avatar 2', url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1' },
    { id: 3, name: 'Avatar 3', url: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1' },
    { id: 4, name: 'Avatar 4', url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1' },
    { id: 5, name: 'Avatar 5', url: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1' },
    { id: 6, name: 'Avatar 6', url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1' }
  ];

  // Mock user stats
  userStats = {
    totalBookings: 8,
    completedBookings: 6,
    averageRating: 4.8,
    totalSpent: 450
  };

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser();
    if (this.currentUser) {
      this.profileForm.patchValue({
        name: this.currentUser.name,
        email: this.currentUser.email,
        phone: this.currentUser.phone || '',
        address: this.currentUser.address || ''
      });
    }
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long'
    }).format(new Date(date));
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.updateError = '';
      this.updateSuccess = false;

      const formValue = this.profileForm.value;
      const updateData = {
        name: formValue.name,
        phone: formValue.phone,
        address: formValue.address
      };

      this.authService.updateProfile(updateData).subscribe({
        next: (user) => {
          this.currentUser = user;
          this.updateSuccess = true;
          this.profileForm.markAsPristine();
          
          setTimeout(() => {
            this.updateSuccess = false;
          }, 3000);
        },
        error: (error) => {
          this.updateError = error.message;
        }
      });
    }
  }

  resetForm(): void {
    if (this.currentUser) {
      this.profileForm.patchValue({
        name: this.currentUser.name,
        email: this.currentUser.email,
        phone: this.currentUser.phone || '',
        address: this.currentUser.address || ''
      });
      this.profileForm.markAsPristine();
    }
    this.updateError = '';
    this.updateSuccess = false;
  }

  changeAvatar(): void {
    this.selectedAvatar = this.currentUser?.avatar || '';
    this.showAvatarModal = true;
  }

  closeAvatarModal(): void {
    this.showAvatarModal = false;
    this.selectedAvatar = '';
  }

  selectAvatar(avatarUrl: string): void {
    this.selectedAvatar = avatarUrl;
  }

  updateAvatar(): void {
    if (this.selectedAvatar) {
      this.authService.updateProfile({ avatar: this.selectedAvatar }).subscribe({
        next: (user) => {
          this.currentUser = user;
          this.closeAvatarModal();
        },
        error: (error) => {
          this.updateError = error.message;
          this.closeAvatarModal();
        }
      });
    }
  }

  generateDefaultAvatar(name: string): string {
    const cleanName = encodeURIComponent(name.trim());
    return `https://ui-avatars.com/api/?name=${cleanName}&background=3b82f6&color=ffffff&size=120&rounded=true&bold=true`;
  }
}