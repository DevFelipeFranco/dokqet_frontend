import { Component, ElementRef, HostListener, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown.component.html'
})
export class DropdownComponent {
  align = input<'left' | 'right'>('left');
  closeOnItemClick = input<boolean>(true);
  fullWidth = input<boolean>(false);

  isOpen = signal<boolean>(false);

  constructor(private elementRef: ElementRef) {}

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onMenuClick(event: MouseEvent): void {
    if (this.closeOnItemClick()) {
      this.close();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
