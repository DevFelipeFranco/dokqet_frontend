import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'brand';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html'
})
export class BadgeComponent {
  variant = input<BadgeVariant>('default');
  hasDot = input<boolean>(false);
  className = input<string>('');

  computedClasses = computed(() => {
    const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors select-none ';
    let variantCls = '';

    switch (this.variant()) {
      case 'default':
        variantCls = 'bg-primary text-primary-foreground ';
        break;
      case 'brand':
        variantCls = 'bg-brand text-brand-foreground ';
        break;
      case 'secondary':
        variantCls = 'bg-secondary text-secondary-foreground ';
        break;
      case 'outline':
        variantCls = 'border border-border text-foreground ';
        break;
      case 'destructive':
        variantCls = 'bg-destructive/15 text-destructive border border-destructive/20 ';
        break;
      case 'success':
        variantCls = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 ';
        break;
      case 'warning':
        variantCls = 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20 ';
        break;
    }

    return `${base} ${variantCls} ${this.className()}`.trim();
  });
}
