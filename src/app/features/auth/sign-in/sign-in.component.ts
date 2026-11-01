import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { ProblemDetailAccountLocked } from '../../../core/models/user.model';
import { parseHttpAuthError, ParsedHttpError } from '../../../core/utils/http-error.utils';
import { 
  ButtonComponent, 
  FormAlertComponent,
  LogoComponent
} from '../../../shared/components/ui';

export interface LockInfoState {
  lockedUntil: Date;
  minutesRemaining: number;
  detail: string;
}

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink,
    ButtonComponent,
    FormAlertComponent,
    LogoComponent
  ],
  templateUrl: './sign-in.component.html'
})
export class SignInComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly capsLockActive = signal(false);

  // Estados de control de bloqueo y advertencias (HU-17)
  readonly lockedInfo = signal<LockInfoState | null>(null);
  readonly countdownDisplay = signal<string>('');
  readonly warningAttempts = signal<number | null>(null);
  readonly accountUnlockedNotice = signal<string | null>(null);
  readonly connectionError = signal<ParsedHttpError | null>(null);

  // Estados de vigencia de sesión y activación de cuenta (HU-20)
  readonly sessionInactiveNotice = signal<string | null>(null);
  readonly emailNotVerified = signal<boolean>(false);
  readonly resendingVerification = signal<boolean>(false);
  readonly resendCooldown = signal<number>(0);
  readonly resendSuccess = signal<string | null>(null);
  readonly resendError = signal<string | null>(null);

  // Estado de cuenta suspendida (HU-21 / US-020)
  readonly accountSuspendedNotice = signal<string | null>(null);

  private countdownTimer: any = null;
  private resendTimer: any = null;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.stopCountdown();
      this.clearResendTimer();
    });
  }

  ngOnInit(): void {
    const emailParam = this.route.snapshot.queryParams['email'];
    if (emailParam) {
      this.form.patchValue({ email: emailParam });
    }

    if (this.route.snapshot.queryParams['motivo'] === 'inactividad') {
      this.sessionInactiveNotice.set('Tu sesión se cerró por inactividad.');
    } else if (this.route.snapshot.queryParams['motivo'] === 'cuenta_suspendida') {
      this.accountSuspendedNotice.set('Tu cuenta ha sido suspendida y no es posible iniciar sesión. Contacta al administrador.');
    }
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  /**
   * Detecta si la tecla Bloq Mayús está activada para advertir al usuario
   */
  checkCapsLock(event: KeyboardEvent): void {
    if (typeof event.getModifierState === 'function') {
      this.capsLockActive.set(event.getModifierState('CapsLock'));
    }
  }

  /**
   * Inicia el temporizador regresivo hasta la fecha/hora de desbloqueo (lockedUntil)
   */
  startCountdown(lockedUntil: Date): void {
    this.stopCountdown();

    const updateTimer = () => {
      const diffMs = lockedUntil.getTime() - Date.now();
      if (diffMs <= 0) {
        this.stopCountdown();
        this.lockedInfo.set(null);
        this.countdownDisplay.set('');
        this.accountUnlockedNotice.set('El periodo de bloqueo por seguridad ha finalizado. Puedes intentar iniciar sesión nuevamente.');
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      this.countdownDisplay.set(
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateTimer();
    this.countdownTimer = setInterval(updateTimer, 1000);
  }

  /**
   * Detiene y limpia el temporizador de cuenta regresiva
   */
  stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  /**
   * Envía las credenciales para autenticación en Dokqet
   */
  onSubmit(): void {
    if (this.form.invalid || this.lockedInfo()) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.connectionError.set(null);
    this.warningAttempts.set(null);
    this.accountUnlockedNotice.set(null);
    this.sessionInactiveNotice.set(null);
    this.accountSuspendedNotice.set(null);
    this.emailNotVerified.set(false);

    const email = this.form.value.email?.trim().toLowerCase() || '';
    const password = this.form.value.password || '';

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.stopCountdown();
        this.clearResendTimer();
        this.lockedInfo.set(null);
        this.connectionError.set(null);

        // [HU-20 RN-FE-05] Redirección segura: Si viene con invitación va a la invitación, si no estrictamente a /panel
        const invToken = this.route.snapshot.queryParams['invitacion'];
        if (invToken) {
          this.router.navigate(['/invitacion', invToken]);
        } else {
          this.router.navigate(['/panel']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        const parsed = parseHttpAuthError(err);
        const errorCode = err?.error?.errorCode;

        // Caso 0A: Cuenta suspendida (HTTP 403 Forbidden con ACCOUNT_SUSPENDED - HU-21 / US-020)
        // NO computa como intento fallido de contraseña ni altera bloqueo temporal
        if ((err.status === 403 || err.status === 401) && (errorCode === 'ACCOUNT_SUSPENDED' || parsed.kind === 'ACCOUNT_SUSPENDED')) {
          this.accountSuspendedNotice.set('Tu cuenta ha sido suspendida y no es posible iniciar sesión. Contacta al administrador.');
          this.warningAttempts.set(null);
          this.errorMessage.set(null);
          this.connectionError.set(null);
          this.emailNotVerified.set(false);
          return;
        }

        // Caso 0B: Correo no verificado (HTTP 403 Forbidden con EMAIL_NOT_VERIFIED - HU-20)
        // NO computa como intento fallido de contraseña errónea ni bloquea la cuenta
        if (err.status === 403 && (errorCode === 'EMAIL_NOT_VERIFIED' || parsed.kind === 'EMAIL_NOT_VERIFIED')) {
          this.emailNotVerified.set(true);
          this.warningAttempts.set(null);
          this.errorMessage.set(null);
          this.connectionError.set(null);
          this.startResendCooldown(60);
          return;
        }

        // Caso 1: Servidor no disponible, conexión caída o fallas 5xx
        if (parsed.isConnectionOrServerError) {
          this.connectionError.set(parsed);
          this.warningAttempts.set(null);
          this.errorMessage.set(null);
          return;
        }

        // Caso 2: Cuenta bloqueada temporalmente (HTTP 423 Locked)
        if (err.status === 423) {
          const errorPayload: ProblemDetailAccountLocked | undefined = err.error;
          const lockedUntilStr = errorPayload?.lockedUntil;
          const lockedDate = lockedUntilStr ? new Date(lockedUntilStr) : new Date(Date.now() + 15 * 60 * 1000);
          const minutes = Number(errorPayload?.minutesRemaining) || 15;
          const detail = errorPayload?.detail || errorPayload?.message || 'Cuenta bloqueada temporalmente por motivos de seguridad.';

          this.lockedInfo.set({
            lockedUntil: lockedDate,
            minutesRemaining: minutes,
            detail
          });
          this.startCountdown(lockedDate);
          this.connectionError.set(null);
          this.errorMessage.set(null);
          return;
        }

        // Caso 3: Intento fallido con advertencia de intentos restantes (HTTP 400 Bad Request)
        if (err.status === 400) {
          const msg: string = err.error?.detail || err.error?.message || '';
          const match = msg.match(/quedan\s+(\d+)\s+intento/i);
          if (match) {
            const remaining = parseInt(match[1], 10);
            this.warningAttempts.set(remaining);
          } else {
            this.warningAttempts.set(null);
          }
          this.connectionError.set(null);
          this.errorMessage.set(msg || 'Credenciales incorrectas.');
          return;
        }

        // Caso 4: Credenciales inválidas explícitas (HTTP 401, 404 u otros 4xx)
        this.connectionError.set(null);
        this.warningAttempts.set(null);
        this.errorMessage.set(parsed.message);
      }
    });
  }

  /**
   * Reenvía correo de verificación para cuenta no verificada (HU-20)
   */
  resendVerification(): void {
    const email = this.form.value.email?.trim().toLowerCase();
    if (!email || this.resendingVerification() || this.resendCooldown() > 0) return;

    this.resendingVerification.set(true);
    this.resendSuccess.set(null);
    this.resendError.set(null);

    this.authService.resendVerificationEmail(email).subscribe({
      next: () => {
        this.resendingVerification.set(false);
        this.resendSuccess.set('Correo de verificación reenviado exitosamente. Revisa tu bandeja de entrada.');
        this.startResendCooldown(60);
      },
      error: (err) => {
        this.resendingVerification.set(false);
        this.resendError.set(err.error?.detail || err.error?.message || 'Error al reenviar el correo. Intenta de nuevo más tarde.');
      }
    });
  }

  startResendCooldown(seconds: number): void {
    this.clearResendTimer();
    this.resendCooldown.set(seconds);

    this.resendTimer = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.clearResendTimer();
        this.resendCooldown.set(0);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}
