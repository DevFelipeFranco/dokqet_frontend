import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  AdminMember,
  AdminOrganizationSummary,
  AdminPlatformOverview
} from '../../../core/models/super-admin.model';
import {
  BadgeComponent,
  BadgeVariant,
  BreadcrumbsComponent,
  BreadcrumbItem,
  ButtonComponent,
  EmptyStateComponent,
  FormAlertComponent,
  ModalComponent,
  SkeletonCardGridComponent,
  SkeletonComponent,
  SkeletonTableComponent,
  StatCardComponent
} from '../../../shared/components/ui';

@Component({
  selector: 'app-organizations-admin',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    BreadcrumbsComponent,
    ButtonComponent,
    BadgeComponent,
    StatCardComponent,
    SkeletonCardGridComponent,
    SkeletonTableComponent,
    SkeletonComponent,
    EmptyStateComponent,
    FormAlertComponent,
    ModalComponent
  ],
  templateUrl: './organizations-admin.component.html'
})
export class OrganizationsAdminComponent implements OnInit {
  private readonly superAdminService = inject(SuperAdminService);
  private readonly notificationService = inject(NotificationService);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', url: '/panel' },
    { label: 'Super Admin' },
    { label: 'Organizaciones' }
  ];

  // Métricas consolidadas (Overview)
  readonly overview = signal<AdminPlatformOverview | null>(null);
  readonly loadingOverview = signal<boolean>(true);
  readonly overviewError = signal<string | null>(null);

  // Tabla interactiva de organizaciones
  readonly organizations = signal<AdminOrganizationSummary[]>([]);
  readonly loadingOrganizations = signal<boolean>(true);
  readonly organizationsError = signal<string | null>(null);
  readonly currentPage = signal<number>(0);
  readonly pageSize = signal<number>(10);
  readonly totalElements = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly searchQuery = signal<string>('');

  // Inspección de miembros de una firma
  readonly selectedOrg = signal<AdminOrganizationSummary | null>(null);
  readonly isMembersModalOpen = signal<boolean>(false);
  readonly loadingMembers = signal<boolean>(false);
  readonly members = signal<AdminMember[]>([]);
  readonly membersError = signal<string | null>(null);

  private searchDebounceTimer: any = null;

  ngOnInit(): void {
    this.loadOverview();
    this.loadOrganizations();
  }

  /**
   * Carga métricas globales de la plataforma
   */
  loadOverview(): void {
    this.loadingOverview.set(true);
    this.overviewError.set(null);

    this.superAdminService.getPlatformOverview().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.overview.set(res.data);
        } else {
          this.overviewError.set('No se pudieron obtener las métricas de la plataforma.');
        }
        this.loadingOverview.set(false);
      },
      error: (err) => {
        console.error('[OrganizationsAdminComponent] Error al cargar overview:', err);
        this.overviewError.set('Error al conectar con el servicio de métricas.');
        this.loadingOverview.set(false);
      }
    });
  }

  /**
   * Carga el listado paginado de organizaciones
   */
  loadOrganizations(): void {
    this.loadingOrganizations.set(true);
    this.organizationsError.set(null);

    const page = this.currentPage();
    const size = this.pageSize();
    const query = this.searchQuery();

    this.superAdminService.getOrganizations(page, size, query).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.organizations.set(res.data.content || []);
          this.totalElements.set(res.data.totalElements || 0);
          this.totalPages.set(res.data.totalPages || 0);
        } else {
          this.organizations.set([]);
          this.organizationsError.set('Respuesta inesperada al consultar organizaciones.');
        }
        this.loadingOrganizations.set(false);
      },
      error: (err) => {
        console.error('[OrganizationsAdminComponent] Error al cargar organizaciones:', err);
        this.organizationsError.set('No se pudo cargar el listado de organizaciones.');
        this.loadingOrganizations.set(false);
      }
    });
  }

  /**
   * Manejador de búsqueda con debounce de 350ms
   */
  onSearchChange(term: string): void {
    this.searchQuery.set(term);
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage.set(0);
      this.loadOrganizations();
    }, 350);
  }

  /**
   * Limpia el filtro de búsqueda
   */
  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(0);
    this.loadOrganizations();
  }

  /**
   * Navega a una página específica
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadOrganizations();
    }
  }

  /**
   * Abre modal para inspeccionar la conformación de la organización
   */
  openMembersModal(org: AdminOrganizationSummary): void {
    this.selectedOrg.set(org);
    this.isMembersModalOpen.set(true);
    this.loadingMembers.set(true);
    this.membersError.set(null);
    this.members.set([]);

    this.superAdminService.getOrganizationMembers(org.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.members.set(res.data);
        } else {
          this.members.set([]);
        }
        this.loadingMembers.set(false);
      },
      error: (err) => {
        console.error('[OrganizationsAdminComponent] Error al consultar miembros:', err);
        this.membersError.set('No se pudo obtener la lista de integrantes de esta organización.');
        this.loadingMembers.set(false);
      }
    });
  }

  /**
   * Cierra modal de miembros
   */
  closeMembersModal(): void {
    this.isMembersModalOpen.set(false);
    this.selectedOrg.set(null);
    this.members.set([]);
  }

  /**
   * Refresca todos los datos de la vista
   */
  refreshAll(): void {
    this.loadOverview();
    this.loadOrganizations();
    this.notificationService.showInfo('Datos de observabilidad actualizados');
  }

  /**
   * Formateador de NIT con DV
   */
  formatNit(org: AdminOrganizationSummary): string {
    if (!org.nit) return '—';
    return org.nitDv ? `${org.nit}-${org.nitDv}` : org.nit;
  }

  /**
   * Formateador de rol en la firma para la insignia
   */
  getRoleLabel(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Administrador';
      case 'LAWYER':
        return 'Litigante';
      default:
        return role;
    }
  }

  /**
   * Variante de badge según rol
   */
  getRoleVariant(role: string): BadgeVariant {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'default';
      case 'ADMIN':
        return 'brand';
      case 'LAWYER':
        return 'outline';
      default:
        return 'secondary';
    }
  }
}
