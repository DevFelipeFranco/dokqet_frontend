import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import {
  ProfileComponent,
  passwordMatchValidator,
  canToggleMemberStatus,
  computeMemberStats
} from './profile.component';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../core/services/user.service';
import { OrganizationService } from '../../core/services/organization.service';
import { ProcessService } from '../../core/services/process.service';
import { DocumentType, User } from '../../core/models/user.model';
import { Member, MemberRole, MembershipStatus } from '../../core/models/organization.model';
import { RepresentedParty } from '../../core/models/process.model';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let orgService: jasmine.SpyObj<OrganizationService>;
  let processService: jasmine.SpyObj<ProcessService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockUser: User = {
    id: 'usr-1',
    email: 'abogado@dokqet.com',
    name: 'Carlos Gómez',
    firstName: 'Carlos',
    middleName: 'Andrés',
    lastName: 'Gómez',
    secondLastName: 'Restrepo',
    documentType: DocumentType.CC,
    documentNumber: '10203040',
    emailVerified: true,
    isSuperAdmin: false
  };

  const mockMembers: Member[] = [
    {
      userId: 'usr-1',
      name: 'Carlos Gómez',
      email: 'abogado@dokqet.com',
      role: MemberRole.ADMIN,
      status: MembershipStatus.ACTIVE,
      isCreator: true,
      joinedAt: '2026-01-01T00:00:00Z'
    },
    {
      userId: 'usr-2',
      name: 'Laura Zapata',
      email: 'laura@dokqet.com',
      role: MemberRole.LAWYER,
      status: MembershipStatus.ACTIVE,
      isCreator: false,
      joinedAt: '2026-01-02T00:00:00Z'
    },
    {
      userId: 'usr-3',
      name: 'Mario Ruiz',
      email: 'mario@dokqet.com',
      role: MemberRole.LAWYER,
      status: MembershipStatus.SUSPENDED,
      isCreator: false,
      joinedAt: '2026-01-03T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    const userSpy = jasmine.createSpyObj('UserService', ['getProfile', 'updateProfile', 'changePassword']);
    const orgSpy = jasmine.createSpyObj('OrganizationService', ['listMembers', 'changeMemberStatus']);
    const procSpy = jasmine.createSpyObj('ProcessService', ['listProcesses']);
    const authSpy = jasmine.createSpyObj('AuthService', ['currentUser', 'activeOrgId', 'isAdmin', 'updateCurrentUser', 'resendVerificationEmail']);

    userSpy.getProfile.and.returnValue(of({ success: true, data: mockUser }));
    orgSpy.listMembers.and.returnValue(of({ success: true, data: mockMembers }));
    procSpy.listProcesses.and.returnValue(of({ success: true, data: [] }));

    authSpy.currentUser.and.returnValue(mockUser);
    authSpy.activeOrgId.and.returnValue('org-alpha');
    authSpy.isAdmin.and.returnValue(true);
    authSpy.resendVerificationEmail.and.returnValue(of({ success: true, message: 'Enlace enviado.' }));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: UserService, useValue: userSpy },
        { provide: OrganizationService, useValue: orgSpy },
        { provide: ProcessService, useValue: procSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    orgService = TestBed.inject(OrganizationService) as jasmine.SpyObj<OrganizationService>;
    processService = TestBed.inject(ProcessService) as jasmine.SpyObj<ProcessService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);

    fixture.detectChanges();
  });

  it('should create and load profile into form', () => {
    expect(component).toBeTruthy();
    expect(userService.getProfile).toHaveBeenCalled();
    expect(component.profileForm.get('firstName')?.value).toBe('Carlos');
    expect(component.profileForm.get('lastName')?.value).toBe('Gómez');
    expect(component.profileForm.get('documentNumber')?.value).toBe('10203040');
    expect(orgService.listMembers).toHaveBeenCalledWith('org-alpha');
    expect(component.members().length).toBe(3);
  });

  describe('Pure helpers', () => {
    it('passwordMatchValidator should return null when passwords match', () => {
      const group = new FormGroup({
        newPassword: new FormControl('Password123!'),
        confirmPassword: new FormControl('Password123!')
      });
      expect(passwordMatchValidator(group)).toBeNull();
    });

    it('passwordMatchValidator should return error when passwords differ', () => {
      const group = new FormGroup({
        newPassword: new FormControl('Password123!'),
        confirmPassword: new FormControl('Different123!')
      });
      expect(passwordMatchValidator(group)).toEqual({ passwordMismatch: true });
    });

    it('canToggleMemberStatus prevents suspending self or creator', () => {
      const selfMember = mockMembers[0]; // usr-1, isCreator: true
      const colleague = mockMembers[1];  // usr-2, isCreator: false

      expect(canToggleMemberStatus(selfMember, 'usr-1')).toBeFalse();
      expect(canToggleMemberStatus(selfMember, 'usr-2')).toBeFalse();
      expect(canToggleMemberStatus(colleague, 'usr-1')).toBeTrue();
    });

    it('computeMemberStats counts total, active and suspended accurately', () => {
      const stats = computeMemberStats(mockMembers);
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.suspended).toBe(1);
    });
  });

  describe('saveProfile', () => {
    it('should call userService.updateProfile on valid form', () => {
      userService.updateProfile.and.returnValue(of({
        success: true,
        data: { ...mockUser, firstName: 'Juan' },
        message: 'Actualizado'
      }));

      component.profileForm.patchValue({
        firstName: 'Juan',
        lastName: 'Gómez',
        documentType: DocumentType.CC,
        documentNumber: '10203040'
      });

      component.saveProfile();

      expect(userService.updateProfile).toHaveBeenCalled();
      expect(component.profileSuccess()).toContain('Información personal');
      expect(authService.updateCurrentUser).toHaveBeenCalled();
    });

    it('should set profileError when updateProfile fails', () => {
      userService.updateProfile.and.returnValue(throwError(() => ({
        error: { message: 'Documento duplicado' }
      })));

      component.saveProfile();

      expect(component.profileError()).toBe('Documento duplicado');
    });
  });

  describe('submitPasswordChange', () => {
    it('should reject when passwords do not match', () => {
      component.passwordForm.patchValue({
        currentPassword: 'CurrentPassword123',
        newPassword: 'NewPassword1234',
        confirmPassword: 'MismatchPassword'
      });

      component.submitPasswordChange();
      expect(userService.changePassword).not.toHaveBeenCalled();
      expect(component.passwordError()).toContain('no coinciden');
    });

    it('should call userService.changePassword on valid passwords', () => {
      userService.changePassword.and.returnValue(of({ success: true, message: 'OK' }));

      component.passwordForm.patchValue({
        currentPassword: 'CurrentPassword123',
        newPassword: 'NewPassword1234',
        confirmPassword: 'NewPassword1234'
      });

      component.submitPasswordChange();

      expect(userService.changePassword).toHaveBeenCalledWith({
        currentPassword: 'CurrentPassword123',
        newPassword: 'NewPassword1234'
      });
      expect(component.passwordSuccess()).toContain('actualizada con éxito');
    });
  });

  describe('Lawyer processes modal', () => {
    it('should open modal and fetch processes for lawyer', () => {
      const mockProcesses = [
        {
          id: 'op-1',
          radicado: '05001333300020130157702',
          instancia: '1',
          despacho: 'Juzgado 1 Civil',
          departamento: 'Antioquia',
          esPrivado: false,
          demandantes: ['Pedro Perez'],
          demandados: ['Compañía Seguros'],
          representedParty: RepresentedParty.DEMANDANTE,
          subprocesses: [],
          newCount: 2,
          instanceNotices: 0
        }
      ];

      processService.listProcesses.and.returnValue(of({ success: true, data: mockProcesses as any }));

      const target = mockMembers[1];
      component.openLawyerProcesses(target);

      expect(component.showProcessesModal()).toBeTrue();
      expect(component.selectedLawyer()).toBe(target);
      expect(processService.listProcesses).toHaveBeenCalledWith({ responsibleUserId: 'usr-2' });
      expect(component.lawyerProcesses().length).toBe(1);
    });

    it('should close processes modal and navigate when viewProcessDetail is called', () => {
      spyOn(router, 'navigate');
      component.showProcessesModal.set(true);

      component.viewProcessDetail('op-1');

      expect(component.showProcessesModal()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/procesos', 'op-1']);
    });
  });

  describe('Status modal (Activar / Suspender)', () => {
    it('should open and close status modal', () => {
      const target = mockMembers[1];
      component.openStatusModal(target, MembershipStatus.SUSPENDED);

      expect(component.showStatusModal()).toBeTrue();
      expect(component.targetMember()).toBe(target);
      expect(component.targetStatus()).toBe(MembershipStatus.SUSPENDED);

      component.closeStatusModal();
      expect(component.showStatusModal()).toBeFalse();
    });

    it('should call orgService.changeMemberStatus on confirmStatusChange', () => {
      orgService.changeMemberStatus.and.returnValue(of({ success: true }));

      const target = mockMembers[1];
      component.openStatusModal(target, MembershipStatus.SUSPENDED);
      component.confirmStatusChange();

      expect(orgService.changeMemberStatus).toHaveBeenCalledWith('org-alpha', 'usr-2', MembershipStatus.SUSPENDED);
      expect(component.showStatusModal()).toBeFalse();
      expect(orgService.listMembers).toHaveBeenCalled();
    });
  });

  describe('Email verification', () => {
    it('isEmailVerified should reflect currentUser emailVerified status', () => {
      expect(component.isEmailVerified()).toBeTrue();
    });

    it('resendVerification should call authService.resendVerificationEmail when not verified', () => {
      authService.currentUser.and.returnValue({ ...mockUser, emailVerified: false });
      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.isEmailVerified()).toBeFalse();

      component.resendVerification();
      expect(authService.resendVerificationEmail).toHaveBeenCalled();
      expect(component.verificationSentMessage()).toBe('Enlace enviado.');
      expect(component.cooldownSeconds()).toBe(60);
    });

    it('resendVerification should not call service when cooldown is active', () => {
      authService.currentUser.and.returnValue({ ...mockUser, emailVerified: false });
      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.cooldownSeconds.set(30);
      component.resendVerification();

      expect(authService.resendVerificationEmail).not.toHaveBeenCalled();
    });

    it('resendVerification should parse remaining seconds from server error and set cooldown', () => {
      authService.currentUser.and.returnValue({ ...mockUser, emailVerified: false });
      authService.resendVerificationEmail.and.returnValue(throwError(() => ({
        error: { message: 'Debes esperar 45 segundos antes de solicitar un nuevo enlace.' }
      })));
      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.resendVerification();
      expect(authService.resendVerificationEmail).toHaveBeenCalled();
      expect(component.cooldownSeconds()).toBe(45);
      expect(component.verificationErrorMessage()).toContain('Debes esperar 45 segundos');
    });

    it('resendVerification should handle error gracefully', () => {
      authService.currentUser.and.returnValue({ ...mockUser, emailVerified: false });
      authService.resendVerificationEmail.and.returnValue(throwError(() => ({ error: { message: 'Fallo al enviar' } })));
      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.resendVerification();
      expect(authService.resendVerificationEmail).toHaveBeenCalled();
      expect(component.verificationErrorMessage()).toBe('Fallo al enviar');
    });
  });
});
