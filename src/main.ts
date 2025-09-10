import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom, isDevMode } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  template: `
    <div class="app" *ngIf="!authService.isLoading(); else loadingTemplate">
      <app-header></app-header>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
    
    <ng-template #loadingTemplate>
      <div class="app-loading">
        <div class="loading-spinner">
          <div class="spinner"></div>
        </div>
        <p>Cargando...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
    }
    
    .app-loading {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
    }
    
    .loading-spinner {
      margin-bottom: 1rem;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class App {
  title = 'ServiPro';
  
  constructor(public authService: AuthService) {}
}

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    importProvidersFrom(FormsModule),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
}).catch(err => console.error(err));
