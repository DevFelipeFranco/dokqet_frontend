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
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  ngOnInit(): void {
    const emailParam = this.route.snapshot.queryParams['email'];
    if (emailParam) {
      this.form.patchValue({ email: emailParam });
    }
  }

  /**
   * Solicita el enlace seguro de restablecimiento de contraseña
   */
  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const email = this.form.value.email!.trim().toLowerCase();

    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message || 'Si la cuenta existe, te enviamos un enlace de recuperación. Revisa tu correo.');
      },
      error: (err) => {
        this.loading.set(false);
        const parsed = parseHttpAuthError(err);
        if (parsed.isConnectionOrServerError) {
          this.errorMessage.set(parsed.message);
        } else {
          this.errorMessage.set(err.error?.message || 'Error al procesar la solicitud.');
        }
      }
    });
  }
}
