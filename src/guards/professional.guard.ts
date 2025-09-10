import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserType } from '../models/user.model';
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

      if (currentUser.userType !== UserType.PROFESSIONAL) {
        router.navigate(['/']);
        return false;
      }

      return true;
    })
  );
};