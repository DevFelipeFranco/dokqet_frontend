import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { catchError, throwError } from 'rxjs';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const activeOrgId = authService.activeOrgId();

  // Si existe organización activa y la petición no lleva ya la cabecera X-Tenant-ID
  const modifiedReq = (activeOrgId && !req.headers.has('X-Tenant-ID'))
    ? req.clone({ setHeaders: { 'X-Tenant-ID': activeOrgId } })
    : req;

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403 && typeof error.error?.message === 'string') {
        const msg = error.error.message.toLowerCase();
        if (msg.includes('organización') || msg.includes('tenant') || msg.includes('perteneces')) {
          console.warn('[TenantInterceptor] Acceso denegado al tenant solicitado:', error.error.message);
        }
      }
      return throwError(() => error);
    })
  );
};
