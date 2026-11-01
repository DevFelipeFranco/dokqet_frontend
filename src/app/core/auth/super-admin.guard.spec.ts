import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { superAdminGuard } from './super-admin.guard';
import { AuthService } from './auth.service';
import { NotificationService } from '../services/notification.service';
import { signal } from '@angular/core';

describe('superAdminGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let authServiceMock: {
    isAuthenticated: jasmine.Spy;
    isSuperAdmin: jasmine.Spy;
  };

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showWarning']);

    authServiceMock = {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      isSuperAdmin: jasmine.createSpy('isSuperAdmin').and.returnValue(true)
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    });
  });

  it('debe permitir la activación de la ruta si el usuario está autenticado y es SuperAdmin', () => {
    authServiceMock.isAuthenticated.and.returnValue(true);
    authServiceMock.isSuperAdmin.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => superAdminGuard({} as any, {} as any));

    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(notificationServiceSpy.showWarning).not.toHaveBeenCalled();
  });

  it('debe bloquear el acceso, emitir advertencia y redirigir a /panel si el usuario NO es SuperAdmin (rol LAWYER o ADMIN)', () => {
    authServiceMock.isAuthenticated.and.returnValue(true);
    authServiceMock.isSuperAdmin.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => superAdminGuard({} as any, {} as any));

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/panel']);
    expect(notificationServiceSpy.showWarning).toHaveBeenCalledWith('Acceso restringido para el área técnica');
  });

  it('debe bloquear el acceso y redirigir a /panel si el usuario no está autenticado', () => {
    authServiceMock.isAuthenticated.and.returnValue(false);
    authServiceMock.isSuperAdmin.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => superAdminGuard({} as any, {} as any));

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/panel']);
    expect(notificationServiceSpy.showWarning).toHaveBeenCalledWith('Acceso restringido para el área técnica');
  });
});
