import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html'
})
export class StatCardComponent {
  label = input<string>('');
  title = input<string>('');
  description = input<string>('');
  value = input<string | number>('0');
  iconBg = input<string>('');
  dotColor = input<string>('bg-violet-600 dark:bg-violet-400');
  className = input<string>('');
  active = input<boolean>(false);

  displayLabel = computed(() => this.label() || this.title() || '');

  computedClass = computed(() => {
    const base = 'group flex flex-col justify-between gap-3 rounded-2xl border bg-card p-4 sm:p-5 text-card-foreground shadow-xs transition-all duration-150 select-none ';
    const state = this.active()
      ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.03] dark:bg-primary/[0.08] shadow-sm '
      : 'border-border hover:border-foreground/25 hover:bg-muted/30 ';
    return `${base} ${state} ${this.className()}`.trim();
  });
}
