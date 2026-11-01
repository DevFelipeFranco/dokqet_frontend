import { Pipe, PipeTransform } from '@angular/core';
import { DokqetDateFormat, formatLocalDate } from '../../core/utils/datetime.utils';

@Pipe({
  name: 'dokqetDate',
  standalone: true
})
export class DokqetDatePipe implements PipeTransform {
  /**
   * Transforma una fecha UTC ISO 8601 (o Date/timestamp) a la hora local del usuario
   * o al formato especificado (time, date, datetime, full, relative, legal).
   *
   * Ejemplos:
   *   {{ session.lastActiveAt | dokqetDate }} => "1 nov 2026, 3:12 p. m."
   *   {{ session.lastActiveAt | dokqetDate:'time' }} => "3:12 p. m."
   *   {{ session.lastActiveAt | dokqetDate:'relative' }} => "hace 5 minutos"
   *   {{ actuation.fecha | dokqetDate:'legal' }} => "1 nov 2026, 3:12 p. m. COT"
   */
  transform(
    value: string | number | Date | null | undefined,
    format: DokqetDateFormat = 'datetime',
    timeZone?: string,
    locale?: string
  ): string {
    return formatLocalDate(value, format, { timeZone, locale });
  }
}
