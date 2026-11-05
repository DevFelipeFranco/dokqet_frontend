import { Component, input, output } from '@angular/core';

import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './empty-state.component.html'
})
export class EmptyStateComponent {
  title = input<string>('No hay elementos');
  description = input<string>('');
  actionLabel = input<string>('');

  actionClick = output<void>();
}
