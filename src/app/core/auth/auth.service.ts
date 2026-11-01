import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, of, tap } from 'rxjs';
import { AuthResponse, OrganizationSummary, SessionHeartbeatResponse, SignUpResponse, User, VerifyEmailResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = 'http://localhost:8080/api/v1/auth';

  constructor() {}

  private getSavedUser(): User | null {
    try {
      const saved = localStorage.getItem('dokqet_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  private getSavedOrganizations(): OrganizationSummary[] {
    try {
      const saved = localStorage.getItem('dokqet_user_orgs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  // Signals reactivos con persistencia resiliente ante recargas de página (F5)
  private currentUserSignal = signal<User | null>(this.getSavedUser());
  private accessTokenSignal = signal<string | null>(localStorage.getItem('dokqet_paseto_access'));
  private refreshTokenSignal = signal<string | null>(localStorage.getItem('dokqet_paseto_refresh'));
  private activeOrgIdSignal = signal<string | null>(localStorage.getItem('dokqet_active_org'));
  private currentRoleSignal = signal<string | null>(localStorage.getItem('dokqet_role'));
  private organizationsSignal = signal<OrganizationSummary[]>(this.getSavedOrganizations());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly refreshTokenValue = this.refreshTokenSignal.asReadonly();
  readonly activeOrgId = this.activeOrgIdSignal.asReadonly();
  readonly currentRole = this.currentRoleSignal.asReadonly();
  readonly organizations = this.organizationsSignal.asReadonly();

  readonly isAuthenticated = computed(() => !!this.accessTokenSignal());
  readonly isEmailVerified = computed(() => !!this.currentUserSignal()?.emailVerified);
  readonly isAdmin = computed(() => this.currentRoleSignal() === 'ADMIN');
  readonly isSuperAdmin = computed(() => this.currentRoleSignal() === 'SUPER_ADMIN' || !!this.currentUserSignal()?.isSuperAdmin);

  /**
   * Inicializador de autenticación ejecutado en el arranque de Angular (provideAppInitializer).
   * Refresca la sesión si existen credenciales previas sin expulsar al usuario ante fallos de red transitorios.
   */
  async initAuth(): Promise<void> {
    const hasExistingAccess = !!this.accessTokenSignal();
    const hasExistingRefresh = !!this.refreshTokenSignal();

    if (!hasExistingAccess && !hasExistingRefresh) {
      return;
    }

    try {
      await firstValueFrom(this.refreshToken());
    } catch (err: any) {
      // Solo limpiamos la sesión si el servidor confirma explícitamente token inválido o revocado
      if (err?.status === 401 || (!hasExistingAccess && (err?.status === 400 || err?.status === 403))) {
        this.clearSessionState();
      }
    }
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<{ success: boolean; data: AuthResponse }>(
      `${this.API_URL}/login`,
      credentials,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  /**
   * Registra un nuevo usuario en Dokqet (HU-20).
   * No guarda tokens de sesión ni realiza auto-login ya que la cuenta queda
   * en estado pendiente de verificación de correo electrónico.
   */
  register(data: any): Observable<{ success: boolean; data: SignUpResponse; message?: string }> {
    return this.http.post<{ success: boolean; data: SignUpResponse; message?: string }>(
      `${this.API_URL}/register`,
      data,
      { withCredentials: true }
    );
  }

  signUp(data: any): Observable<{ success: boolean; data: SignUpResponse; message?: string }> {
    return this.register(data);
  }

  /**
   * Solicita la renovación del accessToken enviando el refreshToken en el body
   * y adjuntando credenciales (cookie HttpOnly si está disponible en el navegador).
   */
  refreshToken(): Observable<{ success: boolean; data: AuthResponse }> {
    const savedRefresh = this.refreshTokenSignal() || localStorage.getItem('dokqet_paseto_refresh');
    const body = savedRefresh ? { refreshToken: savedRefresh } : {};

    return this.http.post<{ success: boolean; data: AuthResponse }>(
      `${this.API_URL}/refresh`,
      body,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  /**
   * Verificación idempotente de correo electrónico (HU-20).
   * Devuelve estado ACTIVATED, EXPIRED o INVALID, y conserva el token de invitación si existe.
   */
  verifyEmail(token: string, invitationToken?: string): Observable<{ success: boolean; data: VerifyEmailResponse; message?: string }> {
    const body: { token: string; invitationToken?: string } = { token };
    if (invitationToken) {
      body.invitationToken = invitationToken;
    }

    return this.http.post<{ success: boolean; data: VerifyEmailResponse; message?: string }>(
      `${this.API_URL}/verify-email`,
      body,
      { withCredentials: true }
    ).pipe(
      tap(res => {
        if (res.data?.status === 'ACTIVATED') {
          const current = this.currentUserSignal();
          if (current) {
            this.updateCurrentUser({ ...current, emailVerified: true });
          }
        }
      })
    );
  }

  /**
   * Heartbeat para mantener y validar la vigencia de sesión activa (HU-20).
   * Actualiza lastActiveAt y evalúa inactividad / corte de las 3:00 a. m. COT en el backend.
   */
  sendHeartbeat(): Observable<{ success: boolean; data: SessionHeartbeatResponse }> {
    return this.http.post<{ success: boolean; data: SessionHeartbeatResponse }>(
      `${this.API_URL}/session/heartbeat`,
      {},
      { withCredentials: true }
    );
  }

  resendVerificationEmail(email?: string): Observable<any> {
    const body = email ? { email } : {};
    return this.http.post<{ success: boolean; message: string }>(
      `${this.API_URL}/resend-verification`,
      body,
      { withCredentials: true }
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/reset-password`, { token, newPassword });
  }

  logout(): void {
    this.http.post(`${this.API_URL}/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(null))
    ).subscribe({
      complete: () => {
        this.clearSessionState();
        this.router.navigate(['/iniciar-sesion']);
      }
    });
  }

  clearSessionState(): void {
    localStorage.removeItem('dokqet_user');
    localStorage.removeItem('dokqet_user_orgs');
    localStorage.removeItem('dokqet_paseto_access');
    localStorage.removeItem('dokqet_paseto_refresh');
    localStorage.removeItem('dokqet_active_org');
    localStorage.removeItem('dokqet_role');

    this.currentUserSignal.set(null);
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.activeOrgIdSignal.set(null);
    this.currentRoleSignal.set(null);
    this.organizationsSignal.set([]);
  }

  updateCurrentUser(user: User): void {
    this.currentUserSignal.set(user);
    localStorage.setItem('dokqet_user', JSON.stringify(user));
  }

  setSession(data: AuthResponse): void {
    this.currentUserSignal.set(data.user);
    this.accessTokenSignal.set(data.accessToken);
    if (data.refreshToken) {
      this.refreshTokenSignal.set(data.refreshToken);
      localStorage.setItem('dokqet_paseto_refresh', data.refreshToken);
    }
    this.activeOrgIdSignal.set(data.activeOrganizationId);
    this.currentRoleSignal.set(data.role);

    localStorage.setItem('dokqet_user', JSON.stringify(data.user));
    localStorage.setItem('dokqet_paseto_access', data.accessToken);
    localStorage.setItem('dokqet_active_org', data.activeOrganizationId);
    localStorage.setItem('dokqet_role', data.role);

    if (data.organizations && data.organizations.length > 0) {
      this.organizationsSignal.set(data.organizations);
      localStorage.setItem('dokqet_user_orgs', JSON.stringify(data.organizations));
    }
  }

  updateTokens(accessToken: string, refreshToken?: string, orgId?: string, role?: string, organizations?: OrganizationSummary[]): void {
    this.accessTokenSignal.set(accessToken);
    localStorage.setItem('dokqet_paseto_access', accessToken);

    if (refreshToken) {
      this.refreshTokenSignal.set(refreshToken);
      localStorage.setItem('dokqet_paseto_refresh', refreshToken);
    }
    if (orgId) {
      this.activeOrgIdSignal.set(orgId);
      localStorage.setItem('dokqet_active_org', orgId);
    }
    if (role) {
      this.currentRoleSignal.set(role);
      localStorage.setItem('dokqet_role', role);
    }

    if (organizations && organizations.length > 0) {
      this.organizationsSignal.set(organizations);
      localStorage.setItem('dokqet_user_orgs', JSON.stringify(organizations));
    }
  }

  updateOrganizations(organizations: OrganizationSummary[]): void {
    if (organizations && organizations.length > 0) {
      this.organizationsSignal.set(organizations);
      localStorage.setItem('dokqet_user_orgs', JSON.stringify(organizations));
    }
  }
}
