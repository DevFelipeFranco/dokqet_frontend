import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ActuacionDocumentosView,
  FoundProcess,
  ProcessDetailView,
  ProcessGroupPageResponse,
  ProcessListItem,
  ProcessListQueryFilters,
  RefreshProcessResponse,
  ReloadLookupResponse,
  ReloadProcessRequest
} from '../models/process.model';
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

  listProcesses(filters?: ProcessListQueryFilters): Observable<{ success: boolean; data: ProcessGroupPageResponse }> {
    let params = new HttpParams();
    if (filters?.filter) params = params.set('filter', filters.filter);
    if (filters?.q) params = params.set('q', filters.q);
    if (filters?.order) params = params.set('order', filters.order);
    if (filters?.page) params = params.set('page', String(filters.page));
    if (filters?.pageSize) params = params.set('pageSize', String(filters.pageSize));
    if (filters?.onlyMine !== undefined) params = params.set('onlyMine', String(filters.onlyMine));
    if (filters?.unassignedOnly !== undefined) params = params.set('unassignedOnly', String(filters.unassignedOnly));
    if (filters?.withNewsOnly !== undefined) params = params.set('withNewsOnly', String(filters.withNewsOnly));
    if (filters?.responsibleUserId) params = params.set('responsibleUserId', filters.responsibleUserId);

    return this.http.get<{ success: boolean; data: ProcessGroupPageResponse }>(this.API_URL, { params });
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

  /**
   * Dispara la actualización bajo demanda con cooldown compartido de 10 min.
   * Consume 1 de cuota RAMA_SEARCH si han transcurrido >= 10 minutos.
   */
  refreshProcess(id: string): Observable<{ success: boolean; data: RefreshProcessResponse }> {
    return this.http.post<{ success: boolean; data: RefreshProcessResponse }>(
      `${this.API_URL}/${id}/refresh`,
      {}
    );
  }

  /**
   * Consulta candidatos públicos disponibles en la Rama para recarga manual.
   * Consume 1 de cuota RAMA_SEARCH.
   */
  reloadLookup(id: string): Observable<{ success: boolean; data: ReloadLookupResponse }> {
    return this.http.post<{ success: boolean; data: ReloadLookupResponse }>(
      `${this.API_URL}/${id}/reload-lookup`,
      {}
    );
  }

  /**
   * Ejecuta la recarga manual autorizada con el idProceso seleccionado.
   * Consume 1 de cuota RAMA_REGISTER.
   */
  reload(id: string, data: ReloadProcessRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.API_URL}/${id}/reload`,
      data
    );
  }

  /**
   * Consulta los documentos digitales de una actuación en la Rama Judicial (US-025 / Mejora 9.24).
   * Si ya fueron consultados previamente, retorna los datos de la base de datos sin consumir cuota.
   * Si es la primera vez, descuenta 1 unidad del límite RAMA_SEARCH.
   */
  consultActuacionDocumentos(
    processId: string,
    actuacionId: string
  ): Observable<{ success: boolean; data: ActuacionDocumentosView }> {
    return this.http.post<{ success: boolean; data: ActuacionDocumentosView }>(
      `${this.API_URL}/${processId}/actuaciones/${actuacionId}/documentos`,
      {}
    );
  }
}
