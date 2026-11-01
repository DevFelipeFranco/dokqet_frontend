import { Injectable, NgZone, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, of } from 'rxjs';

export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutos
export const HEARTBEAT_THROTTLE_MS = 60 * 1000;      // 60 segundos
export const DAILY_CUTOFF_HOUR_COT = 3;              // 3:00 a. m. COT
export const DAILY_CUTOFF_UTC_HOUR = 8;              // 08:00:00 UTC (COT = UTC-5)

@Injectable({
  providedIn: 'root'
})
export class SessionVigenciaService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  private inactivityTimer: any = null;
  private dailyCutoffTimer: any = null;
  private lastActivityTimestamp = Date.now();
  private lastHeartbeatTimestamp = 0;
  private isMonitoring = false;
  private unregisterListeners: (() => void) | null = null;

  constructor() {
    // Sincroniza automáticamente el monitoreo con el estado reactivo de autenticación
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      if (isAuth && !this.isMonitoring) {
        this.startMonitoring();
      } else if (!isAuth && this.isMonitoring) {
        this.stopMonitoring();
      }
    });
  }

  /**
   * Inicia la monitorización activa de vigencia por inactividad y corte diario a las 3:00 a. m. COT
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.lastActivityTimestamp = Date.now();

    this.setupEventListeners();
    this.resetInactivityTimer();
    this.scheduleDailyCutoffTimer();
  }

  /**
   * Detiene temporizadores y desregistra los listeners del navegador
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.clearInactivityTimer();
    this.clearDailyCutoffTimer();

    if (this.unregisterListeners) {
      this.unregisterListeners();
      this.unregisterListeners = null;
    }
  }

  /**
   * Registra actividad del usuario (clic, tecla, scroll, touch, focus) con throttle de 60s
   */
  recordActivity(): void {
    if (!this.isMonitoring || !this.authService.isAuthenticated()) return;

    const now = Date.now();
    this.lastActivityTimestamp = now;
    this.resetInactivityTimer();

    if (now - this.lastHeartbeatTimestamp >= HEARTBEAT_THROTTLE_MS) {
      this.lastHeartbeatTimestamp = now;
      this.sendHeartbeat();
    }
  }

  /**
   * Emite heartbeat al backend para sincronizar vigencia en Redis/BD
   */
  private sendHeartbeat(): void {
    this.authService.sendHeartbeat().pipe(
      catchError(err => {
        const errorCode = err?.error?.errorCode;
        if (err?.status === 401) {
          if (errorCode === 'SESSION_INACTIVE') {
            this.handleInactivityExpiration();
          } else if (errorCode === 'SESSION_DAILY_CUTOFF') {
            this.handleDailyCutoffExpiration();
          }
        }
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Configura listeners de eventos nativos fuera de la zona de Angular para máximo rendimiento
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    this.ngZone.runOutsideAngular(() => {
      const handleUserActivity = () => {
        this.recordActivity();
      };

      const eventNames = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'focus'];
      eventNames.forEach(evt => {
        window.addEventListener(evt, handleUserActivity, { passive: true });
      });

      this.unregisterListeners = () => {
        eventNames.forEach(evt => {
          window.removeEventListener(evt, handleUserActivity);
        });
      };
    });
  }

  /**
   * Reinicia la cuenta regresiva local de inactividad de 60 minutos
   */
  private resetInactivityTimer(): void {
    this.clearInactivityTimer();

    this.ngZone.runOutsideAngular(() => {
      this.inactivityTimer = setTimeout(() => {
        this.ngZone.run(() => {
          this.handleInactivityExpiration();
        });
      }, INACTIVITY_TIMEOUT_MS);
    });
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Programa la alarma para el próximo corte de las 3:00 a. m. hora de Colombia (08:00:00 UTC)
   */
  private scheduleDailyCutoffTimer(): void {
    this.clearDailyCutoffTimer();

    const delayMs = this.calculateMsUntilNextCutoff();

    this.ngZone.runOutsideAngular(() => {
      this.dailyCutoffTimer = setTimeout(() => {
        this.ngZone.run(() => {
          this.handleDailyCutoffExpiration();
        });
      }, delayMs);
    });
  }

  private clearDailyCutoffTimer(): void {
    if (this.dailyCutoffTimer) {
      clearTimeout(this.dailyCutoffTimer);
      this.dailyCutoffTimer = null;
    }
  }

  /**
   * Calcula los milisegundos restantes hasta las próximas 3:00 a. m. COT (08:00 UTC)
   */
  calculateMsUntilNextCutoff(now = new Date()): number {
    const nextCutoff = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      DAILY_CUTOFF_UTC_HOUR,
      0,
      0,
      0
    ));

    if (now.getTime() >= nextCutoff.getTime()) {
      nextCutoff.setUTCDate(nextCutoff.getUTCDate() + 1);
    }

    return Math.max(1000, nextCutoff.getTime() - now.getTime());
  }

  /**
   * Maneja el vencimiento por 60 minutos de inactividad
   */
  handleInactivityExpiration(): void {
    if (!this.authService.isAuthenticated()) return;

    this.stopMonitoring();
    this.authService.clearSessionState();
    this.router.navigate(['/iniciar-sesion'], {
      queryParams: { motivo: 'inactividad' }
    });
  }

  /**
   * Maneja el corte diario de las 3:00 a. m. COT (silencioso, sin motivo de inactividad)
   */
  handleDailyCutoffExpiration(): void {
    if (!this.authService.isAuthenticated()) return;

    this.stopMonitoring();
    this.authService.clearSessionState();
    this.router.navigate(['/iniciar-sesion']);
  }
}
