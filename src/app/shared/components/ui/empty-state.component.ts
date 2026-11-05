import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './empty-state.component.html'
})
export class EmptyStateComponent {
  title = input<string>('No hay elementos');
  description = input<string>('');
  actionLabel = input<string>('');

  actionClick = output<void>();
}
