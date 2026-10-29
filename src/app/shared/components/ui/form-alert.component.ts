import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'error' | 'success' | 'warning' | 'info';

@Component({
  selector: 'app-form-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-alert.component.html'
})
export class FormAlertComponent {
  type = input<AlertType>('error');
  className = input<string>('');

  computedClasses = computed(() => {
    const base = 'flex items-start gap-3 rounded-lg border p-3.5 ';
    let typeCls = '';

    switch (this.type()) {
      case 'error':
        typeCls = 'border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/15 ';
        break;
      case 'success':
        typeCls = 'border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 ';
        break;
      case 'warning':
        typeCls = 'border-amber-500/30 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 ';
        break;
      case 'info':
        typeCls = 'border-primary/20 bg-primary/[0.04] text-foreground ';
        break;
    }

    return `${base} ${typeCls} ${this.className()}`.trim();
  });
}
