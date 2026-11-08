import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { AdminPlatformOverview } from '../../../core/models/super-admin.model';
import {
  BreadcrumbsComponent,
  ButtonComponent,
  FormAlertComponent,
  StatCardComponent,
  SkeletonCardGridComponent
} from '../../../shared/components/ui';

@Component({
  selector: 'app-overview-admin',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    ButtonComponent,
    FormAlertComponent,
    StatCardComponent,
    SkeletonCardGridComponent
  ],
  templateUrl: './overview-admin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewAdminComponent implements OnInit {
  private readonly superAdminService = inject(SuperAdminService);

  readonly breadcrumbs = [
    { label: 'Super Admin', url: '/admin/organizaciones' },
    { label: 'Resumen Ejecutivo' }
  ];

  readonly overview = signal<AdminPlatformOverview | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.loading.set(true);
    this.error.set(null);

    this.superAdminService.getPlatformOverview().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res?.data) {
          this.overview.set(res.data);
        } else {
          this.error.set('No se obtuvieron datos en la respuesta del servidor.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail || err?.message || 'Error al consultar el resumen ejecutivo de la plataforma.');
      }
    });
  }

  formatDate(dateIso?: string | null): string {
    if (!dateIso) return 'Sin fecha';
    const date = new Date(dateIso);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatDuration(startIso?: string | null, endIso?: string | null): string {
    if (!startIso || !endIso) return '—';
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return '—';

    const diffSeconds = Math.floor((end - start) / 1000);
    if (diffSeconds < 60) {
      return `${diffSeconds}s`;
    }
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }
}
