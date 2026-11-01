import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminUsersComponent } from './admin-users.component';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { AdminUserSummary } from '../../../core/models/super-admin.model';

describe('AdminUsersComponent (HU-21: Gestión de Usuarios)', () => {
  let component: AdminUsersComponent;
  let fixture: ComponentFixture<AdminUsersComponent>;
  let superAdminServiceSpy: jasmine.SpyObj<SuperAdminService>;

  const mockUsers: AdminUserSummary[] = [
    {
      id: 'usr-1',
      email: 'maria@firma.co',
      name: 'María José Gómez',
      firstName: 'María',
      lastName: 'Gómez',
      documentType: 'CC',
      documentNumber: '52000111',
      cityId: '11001',
      emailVerified: true,
      isSuperAdmin: false,
      isAccountLocked: false,
      isSuspended: false,
      suspendedAt: null,
      suspensionType: null,
      lastSignInAt: '2026-11-01T14:30:00Z',
      createdAt: '2026-01-10T10:00:00Z'
    },
    {
      id: 'usr-2',
      email: 'carlos@firma.co',
      name: 'Carlos Gomez Peña',
      firstName: 'Carlos',
      lastName: 'Gomez',
      documentType: 'CC',
      documentNumber: '10203040',
      cityId: '05001',
      emailVerified: false,
      isSuperAdmin: false,
      isAccountLocked: false,
      isSuspended: false,
      suspendedAt: null,
      suspensionType: null,
      lastSignInAt: null,
      createdAt: '2026-02-15T09:00:00Z'
    },
    {
      id: 'usr-3',
      email: 'suspendido@firma.co',
      name: 'Abogado Suspendido',
      firstName: 'Abogado',
      lastName: 'Suspendido',
      documentType: 'CC',
      documentNumber: '80999888',
      cityId: '76001',
      emailVerified: true,
      isSuperAdmin: false,
      isAccountLocked: false,
      isSuspended: true,
      suspendedAt: '2026-11-01T12:00:00Z',
      suspensionType: 'MANUAL',
      lastSignInAt: '2026-10-31T18:00:00Z',
      createdAt: '2026-03-01T08:00:00Z'
    }
  ];

  beforeEach(async () => {
    superAdminServiceSpy = jasmine.createSpyObj('SuperAdminService', ['searchUsers']);
    superAdminServiceSpy.searchUsers.and.returnValue(
      of({
        success: true,
        data: {
          content: mockUsers,
          totalElements: 3,
          totalPages: 1,
          last: true,
          first: true,
          size: 50,
          number: 0,
          empty: false
        }
      })
    );

    await TestBed.configureTestingModule({
      imports: [AdminUsersComponent],
      providers: [
        provideRouter([]),
        { provide: SuperAdminService, useValue: superAdminServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente y cargar usuarios inicialmente con status ALL', () => {
    expect(component).toBeTruthy();
    expect(superAdminServiceSpy.searchUsers).toHaveBeenCalledWith('', 'ALL', 0, 50);
    expect(component.users().length).toBe(3);
    expect(component.totalElements()).toBe(3);
  });

  it('debe ejecutar búsqueda insensible con debounce de 300ms', fakeAsync(() => {
    superAdminServiceSpy.searchUsers.calls.reset();

    component.onSearchInput('gomez');
    expect(superAdminServiceSpy.searchUsers).not.toHaveBeenCalled();

    tick(300);
    expect(superAdminServiceSpy.searchUsers).toHaveBeenCalledWith('gomez', 'ALL', 0, 50);
  }));

  it('debe cambiar filtro de estado y resetear a página 0', () => {
    superAdminServiceSpy.searchUsers.calls.reset();

    component.setStatusFilter('SUSPENDED');
    expect(component.selectedStatus()).toBe('SUSPENDED');
    expect(component.currentPage()).toBe(0);
    expect(superAdminServiceSpy.searchUsers).toHaveBeenCalledWith('', 'SUSPENDED', 0, 50);
  });

  it('debe determinar correctamente los badges de estado', () => {
    const activeUser = mockUsers[0];
    const unverifiedUser = mockUsers[1];
    const suspendedUser = mockUsers[2];

    expect(component.getUserStatusBadge(activeUser)).toEqual({ variant: 'success', label: 'ACTIVA' });
    expect(component.getUserStatusBadge(unverifiedUser)).toEqual({ variant: 'warning', label: 'SIN VERIFICAR' });
    expect(component.getUserStatusBadge(suspendedUser)).toEqual({ variant: 'destructive', label: 'SUSPENDIDA' });
  });

  it('debe manejar error al consultar usuarios', () => {
    superAdminServiceSpy.searchUsers.and.returnValue(
      throwError(() => ({ error: { detail: 'Error en la base de datos' } }))
    );

    component.loadUsers();
    expect(component.loading()).toBeFalse();
    expect(component.errorMessage()).toBe('Error en la base de datos');
  });

  it('debe navegar a siguiente y anterior página', () => {
    component.totalPages.set(3);
    component.currentPage.set(0);

    superAdminServiceSpy.searchUsers.calls.reset();
    component.nextPage();
    expect(component.currentPage()).toBe(1);
    expect(superAdminServiceSpy.searchUsers).toHaveBeenCalledWith('', 'ALL', 1, 50);

    superAdminServiceSpy.searchUsers.calls.reset();
    component.previousPage();
    expect(component.currentPage()).toBe(0);
    expect(superAdminServiceSpy.searchUsers).toHaveBeenCalledWith('', 'ALL', 0, 50);
  });
});
