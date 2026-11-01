import { Component, computed, input } from '@angular/core';
import { SkeletonComponent } from './skeleton.component';

export type SkeletonTableVariant = 'default' | 'processes' | 'actuaciones' | 'catalog' | 'team' | 'organizations';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div [class]="'overflow-x-auto rounded-xl border border-border/70 ' + className()" role="status" aria-live="polite" aria-busy="true">
      <span class="sr-only">{{ srText() }}</span>
      <table class="w-full border-collapse text-left text-xs sm:text-sm">
        @if (showHeader()) {
          <thead>
            <tr class="border-b border-border/70 bg-muted/50 text-[11px] font-semibold text-muted-foreground select-none">
              @if (variant() === 'processes') {
                <th scope="col" class="w-11 py-3 pl-4 pr-2">
                  <app-skeleton width="16px" height="16px" rounded="rounded"></app-skeleton>
                </th>
                <th scope="col" class="py-3 px-3">Radicado</th>
                <th scope="col" class="py-3 px-3">Sujetos Procesales</th>
                <th scope="col" class="py-3 px-3">Últ. Actuación</th>
                <th scope="col" class="py-3 px-3">Estado</th>
                <th scope="col" class="py-3 px-3">Despacho Judicial</th>
                <th scope="col" class="py-3 px-3">Responsable</th>
                <th scope="col" class="py-3 pl-3 pr-4 text-right">Acción</th>
              } @else if (variant() === 'actuaciones') {
                <th scope="col" class="py-3 pl-4 pr-3">Fecha</th>
                <th scope="col" class="py-3 px-3 min-w-[220px]">Actuación</th>
                <th scope="col" class="py-3 px-3">Anotación judicial</th>
                <th scope="col" class="py-3 px-3">Documento</th>
                <th scope="col" class="py-3 pl-3 pr-4 text-right">Estado</th>
              } @else if (variant() === 'catalog') {
                <th scope="col" class="py-3 pl-4 pr-3">Código</th>
                <th scope="col" class="py-3 px-3">Nombre / Razón</th>
                <th scope="col" class="py-3 px-3">Descripción</th>
                <th scope="col" class="py-3 px-3">Atributos clave</th>
                <th scope="col" class="py-3 px-3 text-center">Orden</th>
                <th scope="col" class="py-3 px-3 text-center">Estado</th>
                <th scope="col" class="py-3 pl-3 pr-4 text-right">Acciones</th>
              } @else if (variant() === 'team') {
                <th scope="col" class="py-3 pl-4 pr-3">Abogado / Profesional</th>
                <th scope="col" class="py-3 px-3">Rol en firma</th>
                <th scope="col" class="py-3 px-3">Estado de acceso</th>
                <th scope="col" class="py-3 pl-3 pr-4 text-right">Acciones de supervisión</th>
              } @else if (variant() === 'organizations') {
                <th scope="col" class="py-3 pl-4 pr-3">Organización</th>
                <th scope="col" class="py-3 px-3">Tipo</th>
                <th scope="col" class="py-3 px-3">NIT / DV</th>
                <th scope="col" class="py-3 px-3">Personas vinculadas</th>
                <th scope="col" class="py-3 px-3">Expedientes vigilados</th>
                <th scope="col" class="py-3 px-3">Fecha registro</th>
                <th scope="col" class="py-3 pl-3 pr-4 text-right">Acciones</th>
              } @else {
                @if (hasCheckbox()) {
                  <th scope="col" class="w-11 py-3 pl-4 pr-2">
                    <app-skeleton width="16px" height="16px" rounded="rounded"></app-skeleton>
                  </th>
                }
                @for (col of colIndices(); track col) {
                  <th scope="col" class="py-3 px-3">
                    <app-skeleton [width]="colHeaderWidth(col)" height="0.875rem"></app-skeleton>
                  </th>
                }
                @if (hasActions()) {
                  <th scope="col" class="py-3 pl-3 pr-4 text-right">
                    <app-skeleton width="50px" height="0.875rem" className="ml-auto"></app-skeleton>
                  </th>
                }
              }
            </tr>
          </thead>
        }

        <tbody class="divide-y divide-border/60 bg-card">
          @for (r of rowIndices(); track r) {
            <tr class="align-top">
              @if (variant() === 'processes') {
                <!-- Col 0: Checkbox -->
                <td class="py-3.5 pl-4 pr-2 align-middle">
                  <app-skeleton width="16px" height="16px" rounded="rounded"></app-skeleton>
                </td>
                <!-- Col 1: Radicado -->
                <td class="py-3.5 px-3">
                  <div class="space-y-1">
                    <app-skeleton [width]="cellWidth(r, 0, '180px')" height="1rem" rounded="rounded-md"></app-skeleton>
                    <app-skeleton width="70px" height="0.75rem" rounded="rounded"></app-skeleton>
                  </div>
                </td>
                <!-- Col 2: Sujetos Procesales -->
                <td class="py-3.5 px-3 max-w-[200px]">
                  <div class="space-y-1">
                    <app-skeleton [width]="cellWidth(r, 1, '85%')" height="0.875rem"></app-skeleton>
                    <app-skeleton [width]="cellWidth(r, 2, '60%')" height="0.75rem"></app-skeleton>
                  </div>
                </td>
                <!-- Col 3: Últ Actuación -->
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <app-skeleton width="75px" height="0.875rem"></app-skeleton>
                </td>
                <!-- Col 4: Estado -->
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <app-skeleton width="70px" height="1.25rem" rounded="rounded-full"></app-skeleton>
                </td>
                <!-- Col 5: Despacho -->
                <td class="py-3.5 px-3 max-w-[220px]">
                  <div class="space-y-1">
                    <app-skeleton [width]="cellWidth(r, 3, '90%')" height="0.875rem"></app-skeleton>
                    <app-skeleton width="50%" height="0.75rem"></app-skeleton>
                  </div>
                </td>
                <!-- Col 6: Responsable -->
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <app-skeleton variant="circular" width="20px" height="20px"></app-skeleton>
                    <app-skeleton width="80px" height="0.875rem"></app-skeleton>
                  </div>
                </td>
                <!-- Col 7: Acción -->
                <td class="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                  <app-skeleton width="60px" height="1.75rem" rounded="rounded-lg" className="ml-auto"></app-skeleton>
                </td>
              } @else if (variant() === 'actuaciones') {
                <!-- Col 1: Fecha -->
                <td class="py-3.5 pl-4 pr-3 whitespace-nowrap">
                  <div class="space-y-1">
                    <app-skeleton width="75px" height="0.9rem"></app-skeleton>
                    <app-skeleton width="50px" height="0.75rem"></app-skeleton>
                  </div>
                </td>
                <!-- Col 2: Actuación -->
                <td class="py-3.5 px-3 min-w-[220px]">
                  <div class="space-y-1.5">
                    <app-skeleton [width]="cellWidth(r, 0, '80%')" height="0.95rem"></app-skeleton>
                    <app-skeleton width="45%" height="0.8rem"></app-skeleton>
                  </div>
                </td>
                <!-- Col 3: Anotación -->
                <td class="py-3.5 px-3">
                  <div class="space-y-1">
                    <app-skeleton [width]="cellWidth(r, 1, '92%')" height="0.85rem"></app-skeleton>
                    <app-skeleton [width]="cellWidth(r, 2, '65%')" height="0.85rem"></app-skeleton>
                  </div>
                </td>
                <!-- Col 4: Documento -->
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <app-skeleton width="65px" height="1.5rem" rounded="rounded-lg"></app-skeleton>
                </td>
                <!-- Col 5: Estado -->
                <td class="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                  <app-skeleton width="60px" height="1.25rem" rounded="rounded-full" className="ml-auto"></app-skeleton>
                </td>
              } @else if (variant() === 'catalog') {
                <!-- Col 1: Código -->
                <td class="py-3.5 pl-4 pr-3 whitespace-nowrap">
                  <app-skeleton width="55px" height="1.25rem" rounded="rounded"></app-skeleton>
                </td>
                <!-- Col 2: Nombre -->
                <td class="py-3.5 px-3">
                  <app-skeleton [width]="cellWidth(r, 0, '140px')" height="0.95rem"></app-skeleton>
                </td>
                <!-- Col 3: Descripción -->
                <td class="py-3.5 px-3">
                  <app-skeleton [width]="cellWidth(r, 1, '200px')" height="0.85rem"></app-skeleton>
                </td>
                <!-- Col 4: Atributos -->
                <td class="py-3.5 px-3">
                  <app-skeleton width="110px" height="0.85rem"></app-skeleton>
                </td>
                <!-- Col 5: Orden -->
                <td class="py-3.5 px-3 text-center">
                  <app-skeleton width="30px" height="0.85rem" className="mx-auto"></app-skeleton>
                </td>
                <!-- Col 6: Estado -->
                <td class="py-3.5 px-3 text-center">
                  <app-skeleton width="50px" height="1.25rem" rounded="rounded-full" className="mx-auto"></app-skeleton>
                </td>
                <!-- Col 7: Acciones -->
                <td class="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                  <app-skeleton width="60px" height="1.75rem" rounded="rounded-lg" className="ml-auto"></app-skeleton>
                </td>
              } @else if (variant() === 'team') {
                <!-- Col 1: Abogado -->
                <td class="py-3.5 pl-4 pr-3">
                  <div class="flex items-center gap-3">
                    <app-skeleton variant="circular" width="32px" height="32px" className="shrink-0"></app-skeleton>
                    <div class="space-y-1">
                      <app-skeleton [width]="cellWidth(r, 0, '130px')" height="0.95rem"></app-skeleton>
                      <app-skeleton [width]="cellWidth(r, 1, '160px')" height="0.75rem"></app-skeleton>
                    </div>
                  </div>
                </td>
                <!-- Col 2: Rol -->
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <app-skeleton width="80px" height="1.25rem" rounded="rounded-full"></app-skeleton>
                </td>
                <!-- Col 3: Estado -->
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <app-skeleton width="60px" height="1.25rem" rounded="rounded-full"></app-skeleton>
                </td>
                <!-- Col 4: Acciones -->
                <td class="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                  <app-skeleton width="70px" height="1.75rem" rounded="rounded-lg" className="ml-auto"></app-skeleton>
                </td>
              } @else if (variant() === 'organizations') {
                <!-- Col 1: Organización -->
                <td class="py-3.5 pl-4 pr-3">
                  <div class="space-y-1">
                    <app-skeleton [width]="cellWidth(r, 0, '160px')" height="0.95rem"></app-skeleton>
                    <app-skeleton [width]="cellWidth(r, 1, '120px')" height="0.75rem"></app-skeleton>
                  </div>
                </td>
                <!-- Col 2: Tipo -->
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <app-skeleton width="80px" height="1.25rem" rounded="rounded-full"></app-skeleton>
                </td>
                <!-- Col 3: NIT / DV -->
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <app-skeleton width="90px" height="0.875rem"></app-skeleton>
                </td>
                <!-- Col 4: Personas -->
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <app-skeleton width="36px" height="0.875rem"></app-skeleton>
                </td>
                <!-- Col 5: Expedientes -->
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <app-skeleton width="36px" height="0.875rem"></app-skeleton>
                </td>
                <!-- Col 6: Fecha -->
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <app-skeleton width="75px" height="0.875rem"></app-skeleton>
                </td>
                <!-- Col 7: Acciones -->
                <td class="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                  <app-skeleton width="70px" height="1.75rem" rounded="rounded-lg" className="ml-auto"></app-skeleton>
                </td>
              } @else {
                <!-- Default dynamic columns -->
                @if (hasCheckbox()) {
                  <td class="py-3.5 pl-4 pr-2 align-middle">
                    <app-skeleton width="16px" height="16px" rounded="rounded"></app-skeleton>
                  </td>
                }
                @for (col of colIndices(); track col) {
                  <td class="py-3.5 px-3">
                    <app-skeleton [width]="defaultColWidth(r, col)" height="0.875rem"></app-skeleton>
                  </td>
                }
                @if (hasActions()) {
                  <td class="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                    <app-skeleton width="60px" height="1.75rem" rounded="rounded-lg" className="ml-auto"></app-skeleton>
                  </td>
                }
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class SkeletonTableComponent {
  variant = input<SkeletonTableVariant>('default');
  rows = input<number>(5);
  columns = input<number>(5);
  showHeader = input<boolean>(true);
  hasCheckbox = input<boolean>(false);
  hasActions = input<boolean>(true);
  className = input<string>('');
  srText = input<string>('Cargando registros...');

  rowIndices = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
  colIndices = computed(() => Array.from({ length: this.columns() }, (_, i) => i));

  colHeaderWidth(col: number): string {
    const widths = ['80px', '120px', '95px', '75px', '110px', '90px'];
    return widths[col % widths.length];
  }

  defaultColWidth(row: number, col: number): string {
    const variations = [
      ['75%', '60%', '85%', '50%', '70%'],
      ['60%', '80%', '45%', '70%', '90%'],
      ['90%', '70%', '65%', '80%', '55%'],
      ['50%', '65%', '90%', '60%', '80%'],
      ['80%', '85%', '55%', '75%', '65%']
    ];
    const rowList = variations[row % variations.length];
    return rowList[col % rowList.length];
  }

  cellWidth(row: number, slot: number, fallback: string): string {
    const list = [
      ['70%', '85%', '60%', '75%'],
      ['85%', '65%', '80%', '90%'],
      ['60%', '90%', '55%', '65%'],
      ['90%', '75%', '70%', '80%'],
      ['75%', '60%', '85%', '70%']
    ];
    const rowList = list[row % list.length];
    return rowList[slot % rowList.length] || fallback;
  }
}

