import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  AdminMember,
  AdminOrganizationSummary,
  AdminPlatformOverview,
  AdminUserOrganizationsGroupDto,
  OrganizationsViewMode
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
    RouterLink,
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
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './organizations-admin.component.html'
})
export class OrganizationsAdminComponent implements OnInit {
  private readonly router = inject(Router);
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

  // Modo de visualización: Agrupado por Usuario vs Lista General Plana (HU-25)
  readonly viewMode = signal<OrganizationsViewMode>('GROUPED');
  readonly userGroups = signal<AdminUserOrganizationsGroupDto[]>([]);
  readonly expandedUserIds = signal<Set<string>>(new Set<string>());

  readonly allUsersExpanded = computed(() => {
    const groups = this.userGroups();
    return groups.length > 0 && groups.every((g) => this.expandedUserIds().has(g.userId));
  });

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
          const list = res.data.content || [];
          this.organizations.set(list);
          this.userGroups.set(this.buildUserGroups(list));
          this.totalElements.set(res.data.totalElements || 0);
          this.totalPages.set(res.data.totalPages || 0);
        } else {
          this.organizations.set([]);
          this.userGroups.set([]);
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

  /**
   * Determina si la fila de un usuario está expandida en la vista jerárquica (HU-25)
   */
  isUserExpanded(userId: string): boolean {
    return this.expandedUserIds().has(userId);
  }

  /**
   * Conmuta la expansión de un usuario específico
   */
  toggleUserExpand(userId: string): void {
    this.expandedUserIds.update((set) => {
      const copy = new Set(set);
      if (copy.has(userId)) {
        copy.delete(userId);
      } else {
        copy.add(userId);
      }
      return copy;
    });
  }

  /**
   * Navega a la pantalla completa de la organización (HU-26)
   */
  openOrganizationDetail(orgId: string): void {
    if (orgId) {
      this.router.navigate(['/admin/organizaciones', orgId]);
    }
  }

  /**
   * Navega a la ficha de usuario titular
   */
  openUserDetail(userId: string): void {
    if (userId && !userId.startsWith('email:') && !userId.startsWith('name:')) {
      this.router.navigate(['/admin/usuarios', userId]);
    }
  }

  /**
   * Conmuta la expansión masiva de todos los usuarios
   */
  toggleAllUsers(): void {
    const shouldExpand = !this.allUsersExpanded();
    this.expandedUserIds.update((set) => {
      const copy = new Set(set);
      for (const group of this.userGroups()) {
        if (shouldExpand) {
          copy.add(group.userId);
        } else {
          copy.delete(group.userId);
        }
      }
      return copy;
    });
  }

  /**
   * Obtiene iniciales a partir del nombre completo
   */
  getUserInitials(name: string): string {
    if (!name) return 'US';
    const clean = name.replace(/^Espacio Personal\s*-\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }

  /**
   * Agrupa las organizaciones por usuario propietario/titular
   */
  buildUserGroups(orgList: AdminOrganizationSummary[]): AdminUserOrganizationsGroupDto[] {
    const map = new Map<string, AdminUserOrganizationsGroupDto>();

    for (const org of orgList) {
      // 1. Clave primaria unificada: ownerId, personalOwnerId o createdById
      let userKey = org.ownerId || org.personalOwnerId || org.createdById;

      // 2. Fallbacks de agrupación si el backend no tuviera id directo
      if (!userKey && org.ownerEmail) {
        userKey = 'email:' + org.ownerEmail.trim().toLowerCase();
      }

      if (!userKey && org.ownerName) {
        userKey = 'name:' + org.ownerName.trim().toLowerCase();
      }

      let userName = org.ownerName;
      let userEmail = org.ownerEmail;

      if (org.isPersonal) {
        if (!userName) {
          const stripped = org.name.replace(/^Espacio Personal\s*-\s*/i, '').trim();
          userName = stripped.toLowerCase() === 'mi espacio de trabajo' || !stripped ? 'Usuario Titular' : stripped;
        }
        if (!userKey) {
          const stripped = org.name.replace(/^Espacio Personal\s*-\s*/i, '').trim();
          userKey = stripped && stripped.toLowerCase() !== 'mi espacio de trabajo'
            ? 'name:' + stripped.toLowerCase()
            : org.id;
        }
        userEmail = userEmail || `${userName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@dokqet.com`;
      } else {
        userKey = userKey || org.id;
        userName = userName || org.name;
        userEmail = userEmail || `${userName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@dokqet.com`;
      }

      let group = map.get(userKey);
      if (!group) {
        group = {
          userId: userKey,
          userName: userName,
          userEmail: userEmail,
          userStatus: 'ACTIVE',
          personalWorkspace: null,
          organizations: [],
          totalWorkspacesCount: 0,
          totalProcessesCount: 0,
          totalMembersCount: 0,
          createdAt: org.createdAt
        };
        map.set(userKey, group);
      } else {
        // Enriquecer el nombre de la persona si el existente era preliminar o genérico
        const isGenericName =
          !group.userName ||
          group.userName === 'Usuario Titular' ||
          group.userName.toLowerCase() === 'mi espacio de trabajo' ||
          group.userName.startsWith('Usuario ');
        if (isGenericName && userName && userName !== 'Usuario Titular') {
          group.userName = userName;
        }
        if (org.ownerEmail && (!group.userEmail || group.userEmail.endsWith('@dokqet.com'))) {
          group.userEmail = org.ownerEmail;
        }
      }

      if (org.isPersonal) {
        group.personalWorkspace = org;
        if (org.ownerName) {
          group.userName = org.ownerName;
        }
      } else {
        group.organizations.push(org);
        if (org.ownerName && (!group.userName || group.userName === 'Usuario Titular' || group.userName.toLowerCase() === 'mi espacio de trabajo')) {
          group.userName = org.ownerName;
        }
      }

      group.totalWorkspacesCount = (group.personalWorkspace ? 1 : 0) + group.organizations.length;
      group.totalProcessesCount =
        (group.personalWorkspace?.processesCount ?? 0) +
        group.organizations.reduce((acc, o) => acc + (o.processesCount || 0), 0);
      group.totalMembersCount =
        (group.personalWorkspace?.membersCount ?? 0) +
        group.organizations.reduce((acc, o) => acc + (o.membersCount || 0), 0);
    }

    return Array.from(map.values());
  }
}
