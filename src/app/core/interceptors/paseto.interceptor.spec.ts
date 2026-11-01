import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { pasetoInterceptor } from './paseto.interceptor';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../services/notification.service';

describe('pasetoInterceptor (HU-20: Cierre por Inactividad, Corte Diario y Límites 429)', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'accessToken',
      'clearSessionState',
      'refreshToken',
      'logout'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showWarning']);

    authServiceSpy.accessToken.and.returnValue('mock-token');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([pasetoInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('debe capturar HTTP 401 SESSION_INACTIVE, limpiar sesión y redirigir con motivo=inactividad', () => {
    httpClient.get('/api/v1/processes/list').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
      }
    });

    const req = httpTestingController.expectOne('/api/v1/processes/list');
    req.flush(
      { errorCode: 'SESSION_INACTIVE', detail: 'Sesión inactiva' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(authServiceSpy.clearSessionState).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/iniciar-sesion'], {
      queryParams: { motivo: 'inactividad' }
    });
    expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
  });

  it('debe capturar HTTP 401 ACCOUNT_SUSPENDED, limpiar sesión y redirigir con motivo=cuenta_suspendida', () => {
    httpClient.get('/api/v1/processes/list').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
      }
    });

    const req = httpTestingController.expectOne('/api/v1/processes/list');
    req.flush(
      { errorCode: 'ACCOUNT_SUSPENDED', detail: 'Cuenta suspendida' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(authServiceSpy.clearSessionState).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/iniciar-sesion'], {
      queryParams: { motivo: 'cuenta_suspendida' }
    });
    expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
  });

  it('debe capturar HTTP 401 SESSION_DAILY_CUTOFF, limpiar sesión y redirigir silenciosamente', () => {
    httpClient.get('/api/v1/processes/list').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
      }
    });

    const req = httpTestingController.expectOne('/api/v1/processes/list');
    req.flush(
      { errorCode: 'SESSION_DAILY_CUTOFF', detail: 'Corte diario a las 3:00 a. m.' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(authServiceSpy.clearSessionState).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/iniciar-sesion']);
    expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
  });

  it('debe capturar HTTP 429 Too Many Requests y alertar los minutos restantes conforme a Retry-After', () => {
    httpClient.get('/api/v1/processes/search-radicado').subscribe({
      error: (err) => {
        expect(err.status).toBe(429);
      }
    });

    const req = httpTestingController.expectOne('/api/v1/processes/search-radicado');
    // 480 segundos = 8 minutos
    req.flush(
      { detail: 'Límite de consultas excedido' },
      {
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 'Retry-After': '480' }
      }
    );

    expect(notificationServiceSpy.showWarning).toHaveBeenCalledWith(
      jasmine.stringMatching(/8 minutos/),
      'Límite de operaciones superado'
    );
  });
});
