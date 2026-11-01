import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminActionsComponent } from './admin-actions.component';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { AdminAction } from '../../../core/models/super-admin.model';

describe('AdminActionsComponent (HU-21: Auditoría Inmutable)', () => {
  let component: AdminActionsComponent;
  let fixture: ComponentFixture<AdminActionsComponent>;
  let superAdminServiceSpy: jasmine.SpyObj<SuperAdminService>;

  const mockActions: AdminAction[] = [
    {
      id: 'act-1',
      type: 'SUSPEND_USER',
      viaCommand: false,
      actorId: 'admin-1',
      actorEmail: 'admin@dokqet.com',
      targetId: 'usr-1',
      targetEmail: 'suspendido@firma.co',
      reason: 'Extravío de dispositivo',
      createdAt: '2026-11-01T15:00:00Z'
    },
    {
      id: 'act-2',
      type: 'REACTIVATE_USER',
      viaCommand: true,
      actorId: null,
      actorEmail: 'admin-seed@dokqet.internal',
      targetId: 'usr-2',
      targetEmail: 'abogado@firma.co',
      reason: 'Reactivación de emergencia vía comando',
      createdAt: '2026-11-01T15:30:00Z'
    }
  ];

  beforeEach(async () => {
    superAdminServiceSpy = jasmine.createSpyObj('SuperAdminService', ['getAdminActions']);
    superAdminServiceSpy.getAdminActions.and.returnValue(
      of({
        success: true,
        data: {
          content: mockActions,
          totalElements: 2,
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
      imports: [AdminActionsComponent],
      providers: [
        provideRouter([]),
        { provide: SuperAdminService, useValue: superAdminServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y consultar las acciones administrativas inicialmente', () => {
    expect(component).toBeTruthy();
    expect(superAdminServiceSpy.getAdminActions).toHaveBeenCalledWith(undefined, 0, 50);
    expect(component.actions().length).toBe(2);
    expect(component.totalElements()).toBe(2);
  });

  it('debe filtrar por tipo de acción y resetear a página 0', () => {
    superAdminServiceSpy.getAdminActions.calls.reset();

    component.setTypeFilter('SUSPEND_USER');
    expect(component.selectedType()).toBe('SUSPEND_USER');
    expect(component.currentPage()).toBe(0);
    expect(superAdminServiceSpy.getAdminActions).toHaveBeenCalledWith('SUSPEND_USER', 0, 50);
  });

  it('debe asignar badges semánticos correspondientes a cada tipo de acción', () => {
    expect(component.getActionBadge('SUSPEND_USER')).toEqual({ variant: 'destructive', label: 'SUSPENSIÓN' });
    expect(component.getActionBadge('REACTIVATE_USER')).toEqual({ variant: 'success', label: 'REACTIVACIÓN' });
    expect(component.getActionBadge('GRANT_PLATFORM_ADMIN')).toEqual({ variant: 'brand', label: 'ASIGNÓ ADMIN' });
    expect(component.getActionBadge('REVOKE_PLATFORM_ADMIN')).toEqual({ variant: 'warning', label: 'REVOCÓ ADMIN' });
    expect(component.getActionBadge('SEND_PASSWORD_RESET')).toEqual({ variant: 'secondary', label: 'RESET CLAVE' });
    expect(component.getActionBadge('RESEND_VERIFICATION')).toEqual({ variant: 'secondary', label: 'REENVIÓ ACTIVACIÓN' });
  });

  it('debe paginar hacia adelante y hacia atrás', () => {
    component.totalPages.set(2);
    component.currentPage.set(0);

    superAdminServiceSpy.getAdminActions.calls.reset();
    component.nextPage();
    expect(component.currentPage()).toBe(1);
    expect(superAdminServiceSpy.getAdminActions).toHaveBeenCalledWith(undefined, 1, 50);

    superAdminServiceSpy.getAdminActions.calls.reset();
    component.previousPage();
    expect(component.currentPage()).toBe(0);
    expect(superAdminServiceSpy.getAdminActions).toHaveBeenCalledWith(undefined, 0, 50);
  });
});
