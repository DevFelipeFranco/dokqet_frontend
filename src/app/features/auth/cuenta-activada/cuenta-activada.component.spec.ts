import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { CuentaActivadaComponent } from './cuenta-activada.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('CuentaActivadaComponent (HU-20: Activación Idempotente sin Auto-Login)', () => {
  let component: CuentaActivadaComponent;
  let fixture: ComponentFixture<CuentaActivadaComponent>;
  let authService: AuthService;

  const activatedRouteMock = {
    snapshot: {
      queryParams: {
        token: 'token-valido-123',
        invitacion: 'inv-abc'
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentaActivadaComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CuentaActivadaComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
  });

  it('debe crearse exitosamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar estado ACTIVATED y preservar invitación cuando verifyEmail responde status ACTIVATED', () => {
    spyOn(authService, 'verifyEmail').and.returnValue(
      of({
        success: true,
        data: {
          status: 'ACTIVATED',
          invitationToken: 'inv-abc'
        }
      })
    );

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.state()).toBe('ACTIVATED');
    expect(component.invitationToken()).toBe('inv-abc');
    expect(component.getLoginQueryParams()).toEqual({ invitacion: 'inv-abc' });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('¡Tu cuenta quedó activada!');
  });

  it('debe mostrar estado EXPIRED cuando el token ha vencido', () => {
    spyOn(authService, 'verifyEmail').and.returnValue(
      of({
        success: true,
        data: {
          status: 'EXPIRED'
        }
      })
    );

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.state()).toBe('EXPIRED');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('El enlace venció');
  });

  it('debe mostrar estado INVALID cuando el token es inválido o no existe', () => {
    spyOn(authService, 'verifyEmail').and.returnValue(
      throwError(() => ({
        status: 400,
        error: { detail: 'Token inválido' }
      }))
    );

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.state()).toBe('INVALID');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('El enlace no es válido');
  });
});
