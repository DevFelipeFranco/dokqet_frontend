import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard para proteger rutas exclusivas de Super Administrador (HU-13)
 */
export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isSuperAdmin()) {
    return true;
  }

  // Redirige a la vista de consulta de catálogos
  router.navigate(['/catalogos']);
  return false;
};
