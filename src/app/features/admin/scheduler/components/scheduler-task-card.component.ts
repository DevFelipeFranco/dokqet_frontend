import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, switchMap, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CronValidationResponseDto,
  FREQUENCY_OPTIONS,
  ScheduleFrequencyType,
  ScheduledTaskDto,
  TimezoneOptionDto,
  UpdateScheduledTaskPayload,
  WEEKDAY_OPTIONS
} from '../../../../core/models/scheduler-admin.model';
import { SchedulerAdminService } from '../../../../core/services/scheduler-admin.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FormAlertComponent } from '../../../../shared/components/ui';

@Component({
  selector: 'app-scheduler-task-card',
  standalone: true,
  imports: [CommonModule, FormsModule, FormAlertComponent],
  templateUrl: './scheduler-task-card.component.html',
  host: {
    class: 'block'
  }
})
export class SchedulerTaskCardComponent implements OnInit {
  private readonly schedulerService = inject(SchedulerAdminService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly task = input.required<ScheduledTaskDto>();
  readonly timezones = input.required<TimezoneOptionDto[]>();
  readonly globalPaused = input<boolean>(false);

  readonly taskMutated = output<ScheduledTaskDto>();
  readonly runNowRequested = output<ScheduledTaskDto>();
  readonly stopRequested = output<ScheduledTaskDto>();
  readonly unlockRequested = output<ScheduledTaskDto>();
  readonly historyRequested = output<ScheduledTaskDto>();

  readonly frequencyOptions = FREQUENCY_OPTIONS;
  readonly weekdayOptions = WEEKDAY_OPTIONS;

  // Estado local editable por tarjeta (aislado para no perder cambios durante polling)
  readonly title = signal<string>('');
  readonly description = signal<string>('');
  readonly frequencyType = signal<ScheduleFrequencyType>('DAILY');
  readonly executionTime = signal<string>('03:00');
  readonly scheduledDate = signal<string>('');
  readonly intervalMinutes = signal<number>(15);
  readonly selectedDays = signal<string[]>(['MON']);
  readonly dayOfMonth = signal<number>(1);
  readonly timezone = signal<string>('America/Bogota');
  readonly cronExpression = signal<string>('0 3 * * *');
  readonly preventOverlap = signal<boolean>(true);
  readonly timeoutSeconds = signal<number>(3600);
  readonly notifyOnFailure = signal<boolean>(true);
  readonly alertEmails = signal<string>('');

  readonly isDirty = signal<boolean>(false);
  readonly showAdvancedEditor = signal<boolean>(false);
  readonly showNextRunsPreview = signal<boolean>(false);

  readonly savingSchedule = signal<boolean>(false);
  readonly togglingStatus = signal<boolean>(false);
  readonly triggeringRun = signal<boolean>(false);
  readonly stoppingRun = signal<boolean>(false);

  readonly cardError = signal<string | null>(null);
  readonly cronPreview = signal<CronValidationResponseDto | null>(null);
  readonly validatingCron = signal<boolean>(false);

  private readonly cronValidateTrigger$ = new Subject<{ cron: string; tz: string; date: string | null }>();
  private lastSyncedTaskSignature = '';

  constructor() {
    effect(() => {
      const incoming = this.task();
      const dirty = untracked(() => this.isDirty());
      const signature = `${incoming.taskKey}|${incoming.updatedAt}|${incoming.cronExpression}|${incoming.title}`;
      if (!dirty && signature !== this.lastSyncedTaskSignature) {
        untracked(() => this.hydrateFormFromTask(incoming));
        this.lastSyncedTaskSignature = signature;
      }
    });
  }

  ngOnInit(): void {
    this.hydrateFormFromTask(this.task());

    this.cronValidateTrigger$
      .pipe(
        debounceTime(350),
        switchMap(({ cron, tz, date }) => {
          if (!cron.trim()) {
            this.validatingCron.set(false);
            return of(null);
          }
          this.validatingCron.set(true);
          return this.schedulerService
            .validateCron({ cronExpression: cron.trim(), timezone: tz, scheduledDate: date })
            .pipe(
              catchError((err) => {
                this.validatingCron.set(false);
                return of({
                  success: false,
                  data: {
                    valid: false,
                    normalizedCron: null,
                    humanDescription: 'Expresión Cron inválida',
                    nextExecutions: [],
                    errorMessage: err?.error?.detail || 'La expresión Cron no es válida. Verifique minutos y horas.'
                  }
                });
              })
            );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.validatingCron.set(false);
        if (res?.data) {
          this.cronPreview.set(res.data);
        }
      });
  }

  readonly titleError = computed(() => {
    const len = this.title().trim().length;
    if (len < 5) return 'El título identificativo debe tener al menos 5 caracteres.';
    if (len > 160) return 'El título no puede superar 160 caracteres.';
    return null;
  });

  readonly descriptionError = computed(() => {
    const len = this.description().trim().length;
    if (len < 10) return 'La descripción operativa debe tener al menos 10 caracteres.';
    if (len > 600) return 'La descripción no puede superar 600 caracteres.';
    return null;
  });

  readonly cronError = computed(() => {
    const raw = this.cronExpression().trim();
    if (!raw) return 'La expresión Cron es obligatoria.';
    const parts = raw.split(/\s+/);
    if (parts.length !== 5 && parts.length !== 6) {
      return 'La expresión Cron no es válida. Use 5 campos (min hora día mes sem) o 6 campos.';
    }
    const preview = this.cronPreview();
    if (preview && !preview.valid) {
      return preview.errorMessage || 'La expresión Cron no es válida. Verifique minutos y horas.';
    }
    return null;
  });

  readonly dateError = computed(() => {
    if (this.frequencyType() === 'ONCE_AT_DATE' && !this.scheduledDate()) {
      return 'Seleccione la fecha específica programada.';
    }
    return null;
  });

  readonly isFormValid = computed(() => {
    return !this.titleError() && !this.descriptionError() && !this.cronError() && !this.dateError();
  });

  readonly minDateString = computed(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });

  hydrateFormFromTask(dto: ScheduledTaskDto): void {
    this.title.set(dto.title);
    this.description.set(dto.description);
    this.frequencyType.set(dto.frequencyType);
    this.executionTime.set(dto.executionTime ? dto.executionTime.slice(0, 5) : '03:00');
    this.scheduledDate.set(dto.scheduledDate ?? '');
    this.intervalMinutes.set(dto.intervalMinutes ?? 15);
    this.selectedDays.set(dto.daysOfWeek ? dto.daysOfWeek.split(',').map((d) => d.trim()).filter(Boolean) : ['MON']);
    this.dayOfMonth.set(dto.dayOfMonth ?? 1);
    this.timezone.set(dto.timezone || 'America/Bogota');
    this.cronExpression.set(dto.displayCronExpression || dto.cronExpression);
    this.preventOverlap.set(dto.preventOverlap);
    this.timeoutSeconds.set(dto.timeoutSeconds || 3600);
    this.notifyOnFailure.set(dto.notifyOnFailure);
    this.alertEmails.set(dto.alertEmails ?? '');
    this.isDirty.set(false);
    this.cardError.set(null);
    this.cronPreview.set(null);
  }

  onTitleChange(val: string): void {
    this.title.set(val);
    this.markDirty();
  }

  onDescriptionChange(val: string): void {
    this.description.set(val);
    this.markDirty();
  }

  onFrequencyChange(freq: ScheduleFrequencyType): void {
    this.frequencyType.set(freq);
    if (freq === 'ONCE_AT_DATE' && !this.scheduledDate()) {
      const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
      this.scheduledDate.set(tomorrow);
    }
    if (freq !== 'CUSTOM_CRON') {
      this.recomputeCronFromControls();
    }
    this.markDirty();
  }

  onTimeChange(timeVal: string): void {
    this.executionTime.set(timeVal || '03:00');
    if (this.frequencyType() !== 'CUSTOM_CRON') {
      this.recomputeCronFromControls();
    }
    this.markDirty();
  }

  onScheduledDateChange(dateVal: string): void {
    this.scheduledDate.set(dateVal);
    if (this.frequencyType() === 'ONCE_AT_DATE') {
      this.recomputeCronFromControls();
    } else {
      this.queueCronValidation();
    }
    this.markDirty();
  }

  onIntervalMinutesChange(val: number): void {
    const safe = Math.max(1, Math.min(720, Number(val) || 15));
    this.intervalMinutes.set(safe);
    this.recomputeCronFromControls();
    this.markDirty();
  }

  toggleWeekday(code: string): void {
    const current = this.selectedDays();
    const exists = current.includes(code);
    const updated = exists ? current.filter((d) => d !== code) : [...current, code];
    this.selectedDays.set(updated.length > 0 ? updated : ['MON']);
    this.recomputeCronFromControls();
    this.markDirty();
  }

  onDayOfMonthChange(day: number): void {
    const safe = Math.max(1, Math.min(28, Number(day) || 1));
    this.dayOfMonth.set(safe);
    this.recomputeCronFromControls();
    this.markDirty();
  }

  onTimezoneChange(tz: string): void {
    this.timezone.set(tz);
    this.queueCronValidation();
    this.markDirty();
  }

  onManualCronInput(rawCron: string): void {
    this.cronExpression.set(rawCron);
    this.frequencyType.set('CUSTOM_CRON');
    this.queueCronValidation();
    this.markDirty();
  }

  toggleNextRunsPreview(): void {
    const nextState = !this.showNextRunsPreview();
    this.showNextRunsPreview.set(nextState);
    if (nextState && !this.cronPreview()) {
      this.queueCronValidation();
    }
  }

  discardChanges(): void {
    this.hydrateFormFromTask(this.task());
  }

  saveSchedule(): void {
    if (!this.isFormValid() || this.savingSchedule()) return;

    this.savingSchedule.set(true);
    this.cardError.set(null);

    const payload: UpdateScheduledTaskPayload = {
      title: this.title().trim(),
      description: this.description().trim(),
      frequencyType: this.frequencyType(),
      executionTime: this.usesExecutionTime() ? `${this.executionTime()}:00` : null,
      scheduledDate: this.scheduledDate() ? this.scheduledDate() : null,
      intervalMinutes: this.frequencyType() === 'INTERVAL_MINUTES' ? this.intervalMinutes() : null,
      daysOfWeek: this.frequencyType() === 'WEEKLY' ? this.selectedDays().join(',') : null,
      dayOfMonth: this.frequencyType() === 'MONTHLY' ? this.dayOfMonth() : null,
      cronExpression: this.cronExpression().trim(),
      timezone: this.timezone(),
      preventOverlap: this.preventOverlap(),
      timeoutSeconds: Number(this.timeoutSeconds()) || 3600,
      notifyOnFailure: this.notifyOnFailure(),
      alertEmails: this.alertEmails().trim() || null
    };

    this.schedulerService.updateTask(this.task().taskKey, payload).subscribe({
      next: (res) => {
        this.savingSchedule.set(false);
        this.isDirty.set(false);
        if (res?.data) {
          this.hydrateFormFromTask(res.data);
          this.taskMutated.emit(res.data);
        }
        this.notificationService.showSuccess(res.message || 'Horario reprogramado en caliente.');
      },
      error: (err) => {
        this.savingSchedule.set(false);
        this.cardError.set(err?.error?.detail || err?.error?.message || 'Error al guardar la configuración del Cron.');
      }
    });
  }

  onToggleEnabled(): void {
    if (this.togglingStatus()) return;
    const nextEnabled = !this.task().enabled;
    this.togglingStatus.set(true);
    this.cardError.set(null);

    this.schedulerService.toggleTaskStatus(this.task().taskKey, nextEnabled).subscribe({
      next: (res) => {
        this.togglingStatus.set(false);
        if (res?.data) {
          this.taskMutated.emit(res.data);
        }
        this.notificationService.showInfo(
          nextEnabled ? `Tarea «${this.task().title}» activada.` : `Tarea «${this.task().title}» pausada.`
        );
      },
      error: (err) => {
        this.togglingStatus.set(false);
        this.cardError.set(err?.error?.detail || 'No se pudo cambiar el estado de la tarea.');
      }
    });
  }

  onRunNowClick(): void {
    this.runNowRequested.emit(this.task());
  }

  onStopClick(): void {
    this.stopRequested.emit(this.task());
  }

  onUnlockClick(): void {
    this.unlockRequested.emit(this.task());
  }

  onHistoryClick(): void {
    this.historyRequested.emit(this.task());
  }

  usesExecutionTime(): boolean {
    const f = this.frequencyType();
    return f !== 'INTERVAL_MINUTES' && f !== 'CUSTOM_CRON';
  }

  formatFriendlyInstant(iso: string | null, emptyText: string): string {
    if (!iso) return emptyText;
    const tz = this.timezone() || this.task().timezone || 'America/Bogota';
    try {
      const target = new Date(iso);
      const now = new Date();
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

      if (targetDay === todayDay) return `Hoy a las ${timePart}`;
      if (targetDay === tomorrowDay) return `Mañana a las ${timePart}`;
      if (targetDay === yesterdayDay) return `Ayer a las ${timePart}`;

      const fullFmt = new Intl.DateTimeFormat('es-CO', {
        timeZone: tz,
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      return `${fullFmt.format(target)} a las ${timePart}`;
    } catch {
      return new Date(iso).toLocaleString('es-CO');
    }
  }

  formatDuration(ms: number | null): string {
    if (ms === null || ms === undefined) return '—';
    return `${ms.toLocaleString('es-CO')} ms`;
  }

  private recomputeCronFromControls(): void {
    const [hourStr, minStr] = (this.executionTime() || '03:00').split(':');
    const hour = Number(hourStr) || 0;
    const minute = Number(minStr) || 0;

    let computedCron = this.cronExpression();
    switch (this.frequencyType()) {
      case 'INTERVAL_MINUTES':
        computedCron = `*/${this.intervalMinutes()} * * * *`;
        break;
      case 'HOURLY':
        computedCron = `${minute} * * * *`;
        break;
      case 'DAILY':
        computedCron = `${minute} ${hour} * * *`;
        break;
      case 'TWICE_DAILY':
        computedCron = `${minute} ${hour},${(hour + 6) % 24} * * *`;
        break;
      case 'WEEKDAYS':
        computedCron = `${minute} ${hour} * * MON-FRI`;
        break;
      case 'WEEKLY':
        computedCron = `${minute} ${hour} * * ${this.selectedDays().join(',')}`;
        break;
      case 'MONTHLY':
        computedCron = `${minute} ${hour} ${this.dayOfMonth()} * *`;
        break;
      case 'ONCE_AT_DATE': {
        if (this.scheduledDate()) {
          const [, monthStr, dayStr] = this.scheduledDate().split('-');
          computedCron = `${minute} ${hour} ${Number(dayStr) || 1} ${Number(monthStr) || 1} *`;
        }
        break;
      }
      case 'CUSTOM_CRON':
        break;
    }

    this.cronExpression.set(computedCron);
    this.queueCronValidation();
  }

  private queueCronValidation(): void {
    this.cronValidateTrigger$.next({
      cron: this.cronExpression(),
      tz: this.timezone(),
      date: this.scheduledDate() || null
    });
  }

  private markDirty(): void {
    this.isDirty.set(true);
    this.cardError.set(null);
  }
}
