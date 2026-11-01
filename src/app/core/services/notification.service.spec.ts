import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService]
    });
    service = TestBed.inject(NotificationService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
    expect(service.alert()).toBeNull();
  });

  it('debe emitir alerta de advertencia', () => {
    service.showWarning('Acceso restringido para el área técnica');

    expect(service.alert()).toEqual({
      type: 'warning',
      message: 'Acceso restringido para el área técnica',
      title: undefined
    });
  });

  it('debe auto-limpiar la alerta después del timeout', fakeAsync(() => {
    service.showWarning('Alerta temporal');
    expect(service.alert()).not.toBeNull();

    tick(6000);
    expect(service.alert()).toBeNull();
  }));

  it('debe limpiar la alerta manualmente con clear()', () => {
    service.showError('Error crítico');
    expect(service.alert()).not.toBeNull();

    service.clear();
    expect(service.alert()).toBeNull();
  });
});
