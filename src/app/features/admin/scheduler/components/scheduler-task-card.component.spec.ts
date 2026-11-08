import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { SchedulerTaskCardComponent } from './scheduler-task-card.component';
import { ScheduledTaskDto } from '../../../../core/models/scheduler-admin.model';
import { SchedulerAdminService } from '../../../../core/services/scheduler-admin.service';

const MOCK_TASK: ScheduledTaskDto = {
  id: 'task-1',
  taskKey: 'RAMA_INSTANCES_SYNC',
  title: 'Sincronización Diaria de Instancias Judiciales',
  description: 'Consulta instancias en el Portal de la Rama Judicial.',
  frequencyType: 'DAILY',
  cronExpression: '0 3 * * *',
  displayCronExpression: '0 3 * * *',
  timezone: 'America/Bogota',
  utcOffset: 'UTC-05:00',
  executionTime: '03:00',
  scheduledDate: null,
  intervalMinutes: null,
  daysOfWeek: null,
  dayOfMonth: null,
  enabled: true,
  preventOverlap: true,
  timeoutSeconds: 3600,
  notifyOnFailure: true,
  alertEmails: 'alertas@dokqet.com',
  lastRunId: 'run-101',
  lastExecutionAt: '2026-11-04T08:00:00Z',
  lastDurationMs: 4280,
  lastStatus: 'COMPLETED',
  lastErrorMessage: null,
  nextExecutionAt: '2026-11-05T08:00:00Z',
  updatedAt: '2026-11-04T08:05:00Z',
  updatedBy: 'admin@dokqet.com'
};

describe('SchedulerTaskCardComponent (HU-24 Tarjetas Colapsibles)', () => {
  let component: SchedulerTaskCardComponent;
  let fixture: ComponentFixture<SchedulerTaskCardComponent>;
  let schedulerService: jasmine.SpyObj<SchedulerAdminService>;

  beforeEach(async () => {
    schedulerService = jasmine.createSpyObj('SchedulerAdminService', ['updateTask', 'toggleTaskStatus']);
    schedulerService.toggleTaskStatus.and.returnValue(of({
      success: true,
      message: 'Estado de tarea actualizado',
      timestamp: '2026-11-05T00:00:00Z',
      data: { ...MOCK_TASK, enabled: false }
    }));

    await TestBed.configureTestingModule({
      imports: [SchedulerTaskCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SchedulerAdminService, useValue: schedulerService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulerTaskCardComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('task', MOCK_TASK);
    fixture.componentRef.setInput('timezones', [
      { zoneId: 'America/Bogota', utcOffset: 'UTC-05:00', displayName: 'UTC-05:00 (America/Bogota)' }
    ]);
    fixture.detectChanges();
  });

  it('debe inicializarse en estado colapsado por defecto', () => {
    expect(component.isExpanded()).toBeFalse();
    const headerEl = fixture.debugElement.query(By.css('header[role="button"]'));
    expect(headerEl).toBeTruthy();
    expect(headerEl.attributes['aria-expanded']).toBe('false');
  });

  it('debe mostrar en la cabecera el título, badge de estado, tag técnico RAMA_INSTANCES_SYNC y switch', () => {
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Sincronización Diaria de Instancias Judiciales');
    expect(textContent).toContain('Ejecutado con Éxito');
    expect(textContent).toContain('RAMA_INSTANCES_SYNC');
    expect(textContent).toContain('Activa');

    const switchBtn = fixture.debugElement.query(By.css('button[role="switch"]'));
    expect(switchBtn).toBeTruthy();
    expect(switchBtn.attributes['aria-checked']).toBe('true');
  });

  it('debe expandirse al hacer clic en el encabezado', () => {
    const headerEl = fixture.debugElement.query(By.css('header[role="button"]'));
    headerEl.nativeElement.click();
    fixture.detectChanges();

    expect(component.isExpanded()).toBeTrue();
    expect(headerEl.attributes['aria-expanded']).toBe('true');
  });

  it('debe expandirse y colapsarse mediante eventos de teclado (Enter)', () => {
    const headerEl = fixture.debugElement.query(By.css('header[role="button"]'));
    headerEl.triggerEventHandler('keydown.enter', {});
    fixture.detectChanges();

    expect(component.isExpanded()).toBeTrue();

    headerEl.triggerEventHandler('keydown.enter', {});
    fixture.detectChanges();

    expect(component.isExpanded()).toBeFalse();
  });

  it('al presionar el switch de activar/pausar debe conmutar el estado sin expandir la tarjeta (stopPropagation)', () => {
    expect(component.isExpanded()).toBeFalse();

    const switchBtn = fixture.debugElement.query(By.css('button[role="switch"]'));
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    spyOn(clickEvent, 'stopPropagation').and.callThrough();

    switchBtn.nativeElement.dispatchEvent(clickEvent);
    fixture.detectChanges();

    expect(clickEvent.stopPropagation).toHaveBeenCalled();
    expect(schedulerService.toggleTaskStatus).toHaveBeenCalledWith('RAMA_INSTANCES_SYNC', false);
    expect(component.isExpanded()).toBeFalse(); // La tarjeta NO se expandió
  });

  it('debe mostrar el badge "Cambios sin guardar" en la cabecera si el formulario es sucio y está colapsado', () => {
    component.isDirty.set(true);
    component.isExpanded.set(false);
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Cambios sin guardar');
  });

  it('debe preservar en memoria los valores editados si se colapsa la tarjeta', () => {
    component.isExpanded.set(true);
    fixture.detectChanges();

    component.onTimeChange('05:45');
    fixture.detectChanges();

    expect(component.executionTime()).toBe('05:45');
    expect(component.isDirty()).toBeTrue();

    // Colapsar
    component.toggleExpand();
    fixture.detectChanges();
    expect(component.isExpanded()).toBeFalse();

    // Re-expandir
    component.toggleExpand();
    fixture.detectChanges();
    expect(component.isExpanded()).toBeTrue();
    expect(component.executionTime()).toBe('05:45');
  });
});
