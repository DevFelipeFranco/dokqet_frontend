import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html'
})
export class ButtonComponent {
  variant = input<ButtonVariant>('default');
  size = input<ButtonSize>('default');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  className = input<string>('');

  buttonClick = output<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.buttonClick.emit(event);
    }
  }

  computedClasses = computed(() => {
    const base = 'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer ';
    
    let variantClasses = '';
    switch (this.variant()) {
      case 'default':
        variantClasses = 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm ';
        break;
      case 'outline':
        variantClasses = 'border-border bg-background hover:bg-muted hover:text-foreground text-foreground shadow-xs ';
        break;
      case 'secondary':
        variantClasses = 'bg-secondary text-secondary-foreground hover:bg-secondary/80 ';
        break;
      case 'ghost':
        variantClasses = 'hover:bg-muted hover:text-foreground text-foreground ';
        break;
      case 'destructive':
        variantClasses = 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs ';
        break;
      case 'link':
        variantClasses = 'text-link underline-offset-4 hover:underline p-0 h-auto font-normal ';
        break;
    }

    let sizeClasses = '';
    switch (this.size()) {
      case 'sm':
        sizeClasses = 'h-8 px-3 text-xs gap-1.5 ';
        break;
      case 'default':
        sizeClasses = 'h-9 px-4 text-sm gap-2 ';
        break;
      case 'lg':
        sizeClasses = 'h-10 px-5 text-sm gap-2 ';
        break;
      case 'icon':
        sizeClasses = 'size-9 p-0 ';
        break;
    }

    return `${base} ${variantClasses} ${sizeClasses} ${this.className()}`.trim();
  });
}
