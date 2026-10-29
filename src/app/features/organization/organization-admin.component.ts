import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrganizationService } from '../../core/services/organization.service';
import { CatalogService } from '../../core/services/catalog.service';
import { OrganizationStore } from '../../core/state/organization.store';
import { AuthService } from '../../core/auth/auth.service';
import { Member, MemberRole, Organization, PersonType, Invitation } from '../../core/models/organization.model';
import { CityDto, CountryDto, DepartmentDto, PersonTypeDto } from '../../core/models/catalog.model';
import { calculateNitCheckDigit } from '../../shared/validators/dian.validators';
import {
  LEGAL_CONSTANTS,
  MEMBER_ROLE_OPTIONS,
  PERSON_TYPE_OPTIONS,
  formatMemberRole,
  formatPersonType,
  formatInvitationStatus
} from '../../core/constants';
import {
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  CardFooterComponent,
  ButtonComponent,
  BadgeComponent,
  BadgeVariant,
  FormAlertComponent,
  BreadcrumbsComponent,
  ModalComponent,
  SkeletonComponent,
  SkeletonTableComponent
} from '../../shared/components/ui';

/**
 * Función pura para calcular los días restantes de restricción fiscal
 */
export function calculateRemainingCooldownDays(
  dataUpdatedAt?: string | null,
  cooldownDays: number = LEGAL_CONSTANTS.ORGANIZATION_COOLDOWN_DAYS,
  currentTimestamp: number = Date.now()
): number {
  if (!dataUpdatedAt) return 0;
  const updatedMs = new Date(dataUpdatedAt).getTime();
  const diffMs = currentTimestamp - updatedMs;
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  if (diffMs >= cooldownMs) return 0;
  return Math.ceil((cooldownMs - diffMs) / (24 * 60 * 60 * 1000));
}

