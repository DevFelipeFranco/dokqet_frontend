import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { SignInComponent } from './sign-in.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignInComponent],
      providers: [
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  afterEach(() => {
    component.stopCountdown();
  });

  it('should create sign in component', () => {
    expect(component).toBeTruthy();
  });

  it('should validate email and password controls', () => {
    expect(component.form.valid).toBeFalse();

    component.form.patchValue({
      email: 'invalid-email',
      password: ''
    });
    expect(component.form.valid).toBeFalse();

    component.form.patchValue({
      email: 'abogado@firma.co',
      password: 'SecretPassword123'
    });
    expect(component.form.valid).toBeTrue();
  });

  it('should toggle password visibility signal', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBeFalse();
  });

  it('should detect caps lock state from keyboard events', () => {
    const capsOnEvent = new KeyboardEvent('keydown', {
      modifierCapsLock: true
    });
    component.checkCapsLock(capsOnEvent);
    expect(component.capsLockActive()).toBeTrue();
  });

  describe('HU-17: Manejo de Intentos Fallidos y Bloqueo de Cuentas', () => {
    it('debe advertir intentos restantes ante error HTTP 400', () => {
      component.form.patchValue({
        email: 'abogado.gonzalez@dokqet.com',
        password: 'ClaveErronea1'
      });

      spyOn(authService, 'login').and.returnValue(
        throwError(() => ({
          status: 400,
          error: {
            detail: 'Credenciales incorrectas. Te quedan 3 intento(s) antes de que la cuenta sea bloqueada temporalmente.'
          }
        }))
      );

      component.onSubmit();
      fixture.detectChanges();

      expect(component.loading()).toBeFalse();
      expect(component.warningAttempts()).toBe(3);
      expect(component.lockedInfo()).toBeNull();
      expect(component.errorMessage()).toContain('Te quedan 3 intento(s)');

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Te restan 3 intento(s)');
    });

    it('debe activar el estado de bloqueo temporal ante HTTP 423 Locked con temporizador', () => {
      component.form.patchValue({
        email: 'abogado.gonzalez@dokqet.com',
        password: 'ClaveErronea5'
      });

      const lockDate = new Date(Date.now() + 15 * 60 * 1000);
      spyOn(authService, 'login').and.returnValue(
        throwError(() => ({
          status: 423,
          error: {
            status: 423,
            title: 'Cuenta Bloqueada Temporalmente',
            detail: 'Has superado el número máximo de intentos permitidos (5).',
            lockedUntil: lockDate.toISOString(),
            minutesRemaining: 15
          }
        }))
      );

      component.onSubmit();
      fixture.detectChanges();

      expect(component.loading()).toBeFalse();
      expect(component.lockedInfo()).toBeTruthy();
      expect(component.lockedInfo()?.minutesRemaining).toBe(15);
      expect(component.countdownDisplay()).toBeTruthy();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Cuenta Bloqueada por Seguridad');
      expect(compiled.textContent).toContain('Restablecer contraseña');
    });

    it('debe limpiar el estado de bloqueo y notificar cuando el temporizador llega a cero', () => {
      const pastDate = new Date(Date.now() - 5000);
      component.startCountdown(pastDate);

      expect(component.lockedInfo()).toBeNull();
      expect(component.countdownDisplay()).toBe('');
      expect(component.accountUnlockedNotice()).toContain('El periodo de bloqueo por seguridad ha finalizado');
    });

    it('debe restablecer el estado de bloqueo si el login es exitoso', () => {
      component.form.patchValue({
        email: 'abogado.gonzalez@dokqet.com',
        password: 'ClaveCorrecta2026*'
      });

      spyOn(authService, 'login').and.returnValue(
        of({ success: true, data: {} as any })
      );

      component.onSubmit();

      expect(component.loading()).toBeFalse();
      expect(component.lockedInfo()).toBeNull();
      expect(component.warningAttempts()).toBeNull();
    });
  });
});
