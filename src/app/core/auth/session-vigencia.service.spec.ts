import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { SessionVigenciaService, DAILY_CUTOFF_UTC_HOUR } from './session-vigencia.service';
import { AuthService } from './auth.service';

describe('SessionVigenciaService (HU-20: Vigencia de Sesión y Corte Diario)', () => {
  let service: SessionVigenciaService;
  let authService: AuthService;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        SessionVigenciaService,
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(SessionVigenciaService);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    service.stopMonitoring();
  });

  it('debe crearse exitosamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe calcular correctamente los milisegundos hasta las 3:00 a. m. COT (08:00 UTC)', () => {
    // Caso 1: 07:00 UTC (antes de las 08:00 UTC) -> El próximo corte es hoy a las 08:00 UTC (1 hora = 3,600,000 ms)
    const mockDateBeforeCutoff = new Date(Date.UTC(2026, 10, 1, 7, 0, 0, 0));
    const msUntil = service.calculateMsUntilNextCutoff(mockDateBeforeCutoff);
    expect(msUntil).toBe(3600000);

    // Caso 2: 09:00 UTC (después de las 08:00 UTC) -> El próximo corte es mañana a las 08:00 UTC (23 horas = 82,800,000 ms)
    const mockDateAfterCutoff = new Date(Date.UTC(2026, 10, 1, 9, 0, 0, 0));
    const msUntilTomorrow = service.calculateMsUntilNextCutoff(mockDateAfterCutoff);
    expect(msUntilTomorrow).toBe(23 * 3600 * 1000);
  });

  it('handleInactivityExpiration debe limpiar la sesión y navegar a /iniciar-sesion?motivo=inactividad', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    const clearSpy = spyOn(authService, 'clearSessionState');

    service.handleInactivityExpiration();

    expect(clearSpy).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/iniciar-sesion'], {
      queryParams: { motivo: 'inactividad' }
    });
  });

  it('handleDailyCutoffExpiration debe limpiar la sesión y navegar a /iniciar-sesion silenciosamente', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    const clearSpy = spyOn(authService, 'clearSessionState');

    service.handleDailyCutoffExpiration();

    expect(clearSpy).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/iniciar-sesion']);
  });

  it('recordActivity debe invocar heartbeat si el usuario está autenticado y transcurrieron 60s', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    const heartbeatSpy = spyOn(authService, 'sendHeartbeat').and.returnValue(
      of({ success: true, data: { valid: true, lastActiveAt: '2026-11-01T12:00:00Z', expiresAt: '2026-11-01T13:00:00Z' } })
    );

    service.startMonitoring();
    service.recordActivity();

    expect(heartbeatSpy).toHaveBeenCalled();
  });

  it('heartbeat debe expulsar por inactividad si el backend responde 401 SESSION_INACTIVE', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    spyOn(authService, 'sendHeartbeat').and.returnValue(
      throwError(() => ({
        status: 401,
        error: { errorCode: 'SESSION_INACTIVE' }
      }))
    );
    const inactivitySpy = spyOn(service, 'handleInactivityExpiration');

    service.startMonitoring();
    service.recordActivity();

    expect(inactivitySpy).toHaveBeenCalled();
  });
});
