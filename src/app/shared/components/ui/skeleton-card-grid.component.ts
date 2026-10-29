import { Component, computed, input } from '@angular/core';
import { SkeletonComponent } from './skeleton.component';

@Component({
  selector: 'app-skeleton-card-grid',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div [class]="computedGridClasses()" role="status" aria-live="polite" aria-busy="true">
      <span class="sr-only">Cargando métricas e indicadores...</span>
      @for (i of items(); track i) {
        <div class="group flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5 text-card-foreground shadow-xs select-none">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="size-2 shrink-0 rounded-full bg-muted-foreground/30 animate-pulse" aria-hidden="true"></span>
              <app-skeleton variant="text" [width]="labelWidth(i)" height="0.875rem"></app-skeleton>
            </div>
          </div>
          <div>
            <app-skeleton variant="rounded" [width]="valueWidth(i)" height="1.875rem" rounded="rounded-md"></app-skeleton>
            <app-skeleton variant="text" width="55%" height="0.6875rem" className="mt-2"></app-skeleton>
          </div>
        </div>
      }
    </div>
  `
})
export class SkeletonCardGridComponent {
  count = input<number>(4);
  cols = input<string>('grid-cols-1 sm:grid-cols-2 xl:grid-cols-4');
  className = input<string>('');

  items = computed(() => Array.from({ length: this.count() }, (_, i) => i));

  computedGridClasses = computed(() => `grid gap-3.5 ${this.cols()} ${this.className()}`.trim());

  labelWidth(index: number): string {
    const widths = ['130px', '145px', '115px', '135px'];
    return widths[index % widths.length];
  }

  valueWidth(index: number): string {
    const widths = ['3.5rem', '2.5rem', '3rem', '4rem'];
    return widths[index % widths.length];
  }
}

