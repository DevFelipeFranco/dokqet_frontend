import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'group/card flex flex-col rounded-xl bg-card text-card-foreground border border-border shadow-xs overflow-hidden ' + (className() || '')">
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
  className = input<string>('');
}

@Component({
  selector: 'app-card-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'flex flex-col gap-1.5 p-5 ' + (border() ? 'border-b border-border ' : '') + (className() || '')">
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-col gap-1 min-w-0">
          <ng-content select="[card-title], app-card-title, h1, h2, h3"></ng-content>
          <ng-content select="[card-description], app-card-description, p"></ng-content>
        </div>
        <div class="shrink-0">
          <ng-content select="[card-action]"></ng-content>
        </div>
      </div>
      <ng-content></ng-content>
    </div>
  `
})
export class CardHeaderComponent {
  className = input<string>('');
  border = input<boolean>(false);
}

@Component({
  selector: 'app-card-title',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 [class]="'text-lg font-semibold leading-tight text-foreground ' + (className() || '')">
      <ng-content></ng-content>
    </h3>
  `
})
export class CardTitleComponent {
  className = input<string>('');
}

@Component({
  selector: 'app-card-description',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p [class]="'text-sm text-muted-foreground ' + (className() || '')">
      <ng-content></ng-content>
    </p>
  `
})
export class CardDescriptionComponent {
  className = input<string>('');
}

@Component({
  selector: 'app-card-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'p-5 text-sm ' + (className() || '')">
      <ng-content></ng-content>
    </div>
  `
})
export class CardContentComponent {
  className = input<string>('');
}

@Component({
  selector: 'app-card-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'flex items-center justify-between p-5 border-t border-border/50 bg-muted/20 ' + (className() || '')">
      <ng-content></ng-content>
    </div>
  `
})
export class CardFooterComponent {
  className = input<string>('');
}
