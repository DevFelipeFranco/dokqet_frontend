import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.currentUser();
    if (user && user.emailVerified === false) {
      return router.parseUrl(`/activacion-pendiente?email=${encodeURIComponent(user.email)}`);
    }
    return true;
  }

  return router.parseUrl('/iniciar-sesion');
};
