/**
 * Utilidades centralizadas para manejo de fechas, horas y zonas horarias en Dokqet.
 *
 * Principio rector de arquitectura:
 * "Almacenar y transportar en UTC (Z), formatear y presentar en la hora local del usuario en la UI".
 */

export const COLOMBIA_TIMEZONE = 'America/Bogota';
export const DEFAULT_LOCALE = 'es-CO';

export type DokqetDateFormat =
  | 'time'       // Ej: "3:12 p. m."
  | 'date'       // Ej: "1 nov 2026" o "1 de noviembre de 2026"
  | 'datetime'   // Ej: "1 nov 2026, 3:12 p. m."
  | 'full'       // Ej: "Domingo, 1 de noviembre de 2026, 3:12:27 p. m. (Hora local)"
  | 'relative'   // Ej: "hace un momento", "hace 5 minutos"
  | 'legal';     // Ej: "1 nov 2026, 3:12 p. m. COT (Rama Judicial de Colombia)"

/**
 * Obtiene la zona horaria del navegador del usuario de forma resiliente.
 */
export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || COLOMBIA_TIMEZONE;
  } catch {
    return COLOMBIA_TIMEZONE;
  }
}

/**
 * Obtiene el locale del navegador del usuario o 'es-CO' por defecto.
 */
export function getUserLocale(): string {
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      return navigator.language;
    }
  } catch {
    // Entorno no navegador
  }
  return DEFAULT_LOCALE;
}

/**
 * Convierte un valor de fecha heterogéneo (string ISO con Z, Date, timestamp numérico) a Date válido.
 */
export function parseDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Formatea una fecha ISO UTC según la zona horaria local del usuario o una zona específica.
 */
export function formatLocalDate(
  value: string | number | Date | null | undefined,
  format: DokqetDateFormat = 'datetime',
  options?: {
    timeZone?: string;
    locale?: string;
  }
): string {
  const date = parseDate(value);
  if (!date) return '—';

  const userTz = options?.timeZone || getUserTimeZone();
  const locale = options?.locale || getUserLocale();

  switch (format) {
    case 'time': {
      return new Intl.DateTimeFormat(locale, {
        timeZone: userTz,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date);
    }

    case 'date': {
      return new Intl.DateTimeFormat(locale, {
        timeZone: userTz,
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(date);
    }

    case 'datetime': {
      return new Intl.DateTimeFormat(locale, {
        timeZone: userTz,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date);
    }

    case 'full': {
      const formatted = new Intl.DateTimeFormat(locale, {
        timeZone: userTz,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      }).format(date);
      return formatted;
    }

    case 'legal': {
      // Hora legal de Colombia obligatoria para términos judiciales
      const formatted = new Intl.DateTimeFormat('es-CO', {
        timeZone: COLOMBIA_TIMEZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date);
      return `${formatted} COT`;
    }

    case 'relative': {
      return formatRelativeTime(date, locale);
    }

    default:
      return date.toLocaleString(locale, { timeZone: userTz });
  }
}

/**
 * Calcula el tiempo relativo humano (ej: "hace 5 minutos", "hace 2 horas", "en 3 días")
 */
export function formatRelativeTime(date: Date, locale = DEFAULT_LOCALE): string {
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHours = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHours / 24);

  // Si está disponible Intl.RelativeTimeFormat en el navegador
  if (typeof Intl !== 'undefined' && 'RelativeTimeFormat' in Intl) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffSec) < 45) {
      return 'hace un momento';
    }
    if (Math.abs(diffMin) < 60) {
      return rtf.format(diffMin, 'minute');
    }
    if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, 'hour');
    }
    if (Math.abs(diffDays) < 30) {
      return rtf.format(diffDays, 'day');
    }
  }

  // Fallback si no está disponible o es superior a un mes
  if (Math.abs(diffMin) < 1) return 'hace un momento';
  if (Math.abs(diffMin) < 60) return `hace ${Math.abs(diffMin)} min`;
  if (Math.abs(diffHours) < 24) return `hace ${Math.abs(diffHours)} h`;
  return formatLocalDate(date, 'date');
}
