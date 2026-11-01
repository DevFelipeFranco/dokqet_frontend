import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminUserDetailComponent } from './admin-user-detail.component';
import { SuperAdminService } from '../../../../core/services/super-admin.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AdminUserDetail } from '../../../../core/models/super-admin.model';

describe('AdminUserDetailComponent (HU-21: Ficha de Soporte y Suspensión)', () => {
  let component: AdminUserDetailComponent;
  let fixture: ComponentFixture<AdminUserDetailComponent>;
  let superAdminServiceSpy: jasmine.SpyObj<SuperAdminService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  const mockUserDetail: AdminUserDetail = {
    id: 'usr-100',
    email: 'abogado@firma.co',
    name: 'Carlos Abogado Gómez',
    firstName: 'Carlos',
    middleName: null,
    lastName: 'Gómez',
    secondLastName: null,
    documentType: 'CC',
    documentNumber: '10203040',
    genderCode: 'M',
    cityId: '05001',
    status: 'ACTIVE',
    emailVerified: true,
    isSuperAdmin: false,
    isAccountLocked: false,
    lockedUntil: null,
    isSuspended: false,
    suspendedAt: null,
    suspensionType: null,
    openSessionsCount: 2,
    lastSignInAt: '2026-11-01T15:00:00Z',
    createdAt: '2026-01-10T10:00:00Z',
    organizations: [
      {
        membershipId: 'mem-1',
        organizationId: 'org-1',
        organizationName: 'Firma Legal S.A.S.',
        personType: 'JURIDICA',
        isPersonal: false,
        role: 'LAWYER',
        status: 'ACTIVE',
        joinedAt: '2026-01-15T10:00:00Z',
        lastUsedAt: '2026-10-31T15:00:00Z'
      }
    ],
    consents: [
      {
        id: 'con-1',
        type: 'TERMS',
        version: '1.0',
        acceptedAt: '2026-01-10T10:05:00Z',
        ipAddress: '190.14.20.10'
      }
    ],
    adminActions: []
  };

  beforeEach(async () => {
    superAdminServiceSpy = jasmine.createSpyObj('SuperAdminService', [
      'getUserDetail',
      'suspendUser',
      'reactivateUser',
      'grantSuperAdmin',
      'revokeSuperAdmin',
      'sendPasswordResetSupportLink',
      'resendVerificationSupportLink',
      'unlockUser'
    ]);

    authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess',
      'showWarning',
      'showError'
    ]);

    authServiceSpy.currentUser.and.returnValue({
      id: 'admin-super-999',
      email: 'admin@dokqet.com',
      name: 'Super Admin',
      roles: ['SUPER_ADMIN']
    } as any);

    superAdminServiceSpy.getUserDetail.and.returnValue(
      of({ success: true, data: mockUserDetail })
    );

    await TestBed.configureTestingModule({
      imports: [AdminUserDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'usr-100' : null)
              }
            }
          }
        },
        { provide: SuperAdminService, useValue: superAdminServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUserDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe cargar la ficha integral del usuario al inicializar', () => {
    expect(component).toBeTruthy();
    expect(superAdminServiceSpy.getUserDetail).toHaveBeenCalledWith('usr-100');
    expect(component.user()?.email).toBe('abogado@firma.co');
    expect(component.user()?.openSessionsCount).toBe(2);
  });

  it('debe prohibir suspenderse a sí mismo o suspender a otro SUPER_ADMIN', () => {
    // Caso 1: Usuario normal -> canSuspend = true
    expect(component.canSuspend()).toBeTrue();

    // Caso 2: El usuario es el mismo admin autenticado
    authServiceSpy.currentUser.and.returnValue({ id: 'usr-100' } as any);
    expect(component.canSuspend()).toBeFalse();
    expect(component.cannotSuspendTooltip()).toContain('No puedes suspender tu propia cuenta');

    // Caso 3: El usuario es otro Super Admin
    authServiceSpy.currentUser.and.returnValue({ id: 'admin-other' } as any);
    component.user.set({ ...mockUserDetail, isSuperAdmin: true });
    expect(component.canSuspend()).toBeFalse();
    expect(component.cannotSuspendTooltip()).toContain('Primero debes quitarle el rol de Super Administrador');
  });

  it('debe suspender cuenta exitosamente con motivo obligatorio y revocar sesiones en UI', () => {
    superAdminServiceSpy.suspendUser.and.returnValue(
      of({
        success: true,
        message: 'Cuenta suspendida.',
        data: { ...mockUserDetail, isSuspended: true, suspendedAt: '2026-11-01T20:00:00Z' }
      })
    );

    component.openSuspendModal();
    expect(component.isSuspendModalOpen()).toBeTrue();

    // Validar motivo vacío
    component.suspendReason.set('');
    component.confirmSuspend();
    expect(component.actionModalError()).toContain('Debes ingresar un motivo válido');

    // Motivo válido
    component.suspendReason.set('Solicitud de bloqueo preventivo por extravío de dispositivo');
    component.confirmSuspend();

    expect(superAdminServiceSpy.suspendUser).toHaveBeenCalledWith(
      'usr-100',
      'Solicitud de bloqueo preventivo por extravío de dispositivo'
    );
    expect(notificationServiceSpy.showSuccess).toHaveBeenCalled();
    expect(component.user()?.isSuspended).toBeTrue();
    expect(component.user()?.status).toBe('SUSPENDED');
    expect(component.user()?.openSessionsCount).toBe(0);
    expect(component.user()?.adminActions[0].type).toBe('SUSPEND_USER');
  });

  it('debe reactivar cuenta exitosamente con motivo obligatorio', () => {
    component.user.set({ ...mockUserDetail, isSuspended: true, status: 'SUSPENDED' });

    superAdminServiceSpy.reactivateUser.and.returnValue(
      of({
        success: true,
        message: 'Cuenta reactivada.',
        data: { ...mockUserDetail, isSuspended: false, suspendedAt: null }
      })
    );

    component.openReactivateModal();
    expect(component.isReactivateModalOpen()).toBeTrue();

    component.reactivateReason.set('Identidad verificada en soporte');
    component.confirmReactivate();

    expect(superAdminServiceSpy.reactivateUser).toHaveBeenCalledWith(
      'usr-100',
      'Identidad verificada en soporte'
    );
    expect(notificationServiceSpy.showSuccess).toHaveBeenCalled();
    expect(component.user()?.isSuspended).toBeFalse();
    expect(component.user()?.status).toBe('ACTIVE');
    expect(component.user()?.adminActions[0].type).toBe('REACTIVATE_USER');
  });

  it('debe exigir contraseña propia para otorgar rol Super Admin y manejar error 403', () => {
    superAdminServiceSpy.grantSuperAdmin.and.returnValue(
      throwError(() => ({ status: 403, error: { detail: 'La contraseña actual ingresada es incorrecta.' } }))
    );

    component.openSuperAdminRoleModal(true);
    expect(component.isSuperAdminRoleModalOpen()).toBeTrue();

    // Sin contraseña
    component.adminCurrentPassword.set('');
    component.confirmSuperAdminRoleChange();
    expect(component.roleModalError()).toContain('Debes confirmar tu contraseña actual');

    // Con contraseña errónea
    component.adminCurrentPassword.set('ClaveErronea123');
    component.confirmSuperAdminRoleChange();
    expect(component.roleModalError()).toBe('La contraseña actual ingresada es incorrecta.');
  });

  it('debe otorgar rol Super Admin tras ingresar contraseña correcta', () => {
    superAdminServiceSpy.grantSuperAdmin.and.returnValue(
      of({
        success: true,
        data: { ...mockUserDetail, isSuperAdmin: true }
      })
    );

    component.openSuperAdminRoleModal(true);
    component.adminCurrentPassword.set('ClaveValidaAdmin123*');
    component.roleReason.set('Promoción a líder técnico');
    component.confirmSuperAdminRoleChange();

    expect(superAdminServiceSpy.grantSuperAdmin).toHaveBeenCalledWith(
      'usr-100',
      'ClaveValidaAdmin123*',
      'Promoción a líder técnico'
    );
    expect(notificationServiceSpy.showSuccess).toHaveBeenCalled();
    expect(component.user()?.isSuperAdmin).toBeTrue();
    expect(component.user()?.adminActions[0].type).toBe('GRANT_PLATFORM_ADMIN');
  });

  it('debe enviar enlace de recuperación y alertar en caso de HTTP 429', () => {
    superAdminServiceSpy.sendPasswordResetSupportLink.and.returnValue(
      throwError(() => ({ status: 429, error: { retryMinutes: 5 } }))
    );

    component.sendPasswordResetLink();

    expect(superAdminServiceSpy.sendPasswordResetSupportLink).toHaveBeenCalledWith('usr-100');
    expect(notificationServiceSpy.showWarning).toHaveBeenCalledWith(
      jasmine.stringMatching(/5 minutos/),
      'Límite de solicitudes de soporte'
    );
  });

  it('debe calcular canUnlock() correctamente según estado de bloqueo de la cuenta', () => {
    // Cuenta normal: canUnlock es falso
    component.user.set({ ...mockUserDetail, isAccountLocked: false, lockedUntil: null });
    expect(component.canUnlock()).toBeFalse();
    expect(component.cannotUnlockTooltip()).toContain('no presenta bloqueo');

    // Cuenta bloqueada preventivamente: canUnlock es verdadero
    component.user.set({ ...mockUserDetail, isAccountLocked: true, lockedUntil: '2026-11-01T20:00:00Z' });
    expect(component.canUnlock()).toBeTrue();
    expect(component.cannotUnlockTooltip()).toBeNull();
  });

  it('debe ejecutar flujo de desbloqueo exitoso al confirmar en el modal (HU-23)', () => {
    component.user.set({ ...mockUserDetail, isAccountLocked: true, lockedUntil: '2026-11-01T20:00:00Z' });
    superAdminServiceSpy.unlockUser.and.returnValue(
      of({
        success: true,
        data: { ...mockUserDetail, isAccountLocked: false, lockedUntil: null } as any,
        message: 'Cuenta desbloqueada'
      })
    );

    component.openUnlockModal();
    expect(component.isUnlockModalOpen()).toBeTrue();

    component.unlockReason.set('Abogado se equivocó de clave en su teléfono');
    component.confirmUnlockUser();

    expect(superAdminServiceSpy.unlockUser).toHaveBeenCalledWith(
      'usr-100',
      'Abogado se equivocó de clave en su teléfono'
    );
    expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith(
      jasmine.stringMatching(/ha sido desbloqueada exitosamente/),
      'Cuenta desbloqueada'
    );
    expect(component.isUnlockModalOpen()).toBeFalse();
    expect(component.user()?.isAccountLocked).toBeFalse();
    expect(component.user()?.lockedUntil).toBeNull();
    expect(component.user()?.adminActions[0].type).toBe('UNLOCK_USER');
  });

  it('debe manejar error al desbloquear y mostrar mensaje en el modal', () => {
    component.user.set({ ...mockUserDetail, isAccountLocked: true, lockedUntil: '2026-11-01T20:00:00Z' });
    superAdminServiceSpy.unlockUser.and.returnValue(
      throwError(() => ({ status: 400, error: { detail: 'La cuenta no se encuentra bloqueada actualmente.' } }))
    );

    component.openUnlockModal();
    component.confirmUnlockUser();

    expect(component.isUnlockModalOpen()).toBeTrue();
    expect(component.unlockModalError()).toBe('La cuenta no se encuentra bloqueada actualmente.');
    expect(component.unlockModalLoading()).toBeFalse();
  });
});
