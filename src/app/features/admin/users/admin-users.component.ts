import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  AdminUserStatusFilter,
  AdminUserSummary
} from '../../../core/models/super-admin.model';
import { DokqetDatePipe } from '../../../shared/pipes/dokqet-date.pipe';
import {
  BadgeComponent,
  BadgeVariant,
  BreadcrumbsComponent,
  BreadcrumbItem,
  ButtonComponent,
  EmptyStateComponent,
  FormAlertComponent,
  SkeletonTableComponent
} from '../../../shared/components/ui';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DokqetDatePipe,
    BreadcrumbsComponent,
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    FormAlertComponent,
    SkeletonTableComponent
  ],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  private readonly superAdminService = inject(SuperAdminService);
  private readonly notificationService = inject(NotificationService);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', url: '/panel' },
    { label: 'Super Admin' },
    { label: 'Usuarios' }
  ];

  // Filtros y Paginación (RN-HU21-01)
  readonly searchQuery = signal<string>('');
  readonly selectedStatus = signal<AdminUserStatusFilter>('ALL');
  readonly currentPage = signal<number>(0);
  readonly pageSize = signal<number>(50);
  readonly totalElements = signal<number>(0);
  readonly totalPages = signal<number>(0);

  // Estados de carga y datos
  readonly users = signal<AdminUserSummary[]>([]);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  private searchDebounceTimer: any = null;

  readonly statusOptions: { value: AdminUserStatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Todas las cuentas' },
    { value: 'ACTIVE', label: 'Activas' },
    { value: 'UNVERIFIED', label: 'Sin verificar' },
    { value: 'SUSPENDED', label: 'Suspendidas' }
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Carga la lista de usuarios según los filtros actuales y paginación
   */
  loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const query = this.searchQuery().trim();
    const status = this.selectedStatus();
    const page = this.currentPage();
    const size = this.pageSize();

    this.superAdminService.searchUsers(query, status, page, size).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.users.set(res.data.content || []);
          this.totalElements.set(res.data.totalElements || 0);
          this.totalPages.set(res.data.totalPages || 0);
        } else {
          this.errorMessage.set('No se pudo cargar la lista de usuarios.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err?.error?.detail || err?.error?.message || 'Error de conexión al consultar usuarios.';
        this.errorMessage.set(detail);
      }
    });
  }

  /**
   * Controla la búsqueda reactiva con debounce de 300ms
   */
  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage.set(0);
      this.loadUsers();
    }, 300);
  }

  /**
   * Limpia el buscador y recarga
   */
  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(0);
    this.loadUsers();
  }

  /**
   * Cambia la pestaña de estado y resetea la página a 0
   */
  setStatusFilter(status: AdminUserStatusFilter): void {
    if (this.selectedStatus() !== status) {
      this.selectedStatus.set(status);
      this.currentPage.set(0);
      this.loadUsers();
    }
  }

  /**
   * Paginación: Página anterior
   */
  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadUsers();
    }
  }

  /**
   * Paginación: Página siguiente
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadUsers();
    }
  }

  /**
   * Determina la variante y etiqueta semántica del estado del usuario
   */
  getUserStatusBadge(user: AdminUserSummary): { variant: BadgeVariant; label: string } {
    if (user.isSuspended) {
      return { variant: 'destructive', label: 'SUSPENDIDA' };
    }
    if (!user.emailVerified) {
      return { variant: 'warning', label: 'SIN VERIFICAR' };
    }
    return { variant: 'success', label: 'ACTIVA' };
  }

  /**
   * Obtiene las iniciales del usuario para el avatar
   */
  getUserInitials(user: AdminUserSummary): string {
    const first = user.firstName ? user.firstName.charAt(0) : '';
    const last = user.lastName ? user.lastName.charAt(0) : '';
    const initials = (first + last).toUpperCase();
    return initials || (user.email ? user.email.charAt(0).toUpperCase() : '?');
  }
}
