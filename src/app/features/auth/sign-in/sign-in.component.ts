import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { ProblemDetailAccountLocked } from '../../../core/models/user.model';
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

  private countdownTimer: any = null;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.stopCountdown();
    });
  }

  ngOnInit(): void {
    const emailParam = this.route.snapshot.queryParams['email'];
    if (emailParam) {
      this.form.patchValue({ email: emailParam });
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
    this.warningAttempts.set(null);
    this.accountUnlockedNotice.set(null);

    const email = this.form.value.email?.trim().toLowerCase() || '';
    const password = this.form.value.password || '';

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.stopCountdown();
        this.lockedInfo.set(null);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/panel';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);

        // Caso 1: Cuenta bloqueada temporalmente (HTTP 423 Locked)
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
          this.errorMessage.set(null);
          return;
        }

        // Caso 2: Intento fallido antes del umbral de bloqueo (HTTP 400 Bad Request)
        if (err.status === 400) {
          const msg: string = err.error?.detail || err.error?.message || '';
          const match = msg.match(/quedan\s+(\d+)\s+intento/i);
          if (match) {
            const remaining = parseInt(match[1], 10);
            this.warningAttempts.set(remaining);
          } else {
            this.warningAttempts.set(null);
          }
          this.errorMessage.set(msg || 'Credenciales incorrectas.');
          return;
        }

        // Caso 3: Otros errores
        this.warningAttempts.set(null);
        this.errorMessage.set(err.error?.detail || err.error?.message || 'Credenciales inválidas o correo profesional no registrado.');
      }
    });
  }
}
