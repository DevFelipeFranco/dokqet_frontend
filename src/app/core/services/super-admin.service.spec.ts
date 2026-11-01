import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SuperAdminService } from './super-admin.service';
import {
  AdminApiResponse,
  AdminMember,
  AdminOrganizationDetail,
  AdminOrganizationSummary,
  AdminPlatformOverview,
  AdminUserSummary,
  PageResponse
} from '../models/super-admin.model';

describe('SuperAdminService', () => {
  let service: SuperAdminService;
  let httpMock: HttpTestingController;

  const mockUserSummary: AdminUserSummary = {
    id: 'usr-001',
    email: 'carlos@martinez.com',
    name: 'Carlos Martínez',
    firstName: 'Carlos',
    lastName: 'Martínez',
    documentType: 'CC',
    documentNumber: '10203040',
    cityId: '05001',
    emailVerified: true,
    isSuperAdmin: false,
    isAccountLocked: false,
    isSuspended: false,
    suspendedAt: null,
    suspensionType: null,
    lastSignInAt: '2026-11-01T15:00:00Z',
    createdAt: '2026-01-15T10:00:00Z'
  };

  const mockOverview: AdminPlatformOverview = {
    totalOrganizations: 15,
    totalPersonalOrganizations: 10,
    totalCollectiveOrganizations: 5,
    totalUsers: 42,
    totalProcesses: 380
  };

  const mockOrgSummary: AdminOrganizationSummary = {
    id: 'org-martinez-001',
    name: 'Martínez & Asociados',
    personType: 'JURIDICA',
    legalName: 'Martínez Abogados S.A.S.',
    nit: '901234567',
    nitDv: '1',
    isPersonal: false,
    membersCount: 4,
    activeMembersCount: 4,
    processesCount: 85,
    createdAt: '2026-01-15T10:00:00Z'
  };

  const mockPageResponse: PageResponse<AdminOrganizationSummary> = {
    content: [mockOrgSummary],
    pageable: {
      pageNumber: 0,
      pageSize: 10
    },
    totalElements: 1,
    totalPages: 1,
    last: true,
    first: true,
    size: 10,
    number: 0,
    empty: false
  };

  const mockMembers: AdminMember[] = [
    {
      membershipId: 'mem-001',
      userId: 'usr-001',
      email: 'admin@martinez.com',
      fullName: 'Carlos Martínez',
      documentType: 'CC',
      documentNumber: '10203040',
      role: 'ADMIN',
      status: 'ACTIVE',
      joinedAt: '2026-01-15T10:00:00Z',
      lastUsedAt: '2026-10-30T15:30:00Z'
    },
    {
      membershipId: 'mem-002',
      userId: 'usr-002',
      email: 'laura@martinez.com',
      fullName: 'Laura Gómez',
      documentType: 'CC',
      documentNumber: '10987654',
      role: 'LAWYER',
      status: 'ACTIVE',
      joinedAt: '2026-02-01T08:00:00Z',
      lastUsedAt: null
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SuperAdminService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(SuperAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe consultar GET /api/v1/admin/overview y retornar AdminPlatformOverview', () => {
    service.getPlatformOverview().subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.totalOrganizations).toBe(15);
      expect(res.data.totalProcesses).toBe(380);
      expect(res.data.totalCollectiveOrganizations).toBe(5);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/admin/overview');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockOverview });
  });

  it('debe consultar GET /api/v1/admin/organizations con parámetros de paginación y búsqueda', () => {
    service.getOrganizations(0, 10, 'martinez').subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.content.length).toBe(1);
      expect(res.data.content[0].name).toBe('Martínez & Asociados');
      expect(res.data.totalElements).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/admin/organizations?page=0&size=10&search=martinez');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('search')).toBe('martinez');
    req.flush({ success: true, data: mockPageResponse });
  });

  it('debe consultar GET /api/v1/admin/organizations/{id}/members', () => {
    const orgId = 'org-martinez-001';
    service.getOrganizationMembers(orgId).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.length).toBe(2);
      expect(res.data[0].role).toBe('ADMIN');
      expect(res.data[1].role).toBe('LAWYER');
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/v1/admin/organizations/${orgId}/members`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockMembers });
  });

  it('debe consultar GET /api/v1/admin/organizations/{id} para el detalle', () => {
    const orgId = 'org-martinez-001';
    const detail: AdminOrganizationDetail = {
      ...mockOrgSummary,
      cityId: '05001',
      personalOwnerId: null,
      createdById: 'usr-001',
      processVisibility: 'ALL_MEMBERS',
      updatedAt: '2026-03-01T12:00:00Z'
    };

    service.getOrganizationDetail(orgId).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.id).toBe(orgId);
      expect(res.data.processVisibility).toBe('ALL_MEMBERS');
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/v1/admin/organizations/${orgId}`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: detail });
  });

  // ==================== HU-21: Gestión de Cuentas, Suspensión y Soporte ====================

  it('debe buscar usuarios con coincidencia unaccent y filtro de estado (GET /users)', () => {
    service.searchUsers('gomez', 'ALL', 0, 50).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.content.length).toBe(1);
      expect(res.data.content[0].email).toBe('carlos@martinez.com');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/admin/users?status=ALL&page=0&size=50&q=gomez');
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      data: {
        content: [mockUserSummary],
        totalElements: 1,
        totalPages: 1,
        last: true,
        first: true,
        size: 50,
        number: 0,
        empty: false
      }
    });
  });

  it('debe obtener la ficha integral de soporte de usuario (GET /users/{id})', () => {
    const userId = 'usr-001';
    service.getUserDetail(userId).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.id).toBe(userId);
      expect(res.data.openSessionsCount).toBe(2);
      expect(res.data.organizations.length).toBe(1);
      expect(res.data.consents.length).toBe(1);
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/v1/admin/users/${userId}`);
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      data: {
        id: userId,
        email: 'carlos@martinez.com',
        name: 'Carlos Martínez',
        firstName: 'Carlos',
        middleName: null,
        lastName: 'Martínez',
        secondLastName: null,
        documentType: 'CC',
        documentNumber: '12345678',
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
        createdAt: '2026-01-15T10:00:00Z',
        organizations: [],
        consents: [],
        adminActions: []
      }
    });
  });

  it('debe suspender cuenta con motivo obligatorio (POST /users/{id}/suspend)', () => {
    const userId = 'usr-001';
    const reason = 'Extravío de dispositivo preventivo';

    service.suspendUser(userId, reason).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.isSuspended).toBeTrue();
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/v1/admin/users/${userId}/suspend`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush({
      success: true,
      message: 'Cuenta suspendida.',
      data: { ...mockUserSummary, isSuspended: true, suspendedAt: '2026-11-01T20:00:00Z' }
    });
  });

  it('debe reactivar cuenta con motivo obligatorio (POST /users/{id}/reactivate)', () => {
    const userId = 'usr-001';
    const reason = 'Verificación completada satisfactoriamente';

    service.reactivateUser(userId, reason).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.isSuspended).toBeFalse();
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/v1/admin/users/${userId}/reactivate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush({
      success: true,
      data: { ...mockUserSummary, isSuspended: false, suspendedAt: null }
    });
  });

  it('debe desbloquear cuenta bloqueada por intentos fallidos (POST /users/{id}/unlock)', () => {
    const userId = 'usr-001';
    const reason = 'Soporte telefónico';

    service.unlockUser(userId, reason).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.isAccountLocked).toBeFalse();
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/v1/admin/users/${userId}/unlock`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush({
      success: true,
      data: { ...mockUserSummary, isAccountLocked: false }
    });
  });

  it('debe otorgar rol SUPER_ADMIN con confirmación de clave propia (POST /users/{id}/super-admin/grant)', () => {
    const userId = 'usr-001';
    service.grantSuperAdmin(userId, 'MySecretPass123*', 'Promoción a equipo directivo').subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.isSuperAdmin).toBeTrue();
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/v1/admin/users/${userId}/super-admin/grant`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      currentPassword: 'MySecretPass123*',
      reason: 'Promoción a equipo directivo'
    });
    req.flush({
      success: true,
      data: { ...mockUserSummary, isSuperAdmin: true }
    });
  });

  it('debe revocar rol SUPER_ADMIN con confirmación de clave propia (POST /users/{id}/super-admin/revoke)', () => {
    const userId = 'usr-001';
    service.revokeSuperAdmin(userId, 'MySecretPass123*', 'Fin de asignación especial').subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.isSuperAdmin).toBeFalse();
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/v1/admin/users/${userId}/super-admin/revoke`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      currentPassword: 'MySecretPass123*',
      reason: 'Fin de asignación especial'
    });
    req.flush({
      success: true,
      data: { ...mockUserSummary, isSuperAdmin: false }
    });
  });

  it('debe enviar enlace de recuperación de contraseña (POST /users/{id}/support/password-reset)', () => {
    const userId = 'usr-001';
    service.sendPasswordResetSupportLink(userId).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.type).toBe('SEND_PASSWORD_RESET');
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/v1/admin/users/${userId}/support/password-reset`);
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      data: {
        id: 'act-001',
        type: 'SEND_PASSWORD_RESET',
        viaCommand: false,
        actorId: 'admin-001',
        actorEmail: 'admin@dokqet.com',
        targetId: userId,
        targetEmail: 'carlos@martinez.com',
        reason: null,
        createdAt: '2026-11-01T20:00:00Z'
      }
    });
  });

  it('debe reeenviar correo de activación (POST /users/{id}/support/resend-verification)', () => {
    const userId = 'usr-002';
    service.resendVerificationSupportLink(userId).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.type).toBe('RESEND_VERIFICATION');
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/v1/admin/users/${userId}/support/resend-verification`);
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      data: {
        id: 'act-002',
        type: 'RESEND_VERIFICATION',
        viaCommand: false,
        actorId: 'admin-001',
        actorEmail: 'admin@dokqet.com',
        targetId: userId,
        targetEmail: 'sinverificar@martinez.com',
        reason: null,
        createdAt: '2026-11-01T20:00:00Z'
      }
    });
  });

  it('debe consultar auditoría inmutable de acciones administrativas (GET /actions)', () => {
    service.getAdminActions('SUSPEND_USER', 0, 50).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.content.length).toBe(1);
      expect(res.data.content[0].type).toBe('SUSPEND_USER');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/admin/actions?page=0&size=50&type=SUSPEND_USER');
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      data: {
        content: [{
          id: 'act-001',
          type: 'SUSPEND_USER',
          viaCommand: false,
          actorId: 'admin-001',
          actorEmail: 'admin@dokqet.com',
          targetId: 'usr-001',
          targetEmail: 'carlos@martinez.com',
          reason: 'Prueba',
          createdAt: '2026-11-01T20:00:00Z'
        }],
        totalElements: 1,
        totalPages: 1,
        last: true,
        first: true,
        size: 50,
        number: 0,
        empty: false
      }
    });
  });
});
