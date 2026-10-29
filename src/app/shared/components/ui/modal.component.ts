import { Component, HostListener, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './modal.component.html'
})
export class ModalComponent {
  isOpen = model<boolean>(false);
  title = input<string>('');
  description = input<string>('');
  confirmText = input<string>('Confirmar');
  cancelText = input<string>('Cancelar');
  confirmVariant = input<'default' | 'destructive'>('default');
  closeOnBackdrop = input<boolean>(true);

  confirmed = output<void>();
  cancelled = output<void>();

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.onCancel();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.isOpen.set(false);
    this.cancelled.emit();
  }
}
