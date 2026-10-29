import { Component, computed, input } from '@angular/core';
import { SkeletonComponent } from './skeleton.component';

@Component({
  selector: 'app-skeleton-form',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div [class]="'space-y-6 ' + className()" role="status" aria-live="polite" aria-busy="true">
      <span class="sr-only">Cargando formulario...</span>
      <div [class]="'grid gap-5 ' + cols()">
        @for (f of fieldIndices(); track f) {
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <app-skeleton [width]="labelWidth(f)" height="0.875rem"></app-skeleton>
            </div>
            <app-skeleton variant="rounded" width="100%" height="46px" rounded="rounded-xl"></app-skeleton>
            <app-skeleton width="60%" height="0.75rem"></app-skeleton>
          </div>
        }
      </div>

      @if (showActions()) {
        <div class="flex justify-end gap-3 pt-4 border-t border-border/60">
          <app-skeleton width="90px" height="38px" rounded="rounded-xl"></app-skeleton>
          <app-skeleton width="130px" height="38px" rounded="rounded-xl"></app-skeleton>
        </div>
      }
    </div>
  `
})
export class SkeletonFormComponent {
  fields = input<number>(4);
  cols = input<string>('grid-cols-1 sm:grid-cols-2');
  showActions = input<boolean>(true);
  className = input<string>('');

  fieldIndices = computed(() => Array.from({ length: this.fields() }, (_, i) => i));

  labelWidth(index: number): string {
    const widths = ['110px', '140px', '95px', '125px', '150px'];
    return widths[index % widths.length];
  }
}

