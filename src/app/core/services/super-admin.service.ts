import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminAction,
  AdminActionType,
  AdminApiResponse,
  AdminMember,
  AdminOrganizationDetail,
  AdminOrganizationSummary,
  AdminPlatformOverview,
  AdminSuperAdminRoleRequest,
  AdminUserDetail,
  AdminUserReasonRequest,
  AdminUserStatusFilter,
  AdminUserSummary,
  PageResponse
} from '../models/super-admin.model';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1/admin';

  /**
   * Obtiene las métricas consolidadas de la plataforma para observabilidad global
   */
  getPlatformOverview(): Observable<AdminApiResponse<AdminPlatformOverview>> {
    return this.http.get<AdminApiResponse<AdminPlatformOverview>>(`${this.API_URL}/overview`);
  }

  /**
   * Consulta el listado paginado de organizaciones con métricas de miembros y procesos
   */
  getOrganizations(
    page: number = 0,
    size: number = 10,
    search?: string
  ): Observable<AdminApiResponse<PageResponse<AdminOrganizationSummary>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<AdminApiResponse<PageResponse<AdminOrganizationSummary>>>(
      `${this.API_URL}/organizations`,
      { params }
    );
  }

  /**
   * Obtiene el detalle administrativo de una organización específica
   */
  getOrganizationDetail(id: string): Observable<AdminApiResponse<AdminOrganizationDetail>> {
    return this.http.get<AdminApiResponse<AdminOrganizationDetail>>(`${this.API_URL}/organizations/${id}`);
  }

  /**
   * Obtiene la conformación y lista de integrantes de una organización
   */
  getOrganizationMembers(id: string): Observable<AdminApiResponse<AdminMember[]>> {
    return this.http.get<AdminApiResponse<AdminMember[]>>(`${this.API_URL}/organizations/${id}/members`);
  }

  /**
   * Obtiene el resumen de usuarios vinculados a una organización
   */
  getOrganizationUsers(id: string): Observable<AdminApiResponse<AdminUserSummary[]>> {
    return this.http.get<AdminApiResponse<AdminUserSummary[]>>(`${this.API_URL}/organizations/${id}/users`);
  }

  /**
   * Búsqueda paginada de usuarios en plataforma con coincidencia unaccent y filtro de estado (HU-21 / US-020)
   */
  searchUsers(
    q?: string,
    status: AdminUserStatusFilter = 'ALL',
    page: number = 0,
    size: number = 50
  ): Observable<AdminApiResponse<PageResponse<AdminUserSummary>>> {
    let params = new HttpParams()
      .set('status', status)
      .set('page', page.toString())
      .set('size', size.toString());

    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }

    return this.http.get<AdminApiResponse<PageResponse<AdminUserSummary>>>(
      `${this.API_URL}/users`,
      { params }
    );
  }

  /**
   * Consulta la ficha integral de soporte de un usuario (HU-21)
   */
  getUserDetail(id: string): Observable<AdminApiResponse<AdminUserDetail>> {
    return this.http.get<AdminApiResponse<AdminUserDetail>>(`${this.API_URL}/users/${id}`);
  }

  /**
   * Suspende la cuenta de un usuario con motivo obligatorio y revocación de sesiones (HU-21)
   */
  suspendUser(id: string, reason: string): Observable<AdminApiResponse<AdminUserSummary>> {
    const payload: AdminUserReasonRequest = { reason };
    return this.http.post<AdminApiResponse<AdminUserSummary>>(
      `${this.API_URL}/users/${id}/suspend`,
      payload
    );
  }

  /**
   * Reactiva la cuenta de un usuario suspendido con motivo obligatorio (HU-21)
   */
  reactivateUser(id: string, reason: string): Observable<AdminApiResponse<AdminUserSummary>> {
    const payload: AdminUserReasonRequest = { reason };
    return this.http.post<AdminApiResponse<AdminUserSummary>>(
      `${this.API_URL}/users/${id}/reactivate`,
      payload
    );
  }

  /**
   * Desbloquea la cuenta de un usuario bloqueada por intentos fallidos de login (HU-23 / US-028)
   */
  unlockUser(id: string, reason?: string): Observable<AdminApiResponse<AdminUserSummary>> {
    const payload: AdminUserReasonRequest = {
      reason: reason?.trim() || 'Desbloqueo administrativo de seguridad por soporte técnico'
    };
    return this.http.post<AdminApiResponse<AdminUserSummary>>(
      `${this.API_URL}/users/${id}/unlock`,
      payload
    );
  }

  /**
   * Otorga el rol de Super Administrador con confirmación de clave actual del actor (HU-21)
   */
  grantSuperAdmin(id: string, currentPassword: string, reason?: string): Observable<AdminApiResponse<AdminUserSummary>> {
    const payload: AdminSuperAdminRoleRequest = { currentPassword, reason };
    return this.http.post<AdminApiResponse<AdminUserSummary>>(
      `${this.API_URL}/users/${id}/super-admin/grant`,
      payload
    );
  }

  /**
   * Revoca el rol de Super Administrador con confirmación de clave actual del actor (HU-21)
   */
  revokeSuperAdmin(id: string, currentPassword: string, reason?: string): Observable<AdminApiResponse<AdminUserSummary>> {
    const payload: AdminSuperAdminRoleRequest = { currentPassword, reason };
    return this.http.post<AdminApiResponse<AdminUserSummary>>(
      `${this.API_URL}/users/${id}/super-admin/revoke`,
      payload
    );
  }

  /**
   * Envía enlace de soporte para restablecer la contraseña a un usuario verificado (HU-21)
   */
  sendPasswordResetSupportLink(id: string): Observable<AdminApiResponse<AdminAction>> {
    return this.http.post<AdminApiResponse<AdminAction>>(
      `${this.API_URL}/users/${id}/support/password-reset`,
      {}
    );
  }

  /**
   * Reenvía correo de activación a un usuario no verificado desde soporte (HU-21)
   */
  resendVerificationSupportLink(id: string): Observable<AdminApiResponse<AdminAction>> {
    return this.http.post<AdminApiResponse<AdminAction>>(
      `${this.API_URL}/users/${id}/support/resend-verification`,
      {}
    );
  }

  /**
   * Consulta el registro de auditoría inmutable de acciones administrativas (HU-21)
   */
  getAdminActions(
    type?: AdminActionType,
    page: number = 0,
    size: number = 50
  ): Observable<AdminApiResponse<PageResponse<AdminAction>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<AdminApiResponse<PageResponse<AdminAction>>>(
      `${this.API_URL}/actions`,
      { params }
    );
  }
}
