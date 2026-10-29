import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'radicado',
  standalone: true
})
export class RadicadoPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const clean = value.replace(/[\s.\-‐‑–—]/g, '');
    if (clean.length !== 23) return value;

    // Formato estándar: 05001-31-03-001-2023-00274-00
    return `${clean.slice(0, 5)}-${clean.slice(5, 7)}-${clean.slice(7, 9)}-${clean.slice(9, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 21)}-${clean.slice(21, 23)}`;
  }
}