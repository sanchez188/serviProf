import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserType } from '../models/user.model';

export const professionalGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();

  if (!currentUser) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (currentUser.userType !== UserType.PROFESSIONAL) {
    router.navigate(['/']);
    return false;
  }

  return true;
};