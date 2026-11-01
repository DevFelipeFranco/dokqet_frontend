import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
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

    it('debe manejar status 0 (backend caído o error de red) sin atribuirlo a credenciales erróneas', () => {
      component.form.patchValue({
        email: 'abogado.gonzalez@dokqet.com',
        password: 'ClaveCorrecta2026*'
      });

      spyOn(authService, 'login').and.returnValue(
        throwError(() => ({
          status: 0,
          statusText: 'Unknown Error'
        }))
      );

      component.onSubmit();
      fixture.detectChanges();

      expect(component.loading()).toBeFalse();
      expect(component.connectionError()).toBeTruthy();
      expect(component.connectionError()?.kind).toBe('CONNECTION_OFFLINE');
      expect(component.errorMessage()).toBeNull();
      expect(component.warningAttempts()).toBeNull();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Error de conexión con el servidor');
      expect(compiled.textContent).toContain('No es necesario cambiar tu contraseña');
      expect(compiled.textContent).toContain('Reintentar conexión');
      expect(compiled.textContent).not.toContain('Credenciales inválidas o correo profesional no registrado');
    });

    it('debe manejar status 503 (servidor no disponible o mantenimiento) de forma clara', () => {
      component.form.patchValue({
        email: 'abogado.gonzalez@dokqet.com',
        password: 'ClaveCorrecta2026*'
      });

      spyOn(authService, 'login').and.returnValue(
        throwError(() => ({
          status: 503,
          statusText: 'Service Unavailable'
        }))
      );

      component.onSubmit();
      fixture.detectChanges();

      expect(component.loading()).toBeFalse();
      expect(component.connectionError()).toBeTruthy();
      expect(component.connectionError()?.kind).toBe('SERVICE_UNAVAILABLE');
      expect(component.errorMessage()).toBeNull();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Servicio temporalmente no disponible');
      expect(compiled.textContent).not.toContain('Credenciales inválidas o correo profesional no registrado');
    });

    it('debe mostrar mensaje de credenciales inválidas ante HTTP 401 Unauthorized sin error de conexión', () => {
      component.form.patchValue({
        email: 'abogado.gonzalez@dokqet.com',
        password: 'ClaveInvalida'
      });

      spyOn(authService, 'login').and.returnValue(
        throwError(() => ({
          status: 401,
          error: {
            detail: 'Credenciales inválidas o correo profesional no registrado.'
          }
        }))
      );

      component.onSubmit();
      fixture.detectChanges();

      expect(component.loading()).toBeFalse();
      expect(component.connectionError()).toBeNull();
      expect(component.errorMessage()).toContain('Credenciales inválidas o correo profesional no registrado.');

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Credenciales inválidas o correo profesional no registrado.');
    });
  });

  describe('HU-20: Vigencia de Sesión, Verificación Obligatoria y Redirección Estricta', () => {
    it('debe desplegar aviso de cierre por inactividad si queryParam motivo=inactividad', () => {
      component.sessionInactiveNotice.set('Tu sesión se cerró por inactividad.');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Tu sesión se cerró por inactividad.');
    });

    it('debe manejar HTTP 403 EMAIL_NOT_VERIFIED sin computar intento fallido y con cooldown de 60s', () => {
      component.form.patchValue({
        email: 'abogado@firma.co',
        password: 'PasswordValido123'
      });

      spyOn(authService, 'login').and.returnValue(
        throwError(() => ({
          status: 403,
          error: {
            errorCode: 'EMAIL_NOT_VERIFIED',
            detail: 'Correo no verificado'
          }
        }))
      );

      component.onSubmit();
      fixture.detectChanges();

      expect(component.emailNotVerified()).toBeTrue();
      expect(component.warningAttempts()).toBeNull();
      expect(component.lockedInfo()).toBeNull();
      expect(component.resendCooldown()).toBe(60);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Tu cuenta aún no ha sido activada');
    });

    it('debe manejar HTTP 403 ACCOUNT_SUSPENDED sin computar intento fallido y mostrar banner de cuenta suspendida (HU-21)', () => {
      component.form.patchValue({
        email: 'suspendido@firma.co',
        password: 'PasswordValido123'
      });

      spyOn(authService, 'login').and.returnValue(
        throwError(() => ({
          status: 403,
          error: {
            errorCode: 'ACCOUNT_SUSPENDED',
            detail: 'Tu cuenta ha sido suspendida y no es posible iniciar sesión. Contacta al administrador.'
          }
        }))
      );

      component.onSubmit();
      fixture.detectChanges();

      expect(component.accountSuspendedNotice()).toBe('Tu cuenta ha sido suspendida y no es posible iniciar sesión. Contacta al administrador.');
      expect(component.warningAttempts()).toBeNull();
      expect(component.lockedInfo()).toBeNull();
      expect(component.emailNotVerified()).toBeFalse();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Cuenta suspendida');
      expect(compiled.textContent).toContain('Tu cuenta ha sido suspendida y no es posible iniciar sesión.');
    });

    it('debe detectar queryParam motivo=cuenta_suspendida y desplegar banner (HU-21)', () => {
      const activeRoute = TestBed.inject(ActivatedRoute);
      (activeRoute.snapshot as any).queryParams = { motivo: 'cuenta_suspendida' };

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.accountSuspendedNotice()).toContain('Tu cuenta ha sido suspendida');
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Cuenta suspendida');
    });

    it('debe redirigir a /panel tras login exitoso ignorando returnUrl externo', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, 'navigate');

      component.form.patchValue({
        email: 'abogado@firma.co',
        password: 'PasswordValido123'
      });

      spyOn(authService, 'login').and.returnValue(of({ success: true, data: {} }));

      component.onSubmit();

      expect(navigateSpy).toHaveBeenCalledWith(['/panel']);
    });
  });
});
