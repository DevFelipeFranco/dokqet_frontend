import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../core/services/user.service';
import { OrganizationService } from '../../core/services/organization.service';
import { ProcessService } from '../../core/services/process.service';
import { CatalogService } from '../../core/services/catalog.service';
import { OrganizationStore } from '../../core/state/organization.store';
import { DocumentType, User } from '../../core/models/user.model';
import { CityDto, CountryDto, DepartmentDto, DocumentTypeDto, GenderDto } from '../../core/models/catalog.model';
import { Member, MemberRole, MembershipStatus } from '../../core/models/organization.model';
import { ProcessListItem } from '../../core/models/process.model';
import { RadicadoPipe } from '../../shared/pipes/radicado.pipe';
import {
  DOCUMENT_TYPE_OPTIONS,
  formatDocumentType,
  formatMemberRole,
  formatMembershipStatus,
  formatRepresentedParty,
  extractUserInitials,
  copyTextToClipboard,
  LEGAL_CONSTANTS
} from '../../core/constants';
import {
  BadgeComponent,
  BreadcrumbsComponent,
  ButtonComponent,
  CardComponent,
  CardContentComponent,
  CardDescriptionComponent,
  CardFooterComponent,
  CardHeaderComponent,
  CardTitleComponent,
  EmptyStateComponent,
  FormAlertComponent,
  ModalComponent,
  StatCardComponent,
  SkeletonComponent,
  SkeletonTableComponent
} from '../../shared/components/ui';

/**
 * Validador puro para verificar coincidencia de contraseñas
 */
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (!newPassword || !confirmPassword) return null;
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
};

/**
 * Función pura para evaluar si el estado de un miembro puede ser modificado por el usuario activo
 */
export function canToggleMemberStatus(member: Member, currentUserId: string): boolean {
  if (!member || !currentUserId) return false;
  if (member.userId === currentUserId) return false;
  if (member.isCreator) return false;
  return true;
}

/**
 * Función pura para computar las estadísticas del personal jurídico
 */
