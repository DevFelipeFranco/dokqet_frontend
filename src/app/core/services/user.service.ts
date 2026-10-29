import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentType, User, UserUnlockResponse } from '../models/user.model';

export interface UpdateProfilePayload {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  documentType: DocumentType | string;
  documentNumber: string;
  genderCode?: string | null;
  cityId?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1/users';

  getProfile(): Observable<{ success: boolean; data: User }> {
    return this.http.get<{ success: boolean; data: User }>(`${this.API_URL}/me`);
  }

  updateProfile(payload: UpdateProfilePayload): Observable<{ success: boolean; data: User; message: string }> {
    return this.http.put<{ success: boolean; data: User; message: string }>(`${this.API_URL}/me`, payload);
  }

  changePassword(payload: ChangePasswordPayload): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.API_URL}/me/password`, payload);
  }

  unlockUser(userId: string): Observable<{ success: boolean; data: UserUnlockResponse; message: string }> {
    return this.http.post<{ success: boolean; data: UserUnlockResponse; message: string }>(
      `${this.API_URL}/${userId}/unlock`,
      {}
    );
  }
}
