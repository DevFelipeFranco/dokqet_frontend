import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  type: 'warning' | 'error' | 'success' | 'info';
  message: string;
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private alertSignal = signal<AppNotification | null>(null);
  readonly alert = this.alertSignal.asReadonly();

  private timeoutHandle: any = null;

  showAlert(notification: AppNotification, autoDismissMs: number = 6000): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }

    this.alertSignal.set(notification);

    if (autoDismissMs > 0) {
      this.timeoutHandle = setTimeout(() => {
        this.clear();
      }, autoDismissMs);
    }
  }

  showWarning(message: string, title?: string): void {
    this.showAlert({ type: 'warning', message, title });
  }

  showError(message: string, title?: string): void {
    this.showAlert({ type: 'error', message, title });
  }

  showSuccess(message: string, title?: string): void {
    this.showAlert({ type: 'success', message, title });
  }

  showInfo(message: string, title?: string): void {
    this.showAlert({ type: 'info', message, title });
  }

  clear(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
    this.alertSignal.set(null);
  }
}
