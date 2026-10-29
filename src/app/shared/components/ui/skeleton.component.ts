import { Component, computed, input } from '@angular/core';

export type SkeletonVariant = 'text' | 'circular' | 'rounded' | 'rectangle';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div
      [class]="computedClasses()"
      [style.width]="width()"
      [style.height]="height()"
      role="status"
      aria-live="polite"
      aria-busy="true">
      <span class="sr-only">{{ srText() }}</span>
    </div>
  `
})
export class SkeletonComponent {
  variant = input<SkeletonVariant>('text');
  width = input<string>('100%');
  height = input<string>('1rem');
  rounded = input<string>('');
  className = input<string>('');
  animate = input<boolean>(true);
  srText = input<string>('Cargando...');

  computedClasses = computed(() => {
    const base = 'inline-block bg-muted/70 border border-border/20 dark:bg-card/70 dark:border-border/40';
    const animation = this.animate() ? 'animate-pulse motion-reduce:animate-none' : '';

    let roundness = '';
    if (this.rounded()) {
      roundness = this.rounded();
    } else {
      switch (this.variant()) {
        case 'circular':
          roundness = 'rounded-full';
          break;
        case 'rounded':
          roundness = 'rounded-xl';
          break;
        case 'rectangle':
          roundness = 'rounded-none';
          break;
        case 'text':
        default:
          roundness = 'rounded-md';
          break;
      }
    }

    return `${base} ${animation} ${roundness} ${this.className()}`.trim();
  });
}

