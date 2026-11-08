import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guardián para rutas públicas (Landing Page o Login):
 * Si el usuario ya está autenticado con sesión activa, lo redirige automáticamente a su panel de procesos (/panel).
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return router.parseUrl('/panel');
  }

  return true;
};
