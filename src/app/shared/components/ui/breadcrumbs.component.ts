import { Component, input } from '@angular/core';

import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './breadcrumbs.component.html'
})
export class BreadcrumbsComponent {
  items = input<BreadcrumbItem[]>([]);
  backUrl = input<string | null>(null);
  backLabel = input<string>('Volver');
}
