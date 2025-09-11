import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const professionalGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.session$.pipe(
    map(session => {
      const currentUser = authService.currentUser();
      
      if (!session || !currentUser) {
        router.navigate(['/auth/login']);
        return false;
      }

      // Cualquier usuario autenticado puede acceder
      return true;
    })
  );
};