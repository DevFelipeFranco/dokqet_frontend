import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { SchedulerAdminComponent } from './scheduler-admin.component';
import { SchedulerAdminService } from '../../../core/services/scheduler-admin.service';
import { SchedulerDashboardResponseDto } from '../../../core/models/scheduler-admin.model';

const MOCK_DASHBOARD: SchedulerDashboardResponseDto = {
  overview: {
    totalTasks: 4,
    activeTasks: 4,
    pausedTasks: 0,
    runningTasks: 0,
    nominalTasks: 3,
    errorTasks: 1,
    alertCount: 1,
    serverTimezone: 'America/Bogota',
    serverUtcOffset: 'UTC-05:00',
    ntpSynchronized: true,
    engineName: 'Spring TaskScheduler (Java 21)',
    workerActive: true,
    globalPaused: false,
    pauseReason: null
  },
  availableTimezones: [
    { zoneId: 'America/Bogota', utcOffset: 'UTC-05:00', displayName: 'UTC-05:00 (America/Bogota)' }
  ],
  tasks: [
    {
      id: 't-1',
      taskKey: 'RAMA_ACTUACIONES_SYNC',
      title: 'Sincronización de Actuaciones Judiciales',
      description: 'Consulta actuaciones en Portal Único de la Rama Judicial.',
      frequencyType: 'TWICE_DAILY',
      cronExpression: '0 0 12,18 * * *',
      displayCronExpression: '0 12,18 * * *',
      timezone: 'America/Bogota',
      utcOffset: 'UTC-05:00',
      executionTime: '12:00:00',
      scheduledDate: null,
      intervalMinutes: null,
      daysOfWeek: null,
      dayOfMonth: null,
      enabled: true,
      preventOverlap: true,
      timeoutSeconds: 3600,
      notifyOnFailure: true,
      alertEmails: 'alertas@dokqet.com',
      lastRunId: 'run-1',
      lastExecutionAt: '2026-10-31T17:00:00Z',
      lastDurationMs: 4280,
      lastStatus: 'COMPLETED',
      lastErrorMessage: null,
      nextExecutionAt: '2026-10-31T23:00:00Z',
      updatedAt: '2026-10-31T17:00:04Z',
      updatedBy: 'admin@dokqet.com'
    },
    {
      id: 't-2',
      taskKey: 'RAMA_INSTANCES_SYNC',
      title: 'Descubrimiento de Nuevas Instancias',
      description: 'Revisión semanal sobre radicados base de 21 dígitos.',
      frequencyType: 'WEEKLY',
      cronExpression: '0 0 12 * * SUN',
      displayCronExpression: '0 12 * * SUN',
      timezone: 'America/Bogota',
      utcOffset: 'UTC-05:00',
      executionTime: '12:00:00',
      scheduledDate: null,
      intervalMinutes: null,
      daysOfWeek: 'SUN',
      dayOfMonth: null,
      enabled: true,
      preventOverlap: true,
      timeoutSeconds: 3600,
      notifyOnFailure: true,
      alertEmails: 'alertas@dokqet.com',
      lastRunId: 'run-2',
      lastExecutionAt: '2026-10-31T16:00:00Z',
      lastDurationMs: 1920,
      lastStatus: 'FAILED',
      lastErrorMessage: 'HTTP 503 Servicio Rama Judicial no disponible',
      nextExecutionAt: '2026-11-01T17:00:00Z',
      updatedAt: '2026-10-31T16:00:02Z',
      updatedBy: 'admin@dokqet.com'
    }
  ]
};

describe('SchedulerAdminComponent', () => {
  let component: SchedulerAdminComponent;
  let fixture: ComponentFixture<SchedulerAdminComponent>;
  let schedulerServiceSpy: jasmine.SpyObj<SchedulerAdminService>;

  beforeEach(async () => {
    schedulerServiceSpy = jasmine.createSpyObj('SchedulerAdminService', [
      'getDashboard',
      'updateTask',
      'toggleTaskStatus',
      'runTaskNow',
      'stopTask',
      'unlockStaleTask',
      'validateCron',
      'pauseGlobal',
      'resumeGlobal',
      'updateServerTimezone',
      'getTaskRuns',
      'getTaskAuditLogs'
    ]);

    await TestBed.configureTestingModule({
      imports: [SchedulerAdminComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SchedulerAdminService, useValue: schedulerServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulerAdminComponent);
    component = fixture.componentInstance;
  });

  it('debe renderizar skeletons contextuales mientras espera la carga inicial del dashboard', () => {
    schedulerServiceSpy.getDashboard.and.returnValue(NEVER);
    fixture.detectChanges();

    expect(component.isLoading()).toBeTrue();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-skeleton-card-grid')).not.toBeNull();
  });

  it('debe filtrar tareas con error y reflejar el conteo nominal 3 / 4 en los KPIs', () => {
    schedulerServiceSpy.getDashboard.and.returnValue(of({ success: true, data: MOCK_DASHBOARD }));
    fixture.detectChanges();

    expect(component.overview()?.nominalTasks).toBe(3);
    expect(component.overview()?.totalTasks).toBe(4);
    expect(component.filteredTasks().length).toBe(2);

    component.selectFilter('ERROR');
    expect(component.filteredTasks().length).toBe(1);
    expect(component.filteredTasks()[0].taskKey).toBe('RAMA_INSTANCES_SYNC');
  });

  it('debe manejar error HTTP 409 ProblemDetail al intentar Ejecutar Ahora una tarea en curso', () => {
    schedulerServiceSpy.getDashboard.and.returnValue(of({ success: true, data: MOCK_DASHBOARD }));
    schedulerServiceSpy.runTaskNow.and.returnValue(
      throwError(() => ({
        status: 409,
        error: {
          title: 'Conflict',
          status: 409,
          detail: 'La tarea ya tiene una ejecución activa en curso.'
        }
      }))
    );
    fixture.detectChanges();

    component.onRunNow('RAMA_ACTUACIONES_SYNC');
    expect(component.actionError()).toContain('ejecución activa en curso');
  });
});
