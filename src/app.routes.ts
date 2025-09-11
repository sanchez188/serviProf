import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { professionalGuard } from './guards/professional.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'professionals',
    loadComponent: () => import('./pages/professionals/professionals.component').then(m => m.ProfessionalsComponent)
  },
  {
    path: 'professional/:id',
    loadComponent: () => import('./pages/professional-detail/professional-detail.component').then(m => m.ProfessionalDetailComponent)
  },
  {
    path: 'service/:id',
    loadComponent: () => import('./pages/professional-detail/professional-detail.component').then(m => m.ProfessionalDetailComponent)
  },
  {
    path: 'my-services',
    loadComponent: () => import('./pages/my-services/my-services.component').then(m => m.MyServicesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services.component').then(m => m.ServicesComponent)
  },
  {
    path: 'create-service',
    loadComponent: () => import('./pages/create-service/create-service.component').then(m => m.CreateServiceComponent),
    canActivate: [authGuard]
  },
  {
    path: 'availability',
    loadComponent: () => import('./pages/availability-management/availability-management.component').then(m => m.AvailabilityManagementComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'professional-setup',
    loadComponent: () => import('./pages/professional-profile-setup/professional-profile-setup.component').then(m => m.ProfessionalProfileSetupComponent),
    canActivate: [authGuard]
  },
  {
    path: 'professional-dashboard',
    loadComponent: () => import('./pages/professional-dashboard/professional-dashboard.component').then(m => m.ProfessionalDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];