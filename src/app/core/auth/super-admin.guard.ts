import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Guard para proteger rutas exclusivas de Super Administrador (HU-18)
 * Redirige a /panel si el usuario no cuenta con privilegios técnicos y emite alerta.
 */
export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  if (authService.isAuthenticated() && authService.isSuperAdmin()) {
    return true;
  }

  notificationService.showWarning('Acceso restringido para el área técnica');
  router.navigate(['/panel']);
  return false;
};
