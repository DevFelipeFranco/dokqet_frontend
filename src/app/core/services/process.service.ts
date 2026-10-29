import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FoundProcess, ProcessDetailView, ProcessListItem } from '../models/process.model';
import { LEGAL_CONSTANTS } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class ProcessService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1/processes';

  searchRadicado(radicado: string): Observable<{ success: boolean; data: FoundProcess[] }> {
    return this.http.get<{ success: boolean; data: FoundProcess[] }>(
      `${this.API_URL}/search-radicado?radicado=${encodeURIComponent(radicado)}`
    );
  }

  registerProcess(data: any): Observable<{ success: boolean; data: string }> {
    return this.http.post<{ success: boolean; data: string }>(this.API_URL, data);
  }

  listProcesses(filters?: { onlyMine?: boolean; unassignedOnly?: boolean; withNewsOnly?: boolean; responsibleUserId?: string }): Observable<{ success: boolean; data: ProcessListItem[] }> {
    const params = new URLSearchParams();
    if (filters?.onlyMine) params.set('onlyMine', 'true');
    if (filters?.unassignedOnly) params.set('unassignedOnly', 'true');
    if (filters?.withNewsOnly) params.set('withNewsOnly', 'true');
    if (filters?.responsibleUserId) params.set('responsibleUserId', filters.responsibleUserId);

    const queryString = params.toString();
    return this.http.get<{ success: boolean; data: ProcessListItem[] }>(
      queryString ? `${this.API_URL}?${queryString}` : this.API_URL
    );
  }

  getProcessDetail(
    id: string,
    page = 1,
    pageSize: number = LEGAL_CONSTANTS.DEFAULT_PAGE_SIZE
  ): Observable<{ success: boolean; data: ProcessDetailView }> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<{ success: boolean; data: ProcessDetailView }>(
      `${this.API_URL}/${id}`,
      { params }
    );
  }

  updateProcess(id: string, data: any): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.API_URL}/${id}`, data);
  }

  unfollowProcess(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.API_URL}/${id}`);
  }

  markSeen(id: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.API_URL}/${id}/seen`, {});
  }
}
