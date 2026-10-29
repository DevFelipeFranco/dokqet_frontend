import { ApplicationConfig, provideZoneChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { pasetoInterceptor } from './core/interceptors/paseto.interceptor';
import { tenantInterceptor } from './core/interceptors/tenant.interceptor';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([pasetoInterceptor, tenantInterceptor])),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.initAuth();
    })
  ]
};
