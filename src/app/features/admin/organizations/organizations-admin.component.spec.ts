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
import { ActivatedRoute } from '@angular/router';

describe('OrganizationsAdminComponent', () => {
  let component: OrganizationsAdminComponent;
  let fixture: ComponentFixture<OrganizationsAdminComponent>;
  let superAdminServiceSpy: jasmine.SpyObj<SuperAdminService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  const mockOverview: AdminPlatformOverview = {
    totalOrganizations: 12,
    totalPersonalOrganizations: 8,
    totalCollectiveOrganizations: 4,
    totalUsers: 35,
    totalProcesses: 290
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
});
