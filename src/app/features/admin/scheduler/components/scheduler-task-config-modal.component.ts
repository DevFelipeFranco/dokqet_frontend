import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  model,
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
import { ButtonComponent, FormAlertComponent, ModalComponent } from '../../../../shared/components/ui';

@Component({
  selector: 'app-scheduler-task-config-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent, FormAlertComponent],
  templateUrl: './scheduler-task-config-modal.component.html'
})
export class SchedulerTaskConfigModalComponent implements OnInit {
  private readonly schedulerService = inject(SchedulerAdminService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  isOpen = model<boolean>(false);
  task = input<ScheduledTaskDto | null>(null);
  timezones = input<TimezoneOptionDto[]>([]);

  taskMutated = output<ScheduledTaskDto>();

  readonly frequencyOptions = FREQUENCY_OPTIONS;
  readonly weekdayOptions = WEEKDAY_OPTIONS;

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
  readonly savingSchedule = signal<boolean>(false);
  readonly togglingStatus = signal<boolean>(false);
  readonly cardError = signal<string | null>(null);

  readonly cronPreview = signal<CronValidationResponseDto | null>(null);
  readonly validatingCron = signal<boolean>(false);

  private readonly cronValidateTrigger$ = new Subject<{ cron: string; tz: string; date: string | null }>();

  constructor() {
    effect(() => {
      const incoming = this.task();
      const open = this.isOpen();
      if (incoming && open) {
        untracked(() => this.hydrateForm(incoming));
      }
    });
  }

  ngOnInit(): void {
    this.cronValidateTrigger$
      .pipe(
        debounceTime(300),
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
                    errorMessage: err?.error?.detail || 'La expresión Cron no es válida. Verifique el formato.'
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
    if (len > 160) return 'El título no puede superar los 160 caracteres.';
    return null;
  });

  readonly cronError = computed(() => {
    const expr = this.cronExpression().trim();
    if (!expr) return 'La expresión Cron no puede estar vacía.';
    const parts = expr.split(/\s+/);
    if (parts.length < 5 || parts.length > 6) {
      return 'La expresión Cron debe contener 5 campos (POSIX) o 6 campos (Spring).';
    }
    if (this.cronPreview() && !this.cronPreview()!.valid) {
      return this.cronPreview()!.errorMessage || 'Expresión Cron no válida.';
    }
    return null;
  });

  readonly dateError = computed(() => {
    if (this.frequencyType() !== 'ONCE_AT_DATE') return null;
    if (!this.scheduledDate()) return 'Debe ingresar una fecha para la ejecución única.';
    const parsed = new Date(`${this.scheduledDate()}T${this.executionTime() || '00:00'}:00`);
    if (isNaN(parsed.getTime()) || parsed.getTime() < Date.now() - 60_000) {
      return 'La fecha y hora de ejecución debe ser posterior al instante actual.';
    }
    return null;
  });

  readonly isFormValid = computed(() => {
    return !this.titleError() && !this.cronError() && !this.dateError();
  });

  readonly minDateString = computed(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  private hydrateForm(task: ScheduledTaskDto): void {
    this.title.set(task.title);
    this.description.set(task.description);
    this.frequencyType.set(task.frequencyType);
    this.executionTime.set(task.executionTime ? task.executionTime.substring(0, 5) : '03:00');
    this.scheduledDate.set(task.scheduledDate ?? '');
    this.intervalMinutes.set(task.intervalMinutes ?? 15);
    this.dayOfMonth.set(task.dayOfMonth ?? 1);
    this.selectedDays.set(task.daysOfWeek ? task.daysOfWeek.split(',') : ['MON']);
    this.timezone.set(task.timezone || 'America/Bogota');
    this.cronExpression.set(task.displayCronExpression || task.cronExpression);
    this.preventOverlap.set(task.preventOverlap);
    this.timeoutSeconds.set(task.timeoutSeconds || 3600);
    this.notifyOnFailure.set(task.notifyOnFailure);
    this.alertEmails.set(task.alertEmails ?? '');
    this.isDirty.set(false);
    this.cardError.set(null);
    this.queueCronValidation();
  }

  onFrequencyChange(type: ScheduleFrequencyType): void {
    this.frequencyType.set(type);
    this.markDirty();
    this.recomputeCronFromControls();
  }

  onTimeChange(val: string): void {
    this.executionTime.set(val);
    this.markDirty();
    this.recomputeCronFromControls();
  }

  onTimezoneChange(tz: string): void {
    this.timezone.set(tz);
    this.markDirty();
    this.queueCronValidation();
  }

  onManualCronInput(cron: string): void {
    this.cronExpression.set(cron);
    this.markDirty();
    this.queueCronValidation();
  }

  onIntervalMinutesChange(minutes: number): void {
    this.intervalMinutes.set(Math.max(1, Math.min(720, minutes || 15)));
    this.markDirty();
    this.recomputeCronFromControls();
  }

  onDayOfMonthChange(dom: number): void {
    this.dayOfMonth.set(Math.max(1, Math.min(28, dom || 1)));
    this.markDirty();
    this.recomputeCronFromControls();
  }

  onScheduledDateChange(dateStr: string): void {
    this.scheduledDate.set(dateStr);
    this.markDirty();
    this.recomputeCronFromControls();
  }

  toggleWeekday(code: string): void {
    const current = this.selectedDays();
    let updated: string[];
    if (current.includes(code)) {
      if (current.length === 1) return;
      updated = current.filter((c) => c !== code);
    } else {
      updated = [...current, code];
    }
    this.selectedDays.set(updated);
    this.markDirty();
    this.recomputeCronFromControls();
  }

  saveSchedule(): void {
    const currentTask = this.task();
    if (!currentTask || !this.isFormValid() || this.savingSchedule()) return;

    this.savingSchedule.set(true);
    this.cardError.set(null);

    const payload: UpdateScheduledTaskPayload = {
      title: this.title().trim(),
      description: this.description().trim(),
      frequencyType: this.frequencyType(),
      executionTime: this.executionTime() ? `${this.executionTime()}:00` : null,
      scheduledDate: this.scheduledDate() || null,
      intervalMinutes: this.frequencyType() === 'INTERVAL_MINUTES' ? this.intervalMinutes() : null,
      daysOfWeek: this.frequencyType() === 'WEEKLY' ? this.selectedDays().join(',') : null,
      dayOfMonth: this.frequencyType() === 'MONTHLY' ? this.dayOfMonth() : null,
      cronExpression: this.cronExpression().trim(),
      timezone: this.timezone(),
      preventOverlap: this.preventOverlap(),
      timeoutSeconds: this.timeoutSeconds(),
      notifyOnFailure: this.notifyOnFailure(),
      alertEmails: this.alertEmails().trim() || null
    };

    this.schedulerService.updateTask(currentTask.taskKey, payload).subscribe({
      next: (res) => {
        this.savingSchedule.set(false);
        this.isDirty.set(false);
        if (res?.data) {
          this.taskMutated.emit(res.data);
        }
        this.notificationService.showSuccess(res.message || 'Configuración guardada y reprogramada en caliente.');
        this.isOpen.set(false);
      },
      error: (err) => {
        this.savingSchedule.set(false);
        this.cardError.set(err?.error?.detail || err?.error?.message || 'Error al guardar la tarea.');
      }
    });
  }

  close(): void {
    this.isOpen.set(false);
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
