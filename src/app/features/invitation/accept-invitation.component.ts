import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { OrganizationService } from '../../core/services/organization.service';
import { OrganizationStore } from '../../core/state/organization.store';
import { Invitation } from '../../core/models/organization.model';
import {
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  CardFooterComponent,
  ButtonComponent,
  FormAlertComponent,
  BadgeComponent,
  BadgeVariant,
  LogoComponent
} from '../../shared/components/ui';

@Component({
  selector: 'app-accept-invitation',
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
    ButtonComponent,
    FormAlertComponent,
    BadgeComponent,
    LogoComponent
  ],
  templateUrl: './accept-invitation.component.html'
})
export class AcceptInvitationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly orgService = inject(OrganizationService);
  private readonly orgStore = inject(OrganizationStore);

  readonly token = signal<string>('');
  readonly loading = signal<boolean>(true);
  readonly processing = signal<boolean>(false);
  readonly invitation = signal<Invitation | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly currentUser = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly isCorrectUser = computed(() => {
    const user = this.currentUser();
    const inv = this.invitation();
    if (!user || !inv) return false;
    return user.email.toLowerCase() === inv.email.toLowerCase();
  });

  readonly isDifferentUser = computed(() => {
    const user = this.currentUser();
    const inv = this.invitation();
    if (!user || !inv) return false;
    return user.email.toLowerCase() !== inv.email.toLowerCase();
  });

  readonly statusBadgeVariant = computed<BadgeVariant>(() => {
    const s = this.invitation()?.status;
    switch (s) {
      case 'ACCEPTED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
      case 'CANCELED':
      case 'EXPIRED':
        return 'destructive';
      default:
        return 'secondary';
    }
  });

  readonly statusLabel = computed<string>(() => {
    const s = this.invitation()?.status;
    switch (s) {
      case 'ACCEPTED':
        return 'Aceptada';
      case 'PENDING':
        return 'Pendiente';
      case 'REJECTED':
        return 'Rechazada';
      case 'CANCELED':
        return 'Cancelada';
      case 'EXPIRED':
        return 'Expirada';
      default:
        return s || '';
    }
  });

  ngOnInit(): void {
    const t = this.route.snapshot.paramMap.get('token');
    if (!t) {
      this.errorMessage.set('Token de invitación no encontrado en la URL.');
      this.loading.set(false);
      return;
    }
    this.token.set(t);
    this.loadInvitation(t);
  }

  loadInvitation(token: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.orgService.getInvitationByToken(token).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.invitation.set(res.data);
        } else {
          this.errorMessage.set('No se pudo encontrar la invitación.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'La invitación no existe o el enlace ha caducado.');
      }
    });
  }

  onAccept(): void {
    this.processing.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.orgService.respondInvitation(this.token(), true).subscribe({
      next: (res) => {
        this.processing.set(false);
        this.successMessage.set(res.message || '¡Invitación aceptada exitosamente!');
        this.invitation.update(inv => inv ? { ...inv, status: 'ACCEPTED' } : null);

        const orgId = this.invitation()?.organizationId;
        if (orgId) {
          this.orgStore.switchOrganization(orgId).subscribe({
            next: () => {
              setTimeout(() => this.router.navigate(['/panel']), 1500);
            },
            error: () => {
              this.orgStore.refreshOrganizations();
              setTimeout(() => this.router.navigate(['/panel']), 1500);
            }
          });
        } else {
          this.orgStore.refreshOrganizations();
          setTimeout(() => this.router.navigate(['/panel']), 1500);
        }
      },
      error: (err) => {
        this.processing.set(false);
        this.errorMessage.set(err.error?.message || 'Ocurrió un error al responder a la invitación.');
      }
    });
  }

  onReject(): void {
    this.processing.set(true);
    this.errorMessage.set(null);

    this.orgService.respondInvitation(this.token(), false).subscribe({
      next: () => {
        this.processing.set(false);
        this.invitation.update(inv => inv ? { ...inv, status: 'REJECTED' } : null);
        this.successMessage.set('Has rechazado la invitación.');
      },
      error: (err) => {
        this.processing.set(false);
        this.errorMessage.set(err.error?.message || 'Error al procesar la respuesta.');
      }
    });
  }

  logoutAndSwitchAccount(): void {
    const invEmail = this.invitation()?.email || '';
    const currentToken = this.token();
    this.authService.logout();
    this.router.navigate(['/iniciar-sesion'], {
      queryParams: {
        returnUrl: `/invitacion/${currentToken}`,
        email: invEmail
      }
    });
  }
}
