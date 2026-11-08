import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SuperAdminService } from '../../../../core/services/super-admin.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AdminMember,
  AdminOrganizationDetail
} from '../../../../core/models/super-admin.model';
import { DokqetDatePipe } from '../../../../shared/pipes/dokqet-date.pipe';
import {
  BadgeComponent,
  BadgeVariant,
  BreadcrumbsComponent,
  BreadcrumbItem,
  EmptyStateComponent,
  FormAlertComponent,
  SkeletonComponent,
  StatCardComponent
} from '../../../../shared/components/ui';

@Component({
  selector: 'app-admin-organization-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DokqetDatePipe,
    BreadcrumbsComponent,
    BadgeComponent,
    EmptyStateComponent,
    FormAlertComponent,
    SkeletonComponent,
    StatCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-organization-detail.component.html'
})
export class AdminOrganizationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly superAdminService = inject(SuperAdminService);
  private readonly notificationService = inject(NotificationService);

  readonly organizationId = signal<string>('');
  readonly organization = signal<AdminOrganizationDetail | null>(null);
  readonly members = signal<AdminMember[]>([]);
  readonly loading = signal<boolean>(true);
  readonly loadingMembers = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly membersErrorMessage = signal<string | null>(null);

  // Pestañas activas: 'members' | 'corporate' | 'processes'
  readonly activeTab = signal<'members' | 'corporate' | 'processes'>('members');

  // Control de copia en portapapeles
  readonly copiedField = signal<string | null>(null);

  // Breadcrumbs dinámicos
  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Inicio', url: '/panel' },
    { label: 'Super Admin' },
    { label: 'Observabilidad de Organizaciones', url: '/admin/organizaciones' },
    { label: this.organization()?.name || 'Ficha de Organización' }
  ]);

  // Si la organización es Espacio Personal
  readonly isPersonal = computed<boolean>(() => {
    return this.organization()?.isPersonal ?? false;
  });

  // Datos consolidados del propietario / titular
  readonly ownerId = computed<string | null>(() => {
    const org = this.organization();
    return org?.ownerId || org?.personalOwnerId || org?.createdById || null;
  });

  readonly ownerName = computed<string | null>(() => {
    const org = this.organization();
    return org?.ownerName || (org?.isPersonal ? org.name.replace(/^Espacio Personal\s*-\s*/i, '') : null);
  });

  readonly ownerEmail = computed<string | null>(() => {
    return this.organization()?.ownerEmail || null;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Identificador de organización no proporcionado en la ruta.');
      this.loading.set(false);
      return;
    }
    this.organizationId.set(id);
    this.loadOrganizationDetail(id);
    this.loadOrganizationMembers(id);
  }

  /**
   * Carga el detalle administrativo de la organización
   */
  loadOrganizationDetail(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.superAdminService.getOrganizationDetail(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.organization.set(res.data);
        } else {
          this.errorMessage.set('No se encontró información para la organización indicada.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[AdminOrganizationDetailComponent] Error al cargar detalle:', err);
        this.errorMessage.set('Error al conectar con el servidor para consultar la organización.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Carga los miembros e integrantes vinculados
   */
  loadOrganizationMembers(id: string): void {
    this.loadingMembers.set(true);
    this.membersErrorMessage.set(null);

    this.superAdminService.getOrganizationMembers(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.members.set(res.data);
        } else {
          this.members.set([]);
        }
        this.loadingMembers.set(false);
      },
      error: (err) => {
        console.error('[AdminOrganizationDetailComponent] Error al cargar miembros:', err);
        this.membersErrorMessage.set('No se pudo obtener la conformación del equipo de esta organización.');
        this.loadingMembers.set(false);
      }
    });
  }

  /**
   * Refresca todos los datos de la ficha
   */
  refreshData(): void {
    const id = this.organizationId();
    if (id) {
      this.loadOrganizationDetail(id);
      this.loadOrganizationMembers(id);
      this.notificationService.showInfo('Datos de la organización actualizados');
    }
  }

  /**
   * Copia texto al portapapeles con feedback temporal
   */
  copyToClipboard(text: string, fieldName: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copiedField.set(fieldName);
      this.notificationService.showInfo(`Copiado al portapapeles: ${text}`);
      setTimeout(() => {
        if (this.copiedField() === fieldName) {
          this.copiedField.set(null);
        }
      }, 2000);
    }).catch((err) => {
      console.error('[AdminOrganizationDetailComponent] Error al copiar:', err);
    });
  }

  /**
   * Formateador de NIT con DV
   */
  formatNit(org: AdminOrganizationDetail | null): string {
    if (!org || !org.nit) return '—';
    return org.nitDv ? `${org.nit}-${org.nitDv}` : org.nit;
  }

  /**
   * Obtiene iniciales a partir del nombre
   */
  getUserInitials(name?: string | null): string {
    if (!name) return 'OR';
    const clean = name.replace(/^Espacio Personal\s*-\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }

  /**
   * Variante de insignia según rol de membresía
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
   * Etiqueta humana para el rol de membresía
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
   * Variante de badge según estado de membresía
   */
  getStatusBadgeVariant(status: string): BadgeVariant {
    return status === 'ACTIVE' ? 'brand' : 'destructive';
  }
}
