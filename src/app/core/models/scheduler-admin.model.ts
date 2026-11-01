/**
 * Modelos de datos y contratos TypeScript para la Consola de Cron & Scheduler (HU-19 / US-018)
 */

export type ScheduleFrequencyType =
  | 'INTERVAL_MINUTES'
  | 'HOURLY'
  | 'DAILY'
  | 'TWICE_DAILY'
  | 'WEEKDAYS'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'ONCE_AT_DATE'
  | 'CUSTOM_CRON';

export type ScheduledTaskRunStatus =
  | 'RUNNING'
  | 'COMPLETED'
  | 'STOPPED'
  | 'INTERRUPTED'
  | 'FAILED';

export type ScheduleTriggerType = 'SCHEDULED' | 'MANUAL';

export type SchedulerFilterTab = 'ALL' | 'ACTIVE' | 'RUNNING' | 'SUCCESS' | 'ERROR';

export interface FrequencyOption {
  value: ScheduleFrequencyType;
  label: string;
}

export const FREQUENCY_OPTIONS: readonly FrequencyOption[] = [
  { value: 'DAILY', label: 'Diaria' },
  { value: 'TWICE_DAILY', label: 'Dos veces al día (+6h)' },
  { value: 'WEEKDAYS', label: 'Días hábiles (Lun - Vie)' },
  { value: 'WEEKLY', label: 'Semanal (días específicos)' },
  { value: 'MONTHLY', label: 'Mensual (día del mes)' },
  { value: 'HOURLY', label: 'Cada hora' },
  { value: 'INTERVAL_MINUTES', label: 'Cada N minutos' },
  { value: 'ONCE_AT_DATE', label: 'Fecha única específica' },
  { value: 'CUSTOM_CRON', label: 'Expresión Cron personalizada' }
];

export const WEEKDAY_OPTIONS: readonly { code: string; label: string }[] = [
  { code: 'MON', label: 'Lun' },
  { code: 'TUE', label: 'Mar' },
  { code: 'WED', label: 'Mié' },
  { code: 'THU', label: 'Jue' },
  { code: 'FRI', label: 'Vie' },
  { code: 'SAT', label: 'Sáb' },
  { code: 'SUN', label: 'Dom' }
];

export interface TimezoneOptionDto {
  zoneId: string;
  utcOffset: string;
  displayName: string;
}

export interface SchedulerOverviewKpiDto {
  totalTasks: number;
  activeTasks: number;
  pausedTasks: number;
  runningTasks: number;
  nominalTasks: number;
  errorTasks: number;
  alertCount: number;
  serverTimezone: string;
  serverUtcOffset: string;
  ntpSynchronized: boolean;
  engineName: string;
  workerActive: boolean;
  globalPaused: boolean;
  pauseReason: string | null;
}

export interface ScheduledTaskDto {
  id: string;
  taskKey: string;
  title: string;
  description: string;
  frequencyType: ScheduleFrequencyType;
  cronExpression: string;
  displayCronExpression: string;
  timezone: string;
  utcOffset: string;
  executionTime: string | null;
  scheduledDate: string | null;
  intervalMinutes: number | null;
  daysOfWeek: string | null;
  dayOfMonth: number | null;
  enabled: boolean;
  preventOverlap: boolean;
  timeoutSeconds: number;
  notifyOnFailure: boolean;
  alertEmails: string | null;
  lastRunId: string | null;
  lastExecutionAt: string | null;
  lastDurationMs: number | null;
  lastStatus: ScheduledTaskRunStatus | null;
  lastErrorMessage: string | null;
  isStaleRunning?: boolean;
  nextExecutionAt: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface SchedulerDashboardResponseDto {
  overview: SchedulerOverviewKpiDto;
  tasks: ScheduledTaskDto[];
  availableTimezones: TimezoneOptionDto[];
}

export interface UpdateScheduledTaskPayload {
  title: string;
  description: string;
  frequencyType: ScheduleFrequencyType;
  executionTime: string | null;
  scheduledDate: string | null;
  intervalMinutes: number | null;
  daysOfWeek: string | null;
  dayOfMonth: number | null;
  cronExpression: string;
  timezone: string;
  preventOverlap: boolean;
  timeoutSeconds: number;
  notifyOnFailure: boolean;
  alertEmails: string | null;
}

export interface CronValidationRequestDto {
  cronExpression: string;
  timezone: string;
  scheduledDate?: string | null;
}

export interface CronValidationResponseDto {
  valid: boolean;
  normalizedCron: string | null;
  humanDescription: string;
  nextExecutions: string[];
  errorMessage?: string | null;
}

export interface ScheduledTaskRunDto {
  runId: string;
  taskKey: string;
  kind: string;
  status: ScheduledTaskRunStatus;
  triggerType: ScheduleTriggerType;
  triggeredByEmail: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  total: number;
  checked: number;
  withChanges: number;
  errors: number;
  instancesFound: number;
  note: string | null;
  errorDetail: string | null;
}

export interface ScheduledTaskAuditDto {
  id: string;
  taskKey: string | null;
  action: string;
  previousStateJson: string | null;
  newStateJson: string | null;
  reason: string | null;
  performedByEmail: string;
  ipAddress: string | null;
  createdAt: string;
}

export interface ProblemDetailSchedulerError {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  message?: string;
  instance?: string;
  errors?: Record<string, string>;
}
