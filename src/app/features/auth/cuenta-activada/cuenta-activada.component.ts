import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import {
  CardComponent,
  CardContentComponent,
  CardDescriptionComponent,
  CardFooterComponent,
  CardHeaderComponent,
  CardTitleComponent,
  FormAlertComponent,
  LogoComponent
} from '../../../shared/components/ui';

export type ActivationState = 'LOADING' | 'ACTIVATED' | 'EXPIRED' | 'INVALID';

@Component({
  selector: 'app-cuenta-activada',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    FormAlertComponent,
    LogoComponent
  ],
  templateUrl: './cuenta-activada.component.html'
})
export class CuentaActivadaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<ActivationState>('LOADING');
  readonly invitationToken = signal<string | null>(null);
  readonly userEmail = signal<string>('');

  // Estados de reenvío si el token está expirado
  readonly resendEmail = signal<string>('');
  readonly resending = signal<boolean>(false);
  readonly resendSuccess = signal<string | null>(null);
  readonly resendError = signal<string | null>(null);
  readonly cooldownRemaining = signal<number>(0);

  private cooldownTimer: any = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearCooldownTimer();
    });
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];
    const invitacion = this.route.snapshot.queryParams['invitacion'] || this.route.snapshot.queryParams['invitationToken'];

    if (invitacion) {
      this.invitationToken.set(invitacion);
    }

    if (!token) {
      this.state.set('INVALID');
      return;
    }

    this.verifyToken(token, invitacion);
  }

  /**
   * Ejecuta la verificación idempotente del token contra el backend
   */
  private verifyToken(token: string, invitation?: string): void {
    this.state.set('LOADING');

    this.authService.verifyEmail(token, invitation).subscribe({
      next: (res) => {
        const payload = res?.data;
        const status = (payload?.status || '').toUpperCase();

        if (payload?.invitationToken) {
          this.invitationToken.set(payload.invitationToken);
        }
        if (payload?.email) {
          this.userEmail.set(payload.email);
          this.resendEmail.set(payload.email);
        }

        if (status === 'ACTIVATED') {
          this.state.set('ACTIVATED');
        } else if (status === 'EXPIRED') {
          this.state.set('EXPIRED');
        } else {
          this.state.set('INVALID');
        }
      },
      error: (err) => {
        const errorStatus = err?.error?.data?.status || err?.error?.status;
        if (errorStatus === 'EXPIRED' || err?.error?.detail?.toLowerCase()?.includes('expir')) {
          this.state.set('EXPIRED');
        } else {
          this.state.set('INVALID');
        }
      }
    });
  }

  /**
   * Reenvía enlace de activación si el actual ha vencido (cooldown de 60s)
   */
  submitResend(): void {
    const emailToUse = this.resendEmail().trim() || this.userEmail().trim();
    if (!emailToUse || this.resending() || this.cooldownRemaining() > 0) return;

    this.resending.set(true);
    this.resendSuccess.set(null);
    this.resendError.set(null);

    this.authService.resendVerificationEmail(emailToUse).subscribe({
      next: () => {
        this.resending.set(false);
        this.resendSuccess.set('Se ha enviado un nuevo enlace de activación a tu buzón.');
        this.startCooldown(60);
      },
      error: (err) => {
        this.resending.set(false);
        this.resendError.set(err.error?.detail || err.error?.message || 'Error al solicitar el reenvío. Intenta de nuevo.');
      }
    });
  }

  private startCooldown(seconds: number): void {
    this.clearCooldownTimer();
    this.cooldownRemaining.set(seconds);

    this.cooldownTimer = setInterval(() => {
      const current = this.cooldownRemaining();
      if (current <= 1) {
        this.clearCooldownTimer();
        this.cooldownRemaining.set(0);
      } else {
        this.cooldownRemaining.set(current - 1);
      }
    }, 1000);
  }

  private clearCooldownTimer(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  /**
   * Retorna los queryParams a pasar a la vista de login preservando ?invitacion si existe
   */
  getLoginQueryParams(): Record<string, string> {
    const inv = this.invitationToken();
    return inv ? { invitacion: inv } : {};
  }
}
