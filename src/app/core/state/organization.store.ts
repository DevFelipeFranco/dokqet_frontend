import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrganizationStore {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API_URL = 'http://localhost:8080/api/v1/organizations';

  private activeOrgSignal = signal<any | null>(null);

  readonly activeOrg = this.activeOrgSignal.asReadonly();
  readonly organizations = this.authService.organizations;

  readonly isAdmin = computed(() => this.authService.isAdmin());

  constructor() {
    // Si la sesión ya cuenta con una organización activa persistida, inicializar sus detalles de inmediato
    if (this.authService.activeOrgId()) {
      this.loadActiveOrganization();
    }
  }

  loadActiveOrganization(): void {
    const orgId = this.authService.activeOrgId();
    if (orgId) {
      this.http.get<{ success: boolean; data: any }>(`${this.API_URL}/${orgId}`).subscribe({
        next: (res) => {
          if (res.success) {
            this.activeOrgSignal.set(res.data);
          }
        },
        error: (err) => {
          console.warn('[OrganizationStore] No se pudo cargar la organización activa:', err);
        }
      });
      this.refreshOrganizations();
    }
  }

  refreshOrganizations(): void {
    this.http.get<{ success: boolean; data: any[] }>(this.API_URL).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.authService.updateOrganizations(res.data);
        }
      },
      error: () => {
        // Silencioso
      }
    });
  }

  switchOrganization(organizationId: string): Observable<any> {
    return this.http.post<{ success: boolean; data: any }>(`${this.API_URL}/switch?organizationId=${organizationId}`, {}).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.authService.updateTokens(
            res.data.accessToken,
            res.data.refreshToken,
            res.data.activeOrganizationId,
            res.data.role,
            res.data.organizations
          );
          this.loadActiveOrganization();
        }
      })
    );
  }
}
