import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SchedulerAdminService } from './scheduler-admin.service';
import { SchedulerDashboardResponseDto } from '../models/scheduler-admin.model';

describe('SchedulerAdminService', () => {
  let service: SchedulerAdminService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/v1/admin/schedulers';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), SchedulerAdminService]
    });

    service = TestBed.inject(SchedulerAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe consultar el dashboard y actualizar el signal alertCount reactivamente', () => {
    const mockDashboard: SchedulerDashboardResponseDto = {
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
      tasks: [],
      availableTimezones: []
    };

    service.getDashboard().subscribe((res) => {
      expect(res.success).toBeTrue();
      expect(res.data.overview.totalTasks).toBe(4);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockDashboard });

    expect(service.alertCount()).toBe(1);
    expect(service.globalPaused()).toBeFalse();
  });

  it('debe disparar la ejecución inmediata POST /{taskKey}/run-now', () => {
    service.runTaskNow('RAMA_ACTUACIONES_SYNC').subscribe((res) => {
      expect(res.data.status).toBe('RUNNING');
      expect(res.data.triggerType).toBe('MANUAL');
    });

    const req = httpMock.expectOne(`${baseUrl}/RAMA_ACTUACIONES_SYNC/run-now`);
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      data: {
        runId: 'run-01',
        taskKey: 'RAMA_ACTUACIONES_SYNC',
        kind: 'UPDATES',
        status: 'RUNNING',
        triggerType: 'MANUAL',
        triggeredByEmail: 'admin@dokqet.com',
        startedAt: '2026-10-31T20:00:00Z',
        finishedAt: null,
        durationMs: null,
        total: 0,
        checked: 0,
        withChanges: 0,
        errors: 0,
        instancesFound: 0,
        note: null,
        errorDetail: null
      }
    });
  });

  it('debe validar una expresión Cron mediante POST /validate-cron', () => {
    service.validateCron({ cronExpression: '0 3 * * *', timezone: 'America/Bogota' }).subscribe((res) => {
      expect(res.data.valid).toBeTrue();
      expect(res.data.nextExecutions.length).toBe(2);
    });

    const req = httpMock.expectOne(`${baseUrl}/validate-cron`);
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      data: {
        valid: true,
        normalizedCron: '0 0 3 * * *',
        humanDescription: 'Todos los días a las 03:00:00 (America/Bogota)',
        nextExecutions: ['2026-11-01T08:00:00Z', '2026-11-02T08:00:00Z']
      }
    });
  });
});
