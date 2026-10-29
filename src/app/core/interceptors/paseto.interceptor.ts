import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Observable, catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const pasetoInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
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
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Excluir endpoints de autenticación para no crear bucles infinitos
        const isExcluded =
          req.url.includes('/api/v1/auth/login') ||
          req.url.includes('/api/v1/auth/register') ||
          req.url.includes('/api/v1/auth/refresh') ||
          req.url.includes('/api/v1/auth/logout');

        if (isExcluded) {
          return throwError(() => error);
        }

        return handle401Error(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
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
        authService.logout();
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
