import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { parseHttpAuthError } from '../../../core/utils/http-error.utils';
import {
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  CardFooterComponent,
  ButtonComponent,
  FormAlertComponent,
  LogoComponent
} from '../../../shared/components/ui';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    ButtonComponent,
    FormAlertComponent,
    LogoComponent
  ],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly token = signal<string | null>(null);
  readonly loading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token');
    this.token.set(t);
  }

  /**
   * Valida y envía la nueva contraseña para el token actual
   */
  onSubmit(): void {
    if (this.form.invalid || !this.token()) return;

    const { newPassword, confirmPassword } = this.form.value;
    if (newPassword !== confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.resetPassword(this.token()!, newPassword!).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message || 'Contraseña actualizada exitosamente.');
      },
      error: (err) => {
        this.loading.set(false);
        const parsed = parseHttpAuthError(err);
        if (parsed.isConnectionOrServerError) {
          this.errorMessage.set(parsed.message);
        } else {
          this.errorMessage.set(err.error?.message || 'El enlace de recuperación es inválido o ha expirado.');
        }
      }
    });
  }
}
