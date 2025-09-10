import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Iniciar Sesión</h1>
          <p>Accede a tu cuenta de ServiPro</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              class="form-control"
              [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              placeholder="tu@email.com"
            >
            @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
              <div class="error-message">
                @if (loginForm.get('email')?.errors?.['required']) {
                  El email es requerido
                }
                @if (loginForm.get('email')?.errors?.['email']) {
                  Ingresa un email válido
                }
              </div>
            }
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              class="form-control"
              [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              placeholder="Tu contraseña"
            >
            @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
              <div class="error-message">
                La contraseña es requerida
              </div>
            }
          </div>

          @if (errorMessage) {
            <div class="alert alert-error">
              {{ errorMessage }}
            </div>
          }

          <div class="divider">
            <span>o</span>
          </div>

          <button 
            type="button" 
            class="btn btn-google btn-full"
            (click)="loginWithGoogle()"
            [disabled]="authService.isLoading()"
          >
            @if (authService.isLoading()) {
              <app-loading-spinner></app-loading-spinner>
            } @else {
              <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            }
          </button>
          <div class="demo-credentials">
            <h4>Cuenta de prueba:</h4>
            <p><strong>Email:</strong> user-test.com</p>
            <p><strong>Contraseña:</strong> password</p>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-full"
            [disabled]="loginForm.invalid || authService.isLoading()"
          >
            @if (authService.isLoading()) {
              <app-loading-spinner></app-loading-spinner>
            } @else {
              Iniciar Sesión
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>¿No tienes cuenta? <a routerLink="/auth/register">Regístrate aquí</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .auth-card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-header h1 {
      font-size: 2rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .auth-header p {
      color: #6b7280;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
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

    .form-control.error {
      border-color: #ef4444;
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

    .demo-credentials {
      background: #f0f9ff;
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid #bae6fd;
    }

    .demo-credentials h4 {
      color: #0369a1;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .demo-credentials p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
      color: #0369a1;
    }

    .divider {
      position: relative;
      text-align: center;
      margin: 1.5rem 0;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e5e7eb;
    }

    .divider span {
      background: white;
      padding: 0 1rem;
      color: #6b7280;
      font-size: 0.875rem;
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

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-google {
      background: white;
      color: #374151;
      border: 2px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .btn-google:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .google-icon {
      flex-shrink: 0;
    }

    .btn-full {
      width: 100%;
    }

    .auth-footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    .auth-footer a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }
  `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  authService = inject(AuthService);

  loginForm: FormGroup;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage = '';
      const credentials = this.loginForm.value;

      this.authService.login(credentials).subscribe({
        next: () => {
          this.router.navigate(['/professionals']);
        },
        error: (error) => {
          this.errorMessage = error.message;
        },
      });
    }
  }

  loginWithGoogle(): void {
    this.errorMessage = '';
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        console.log('Google OAuth initiated');
        // OAuth redirect will handle navigation automatically
      },
      error: (error) => {
        this.errorMessage = error.message;
        console.error('Google login error:', error);
      },
    });
  }
}
