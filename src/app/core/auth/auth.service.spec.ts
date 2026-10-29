import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/user.model';

describe('AuthService (Seguridad de Tokens)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser = {
    id: 'user-1',
    email: 'test@dokqet.com',
    name: 'Carlos Perez',
    firstName: 'Carlos',
    lastName: 'Perez',
    documentType: 'CC',
    documentNumber: '12345678',
    emailVerified: true,
    isSuperAdmin: false
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
    user: mockUser,
    activeOrganizationId: 'org-1',
    role: 'ADMIN',
    organizations: [{ id: 'org-1', name: 'Firma Legal', role: 'ADMIN', isPersonal: true }]
  };

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debe almacenar accessToken y refreshToken en localStorage para persistencia ante recarga', () => {
    service.setSession(mockAuthResponse);

    expect(service.accessToken()).toBe('mock.access.token');
    expect(service.isAuthenticated()).toBeTrue();

    // Verificación de persistencia ante F5:
    expect(localStorage.getItem('dokqet_paseto_access')).toBe('mock.access.token');
    expect(localStorage.getItem('dokqet_paseto_refresh')).toBe('mock.refresh.token');

    // Metadatos de conveniencia UI sí pueden persistir
    expect(localStorage.getItem('dokqet_active_org')).toBe('org-1');
    expect(localStorage.getItem('dokqet_role')).toBe('ADMIN');
  });

  it('debe limpiar tokens y metadatos en localStorage al llamar clearSessionState', () => {
    service.setSession(mockAuthResponse);
    service.clearSessionState();

    expect(localStorage.getItem('dokqet_paseto_access')).toBeNull();
    expect(localStorage.getItem('dokqet_paseto_refresh')).toBeNull();
    expect(localStorage.getItem('dokqet_active_org')).toBeNull();
    expect(service.accessToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('login debe enviar withCredentials: true y persistir la sesión recibida', () => {
    service.login({ email: 'test@dokqet.com', password: 'password123' }).subscribe(res => {
      expect(res.data.accessToken).toBe('mock.access.token');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();

    req.flush({ success: true, data: mockAuthResponse });

    expect(service.accessToken()).toBe('mock.access.token');
    expect(localStorage.getItem('dokqet_paseto_access')).toBe('mock.access.token');
  });

  it('refreshToken debe invocar el endpoint /refresh con withCredentials: true', () => {
    service.refreshToken().subscribe(res => {
      expect(res.data.accessToken).toBe('mock.access.token');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();

    req.flush({ success: true, data: mockAuthResponse });
  });

  it('logout debe llamar a /logout con withCredentials: true, limpiar memoria y redirigir', () => {
    service.setSession(mockAuthResponse);
    service.logout();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/logout');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();

    req.flush({ success: true, data: null });

    expect(service.accessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/iniciar-sesion']);
  });

  it('initAuth debe restaurar la sesión cuando el endpoint /refresh responde exitosamente', async () => {
    localStorage.setItem('dokqet_paseto_access', 'initial-token');
    localStorage.setItem('dokqet_paseto_refresh', 'initial-refresh');
    const initPromise = service.initAuth();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ success: true, data: mockAuthResponse });

    await initPromise;
    expect(service.accessToken()).toBe('mock.access.token');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('initAuth debe limpiar el estado sin fallar si /refresh devuelve 401', async () => {
    localStorage.setItem('dokqet_paseto_access', 'initial-token');
    const initPromise = service.initAuth();
    const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
    req.flush({ success: false, message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await initPromise;
    expect(service.accessToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });
});
