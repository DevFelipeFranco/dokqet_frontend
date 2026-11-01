import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../services/notification.service';
import { Observable, catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const pasetoInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);
  const token = authService.accessToken();

  // Para peticiones hacia la API de Auth (/api/v1/auth/**) asegurar siempre withCredentials: true
  // para que el navegador adjunte y guarde la Cookie HttpOnly (refreshToken).
  let modifiedReq = req;
  const isAuthEndpoint = req.url.includes('/api/v1/auth/');

  if (isAuthEndpoint && !req.withCredentials) {
    modifiedReq = modifiedReq.clone({ withCredentials: true });
  }

  // Adjuntar el Access Token en memoria en la cabecera estándar de autorización
  if (token && !modifiedReq.headers.has('Authorization')) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        // [HU-20] Manejo de límites operativos (HTTP 429 Too Many Requests con Retry-After)
        if (error.status === 429) {
          const retryHeader = error.headers?.get('Retry-After') || error.headers?.get('retry-after');
          let minutes = 1;

          if (retryHeader) {
            const seconds = parseInt(retryHeader, 10);
            if (!isNaN(seconds) && seconds > 0) {
              minutes = Math.max(1, Math.ceil(seconds / 60));
            }
          } else if (error.error?.retryAfterSeconds) {
            minutes = Math.max(1, Math.ceil(Number(error.error.retryAfterSeconds) / 60));
          } else if (error.error?.retryMinutes) {
            minutes = Number(error.error.retryMinutes) || 1;
          }

          notificationService.showWarning(
            `Has alcanzado el límite de consultas permitidas. Por favor espera ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} antes de intentar de nuevo.`,
            'Límite de operaciones superado'
          );
          return throwError(() => error);
        }

        // [HU-20 / HU-21] Manejo de expiración de sesión por inactividad, corte diario o cuenta suspendida
        if (error.status === 401) {
          const errorCode = error.error?.errorCode;

          if (errorCode === 'ACCOUNT_SUSPENDED') {
            authService.clearSessionState();
            router.navigate(['/iniciar-sesion'], {
              queryParams: { motivo: 'cuenta_suspendida' }
            });
            return throwError(() => error);
          }

          if (errorCode === 'SESSION_INACTIVE') {
            authService.clearSessionState();
            router.navigate(['/iniciar-sesion'], {
              queryParams: { motivo: 'inactividad' }
            });
            return throwError(() => error);
          }

          if (errorCode === 'SESSION_DAILY_CUTOFF') {
            authService.clearSessionState();
            router.navigate(['/iniciar-sesion']);
            return throwError(() => error);
          }

          // Excluir endpoints de autenticación para no crear bucles infinitos
          const isExcluded =
            req.url.includes('/api/v1/auth/login') ||
            req.url.includes('/api/v1/auth/signin') ||
            req.url.includes('/api/v1/auth/register') ||
            req.url.includes('/api/v1/auth/signup') ||
            req.url.includes('/api/v1/auth/refresh') ||
            req.url.includes('/api/v1/auth/logout') ||
            req.url.includes('/api/v1/auth/session/heartbeat');

          if (isExcluded) {
            return throwError(() => error);
          }

          return handle401Error(req, next, authService, router);
        }
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap(res => {
        isRefreshing = false;
        const newAccessToken = res.data?.accessToken;
        refreshTokenSubject.next(newAccessToken);

        const retryReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${newAccessToken}`
          }
        });
        return next(retryReq);
      }),
      catchError(refreshError => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        authService.clearSessionState();
        if (refreshError?.error?.errorCode === 'ACCOUNT_SUSPENDED') {
          router.navigate(['/iniciar-sesion'], {
            queryParams: { motivo: 'cuenta_suspendida' }
          });
        } else {
          authService.logout();
        }
        return throwError(() => refreshError);
      })
    );
  } else {
    // Si ya hay un refresco en progreso por otra llamada paralela, esperar a que emita el nuevo token
    return refreshTokenSubject.pipe(
      filter((newToken): newToken is string => newToken !== null),
      take(1),
      switchMap(newToken => {
        const retryReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`
          }
        });
        return next(retryReq);
      })
    );
  }
}
