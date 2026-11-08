import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { OrganizationsAdminComponent } from './organizations-admin.component';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  AdminMember,
  AdminOrganizationSummary,
  AdminPlatformOverview,
  PageResponse
} from '../../../core/models/super-admin.model';
import { ActivatedRoute, Router } from '@angular/router';

describe('OrganizationsAdminComponent', () => {
  let component: OrganizationsAdminComponent;
  let fixture: ComponentFixture<OrganizationsAdminComponent>;
  let superAdminServiceSpy: jasmine.SpyObj<SuperAdminService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  const mockOverview: AdminPlatformOverview = {
    totalOrganizations: 12,
    personalOrganizations: 8,
    firmOrganizations: 4,
    totalPersonalOrganizations: 8,
    totalCollectiveOrganizations: 4,
    totalUsers: 35,
    totalProcesses: 290,
    processes: {
      distinct: 290,
      follows: 350,
      monitoredByDay: 280,
      instancesDetected: 30
    },
    users: {
      total: 35,
      active: 33,
      suspended: 2,
      superAdmins: 2
    },
    rounds: {
      updates: { latestFull: null, late: false, schedule: '0 0 * * *' },
      instances: { latestFull: null, late: false, schedule: '0 2 * * *' },
      historyLast7Days: []
    }
  };

  const mockOrgSummary: AdminOrganizationSummary = {
    id: 'org-martinez-001',
    name: 'Martínez & Asociados',
    personType: 'JURIDICA',
    legalName: 'Martínez Abogados S.A.S.',
    nit: '901234567',
    nitDv: '1',
    isPersonal: false,
    membersCount: 3,
    activeMembersCount: 3,
    processesCount: 45,
    createdAt: '2026-01-10T08:00:00Z'
  };

  const mockPageResponse: PageResponse<AdminOrganizationSummary> = {
    content: [mockOrgSummary],
    pageable: { pageNumber: 0, pageSize: 10 },
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
      membershipId: 'mem-1',
      userId: 'usr-1',
      email: 'carlos@martinez.com',
      fullName: 'Carlos Martínez',
      documentType: 'CC',
      documentNumber: '10203040',
      role: 'ADMIN',
      status: 'ACTIVE',
      joinedAt: '2026-01-10T08:00:00Z',
      lastUsedAt: '2026-10-30T10:00:00Z'
    }
  ];

  beforeEach(async () => {
    superAdminServiceSpy = jasmine.createSpyObj('SuperAdminService', [
      'getPlatformOverview',
      'getOrganizations',
      'getOrganizationMembers'
    ]);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showInfo', 'showWarning', 'showError']);

    superAdminServiceSpy.getPlatformOverview.and.returnValue(of({ success: true, data: mockOverview }));
    superAdminServiceSpy.getOrganizations.and.returnValue(of({ success: true, data: mockPageResponse }));
    superAdminServiceSpy.getOrganizationMembers.and.returnValue(of({ success: true, data: mockMembers }));

    await TestBed.configureTestingModule({
      imports: [OrganizationsAdminComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SuperAdminService, useValue: superAdminServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map() } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse e inicializar métricas y listado de organizaciones', () => {
    expect(component).toBeTruthy();
    expect(superAdminServiceSpy.getPlatformOverview).toHaveBeenCalled();
    expect(superAdminServiceSpy.getOrganizations).toHaveBeenCalledWith(0, 10, '');

    expect(component.overview()).toEqual(mockOverview);
    expect(component.organizations().length).toBe(1);
    expect(component.organizations()[0].name).toBe('Martínez & Asociados');
    expect(component.totalElements()).toBe(1);
  });

  it('debe filtrar organizaciones cuando el usuario escribe en el buscador', fakeAsync(() => {
    component.onSearchChange('martinez');
    tick(400);

    expect(component.searchQuery()).toBe('martinez');
    expect(component.currentPage()).toBe(0);
    expect(superAdminServiceSpy.getOrganizations).toHaveBeenCalledWith(0, 10, 'martinez');
  }));

  it('debe limpiar el filtro de búsqueda con clearSearch()', () => {
    component.searchQuery.set('filtro-previo');
    component.clearSearch();

    expect(component.searchQuery()).toBe('');
    expect(component.currentPage()).toBe(0);
    expect(superAdminServiceSpy.getOrganizations).toHaveBeenCalledWith(0, 10, '');
  });

  it('debe abrir modal de miembros e invocar getOrganizationMembers() al inspeccionar una firma', () => {
    component.openMembersModal(mockOrgSummary);

    expect(component.isMembersModalOpen()).toBeTrue();
    expect(component.selectedOrg()).toEqual(mockOrgSummary);
    expect(superAdminServiceSpy.getOrganizationMembers).toHaveBeenCalledWith('org-martinez-001');
    expect(component.members().length).toBe(1);
    expect(component.members()[0].email).toBe('carlos@martinez.com');
  });

  it('debe cerrar el modal de miembros con closeMembersModal()', () => {
    component.openMembersModal(mockOrgSummary);
    expect(component.isMembersModalOpen()).toBeTrue();

    component.closeMembersModal();
    expect(component.isMembersModalOpen()).toBeFalse();
    expect(component.selectedOrg()).toBeNull();
    expect(component.members().length).toBe(0);
  });

  it('debe manejar error al consultar overview sin romper la vista', () => {
    superAdminServiceSpy.getPlatformOverview.and.returnValue(throwError(() => new Error('Error 500')));
    component.loadOverview();

    expect(component.loadingOverview()).toBeFalse();
    expect(component.overviewError()).not.toBeNull();
  });

  it('debe manejar error al consultar miembros', () => {
    superAdminServiceSpy.getOrganizationMembers.and.returnValue(throwError(() => new Error('Error 500')));
    component.openMembersModal(mockOrgSummary);

    expect(component.loadingMembers()).toBeFalse();
    expect(component.membersError()).not.toBeNull();
  });

  it('formatNit debe retornar el NIT formateado con DV', () => {
    expect(component.formatNit(mockOrgSummary)).toBe('901234567-1');
    expect(component.formatNit({ ...mockOrgSummary, nit: null, nitDv: null })).toBe('—');
  });

  // =========================================================================
  // PRUEBAS DE HU-25: VISTA JERÁRQUICA AGRUPADA POR PERSONA / TITULAR
  // =========================================================================
  it('debe inicializarse en modo GROUPED (Agrupado por Persona) por defecto', () => {
    expect(component.viewMode()).toBe('GROUPED');
  });

  it('debe agrupar organizaciones bajo su usuario titular mediante buildUserGroups()', () => {
    const personalOrg: AdminOrganizationSummary = {
      id: 'org-pers-1',
      name: 'Laura Gómez Pardo',
      personType: 'NATURAL',
      legalName: null,
      nit: null,
      nitDv: null,
      isPersonal: true,
      membersCount: 1,
      activeMembersCount: 1,
      processesCount: 5,
      createdAt: '2026-01-01T00:00:00Z',
      ownerId: 'usr-laura',
      ownerName: 'Laura Gómez Pardo',
      ownerEmail: 'laura.gomez@dokqet.com'
    };

    const collectiveOrg: AdminOrganizationSummary = {
      id: 'org-col-1',
      name: 'Gómez & Asociados Abogados S.A.S.',
      personType: 'JURIDICA',
      legalName: 'Gómez & Asociados S.A.S.',
      nit: '901234567',
      nitDv: '8',
      isPersonal: false,
      membersCount: 4,
      activeMembersCount: 4,
      processesCount: 30,
      createdAt: '2026-01-05T00:00:00Z',
      ownerId: 'usr-laura',
      ownerName: 'Laura Gómez Pardo',
      ownerEmail: 'laura.gomez@dokqet.com'
    };

    const groups = component.buildUserGroups([personalOrg, collectiveOrg]);
    expect(groups.length).toBe(1);

    const lauraGroup = groups[0];
    expect(lauraGroup.userName).toBe('Laura Gómez Pardo');
    expect(lauraGroup.personalWorkspace).toEqual(personalOrg);
    expect(lauraGroup.organizations.length).toBe(1);
    expect(lauraGroup.organizations[0].name).toBe('Gómez & Asociados Abogados S.A.S.');
    expect(lauraGroup.totalWorkspacesCount).toBe(2);
    expect(lauraGroup.totalProcessesCount).toBe(35); // 5 + 30
    expect(lauraGroup.totalMembersCount).toBe(5);   // 1 + 4
  });

  it('debe agrupar "Mi espacio de trabajo" y "FIRMA SUPEr WAY" bajo el mismo usuario cuando comparten propietario', () => {
    const personalOrg: AdminOrganizationSummary = {
      id: 'org-pers-way',
      name: 'Mi espacio de trabajo',
      personType: 'NATURAL',
      legalName: null,
      nit: null,
      nitDv: null,
      isPersonal: true,
      membersCount: 1,
      activeMembersCount: 1,
      processesCount: 3,
      createdAt: '2026-02-01T00:00:00Z',
      ownerId: 'usr-felipe-001',
      ownerName: 'Felipe Way',
      ownerEmail: 'felipe@dokqet.com',
      personalOwnerId: 'usr-felipe-001'
    };

    const firmaOrg: AdminOrganizationSummary = {
      id: 'org-firma-way',
      name: 'FIRMA SUPEr WAY',
      personType: 'JURIDICA',
      legalName: 'Firma Super Way S.A.S.',
      nit: '900999888',
      nitDv: '3',
      isPersonal: false,
      membersCount: 2,
      activeMembersCount: 2,
      processesCount: 15,
      createdAt: '2026-02-02T00:00:00Z',
      ownerId: 'usr-felipe-001',
      ownerName: 'Felipe Way',
      ownerEmail: 'felipe@dokqet.com',
      createdById: 'usr-felipe-001'
    };

    const groups = component.buildUserGroups([personalOrg, firmaOrg]);
    expect(groups.length).toBe(1);

    const felipeGroup = groups[0];
    expect(felipeGroup.userName).toBe('Felipe Way');
    expect(felipeGroup.userEmail).toBe('felipe@dokqet.com');
    expect(felipeGroup.personalWorkspace).toEqual(personalOrg);
    expect(felipeGroup.organizations.length).toBe(1);
    expect(felipeGroup.organizations[0].name).toBe('FIRMA SUPEr WAY');
    expect(felipeGroup.totalWorkspacesCount).toBe(2);
    expect(felipeGroup.totalProcessesCount).toBe(18); // 3 + 15
    expect(felipeGroup.totalMembersCount).toBe(3);   // 1 + 2
  });

  it('debe conmutar la expansión de un usuario con toggleUserExpand()', () => {
    const userId = 'usr-test-123';
    expect(component.isUserExpanded(userId)).toBeFalse();

    component.toggleUserExpand(userId);
    expect(component.isUserExpanded(userId)).toBeTrue();

    component.toggleUserExpand(userId);
    expect(component.isUserExpanded(userId)).toBeFalse();
  });

  it('debe conmutar la expansión masiva con toggleAllUsers()', () => {
    const dummyGroups = [
      {
        userId: 'usr-1',
        userName: 'Usuario 1',
        userEmail: 'u1@dokqet.com',
        personalWorkspace: null,
        organizations: [],
        totalWorkspacesCount: 0,
        totalProcessesCount: 0,
        totalMembersCount: 0,
        userStatus: 'ACTIVE'
      },
      {
        userId: 'usr-2',
        userName: 'Usuario 2',
        userEmail: 'u2@dokqet.com',
        personalWorkspace: null,
        organizations: [],
        totalWorkspacesCount: 0,
        totalProcessesCount: 0,
        totalMembersCount: 0,
        userStatus: 'ACTIVE'
      }
    ];

    component.userGroups.set(dummyGroups);
    expect(component.allUsersExpanded()).toBeFalse();

    // Expandir todos
    component.toggleAllUsers();
    expect(component.allUsersExpanded()).toBeTrue();
    expect(component.isUserExpanded('usr-1')).toBeTrue();
    expect(component.isUserExpanded('usr-2')).toBeTrue();

    // Colapsar todos
    component.toggleAllUsers();
    expect(component.allUsersExpanded()).toBeFalse();
    expect(component.isUserExpanded('usr-1')).toBeFalse();
    expect(component.isUserExpanded('usr-2')).toBeFalse();
  });

  it('debe alternar entre vista GROUPED y FLAT', () => {
    component.viewMode.set('FLAT');
    expect(component.viewMode()).toBe('FLAT');

    component.viewMode.set('GROUPED');
    expect(component.viewMode()).toBe('GROUPED');
  });

  it('openOrganizationDetail debe navegar a /admin/organizaciones/:id', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');

    component.openOrganizationDetail('org-way-001');
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/organizaciones', 'org-way-001']);
  });

  it('openUserDetail debe navegar a /admin/usuarios/:id cuando el id es válido', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');

    component.openUserDetail('usr-felipe-001');
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/usuarios', 'usr-felipe-001']);
  });

  it('getUserInitials debe retornar las iniciales correctas', () => {
    expect(component.getUserInitials('Laura Gómez')).toBe('LG');
    expect(component.getUserInitials('Carlos Mendoza Ruiz')).toBe('CM');
    expect(component.getUserInitials('Dokqet')).toBe('DO');
    expect(component.getUserInitials('')).toBe('US');
  });
});
