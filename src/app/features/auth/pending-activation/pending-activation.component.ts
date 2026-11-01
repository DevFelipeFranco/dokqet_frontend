import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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

export interface WebmailProvider {
  name: string;
  url: string;
  icon: 'gmail' | 'outlook' | 'yahoo';
}

@Component({
  selector: 'app-pending-activation',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    FormAlertComponent,
    LogoComponent
  ],
  templateUrl: './pending-activation.component.html'
})
export class PendingActivationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly email = signal<string>('');
  readonly resending = signal<boolean>(false);
  readonly cooldownRemaining = signal<number>(0);
  readonly resendSuccess = signal<string | null>(null);
  readonly resendError = signal<string | null>(null);

  private cooldownTimer: any = null;

  readonly webmailProvider = computed<WebmailProvider | null>(() => {
    const mail = this.email().toLowerCase().trim();
    if (!mail.includes('@')) return null;

    if (mail.endsWith('@gmail.com') || mail.endsWith('@googlemail.com')) {
      return { name: 'Abrir Gmail', url: 'https://mail.google.com', icon: 'gmail' };
    }
    if (
      mail.endsWith('@outlook.com') ||
      mail.endsWith('@hotmail.com') ||
      mail.endsWith('@live.com') ||
      mail.endsWith('@msn.com')
    ) {
      return { name: 'Abrir Outlook', url: 'https://outlook.live.com', icon: 'outlook' };
    }
    if (mail.endsWith('@yahoo.com') || mail.endsWith('@ymail.com')) {
      return { name: 'Abrir Yahoo Mail', url: 'https://mail.yahoo.com', icon: 'yahoo' };
    }

    return null;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearCooldownTimer();
    });
  }

  ngOnInit(): void {
    const emailParam = this.route.snapshot.queryParams['email'];
    if (emailParam) {
      this.email.set(emailParam);
    }
  }

  /**
   * Reenvía el correo de verificación con cooldown de 60 segundos
   */
  resendEmail(): void {
    const emailVal = this.email().trim();
    if (this.resending() || this.cooldownRemaining() > 0) return;

    this.resending.set(true);
    this.resendSuccess.set(null);
    this.resendError.set(null);

    this.authService.resendVerificationEmail(emailVal || undefined).subscribe({
      next: () => {
        this.resending.set(false);
        this.resendSuccess.set('Correo de verificación reenviado exitosamente. Revisa tu buzón y carpeta de spam.');
        this.startCooldown(60);
      },
      error: (err) => {
        this.resending.set(false);
        const msg = err.error?.detail || err.error?.message || 'No fue posible reenviar el correo en este momento. Intenta de nuevo más tarde.';
        this.resendError.set(msg);
      }
    });
  }

  startCooldown(seconds: number): void {
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
}
