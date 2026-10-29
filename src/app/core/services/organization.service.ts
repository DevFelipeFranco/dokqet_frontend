import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Member, Organization, Invitation, MembershipStatus } from '../models/organization.model';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1/organizations';
  private readonly INVITATIONS_API_URL = 'http://localhost:8080/api/v1/invitations';

  getInvitationByToken(token: string): Observable<{ success: boolean; data: Invitation }> {
    return this.http.get<{ success: boolean; data: Invitation }>(`${this.INVITATIONS_API_URL}/${token}`);
  }

  respondInvitation(token: string, accept: boolean): Observable<{ success: boolean; message: string; data: boolean }> {
    return this.http.post<{ success: boolean; message: string; data: boolean }>(`${this.INVITATIONS_API_URL}/${token}/respond?accept=${accept}`, {});
  }

  createOrganization(data: any): Observable<{ success: boolean; data: Organization }> {
    return this.http.post<{ success: boolean; data: Organization }>(this.API_URL, data);
  }

  getOrganization(id: string): Observable<{ success: boolean; data: Organization }> {
    return this.http.get<{ success: boolean; data: Organization }>(`${this.API_URL}/${id}`);
  }

  updateOrganization(id: string, data: any): Observable<{ success: boolean; data: Organization }> {
    return this.http.put<{ success: boolean; data: Organization }>(`${this.API_URL}/${id}`, data);
  }

  listMembers(id: string): Observable<{ success: boolean; data: Member[] }> {
    return this.http.get<{ success: boolean; data: Member[] }>(`${this.API_URL}/${id}/members`);
  }

  listInvitations(id: string): Observable<{ success: boolean; data: Invitation[] }> {
    return this.http.get<{ success: boolean; data: Invitation[] }>(`${this.API_URL}/${id}/invitations`);
  }

  cancelInvitation(id: string, invitationId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.API_URL}/${id}/invitations/${invitationId}`);
  }

  inviteMember(id: string, data: { email: string; role: string }): Observable<{ success: boolean; data: Invitation }> {
    return this.http.post<{ success: boolean; data: Invitation }>(`${this.API_URL}/${id}/invitations`, data);
  }

  changeRole(id: string, targetUserId: string, role: string): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.API_URL}/${id}/members/${targetUserId}/role?role=${role}`, {});
  }

  changeMemberStatus(id: string, targetUserId: string, status: MembershipStatus): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.API_URL}/${id}/members/${targetUserId}/status?status=${status}`, {});
  }

  removeMember(id: string, targetUserId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.API_URL}/${id}/members/${targetUserId}`);
  }

  leaveOrganization(id: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.API_URL}/${id}/leave`, {});
  }
}
