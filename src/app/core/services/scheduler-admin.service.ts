import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AdminApiResponse, PageResponse } from '../models/super-admin.model';
import {
  CronValidationRequestDto,
  CronValidationResponseDto,
  ScheduledTaskAuditDto,
  ScheduledTaskDto,
  ScheduledTaskRunDto,
  SchedulerDashboardResponseDto,
  SchedulerOverviewKpiDto,
  UpdateScheduledTaskPayload
} from '../models/scheduler-admin.model';

@Injectable({
  providedIn: 'root'
})
export class SchedulerAdminService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1/admin/schedulers';

  /** Señal reactiva compartida con el Sidebar para mostrar la insignia roja "N Alerta(s)" */
  readonly alertCount = signal<number>(0);

  /** Señal reactiva de pausa global de mantenimiento */
  readonly globalPaused = signal<boolean>(false);

  getDashboard(): Observable<AdminApiResponse<SchedulerDashboardResponseDto>> {
    return this.http.get<AdminApiResponse<SchedulerDashboardResponseDto>>(this.API_URL).pipe(
      tap((res) => {
        if (res?.data?.overview) {
          this.syncGlobalIndicators(res.data.overview);
        }
      })
    );
  }

  getOverview(): Observable<AdminApiResponse<SchedulerOverviewKpiDto>> {
    return this.http.get<AdminApiResponse<SchedulerOverviewKpiDto>>(`${this.API_URL}/overview`).pipe(
      tap((res) => {
        if (res?.data) {
          this.syncGlobalIndicators(res.data);
        }
      })
    );
  }

  validateCron(payload: CronValidationRequestDto): Observable<AdminApiResponse<CronValidationResponseDto>> {
    return this.http.post<AdminApiResponse<CronValidationResponseDto>>(`${this.API_URL}/validate-cron`, payload);
  }

  updateTask(taskKey: string, payload: UpdateScheduledTaskPayload): Observable<AdminApiResponse<ScheduledTaskDto>> {
    return this.http.put<AdminApiResponse<ScheduledTaskDto>>(`${this.API_URL}/${encodeURIComponent(taskKey)}`, payload);
  }

  toggleTaskStatus(
    taskKey: string,
    enabled: boolean,
    reason?: string
  ): Observable<AdminApiResponse<ScheduledTaskDto>> {
    return this.http.patch<AdminApiResponse<ScheduledTaskDto>>(
      `${this.API_URL}/${encodeURIComponent(taskKey)}/status`,
      { enabled, reason: reason ?? null }
    );
  }

  runTaskNow(taskKey: string): Observable<AdminApiResponse<ScheduledTaskRunDto>> {
    return this.http.post<AdminApiResponse<ScheduledTaskRunDto>>(
      `${this.API_URL}/${encodeURIComponent(taskKey)}/run-now`,
      {}
    );
  }

  stopTask(taskKey: string): Observable<AdminApiResponse<ScheduledTaskRunDto>> {
    return this.http.post<AdminApiResponse<ScheduledTaskRunDto>>(
      `${this.API_URL}/${encodeURIComponent(taskKey)}/stop`,
      {}
    );
  }

  unlockStaleTask(taskKey: string): Observable<AdminApiResponse<ScheduledTaskRunDto>> {
    return this.http.post<AdminApiResponse<ScheduledTaskRunDto>>(
      `${this.API_URL}/${encodeURIComponent(taskKey)}/unlock`,
      {}
    );
  }

  pauseGlobal(reason: string): Observable<AdminApiResponse<SchedulerOverviewKpiDto>> {
    return this.http.post<AdminApiResponse<SchedulerOverviewKpiDto>>(`${this.API_URL}/global-pause`, { reason }).pipe(
      tap((res) => {
        if (res?.data) {
          this.syncGlobalIndicators(res.data);
        }
      })
    );
  }

  resumeGlobal(): Observable<AdminApiResponse<SchedulerOverviewKpiDto>> {
    return this.http.post<AdminApiResponse<SchedulerOverviewKpiDto>>(`${this.API_URL}/global-resume`, {}).pipe(
      tap((res) => {
        if (res?.data) {
          this.syncGlobalIndicators(res.data);
        }
      })
    );
  }

  updateServerTimezone(timezone: string): Observable<AdminApiResponse<SchedulerOverviewKpiDto>> {
    return this.http.put<AdminApiResponse<SchedulerOverviewKpiDto>>(`${this.API_URL}/server-timezone`, { timezone }).pipe(
      tap((res) => {
        if (res?.data) {
          this.syncGlobalIndicators(res.data);
        }
      })
    );
  }

  getTaskRuns(
    taskKey: string,
    page: number = 0,
    size: number = 8
  ): Observable<AdminApiResponse<PageResponse<ScheduledTaskRunDto>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<AdminApiResponse<PageResponse<ScheduledTaskRunDto>>>(
      `${this.API_URL}/${encodeURIComponent(taskKey)}/runs`,
      { params }
    );
  }

  getTaskAuditLogs(
    taskKey: string,
    page: number = 0,
    size: number = 8
  ): Observable<AdminApiResponse<PageResponse<ScheduledTaskAuditDto>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<AdminApiResponse<PageResponse<ScheduledTaskAuditDto>>>(
      `${this.API_URL}/${encodeURIComponent(taskKey)}/audit`,
      { params }
    );
  }

  private syncGlobalIndicators(overview: SchedulerOverviewKpiDto): void {
    this.alertCount.set(overview.alertCount ?? 0);
    this.globalPaused.set(Boolean(overview.globalPaused));
  }
}
