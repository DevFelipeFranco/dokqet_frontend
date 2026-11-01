import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import {
  AdminAction,
  AdminActionType
} from '../../../core/models/super-admin.model';
import { DokqetDatePipe } from '../../../shared/pipes/dokqet-date.pipe';
import {
  BadgeComponent,
  BadgeVariant,
  BreadcrumbsComponent,
  BreadcrumbItem,
  EmptyStateComponent,
  FormAlertComponent,
  SkeletonTableComponent
} from '../../../shared/components/ui';

@Component({
  selector: 'app-admin-actions',
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
    SkeletonTableComponent
  ],
  templateUrl: './admin-actions.component.html'
})
export class AdminActionsComponent implements OnInit {
  private readonly superAdminService = inject(SuperAdminService);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', url: '/panel' },
    { label: 'Super Admin' },
    { label: 'Registro de acciones' }
  ];

  // Filtro por tipo de acción (RN-HU21-06)
  readonly selectedType = signal<AdminActionType | 'ALL'>('ALL');
  readonly currentPage = signal<number>(0);
  readonly pageSize = signal<number>(50);
  readonly totalElements = signal<number>(0);
  readonly totalPages = signal<number>(0);

  // Estados
  readonly actions = signal<AdminAction[]>([]);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly actionTypeOptions: { value: AdminActionType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Todas las acciones' },
    { value: 'SUSPEND_USER', label: 'Suspensión de cuenta' },
    { value: 'REACTIVATE_USER', label: 'Reactivación de cuenta' },
    { value: 'GRANT_PLATFORM_ADMIN', label: 'Asignación de Super Admin' },
    { value: 'REVOKE_PLATFORM_ADMIN', label: 'Revocación de Super Admin' },
    { value: 'SEND_PASSWORD_RESET', label: 'Restablecimiento de clave' },
    { value: 'RESEND_VERIFICATION', label: 'Reenvío de activación' }
  ];

  ngOnInit(): void {
    this.loadActions();
  }

  loadActions(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const typeFilter = this.selectedType() === 'ALL' ? undefined : (this.selectedType() as AdminActionType);
    const page = this.currentPage();
    const size = this.pageSize();

    this.superAdminService.getAdminActions(typeFilter, page, size).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.actions.set(res.data.content || []);
          this.totalElements.set(res.data.totalElements || 0);
          this.totalPages.set(res.data.totalPages || 0);
        } else {
          this.errorMessage.set('No se pudo cargar el registro de auditoría.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err?.error?.detail || err?.error?.message || 'Error al consultar el registro de auditoría.';
        this.errorMessage.set(detail);
      }
    });
  }

  setTypeFilter(type: AdminActionType | 'ALL'): void {
    if (this.selectedType() !== type) {
      this.selectedType.set(type);
      this.currentPage.set(0);
      this.loadActions();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadActions();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadActions();
    }
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
