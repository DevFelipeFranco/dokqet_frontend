import { Component, computed, inject, input, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchedulerAdminService } from '../../../../core/services/scheduler-admin.service';
import {
  ScheduledTaskAuditDto,
  ScheduledTaskDto,
  ScheduledTaskRunDto,
  ScheduledTaskRunStatus
} from '../../../../core/models/scheduler-admin.model';
import {
  ButtonComponent,
  EmptyStateComponent,
  FormAlertComponent,
  ModalComponent,
  SkeletonTableComponent
} from '../../../../shared/components/ui';

@Component({
  selector: 'app-scheduler-history-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ButtonComponent,
    FormAlertComponent,
    EmptyStateComponent,
    SkeletonTableComponent
  ],
  templateUrl: './scheduler-history-modal.component.html'
})
export class SchedulerHistoryModalComponent {
  private readonly schedulerService = inject(SchedulerAdminService);

  isOpen = model<boolean>(false);
  task = input<ScheduledTaskDto | null>(null);

  readonly activeTab = signal<'RUNS' | 'AUDIT'>('RUNS');

  readonly runs = signal<ScheduledTaskRunDto[]>([]);
  readonly loadingRuns = signal<boolean>(false);
  readonly runsError = signal<string | null>(null);
  readonly runsPage = signal<number>(0);
  readonly runsTotalPages = signal<number>(0);
  readonly runsTotalElements = signal<number>(0);

  readonly audits = signal<ScheduledTaskAuditDto[]>([]);
  readonly loadingAudits = signal<boolean>(false);
  readonly auditsError = signal<string | null>(null);
  readonly auditsPage = signal<number>(0);
  readonly auditsTotalPages = signal<number>(0);
  readonly auditsTotalElements = signal<number>(0);

  readonly modalTitle = computed(() => {
    const current = this.task();
    return current ? `Historial y Auditoría · ${current.title}` : 'Historial de Tarea Programada';
  });

  openForTask(): void {
    this.activeTab.set('RUNS');
    this.runsPage.set(0);
    this.auditsPage.set(0);
    this.loadRuns(0);
    this.loadAudits(0);
  }

  selectTab(tab: 'RUNS' | 'AUDIT'): void {
    this.activeTab.set(tab);
  }

  loadRuns(page: number = 0): void {
    const current = this.task();
    if (!current) return;

    this.loadingRuns.set(true);
    this.runsError.set(null);
    this.schedulerService.getTaskRuns(current.taskKey, page, 8).subscribe({
      next: (res) => {
        this.runs.set(res.data?.content ?? []);
        this.runsPage.set(res.data?.number ?? page);
        this.runsTotalPages.set(res.data?.totalPages ?? 0);
        this.runsTotalElements.set(res.data?.totalElements ?? 0);
        this.loadingRuns.set(false);
      },
      error: (err) => {
        this.runsError.set(err?.error?.detail || 'No fue posible cargar el historial de ejecuciones.');
        this.loadingRuns.set(false);
      }
    });
  }

  loadAudits(page: number = 0): void {
    const current = this.task();
    if (!current) return;

    this.loadingAudits.set(true);
    this.auditsError.set(null);
    this.schedulerService.getTaskAuditLogs(current.taskKey, page, 8).subscribe({
      next: (res) => {
        this.audits.set(res.data?.content ?? []);
        this.auditsPage.set(res.data?.number ?? page);
        this.auditsTotalPages.set(res.data?.totalPages ?? 0);
        this.auditsTotalElements.set(res.data?.totalElements ?? 0);
        this.loadingAudits.set(false);
      },
      error: (err) => {
        this.auditsError.set(err?.error?.detail || 'No fue posible consultar la pista de auditoría.');
        this.loadingAudits.set(false);
      }
    });
  }

  formatDateTime(iso: string | null): string {
    if (!iso) return 'En curso';
    const tz = this.task()?.timezone || 'America/Bogota';
    try {
      return new Intl.DateTimeFormat('es-CO', {
        timeZone: tz,
        dateStyle: 'medium',
        timeStyle: 'medium'
      }).format(new Date(iso));
    } catch {
      return new Date(iso).toLocaleString('es-CO');
    }
  }

  formatDuration(ms: number | null): string {
    if (ms === null || ms === undefined) return '—';
    return `${ms.toLocaleString('es-CO')} ms`;
  }

  statusLabel(status: ScheduledTaskRunStatus): string {
    switch (status) {
      case 'COMPLETED':
        return 'Completado';
      case 'RUNNING':
        return 'Ejecutando';
      case 'STOPPED':
        return 'Detenido';
      case 'INTERRUPTED':
        return 'Interrumpido';
      case 'FAILED':
        return 'Con Error';
    }
  }

  auditActionLabel(action: string): string {
    const labels: Record<string, string> = {
      UPDATE_SCHEDULE: 'Horario / Metadatos Actualizados',
      PAUSE_TASK: 'Tarea Pausada',
      RESUME_TASK: 'Tarea Reactivada',
      RUN_NOW: 'Ejecución Inmediata Manual',
      STOP_RUN: 'Detención Manual de Corrida',
      FORCE_UNLOCK: 'Liberación de Bloqueo Huérfano',
      GLOBAL_PAUSE: 'Pausa Maestra Global',
      GLOBAL_RESUME: 'Reanudación Global',
      UPDATE_SERVER_TIMEZONE: 'Cambio de Zona Horaria Servidor'
    };
    return labels[action] || action;
  }

  close(): void {
    this.isOpen.set(false);
  }
}
