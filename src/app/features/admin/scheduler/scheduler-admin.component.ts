import { Component, DestroyRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SchedulerAdminService } from '../../../core/services/scheduler-admin.service';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ScheduledTaskDto,
  SchedulerFilterTab,
  SchedulerOverviewKpiDto,
  TimezoneOptionDto
} from '../../../core/models/scheduler-admin.model';
import { AdminPlatformOverview } from '../../../core/models/super-admin.model';
import {
  BreadcrumbItem,
  BreadcrumbsComponent,
  ButtonComponent,
  EmptyStateComponent,
  FormAlertComponent,
  ModalComponent,
  SkeletonCardGridComponent,
  SkeletonComponent
} from '../../../shared/components/ui';
import { SchedulerTaskCardComponent } from './components/scheduler-task-card.component';
import { SchedulerHistoryModalComponent } from './components/scheduler-history-modal.component';
import { SchedulerTaskConfigModalComponent } from './components/scheduler-task-config-modal.component';

@Component({
  selector: 'app-scheduler-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    BreadcrumbsComponent,
    ButtonComponent,
    EmptyStateComponent,
    FormAlertComponent,
    ModalComponent,
    SkeletonCardGridComponent,
    SkeletonComponent,
    SchedulerTaskCardComponent,
    SchedulerHistoryModalComponent,
    SchedulerTaskConfigModalComponent
  ],
  templateUrl: './scheduler-admin.component.html'
})
export class SchedulerAdminComponent implements OnInit {
  private readonly schedulerService = inject(SchedulerAdminService);
  private readonly superAdminService = inject(SuperAdminService, { optional: true });
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(SchedulerHistoryModalComponent) historyModal?: SchedulerHistoryModalComponent;

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Super Admin', url: '/admin/organizaciones' },
    { label: 'Cron & Scheduler' }
  ];

  readonly isLoading = signal<boolean>(true);
  readonly isRefreshing = signal<boolean>(false);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly platformOverview = signal<AdminPlatformOverview | null>(null);
  readonly overview = signal<SchedulerOverviewKpiDto | null>(null);
  readonly tasks = signal<ScheduledTaskDto[]>([]);
  readonly availableTimezones = signal<TimezoneOptionDto[]>([]);

  readonly selectedFilter = signal<SchedulerFilterTab>('ALL');
  readonly searchQuery = signal<string>('');
  readonly viewMode = signal<'TABLE' | 'CARDS'>('TABLE');

  // Modal de Configuración Aislada de Tarea
  readonly configModalOpen = signal<boolean>(false);
  readonly selectedConfigTask = signal<ScheduledTaskDto | null>(null);

  // Modal de Pausa Maestra Global
  readonly pauseModalOpen = signal<boolean>(false);
  readonly pauseReasonInput = signal<string>('Ventana de mantenimiento programada en servicios externos.');
  readonly processingGlobalPause = signal<boolean>(false);

  // Modal de Configuración de Zona Horaria del Servidor
  readonly timezoneModalOpen = signal<boolean>(false);
  readonly serverTimezoneInput = signal<string>('America/Bogota');
  readonly savingServerTimezone = signal<boolean>(false);

  // Modal de Historial y Auditoría
  readonly historyModalOpen = signal<boolean>(false);
  readonly selectedHistoryTask = signal<ScheduledTaskDto | null>(null);

  private pollingTimerId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.stopPolling());
  }

  ngOnInit(): void {
    this.loadDashboard(true);
  }

  readonly countAll = computed(() => this.tasks().length);
  readonly countActive = computed(() => this.tasks().filter((t) => t.enabled).length);
  readonly countRunning = computed(() => this.tasks().filter((t) => t.lastStatus === 'RUNNING').length);
  readonly countSuccess = computed(() => this.tasks().filter((t) => t.lastStatus === 'COMPLETED').length);
  readonly countError = computed(
    () => this.tasks().filter((t) => t.lastStatus === 'FAILED' || t.lastStatus === 'INTERRUPTED').length
  );

  readonly filteredTasks = computed(() => {
    const tab = this.selectedFilter();
    const query = this.searchQuery().trim().toLowerCase();

    return this.tasks().filter((task) => {
      const matchesTab =
        tab === 'ALL' ||
        (tab === 'ACTIVE' && task.enabled) ||
        (tab === 'RUNNING' && task.lastStatus === 'RUNNING') ||
        (tab === 'SUCCESS' && task.lastStatus === 'COMPLETED') ||
        (tab === 'ERROR' && (task.lastStatus === 'FAILED' || task.lastStatus === 'INTERRUPTED'));

      if (!matchesTab) return false;
      if (!query) return true;

      return (
        task.title.toLowerCase().includes(query) ||
        task.taskKey.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)
      );
    });
  });

  loadDashboard(initial: boolean = false): void {
    if (initial) {
      this.isLoading.set(true);
    } else {
      this.isRefreshing.set(true);
    }
    this.loadError.set(null);

    if (this.superAdminService) {
      this.superAdminService.getPlatformOverview().subscribe({
        next: (res) => {
          if (res?.data) {
            this.platformOverview.set(res.data);
          }
        },
        error: () => {}
      });
    }

    this.schedulerService.getDashboard().subscribe({
      next: (res) => {
        if (res?.data) {
          this.overview.set(res.data.overview);
          this.tasks.set(res.data.tasks ?? []);
          this.availableTimezones.set(res.data.availableTimezones ?? []);
          this.serverTimezoneInput.set(res.data.overview.serverTimezone || 'America/Bogota');
          this.evaluatePollingNeed(res.data.tasks ?? []);
        }
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      },
      error: (err) => {
        this.loadError.set(
          err?.error?.detail || 'No fue posible consultar el estado del planificador de tareas.'
        );
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      }
    });
  }

  selectFilter(tab: SchedulerFilterTab): void {
    this.selectedFilter.set(tab);
  }

  clearFilters(): void {
    this.selectedFilter.set('ALL');
    this.searchQuery.set('');
  }

  onTaskMutated(updatedTask: ScheduledTaskDto): void {
    this.tasks.update((list) =>
      list.map((item) => (item.taskKey === updatedTask.taskKey ? updatedTask : item))
    );
    this.loadDashboard(false);
  }

  openConfigModal(task: ScheduledTaskDto): void {
    this.selectedConfigTask.set(task);
    this.configModalOpen.set(true);
  }

  toggleTaskActive(task: ScheduledTaskDto): void {
    const nextEnabled = !task.enabled;
    this.schedulerService.toggleTaskStatus(task.taskKey, nextEnabled).subscribe({
      next: (res) => {
        if (res?.data) {
          this.onTaskMutated(res.data);
        }
        this.notificationService.showInfo(
          nextEnabled ? `Tarea «${task.title}» activada.` : `Tarea «${task.title}» pausada.`
        );
      },
      error: (err) => {
        this.actionError.set(err?.error?.detail || 'No se pudo cambiar el estado de la tarea.');
      }
    });
  }

  formatFriendlyInstant(iso: string | null, fallback: string = '—'): string {
    if (!iso) return fallback;
    try {
      const target = new Date(iso);
      if (isNaN(target.getTime())) return fallback;
      const now = new Date();
      const tz = 'America/Bogota';

      const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
      const timeFmt = new Intl.DateTimeFormat('es-CO', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const targetDay = dateFmt.format(target);
      const todayDay = dateFmt.format(now);
      const tomorrowDay = dateFmt.format(new Date(now.getTime() + 86_400_000));
      const yesterdayDay = dateFmt.format(new Date(now.getTime() - 86_400_000));
      const timePart = timeFmt.format(target);

      if (targetDay === todayDay) return `Hoy ${timePart}`;
      if (targetDay === tomorrowDay) return `Mañana ${timePart}`;
      if (targetDay === yesterdayDay) return `Ayer ${timePart}`;

      const fullFmt = new Intl.DateTimeFormat('es-CO', {
        timeZone: tz,
        day: '2-digit',
        month: 'short'
      });
      return `${fullFmt.format(target)} ${timePart}`;
    } catch {
      return fallback;
    }
  }

  formatDuration(ms: number | null): string {
    if (ms === null || ms === undefined) return '—';
    return `${ms.toLocaleString('es-CO')} ms`;
  }

  formatFrequencySummary(task: ScheduledTaskDto): string {
    const time = task.executionTime ? task.executionTime.substring(0, 5) : '03:00';
    switch (task.frequencyType) {
      case 'DAILY':
        return `Diaria · ${time}`;
      case 'TWICE_DAILY':
        return `2x día · ${time}`;
      case 'INTERVAL_MINUTES':
        return `Cada ${task.intervalMinutes || 15} min`;
      case 'HOURLY':
        return `Cada hora`;
      case 'WEEKDAYS':
        return `Lun a Vie · ${time}`;
      case 'WEEKLY':
        return `Semanal (${task.daysOfWeek || 'Lun'})`;
      case 'MONTHLY':
        return `Mensual (día ${task.dayOfMonth || 1})`;
      case 'ONCE_AT_DATE':
        return `Única (${task.scheduledDate || '—'})`;
      case 'CUSTOM_CRON':
        return `Personalizada`;
      default:
        return task.frequencyType;
    }
  }

  onRunNow(taskKeyOrTask: string | ScheduledTaskDto): void {
    const taskKey = typeof taskKeyOrTask === 'string' ? taskKeyOrTask : taskKeyOrTask.taskKey;
    this.actionError.set(null);

    this.schedulerService.runTaskNow(taskKey).subscribe({
      next: (res) => {
        this.tasks.update((list) =>
          list.map((item) =>
            item.taskKey === taskKey
              ? { ...item, lastStatus: 'RUNNING', lastRunId: res?.data?.runId ?? item.lastRunId }
              : item
          )
        );
        this.notificationService.showSuccess(
          res?.message || `Ejecución inmediata iniciada para ${taskKey}.`
        );
        this.startPolling();
      },
      error: (err) => {
        const detail =
          err?.error?.detail ||
          err?.error?.message ||
          'No se pudo iniciar la ejecución inmediata de la tarea.';
        this.actionError.set(detail);
        this.notificationService.showWarning(detail);
        if (err?.status === 409) {
          this.loadDashboard(false);
        }
      }
    });
  }

  onStopTask(task: ScheduledTaskDto): void {
    this.actionError.set(null);
    this.schedulerService.stopTask(task.taskKey).subscribe({
      next: (res) => {
        this.notificationService.showInfo(res?.message || `Tarea «${task.title}» detenida.`);
        this.loadDashboard(false);
      },
      error: (err) => {
        const detail = err?.error?.detail || 'No se pudo detener la ejecución activa.';
        this.actionError.set(detail);
      }
    });
  }

  onUnlockTask(task: ScheduledTaskDto): void {
    this.actionError.set(null);
    this.schedulerService.unlockStaleTask(task.taskKey).subscribe({
      next: (res) => {
        this.notificationService.showSuccess(res?.message || 'Bloqueo huérfano liberado.');
        this.loadDashboard(false);
      },
      error: (err) => {
        this.actionError.set(err?.error?.detail || 'No fue posible liberar el bloqueo.');
      }
    });
  }

  openHistoryForTask(task: ScheduledTaskDto): void {
    this.selectedHistoryTask.set(task);
    this.historyModalOpen.set(true);
    queueMicrotask(() => this.historyModal?.openForTask());
  }

  openGlobalPauseModal(): void {
    this.pauseModalOpen.set(true);
  }

  confirmGlobalPause(): void {
    if (this.processingGlobalPause()) return;
    this.processingGlobalPause.set(true);
    this.actionError.set(null);

    this.schedulerService.pauseGlobal(this.pauseReasonInput().trim()).subscribe({
      next: (res) => {
        this.processingGlobalPause.set(false);
        this.pauseModalOpen.set(false);
        if (res?.data) {
          this.overview.set(res.data);
        }
        this.notificationService.showWarning('Pausa global de mantenimiento activada.');
        this.loadDashboard(false);
      },
      error: (err) => {
        this.processingGlobalPause.set(false);
        this.actionError.set(err?.error?.detail || 'No fue posible activar la pausa global.');
      }
    });
  }

  resumeGlobalScheduler(): void {
    if (this.processingGlobalPause()) return;
    this.processingGlobalPause.set(true);
    this.actionError.set(null);

    this.schedulerService.resumeGlobal().subscribe({
      next: (res) => {
        this.processingGlobalPause.set(false);
        if (res?.data) {
          this.overview.set(res.data);
        }
        this.notificationService.showSuccess('Planificador global reanudado exitosamente.');
        this.loadDashboard(false);
      },
      error: (err) => {
        this.processingGlobalPause.set(false);
        this.actionError.set(err?.error?.detail || 'No fue posible reanudar el planificador global.');
      }
    });
  }

  openServerTimezoneModal(): void {
    this.serverTimezoneInput.set(this.overview()?.serverTimezone || 'America/Bogota');
    this.timezoneModalOpen.set(true);
  }

  confirmServerTimezone(): void {
    if (this.savingServerTimezone()) return;
    this.savingServerTimezone.set(true);

    this.schedulerService.updateServerTimezone(this.serverTimezoneInput()).subscribe({
      next: (res) => {
        this.savingServerTimezone.set(false);
        this.timezoneModalOpen.set(false);
        if (res?.data) {
          this.overview.set(res.data);
        }
        this.notificationService.showSuccess('Zona horaria predeterminada del servidor actualizada.');
      },
      error: (err) => {
        this.savingServerTimezone.set(false);
        this.actionError.set(err?.error?.detail || 'Zona horaria no válida.');
      }
    });
  }

  private evaluatePollingNeed(taskList: ScheduledTaskDto[]): void {
    const anyRunning = taskList.some((t) => t.lastStatus === 'RUNNING');
    if (anyRunning) {
      this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  private startPolling(): void {
    if (this.pollingTimerId !== null) return;
    this.pollingTimerId = setInterval(() => {
      this.schedulerService.getDashboard().subscribe({
        next: (res) => {
          if (res?.data) {
            this.overview.set(res.data.overview);
            this.tasks.set(res.data.tasks ?? []);
            this.evaluatePollingNeed(res.data.tasks ?? []);
          }
        },
        error: () => this.stopPolling()
      });
    }, 3000);
  }

  private stopPolling(): void {
    if (this.pollingTimerId !== null) {
      clearInterval(this.pollingTimerId);
      this.pollingTimerId = null;
    }
  }
}