@Component({
  selector: 'app-organization-admin',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink,
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
    ModalComponent,
    SkeletonComponent,
    SkeletonTableComponent
  ],
  templateUrl: './organization-admin.component.html'
})
export class OrganizationAdminComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orgService = inject(OrganizationService);
  private readonly catalogService = inject(CatalogService);
  private readonly orgStore = inject(OrganizationStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly PersonType = PersonType;
  readonly MemberRole = MemberRole;
  readonly cooldownDays = LEGAL_CONSTANTS.ORGANIZATION_COOLDOWN_DAYS;
  readonly memberRoleOptions = MEMBER_ROLE_OPTIONS;
  readonly personTypeOptions = PERSON_TYPE_OPTIONS;

  // Catálogos dinámicos
  readonly personTypes = signal<PersonTypeDto[]>([]);
  readonly countries = signal<CountryDto[]>([]);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly cities = signal<CityDto[]>([]);
  readonly loadingGeo = signal<boolean>(false);

  readonly isCreateMode = signal(false);
  readonly org = signal<Organization | null>(null);
  readonly members = signal<Member[]>([]);
  readonly invitations = signal<Invitation[]>([]);
  readonly loading = signal(true);
  readonly loadingMembers = signal(false);
  readonly membersError = signal<string | null>(null);
  readonly loadingInvitations = signal(false);
  readonly editing = signal(false);
  readonly savingOrg = signal(false);

  // Modales
  readonly showInviteModal = signal(false);
  readonly confirmSaveModal = signal(false);
  readonly confirmRemoveModal = signal(false);
  readonly selectedMemberToRemove = signal<Member | null>(null);

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly calculatedDv = signal<string>('');

  readonly isAdmin = computed(() => this.authService.isAdmin());
  readonly currentUserId = computed(() => this.authService.currentUser()?.id || '');

  readonly orgForm = this.fb.group({
    name: ['', [Validators.required]],
    personType: ['JURIDICA', [Validators.required]],
    legalName: [''],
    nit: [''],
    countryCode: ['CO'],
    departmentCode: [''],
    cityId: [null as string | null]
  });

  readonly inviteForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: [MemberRole.LAWYER, [Validators.required]]
  });

  constructor() {
    effect(() => {
      const orgId = this.authService.activeOrgId();
      if (orgId && !this.isCreateMode()) {
        this.loadData();
      }
    });
  }

  ngOnInit(): void {
    const isNew = this.router.url.includes('organizaciones/nueva');
    this.isCreateMode.set(isNew);

    this.loadCatalogs();

    this.updateValidators(this.orgForm.value.personType);
    this.orgForm.get('personType')?.valueChanges.subscribe(type => {
      this.updateValidators(type);
    });

    if (isNew) {
      this.loading.set(false);
      this.editing.set(true);
      this.orgForm.reset({
        name: '',
        personType: 'JURIDICA',
        legalName: '',
        nit: '',
        countryCode: 'CO',
        departmentCode: '',
        cityId: null
      });
      this.calculatedDv.set('');
    }
  }

  loadCatalogs(): void {
    this.catalogService.getPersonTypes().subscribe({
      next: (types) => {
        this.personTypes.set(types || []);
        this.updateValidators(this.orgForm.value.personType);
      },
      error: () => {}
    });

    this.catalogService.getCountries().subscribe({
      next: (cList) => {
        this.countries.set(cList || []);
        const country = this.orgForm.get('countryCode')?.value || 'CO';
        this.loadDepartments(country);
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
          this.orgForm.patchValue({ departmentCode: targetDeptCode });
          this.loadCities(targetDeptCode, targetCityId);
        }
      },
      error: () => this.loadingGeo.set(false)
    });
  }

  loadCities(departmentCode: string, targetCityId?: string): void {
    if (!departmentCode) {
      this.cities.set([]);
      this.orgForm.patchValue({ cityId: null });
      return;
    }
    this.loadingGeo.set(true);
    this.catalogService.getCitiesByDepartment(departmentCode).subscribe({
      next: (cityList) => {
        this.cities.set(cityList || []);
        this.loadingGeo.set(false);
        if (targetCityId) {
          this.orgForm.patchValue({ cityId: targetCityId });
        }
      },
      error: () => this.loadingGeo.set(false)
    });
  }

  onCountryChange(countryCode: string): void {
    this.orgForm.patchValue({ departmentCode: '', cityId: null });
    this.departments.set([]);
    this.cities.set([]);
    this.loadDepartments(countryCode);
  }

  onDepartmentChange(departmentCode: string): void {
    this.orgForm.patchValue({ cityId: null });
    this.loadCities(departmentCode);
  }

  /**
   * Actualiza los validadores según el tipo de persona configurado en la tabla maestra
   */
  updateValidators(personType: string | null | undefined): void {
    const matched = this.personTypes().find(p => p.code === personType);
    const requiresLegalName = matched ? matched.requiresLegalName : (personType === 'JURIDICA' || personType === PersonType.JURIDICA);
    const requiresNit = matched ? matched.requiresNit : (personType === 'JURIDICA' || personType === PersonType.JURIDICA);

    const legalNameCtrl = this.orgForm.get('legalName');
    const nitCtrl = this.orgForm.get('nit');

    if (requiresLegalName) {
      legalNameCtrl?.setValidators([Validators.required]);
    } else {
      legalNameCtrl?.clearValidators();
    }

    if (requiresNit) {
      nitCtrl?.setValidators([Validators.required]);
    } else {
      nitCtrl?.clearValidators();
    }

    legalNameCtrl?.updateValueAndValidity();
    nitCtrl?.updateValueAndValidity();
  }

  /**
   * Carga la organización y miembros del tenant activo
   */
  loadData(): void {
    const orgId = this.authService.activeOrgId();
    if (!orgId) return;

    this.loading.set(true);
    this.orgService.getOrganization(orgId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.org.set(res.data);
          this.populateForm(res.data);
          this.loadMembers(orgId);
          if (!res.data.isPersonal) {
            this.loadInvitations(orgId);
          } else {
            this.invitations.set([]);
          }
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  /**
   * Carga las invitaciones enviadas en la firma
   */
  loadInvitations(orgId: string): void {
    this.loadingInvitations.set(true);
    this.orgService.listInvitations(orgId).subscribe({
      next: (res) => {
        this.loadingInvitations.set(false);
        if (res.success && res.data) {
          this.invitations.set(res.data);
        }
      },
      error: () => {
        this.loadingInvitations.set(false);
      }
    });
  }

  /**
   * Carga los miembros del equipo
   */
  loadMembers(orgId: string): void {
    this.loadingMembers.set(true);
    this.membersError.set(null);
    this.orgService.listMembers(orgId).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.loadingMembers.set(false);
        if (res.success && res.data) {
          this.members.set(res.data);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.loadingMembers.set(false);
        this.membersError.set(err.error?.message || 'Error al cargar los miembros del equipo.');
      }
    });
  }

  /**
   * Sincroniza el formulario reactivo con los datos fiscales de la organización
   */
  populateForm(data: Organization): void {
    this.orgForm.patchValue({
      name: data.name,
      personType: data.personType,
      legalName: data.legalName || '',
      nit: data.nit || '',
      cityId: data.cityId || null
    });
    if (data.nit) {
      this.calculatedDv.set(calculateNitCheckDigit(data.nit));
    }
    if (data.cityId) {
      this.catalogService.getCities().subscribe({
        next: (cityList) => {
          const matched = cityList.find(c => c.id === data.cityId || c.code === data.cityId);
          if (matched) {
            const countryCode = matched.countryCode || 'CO';
            this.orgForm.patchValue({ countryCode });
            this.loadDepartments(countryCode, matched.departmentCode || undefined, matched.id);
          }
        }
      });
    }
  }

  /**
   * Recalcula el dígito de verificación cuando el usuario digita el NIT
   */
  onNitInput(): void {
    const nit = this.orgForm.value.nit || '';
    this.calculatedDv.set(calculateNitCheckDigit(nit));
  }

  /**
   * Abre el formulario de edición de datos fiscales
   */
  startEditing(): void {
    if (this.isCooldownActive() || this.org()?.isPersonal) return;
    this.editing.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  /**
   * Cancela la edición y restaura los valores vigentes
   */
  cancelEditing(): void {
    if (this.isCreateMode()) {
      this.router.navigate(['/panel']);
      return;
    }
    this.editing.set(false);
    if (this.org()) {
      this.populateForm(this.org()!);
    }
  }

  /**
   * Confirma la intención de guardar datos fiscales
   */
  onSaveClick(): void {
    if (this.orgForm.invalid) {
      this.orgForm.markAllAsTouched();
      return;
    }
    if (this.isCreateMode()) {
      this.executeCreate();
    } else {
      this.confirmSaveModal.set(true);
    }
  }

  /**
   * Crea una nueva organización corporativa o firma
   */
  executeCreate(): void {
    if (this.orgForm.invalid) return;

    this.savingOrg.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const matched = this.personTypes().find(p => p.code === this.orgForm.value.personType);
    const requiresLegalName = matched ? matched.requiresLegalName : this.orgForm.value.personType === 'JURIDICA';
    const payload = {
      name: this.orgForm.value.name?.trim().toUpperCase(),
      personType: this.orgForm.value.personType,
      legalName: requiresLegalName ? (this.orgForm.value.legalName?.trim().toUpperCase() || null) : null,
      nit: this.orgForm.value.nit?.trim() || null,
      cityId: this.orgForm.value.cityId || null
    };

    this.orgService.createOrganization(payload).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.orgStore.switchOrganization(res.data.id).subscribe({
            next: () => {
              this.savingOrg.set(false);
              this.router.navigate(['/organizacion']);
            },
            error: () => {
              this.savingOrg.set(false);
              this.router.navigate(['/organizacion']);
            }
          });
        } else {
          this.savingOrg.set(false);
        }
      },
      error: (err) => {
        this.savingOrg.set(false);
        this.errorMessage.set(err.error?.message || 'Error al crear la organización.');
      }
    });
  }

  /**
   * Ejecuta el guardado y aplica la política de 30 días
   */
  executeSave(): void {
    const orgId = this.authService.activeOrgId();
    if (!orgId) return;

    if (this.org()?.isPersonal) {
      this.confirmSaveModal.set(false);
      this.errorMessage.set('La organización personal no permite editar estos datos.');
      return;
    }

    this.savingOrg.set(true);
    this.confirmSaveModal.set(false);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const matched = this.personTypes().find(p => p.code === this.orgForm.value.personType);
    const requiresLegalName = matched ? matched.requiresLegalName : this.orgForm.value.personType === 'JURIDICA';
    const payload = {
      name: this.orgForm.value.name?.trim().toUpperCase(),
      personType: this.orgForm.value.personType,
      legalName: requiresLegalName ? (this.orgForm.value.legalName?.trim().toUpperCase() || null) : null,
      nit: this.orgForm.value.nit?.trim() || null,
      cityId: this.orgForm.value.cityId || null
    };

    this.orgService.updateOrganization(orgId, payload).subscribe({
      next: (res) => {
        this.savingOrg.set(false);
        this.editing.set(false);
        this.successMessage.set('Información fiscal actualizada exitosamente.');
        if (res.data) {
          this.org.set(res.data);
          this.populateForm(res.data);
        }
      },
      error: (err) => {
        this.savingOrg.set(false);
        this.errorMessage.set(err.error?.message || 'Error al actualizar datos fiscales.');
      }
    });
  }

  /**
   * Determina si el período de restricción fiscal está activo
   */
  isCooldownActive(): boolean {
    return this.remainingCooldownDays() > 0;
  }

  /**
   * Días restantes del período de restricción
   */
  remainingCooldownDays(): number {
    return calculateRemainingCooldownDays(this.org()?.dataUpdatedAt, this.cooldownDays);
  }

  /**
   * Envía invitación por correo para incorporar un nuevo abogado
   */
  sendInvitation(): void {
    const orgId = this.authService.activeOrgId();
    if (!orgId || this.inviteForm.invalid) return;

    const payload = {
      email: this.inviteForm.value.email!.trim().toLowerCase(),
      role: this.inviteForm.value.role!
    };

    this.orgService.inviteMember(orgId, payload).subscribe({
      next: () => {
        this.showInviteModal.set(false);
        this.inviteForm.reset({ role: MemberRole.LAWYER });
        this.successMessage.set(`Invitación enviada con éxito a ${payload.email}.`);
        this.loadInvitations(orgId);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al enviar invitación.');
      }
    });
  }

  /**
   * Cambia el rol de un miembro entre Administrador y Abogado
   */
  toggleRole(member: Member): void {
    const orgId = this.authService.activeOrgId();
    if (!orgId) return;

    const newRole = member.role === MemberRole.ADMIN ? MemberRole.LAWYER : MemberRole.ADMIN;
    this.orgService.changeRole(orgId, member.userId, newRole).subscribe({
      next: () => {
        this.loadMembers(orgId);
        this.successMessage.set(`Rol de ${member.name} actualizado.`);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'No se pudo cambiar el rol.');
      }
    });
  }

  /**
   * Solicita confirmación antes de retirar a un miembro
   */
  promptRemoveMember(member: Member): void {
    this.selectedMemberToRemove.set(member);
    this.confirmRemoveModal.set(true);
  }

  /**
   * Retira definitivamente a un miembro del equipo
   */
  executeRemoveMember(): void {
    const orgId = this.authService.activeOrgId();
    const member = this.selectedMemberToRemove();
    if (!orgId || !member) return;

    this.confirmRemoveModal.set(false);
    this.orgService.removeMember(orgId, member.userId).subscribe({
      next: () => {
        this.loadMembers(orgId);
        this.successMessage.set(`Miembro ${member.name} retirado exitosamente.`);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'No se pudo retirar al miembro.');
      }
    });
  }

  /**
   * Cancela una invitación pendiente
   */
  cancelInvitation(inv: Invitation): void {
    const orgId = this.authService.activeOrgId();
    if (!orgId) return;

    this.orgService.cancelInvitation(orgId, inv.id).subscribe({
      next: () => {
        this.loadInvitations(orgId);
        this.successMessage.set(`Invitación a ${inv.email} cancelada exitosamente.`);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'No se pudo cancelar la invitación.');
      }
    });
  }

  /**
   * Formatea el estado de la invitación
   */
  formatInvitationStatus(status?: string | null): string {
    return formatInvitationStatus(status);
  }

  /**
    * Determina la variante del badge para el estado de la invitación
    */
  getInvitationBadgeVariant(status?: string | null): BadgeVariant {
    switch (status) {
      case 'ACCEPTED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
      case 'CANCELED':
      case 'EXPIRED':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  /**
   * Formatea tipo de persona delegando en función pura
   */
  formatPersonType(type?: PersonType | string | null): string {
    return formatPersonType(type);
  }

  /**
   * Formatea rol de miembro delegando en función pura
   */
  formatRole(role?: MemberRole | null): string {
    return formatMemberRole(role);
  }
}
