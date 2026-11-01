import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SuperAdminService } from '../../../../core/services/super-admin.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AdminAction,
  AdminActionType,
  AdminUserDetail
} from '../../../../core/models/super-admin.model';
import { DokqetDatePipe } from '../../../../shared/pipes/dokqet-date.pipe';
import {
  BadgeComponent,
  BadgeVariant,
  BreadcrumbsComponent,
  BreadcrumbItem,
  EmptyStateComponent,
  FormAlertComponent,
  ModalComponent,
  SkeletonComponent
} from '../../../../shared/components/ui';

@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DokqetDatePipe,
    BreadcrumbsComponent,
    BadgeComponent,
    EmptyStateComponent,
    FormAlertComponent,
    ModalComponent,
    SkeletonComponent
  ],
  templateUrl: './admin-user-detail.component.html'
})
export class AdminUserDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly superAdminService = inject(SuperAdminService);
  readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly userId = signal<string>('');
  readonly user = signal<AdminUserDetail | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Pestañas internas de la ficha
  readonly activeTab = signal<'organizations' | 'consents' | 'actions'>('organizations');

  // Breadcrumbs dinámicos
  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Inicio', url: '/panel' },
    { label: 'Super Admin' },
    { label: 'Usuarios', url: '/admin/usuarios' },
    { label: this.user()?.name || 'Ficha de Usuario' }
  ]);

  // Modal de Suspensión / Reactivación
  readonly isSuspendModalOpen = signal<boolean>(false);
  readonly isReactivateModalOpen = signal<boolean>(false);
  readonly suspendReason = signal<string>('');
  readonly reactivateReason = signal<string>('');
  readonly actionModalLoading = signal<boolean>(false);
  readonly actionModalError = signal<string | null>(null);

  // Modal de Desbloqueo por Intentos Fallidos (HU-23)
  readonly isUnlockModalOpen = signal<boolean>(false);
  readonly unlockReason = signal<string>('');
  readonly unlockModalLoading = signal<boolean>(false);
  readonly unlockModalError = signal<string | null>(null);

  // Modal de Asignación / Revocación de Super Admin (con confirmación de contraseña)
  readonly isSuperAdminRoleModalOpen = signal<boolean>(false);
  readonly isGrantingRole = signal<boolean>(true); // true = Grant, false = Revoke
  readonly adminCurrentPassword = signal<string>('');
  readonly showAdminPassword = signal<boolean>(false);
  readonly roleReason = signal<string>('');
  readonly roleModalLoading = signal<boolean>(false);
  readonly roleModalError = signal<string | null>(null);

  // Botones de Enlace de Soporte (con control de límites)
  readonly sendingResetLink = signal<boolean>(false);
  readonly resendingVerification = signal<boolean>(false);

  // Reglas de negocio para controles (RN-HU21-03, RN-HU21-04)
  readonly isSelf = computed<boolean>(() => {
    const current = this.authService.currentUser();
    const target = this.user();
    return !!current && !!target && current.id === target.id;
  });

  readonly canUnlock = computed<boolean>(() => {
    const u = this.user();
    if (!u) return false;
    return u.isAccountLocked === true || (u.lockedUntil != null && new Date(u.lockedUntil) > new Date());
  });

  readonly cannotUnlockTooltip = computed<string | null>(() => {
    if (!this.canUnlock()) {
      return 'La cuenta no presenta bloqueo por intentos fallidos.';
    }
    return null;
  });

  readonly canSuspend = computed<boolean>(() => {
    const u = this.user();
    if (!u || u.isSuspended) return false;
    // No puede suspenderse a sí mismo
    if (this.isSelf()) return false;
    // No puede suspender a otro super admin (primero debe quitarle el rol)
    if (u.isSuperAdmin) return false;
    return true;
  });

  readonly cannotSuspendTooltip = computed<string | null>(() => {
    const u = this.user();
    if (!u) return null;
    if (this.isSelf()) return 'No puedes suspender tu propia cuenta de administrador.';
    if (u.isSuperAdmin) return 'Primero debes quitarle el rol de Super Administrador para poder suspenderlo.';
    return null;
  });

  readonly canRevokeSuperAdmin = computed<boolean>(() => {
    const u = this.user();
    if (!u || !u.isSuperAdmin) return false;
    // No puede revocarse el rol a sí mismo
    if (this.isSelf()) return false;
    return true;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(id);
      this.loadUserDetail(id);
    } else {
      this.errorMessage.set('Identificador de usuario no provisto.');
      this.loading.set(false);
    }
  }

  loadUserDetail(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.superAdminService.getUserDetail(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.user.set(res.data);
        } else {
          this.errorMessage.set('No se pudo encontrar la ficha del usuario.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err?.error?.detail || err?.error?.message || 'Error al cargar la información del usuario.';
        this.errorMessage.set(detail);
      }
    });
  }

  // ==================== Flujo: Suspensión de Cuenta ====================

  openSuspendModal(): void {
    if (!this.canSuspend()) return;
    this.suspendReason.set('');
    this.actionModalError.set(null);
    this.isSuspendModalOpen.set(true);
  }

  confirmSuspend(): void {
    const reason = this.suspendReason().trim();
    if (!reason || reason.length > 500) {
      this.actionModalError.set('Debes ingresar un motivo válido (entre 1 y 500 caracteres).');
      return;
    }

    this.actionModalLoading.set(true);
    this.actionModalError.set(null);

    this.superAdminService.suspendUser(this.userId(), reason).subscribe({
      next: (res) => {
        this.actionModalLoading.set(false);
        this.isSuspendModalOpen.set(false);
        this.notificationService.showSuccess(
          'Cuenta suspendida exitosamente. Se han revocado todas las sesiones activas.',
          'Operación completada'
        );

        // Actualización reactiva inmediata en la UI (RN-HU21-03)
        const current = this.user();
        if (current) {
          const newAction: AdminAction = {
            id: 'act-' + Date.now(),
            type: 'SUSPEND_USER',
            viaCommand: false,
            actorId: this.authService.currentUser()?.id || null,
            actorEmail: this.authService.currentUser()?.email || 'admin@dokqet.com',
            targetId: current.id,
            targetEmail: current.email,
            reason: reason,
            createdAt: new Date().toISOString()
          };

          this.user.set({
            ...current,
            isSuspended: true,
            status: 'SUSPENDED',
            suspendedAt: new Date().toISOString(),
            suspensionType: 'MANUAL',
            openSessionsCount: 0,
            adminActions: [newAction, ...(current.adminActions || [])]
          });
        }
      },
      error: (err) => {
        this.actionModalLoading.set(false);
        const detail = err?.error?.detail || err?.error?.message || 'No fue posible suspender la cuenta.';
        this.actionModalError.set(detail);
      }
    });
  }

  // ==================== Flujo: Reactivación de Cuenta ====================

  openReactivateModal(): void {
    this.reactivateReason.set('');
    this.actionModalError.set(null);
    this.isReactivateModalOpen.set(true);
  }

  confirmReactivate(): void {
    const reason = this.reactivateReason().trim();
    if (!reason || reason.length > 500) {
      this.actionModalError.set('Debes ingresar un motivo válido (entre 1 y 500 caracteres).');
      return;
    }

    this.actionModalLoading.set(true);
    this.actionModalError.set(null);

    this.superAdminService.reactivateUser(this.userId(), reason).subscribe({
      next: (res) => {
        this.actionModalLoading.set(false);
        this.isReactivateModalOpen.set(false);
        this.notificationService.showSuccess(
          'Cuenta reactivada exitosamente. El usuario ya puede iniciar sesión.',
          'Cuenta reactivada'
        );

        const current = this.user();
        if (current) {
          const newStatus = current.emailVerified ? 'ACTIVE' : 'UNVERIFIED';
          const newAction: AdminAction = {
            id: 'act-' + Date.now(),
            type: 'REACTIVATE_USER',
            viaCommand: false,
            actorId: this.authService.currentUser()?.id || null,
            actorEmail: this.authService.currentUser()?.email || 'admin@dokqet.com',
            targetId: current.id,
            targetEmail: current.email,
            reason: reason,
            createdAt: new Date().toISOString()
          };

          this.user.set({
            ...current,
            isSuspended: false,
            status: newStatus,
            suspendedAt: null,
            suspensionType: null,
            adminActions: [newAction, ...(current.adminActions || [])]
          });
        }
      },
      error: (err) => {
        this.actionModalLoading.set(false);
        const detail = err?.error?.detail || err?.error?.message || 'No fue posible reactivar la cuenta.';
        this.actionModalError.set(detail);
      }
    });
  }

  // ==================== Flujo: Desbloqueo de Cuenta por Intentos Fallidos (HU-23) ====================

  openUnlockModal(): void {
    if (!this.canUnlock()) return;
    this.unlockReason.set('Desbloqueo solicitado por soporte técnico');
    this.unlockModalError.set(null);
    this.isUnlockModalOpen.set(true);
  }

  closeUnlockModal(): void {
    if (this.unlockModalLoading()) return;
    this.isUnlockModalOpen.set(false);
    this.unlockModalError.set(null);
  }

  confirmUnlockUser(): void {
    const target = this.user();
    if (!target) return;

    this.unlockModalLoading.set(true);
    this.unlockModalError.set(null);
    const reason = this.unlockReason().trim() || 'Desbloqueo administrativo de cuenta por intentos fallidos';

    this.superAdminService.unlockUser(target.id, reason).subscribe({
      next: () => {
        this.unlockModalLoading.set(false);
        this.isUnlockModalOpen.set(false);
        this.notificationService.showSuccess(
          `La cuenta de ${target.name} ha sido desbloqueada exitosamente.`,
          'Cuenta desbloqueada'
        );

        const current = this.user();
        if (current) {
          const newAction: AdminAction = {
            id: 'act-' + Date.now(),
            type: 'UNLOCK_USER',
            viaCommand: false,
            actorId: this.authService.currentUser()?.id || null,
            actorEmail: this.authService.currentUser()?.email || 'admin@dokqet.com',
            targetId: current.id,
            targetEmail: current.email,
            reason: reason,
            createdAt: new Date().toISOString()
          };

          this.user.set({
            ...current,
            isAccountLocked: false,
            lockedUntil: null,
            adminActions: [newAction, ...(current.adminActions || [])]
          });
        }
      },
      error: (err) => {
        this.unlockModalLoading.set(false);
        const detail = err?.error?.detail || err?.error?.message || 'No fue posible desbloquear la cuenta.';
        this.unlockModalError.set(detail);
      }
    });
  }

  // ==================== Flujo: Otorgar / Revocar Super Admin ====================

  openSuperAdminRoleModal(grant: boolean): void {
    if (!grant && !this.canRevokeSuperAdmin()) return;
    this.isGrantingRole.set(grant);
    this.adminCurrentPassword.set('');
    this.roleReason.set('');
    this.roleModalError.set(null);
    this.isSuperAdminRoleModalOpen.set(true);
  }

  toggleAdminPasswordVisibility(): void {
    this.showAdminPassword.update(v => !v);
  }

  confirmSuperAdminRoleChange(): void {
    const password = this.adminCurrentPassword().trim();
    if (!password) {
      this.roleModalError.set('Debes confirmar tu contraseña actual para continuar.');
      return;
    }

    const reason = this.roleReason().trim() || undefined;
    this.roleModalLoading.set(true);
    this.roleModalError.set(null);

    const isGrant = this.isGrantingRole();
    const action$ = isGrant
      ? this.superAdminService.grantSuperAdmin(this.userId(), password, reason)
      : this.superAdminService.revokeSuperAdmin(this.userId(), password, reason);

    action$.subscribe({
      next: () => {
        this.roleModalLoading.set(false);
        this.isSuperAdminRoleModalOpen.set(false);
        const msg = isGrant
          ? 'Rol de administrador de la plataforma otorgado exitosamente.'
          : 'Rol de administrador de la plataforma revocado exitosamente.';
        this.notificationService.showSuccess(msg, 'Permisos actualizados');

        const current = this.user();
        if (current) {
          const actionType: AdminActionType = isGrant ? 'GRANT_PLATFORM_ADMIN' : 'REVOKE_PLATFORM_ADMIN';
          const newAction: AdminAction = {
            id: 'act-' + Date.now(),
            type: actionType,
            viaCommand: false,
            actorId: this.authService.currentUser()?.id || null,
            actorEmail: this.authService.currentUser()?.email || 'admin@dokqet.com',
            targetId: current.id,
            targetEmail: current.email,
            reason: reason || null,
            createdAt: new Date().toISOString()
          };

          this.user.set({
            ...current,
            isSuperAdmin: isGrant,
            adminActions: [newAction, ...(current.adminActions || [])]
          });
        }
      },
      error: (err) => {
        this.roleModalLoading.set(false);
        if (err.status === 403) {
          this.roleModalError.set('La contraseña actual ingresada es incorrecta.');
        } else if (err.status === 429) {
          const minutes = err.error?.retryMinutes || 10;
          this.roleModalError.set(`Has superado el límite de intentos (5 permitidos). Por favor espera ${minutes} minutos antes de intentar de nuevo.`);
        } else {
          const detail = err.error?.detail || err.error?.message || 'Error al actualizar el rol de administrador.';
          this.roleModalError.set(detail);
        }
      }
    });
  }

  // ==================== Flujo: Botones de Enlace de Soporte ====================

  sendPasswordResetLink(): void {
    const u = this.user();
    if (!u || !u.emailVerified || u.isSuspended || this.sendingResetLink()) return;

    this.sendingResetLink.set(true);
    this.superAdminService.sendPasswordResetSupportLink(u.id).subscribe({
      next: (res) => {
        this.sendingResetLink.set(false);
        this.notificationService.showSuccess(
          'Enlace para restablecer la contraseña generado y enviado exitosamente.',
          'Enlace de soporte enviado'
        );

        if (res.data) {
          this.user.update(curr => curr ? {
            ...curr,
            adminActions: [res.data, ...(curr.adminActions || [])]
          } : null);
        }
      },
      error: (err) => {
        this.sendingResetLink.set(false);
        if (err.status === 429) {
          const mins = err.error?.retryMinutes || 5;
          this.notificationService.showWarning(
            `Debes esperar ${mins} minutos antes de reenviar otro enlace de restablecimiento a esta cuenta.`,
            'Límite de solicitudes de soporte'
          );
        } else {
          const detail = err.error?.detail || err.error?.message || 'No fue posible enviar el enlace de recuperación.';
          this.notificationService.showError(detail, 'Error de soporte');
        }
      }
    });
  }

  resendVerificationLink(): void {
    const u = this.user();
    if (!u || u.emailVerified || u.isSuspended || this.resendingVerification()) return;

    this.resendingVerification.set(true);
    this.superAdminService.resendVerificationSupportLink(u.id).subscribe({
      next: (res) => {
        this.resendingVerification.set(false);
        this.notificationService.showSuccess(
          'Correo de activación reenviado exitosamente.',
          'Correo enviado'
        );

        if (res.data) {
          this.user.update(curr => curr ? {
            ...curr,
            adminActions: [res.data, ...(curr.adminActions || [])]
          } : null);
        }
      },
      error: (err) => {
        this.resendingVerification.set(false);
        if (err.status === 429) {
          const mins = err.error?.retryMinutes || 5;
          this.notificationService.showWarning(
            `Debes esperar ${mins} minutos antes de reenviar otro correo de activación a esta cuenta.`,
            'Límite de solicitudes de soporte'
          );
        } else {
          const detail = err.error?.detail || err.error?.message || 'No fue posible reenviar el correo de activación.';
          this.notificationService.showError(detail, 'Error de soporte');
        }
      }
    });
  }

  // ==================== Utilidades UI ====================

  getUserStatusBadge(): { variant: BadgeVariant; label: string } {
    const u = this.user();
    if (!u) return { variant: 'outline', label: 'DESCONOCIDO' };
    if (u.isSuspended) {
      return { variant: 'destructive', label: 'SUSPENDIDA' };
    }
    if (!u.emailVerified) {
      return { variant: 'warning', label: 'SIN VERIFICAR' };
    }
    return { variant: 'success', label: 'ACTIVA' };
  }

  getUserInitials(): string {
    const u = this.user();
    if (!u) return '?';
    const first = u.firstName ? u.firstName.charAt(0) : '';
    const last = u.lastName ? u.lastName.charAt(0) : '';
    return (first + last).toUpperCase() || (u.email ? u.email.charAt(0).toUpperCase() : '?');
  }

  getActionBadge(type: AdminActionType): { variant: BadgeVariant; label: string } {
    switch (type) {
      case 'SUSPEND_USER':
        return { variant: 'destructive', label: 'SUSPENSIÓN' };
      case 'REACTIVATE_USER':
        return { variant: 'success', label: 'REACTIVACIÓN' };
      case 'GRANT_PLATFORM_ADMIN':
        return { variant: 'brand', label: 'ASIGNÓ ADMIN' };
      case 'REVOKE_PLATFORM_ADMIN':
        return { variant: 'warning', label: 'REVOCÓ ADMIN' };
      case 'SEND_PASSWORD_RESET':
        return { variant: 'secondary', label: 'RESET CLAVE' };
      case 'RESEND_VERIFICATION':
        return { variant: 'secondary', label: 'REENVIÓ ACTIVACIÓN' };
      default:
        return { variant: 'outline', label: type };
    }
  }
}