export function computeMemberStats(members: Member[]) {
  const total = members.length;
  const active = members.filter(m => m.status === MembershipStatus.ACTIVE).length;
  const suspended = members.filter(m => m.status === MembershipStatus.SUSPENDED).length;
  return { total, active, suspended };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    RadicadoPipe,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    ButtonComponent,
    BadgeComponent,
    FormAlertComponent,
    BreadcrumbsComponent,
    EmptyStateComponent,
    StatCardComponent,
    ModalComponent,
    SkeletonComponent,
    SkeletonTableComponent
  ],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly orgService = inject(OrganizationService);
  private readonly processService = inject(ProcessService);
  private readonly catalogService = inject(CatalogService);
  readonly orgStore = inject(OrganizationStore);

  // Catálogos maestros dinámicos
  readonly documentTypes = signal<DocumentTypeDto[]>([]);
  readonly genders = signal<GenderDto[]>([]);
  readonly countries = signal<CountryDto[]>([]);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly cities = signal<CityDto[]>([]);
  readonly loadingGeo = signal<boolean>(false);

  // Constantes y opciones
  readonly documentTypeOptions = DOCUMENT_TYPE_OPTIONS;
  readonly MembershipStatus = MembershipStatus;
  readonly MemberRole = MemberRole;

  // Pestaña activa ('personal' | 'team')
  readonly activeTab = signal<'personal' | 'team'>('personal');

  // Estados de carga
  readonly loadingProfile = signal<boolean>(true);
  readonly savingProfile = signal<boolean>(false);
  readonly changingPassword = signal<boolean>(false);
  readonly loadingTeam = signal<boolean>(false);

  // Alertas
  readonly profileSuccess = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);
  readonly passwordSuccess = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);

  // Visibilidad de contraseñas y CapsLock
  readonly showCurrentPassword = signal<boolean>(false);
  readonly showNewPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);
  readonly isCapsLockOn = signal<boolean>(false);

  // Equipo a cargo
  readonly members = signal<Member[]>([]);

  // Modal para ver procesos de un abogado
  readonly showProcessesModal = signal<boolean>(false);
  readonly selectedLawyer = signal<Member | null>(null);
  readonly lawyerProcesses = signal<ProcessListItem[]>([]);
  readonly loadingProcesses = signal<boolean>(false);
  readonly copiedRadicado = signal<string | null>(null);

  // Modal para activar / suspender abogado
  readonly showStatusModal = signal<boolean>(false);
  readonly targetMember = signal<Member | null>(null);
  readonly targetStatus = signal<MembershipStatus | null>(null);
  readonly updatingStatus = signal<boolean>(false);
  readonly statusError = signal<string | null>(null);

  // Formularios reactivos
  readonly profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    middleName: ['', [Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    secondLastName: ['', [Validators.maxLength(100)]],
    documentType: ['CC', [Validators.required]],
    documentNumber: ['', [Validators.required, Validators.maxLength(50)]],
    genderCode: ['' as string | null],
    countryCode: ['CO'],
    departmentCode: [''],
    cityId: ['' as string | null],
    email: [{ value: '', disabled: true }]
  });

  readonly passwordForm = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: [passwordMatchValidator] }
  );

  // Computed signals
  readonly currentUser = computed(() => this.authService.currentUser());
  readonly currentUserId = computed(() => this.currentUser()?.id || '');
  readonly isAdmin = computed(() => this.authService.isAdmin());
  readonly currentOrg = computed(() => this.orgStore.activeOrg());

  readonly userInitials = computed(() => extractUserInitials(this.currentUser()?.name));
  readonly userFullName = computed(() => this.currentUser()?.name || 'Abogado');
  readonly userEmail = computed(() => this.currentUser()?.email || '');
  readonly isEmailVerified = computed(() => !!this.currentUser()?.emailVerified);

  // Reenvío de confirmación de correo
  readonly resendingVerification = signal<boolean>(false);
  readonly cooldownSeconds = signal<number>(0);
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;
  readonly verificationSentMessage = signal<string | null>(null);
  readonly verificationErrorMessage = signal<string | null>(null);

  readonly teamStats = computed(() => computeMemberStats(this.members()));

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadProfile();
    if (this.isAdmin()) {
      this.loadTeamMembers();
    }
  }

  loadCatalogs(): void {
    this.catalogService.getDocumentTypes('NATURAL').subscribe({
      next: (types) => this.documentTypes.set(types || []),
      error: () => {}
    });

    this.catalogService.getGenders().subscribe({
      next: (items) => this.genders.set(items || []),
      error: () => {}
    });

    this.catalogService.getCountries().subscribe({
      next: (cList) => {
        this.countries.set(cList || []);
        const currentCountry = this.profileForm.get('countryCode')?.value || 'CO';
        this.loadDepartments(currentCountry);
      },
      error: () => {}
    });
  }

  loadDepartments(countryCode: string, targetDeptCode?: string, targetCityId?: string): void {
    if (!countryCode) return;
    this.loadingGeo.set(true);
    this.catalogService.getDepartmentsByCountry(countryCode).subscribe({
      next: (depts) => {
        this.departments.set(depts || []);
        this.loadingGeo.set(false);
        if (targetDeptCode) {
          this.profileForm.patchValue({ departmentCode: targetDeptCode });
          this.loadCities(targetDeptCode, targetCityId);
        } else if (depts && depts.length > 0 && !this.profileForm.get('departmentCode')?.value) {
          // Si no tiene departamento seleccionado, opcionalmente cargamos el primero o lo dejamos vacío
        }
      },
      error: () => {
        this.loadingGeo.set(false);
      }
    });
  }

  loadCities(departmentCode: string, targetCityId?: string): void {
    if (!departmentCode) {
      this.cities.set([]);
      this.profileForm.patchValue({ cityId: null });
      return;
    }
    this.loadingGeo.set(true);
    this.catalogService.getCitiesByDepartment(departmentCode).subscribe({
      next: (cityList) => {
        this.cities.set(cityList || []);
        this.loadingGeo.set(false);
        if (targetCityId) {
          this.profileForm.patchValue({ cityId: targetCityId });
        }
      },
      error: () => {
        this.loadingGeo.set(false);
      }
    });
  }

  onCountryChange(countryCode: string): void {
    this.profileForm.patchValue({ departmentCode: '', cityId: null });
    this.departments.set([]);
    this.cities.set([]);
    this.loadDepartments(countryCode);
  }

  onDepartmentChange(departmentCode: string): void {
    this.profileForm.patchValue({ cityId: null });
    this.loadCities(departmentCode);
  }

  loadProfile(): void {
    this.loadingProfile.set(true);
    this.userService.getProfile().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const user = res.data;
          this.authService.updateCurrentUser(user);
          this.applyUserToForm(user);
        }
        this.loadingProfile.set(false);
      },
      error: () => {
        // Fallback al usuario guardado en sesión
        const user = this.currentUser();
        if (user) {
          this.applyUserToForm(user);
        }
        this.loadingProfile.set(false);
      }
    });
  }

  private applyUserToForm(user: User): void {
    this.profileForm.patchValue({
      firstName: user.firstName,
      middleName: user.middleName || '',
      lastName: user.lastName,
      secondLastName: user.secondLastName || '',
      documentType: user.documentType,
      documentNumber: user.documentNumber,
      genderCode: user.genderCode || '',
      email: user.email
    });

    if (user.cityId) {
      // Consultamos la ciudad para identificar su departamento y país
      this.catalogService.getCities().subscribe({
        next: (allCities) => {
          const matched = allCities.find(c => c.id === user.cityId || c.code === user.cityId);
          if (matched) {
            const countryCode = matched.countryCode || 'CO';
            this.profileForm.patchValue({ countryCode });
            this.loadDepartments(countryCode, matched.departmentCode || undefined, matched.id);
          } else {
            this.profileForm.patchValue({ cityId: user.cityId });
          }
        },
        error: () => {
          this.profileForm.patchValue({ cityId: user.cityId });
        }
      });
    }
  }

  loadTeamMembers(): void {
    const orgId = this.authService.activeOrgId();
    if (!orgId) return;

    this.loadingTeam.set(true);
    this.orgService.listMembers(orgId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.members.set(res.data);
        }
        this.loadingTeam.set(false);
      },
      error: () => {
        this.loadingTeam.set(false);
      }
    });
  }

  saveProfile(): void {
    this.profileSuccess.set(null);
    this.profileError.set(null);

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.profileError.set('Por favor completa todos los campos obligatorios del perfil.');
      return;
    }

    const formValue = this.profileForm.getRawValue();
    this.savingProfile.set(true);

    this.userService.updateProfile({
      firstName: formValue.firstName?.trim() || '',
      middleName: formValue.middleName?.trim() || null,
      lastName: formValue.lastName?.trim() || '',
      secondLastName: formValue.secondLastName?.trim() || null,
      documentType: formValue.documentType as string,
      documentNumber: formValue.documentNumber?.trim() || '',
      genderCode: formValue.genderCode || null,
      cityId: formValue.cityId || null
    }).subscribe({
      next: (res) => {
        this.savingProfile.set(false);
        if (res.success && res.data) {
          this.authService.updateCurrentUser(res.data);
          this.profileSuccess.set('Información personal actualizada correctamente.');
        } else {
          this.profileSuccess.set('Información personal guardada.');
        }
      },
      error: (err) => {
        this.savingProfile.set(false);
        const msg = err.error?.message || 'Error al guardar los cambios del perfil.';
        this.profileError.set(msg);
      }
    });
  }

  submitPasswordChange(): void {
    this.passwordSuccess.set(null);
    this.passwordError.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      if (this.passwordForm.errors?.['passwordMismatch']) {
        this.passwordError.set('La nueva contraseña y su confirmación no coinciden.');
      } else {
        this.passwordError.set('Verifica que la contraseña cumpla los requisitos de seguridad (mínimo 8 caracteres).');
      }
      return;
    }

    const val = this.passwordForm.value;
    if (!val.currentPassword || !val.newPassword) return;

    this.changingPassword.set(true);
    this.userService.changePassword({
      currentPassword: val.currentPassword,
      newPassword: val.newPassword
    }).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.passwordSuccess.set('Tu contraseña ha sido actualizada con éxito.');
        this.passwordForm.reset();
      },
      error: (err) => {
        this.changingPassword.set(false);
        const msg = err.error?.message || 'Error al actualizar la contraseña.';
        this.passwordError.set(msg);
      }
    });
  }

  // Visualización de procesos asignados a un abogado
  openLawyerProcesses(member: Member): void {
    this.selectedLawyer.set(member);
    this.lawyerProcesses.set([]);
    this.loadingProcesses.set(true);
    this.showProcessesModal.set(true);

    this.processService.listProcesses({ responsibleUserId: member.userId }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.lawyerProcesses.set(res.data);
        }
        this.loadingProcesses.set(false);
      },
      error: () => {
        this.loadingProcesses.set(false);
      }
    });
  }

  closeProcessesModal(): void {
    this.showProcessesModal.set(false);
    this.selectedLawyer.set(null);
    this.lawyerProcesses.set([]);
  }

  viewProcessDetail(processId: string): void {
    this.closeProcessesModal();
    this.router.navigate(['/procesos', processId]);
  }

  async copyRadicado(radicado: string): Promise<void> {
    const ok = await copyTextToClipboard(radicado);
    if (ok) {
      this.copiedRadicado.set(radicado);
      setTimeout(() => {
        if (this.copiedRadicado() === radicado) {
          this.copiedRadicado.set(null);
        }
      }, LEGAL_CONSTANTS.CLIPBOARD_FEEDBACK_DURATION_MS);
    }
  }

  // Activar o suspender acceso de usuario
  openStatusModal(member: Member, newStatus: MembershipStatus): void {
    this.targetMember.set(member);
    this.targetStatus.set(newStatus);
    this.statusError.set(null);
    this.showStatusModal.set(true);
  }

  closeStatusModal(): void {
    this.showStatusModal.set(false);
    this.targetMember.set(null);
    this.targetStatus.set(null);
    this.statusError.set(null);
  }

  confirmStatusChange(): void {
    const member = this.targetMember();
    const newStatus = this.targetStatus();
    const orgId = this.authService.activeOrgId();

    if (!member || !newStatus || !orgId) return;

    this.updatingStatus.set(true);
    this.statusError.set(null);

    this.orgService.changeMemberStatus(orgId, member.userId, newStatus).subscribe({
      next: () => {
        this.updatingStatus.set(false);
        this.closeStatusModal();
        this.loadTeamMembers();
      },
      error: (err) => {
        this.updatingStatus.set(false);
        const msg = err.error?.message || 'No fue posible actualizar el estado del usuario.';
        this.statusError.set(msg);
      }
    });
  }

  canModify(member: Member): boolean {
    return canToggleMemberStatus(member, this.currentUserId());
  }

  resendVerification(): void {
    if (this.resendingVerification() || this.isEmailVerified() || this.cooldownSeconds() > 0) return;
    this.resendingVerification.set(true);
    this.verificationSentMessage.set(null);
    this.verificationErrorMessage.set(null);

    this.authService.resendVerificationEmail().subscribe({
      next: (res) => {
        this.resendingVerification.set(false);
        this.startCooldown(60);
        this.verificationSentMessage.set(res?.message || 'Enlace de verificación enviado. Revisa tu buzón de correo.');
        setTimeout(() => this.verificationSentMessage.set(null), 6000);
      },
      error: (err) => {
        this.resendingVerification.set(false);
        const errorMsg = err?.error?.message || 'No fue posible reenviar el correo de verificación. Inténtalo de nuevo más tarde.';
        this.verificationErrorMessage.set(errorMsg);
        const match = errorMsg.match(/(\d+)\s*segundos/i);
        if (match && match[1]) {
          this.startCooldown(parseInt(match[1], 10));
        }
        setTimeout(() => this.verificationErrorMessage.set(null), 6000);
      }
    });
  }

  startCooldown(seconds: number = 60): void {
    this.cooldownSeconds.set(seconds);
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
    this.cooldownInterval = setInterval(() => {
      const current = this.cooldownSeconds();
      if (current <= 1) {
        if (this.cooldownInterval) {
          clearInterval(this.cooldownInterval);
          this.cooldownInterval = null;
        }
        this.cooldownSeconds.set(0);
      } else {
        this.cooldownSeconds.set(current - 1);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }

  onKeydownCapsLock(event: KeyboardEvent): void {
    this.isCapsLockOn.set(event.getModifierState('CapsLock'));
  }

  // Pure formatting helpers
  formatDoc(type?: DocumentType | string | null): string {
    return formatDocumentType(type);
  }

  formatRole(role?: MemberRole | string | null): string {
    return formatMemberRole(role);
  }

  formatStatus(status?: MembershipStatus | string | null): string {
    return formatMembershipStatus(status);
  }

  formatParty(party?: any): string {
    return formatRepresentedParty(party);
  }
}
