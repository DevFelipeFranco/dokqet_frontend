import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminOrganizationDetailComponent } from './admin-organization-detail.component';
import { SuperAdminService } from '../../../../core/services/super-admin.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AdminMember,
  AdminOrganizationDetail
} from '../../../../core/models/super-admin.model';

describe('AdminOrganizationDetailComponent', () => {
  let component: AdminOrganizationDetailComponent;
  let fixture: ComponentFixture<AdminOrganizationDetailComponent>;
  let superAdminServiceSpy: jasmine.SpyObj<SuperAdminService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  const mockOrgDetail: AdminOrganizationDetail = {
    id: 'org-way-001',
    name: 'FIRMA SUPEr WAY',
    personType: 'JURIDICA',
    legalName: 'Firma Super Way S.A.S.',
    nit: '900999888',
    nitDv: '3',
    cityId: '11001',
    isPersonal: false,
    personalOwnerId: null,
    createdById: 'usr-felipe-001',
    processVisibility: 'ALL_MEMBERS',
    membersCount: 3,
    activeMembersCount: 2,
    processesCount: 18,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-10-20T12:00:00Z',
    ownerId: 'usr-felipe-001',
    ownerName: 'Felipe Way',
    ownerEmail: 'felipe@dokqet.com'
  };

  const mockMembers: AdminMember[] = [
    {
      membershipId: 'mem-001',
      userId: 'usr-felipe-001',
      email: 'felipe@dokqet.com',
      fullName: 'Felipe Way',
      documentType: 'CC',
      documentNumber: '10987654',
      role: 'ADMIN',
      status: 'ACTIVE',
      joinedAt: '2026-01-15T10:00:00Z',
      lastUsedAt: '2026-11-01T15:30:00Z'
    },
    {
      membershipId: 'mem-002',
      userId: 'usr-abogado-002',
      email: 'abogado2@dokqet.com',
      fullName: 'Abogado Litigante',
      documentType: 'CC',
      documentNumber: '11223344',
      role: 'LAWYER',
      status: 'ACTIVE',
      joinedAt: '2026-02-01T08:00:00Z',
      lastUsedAt: null
    }
  ];

  beforeEach(async () => {
    superAdminServiceSpy = jasmine.createSpyObj('SuperAdminService', [
      'getOrganizationDetail',
      'getOrganizationMembers'
    ]);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showInfo', 'showError', 'showWarning']);

    superAdminServiceSpy.getOrganizationDetail.and.returnValue(of({ success: true, data: mockOrgDetail }));
    superAdminServiceSpy.getOrganizationMembers.and.returnValue(of({ success: true, data: mockMembers }));

    await TestBed.configureTestingModule({
      imports: [AdminOrganizationDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SuperAdminService, useValue: superAdminServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'org-way-001' : null)
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOrganizationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y cargar el detalle de la organización y sus miembros al inicializar', () => {
    expect(component).toBeTruthy();
    expect(component.organizationId()).toBe('org-way-001');
    expect(superAdminServiceSpy.getOrganizationDetail).toHaveBeenCalledWith('org-way-001');
    expect(superAdminServiceSpy.getOrganizationMembers).toHaveBeenCalledWith('org-way-001');

    expect(component.organization()).toEqual(mockOrgDetail);
    expect(component.members().length).toBe(2);
    expect(component.ownerName()).toBe('Felipe Way');
    expect(component.ownerEmail()).toBe('felipe@dokqet.com');
    expect(component.isPersonal()).toBeFalse();
    expect(component.loading()).toBeFalse();
  });

  it('debe manejar error al consultar el detalle de la organización', () => {
    superAdminServiceSpy.getOrganizationDetail.and.returnValue(throwError(() => new Error('Server 500')));
    component.loadOrganizationDetail('org-way-001');

    expect(component.loading()).toBeFalse();
    expect(component.errorMessage()).toBe('Error al conectar con el servidor para consultar la organización.');
  });

  it('debe manejar error al consultar miembros sin bloquear la vista de la organización', () => {
    superAdminServiceSpy.getOrganizationMembers.and.returnValue(throwError(() => new Error('Members 500')));
    component.loadOrganizationMembers('org-way-001');

    expect(component.loadingMembers()).toBeFalse();
    expect(component.membersErrorMessage()).not.toBeNull();
  });

  it('debe alternar entre pestañas activas (members, corporate, processes)', () => {
    expect(component.activeTab()).toBe('members');

    component.activeTab.set('corporate');
    expect(component.activeTab()).toBe('corporate');

    component.activeTab.set('processes');
    expect(component.activeTab()).toBe('processes');
  });

  it('formatNit debe retornar el NIT con su DV correctamente', () => {
    expect(component.formatNit(mockOrgDetail)).toBe('900999888-3');
    expect(component.formatNit({ ...mockOrgDetail, nit: null, nitDv: null })).toBe('—');
  });

  it('getUserInitials debe calcular correctamente las iniciales', () => {
    expect(component.getUserInitials('Felipe Way')).toBe('FW');
    expect(component.getUserInitials('Espacio Personal - Carlos Gomez')).toBe('CG');
    expect(component.getUserInitials('Dokqet')).toBe('DO');
    expect(component.getUserInitials('')).toBe('OR');
  });

  it('getRoleVariant y getRoleLabel deben mapear roles adecuadamente', () => {
    expect(component.getRoleVariant('ADMIN')).toBe('brand');
    expect(component.getRoleVariant('LAWYER')).toBe('outline');
    expect(component.getRoleVariant('SUPER_ADMIN')).toBe('default');
    expect(component.getRoleLabel('ADMIN')).toBe('Administrador');
    expect(component.getRoleLabel('LAWYER')).toBe('Litigante');
  });

  it('getStatusBadgeVariant debe reflejar estado activo o suspendido', () => {
    expect(component.getStatusBadgeVariant('ACTIVE')).toBe('brand');
    expect(component.getStatusBadgeVariant('SUSPENDED')).toBe('destructive');
  });

  it('refreshData debe invocar nuevamente el servicio y notificar al usuario', () => {
    component.refreshData();

    expect(superAdminServiceSpy.getOrganizationDetail).toHaveBeenCalledTimes(2);
    expect(superAdminServiceSpy.getOrganizationMembers).toHaveBeenCalledTimes(2);
    expect(notificationServiceSpy.showInfo).toHaveBeenCalledWith('Datos de la organización actualizados');
  });

  it('copyToClipboard debe escribir en el portapapeles y actualizar copiedField temporalmente', fakeAsync(() => {
    const clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

    component.copyToClipboard('900999888-3', 'nit');
    tick();

    expect(clipboardSpy).toHaveBeenCalledWith('900999888-3');
    expect(component.copiedField()).toBe('nit');
    expect(notificationServiceSpy.showInfo).toHaveBeenCalled();

    tick(2100);
    expect(component.copiedField()).toBeNull();
  }));
});
