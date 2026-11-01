import {
  parseDate,
  formatLocalDate,
  formatRelativeTime,
  getUserTimeZone,
  COLOMBIA_TIMEZONE
} from './datetime.utils';

describe('DateTimeUtils (Manejo de Fechas y Zonas Horarias)', () => {
  const utcIsoString = '2026-11-01T20:12:27.489010Z'; // 20:12 UTC = 15:12 COT (3:12 p. m.)

  it('parseDate debe devolver null para valores vacíos o inválidos', () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate('')).toBeNull();
    expect(parseDate('fecha-invalida')).toBeNull();
  });

  it('parseDate debe parsear correctamente cadenas ISO UTC y números epoch', () => {
    const parsed = parseDate(utcIsoString);
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.getUTCHours()).toBe(20);
    expect(parsed?.getUTCMinutes()).toBe(12);

    const epochParsed = parseDate(1600000000000);
    expect(epochParsed).toBeInstanceOf(Date);
  });

  it('formatLocalDate con formato "time" y timezone America/Bogota debe dar 3:12 p. m.', () => {
    const formatted = formatLocalDate(utcIsoString, 'time', {
      timeZone: 'America/Bogota',
      locale: 'es-CO'
    });

    // En español puede formatearse con "p. m.", "p.m." o "PM"
    expect(formatted.toLowerCase()).toMatch(/3:12/);
    expect(formatted.toLowerCase()).toMatch(/p/);
  });

  it('formatLocalDate con formato "legal" debe incluir sufijo COT y hora colombiana', () => {
    const formatted = formatLocalDate(utcIsoString, 'legal');

    expect(formatted).toContain('COT');
    expect(formatted).toMatch(/3:12/);
  });

  it('formatLocalDate con formato "date" debe incluir día y año', () => {
    const formatted = formatLocalDate(utcIsoString, 'date', {
      timeZone: 'America/Bogota',
      locale: 'es-CO'
    });

    expect(formatted).toContain('2026');
    expect(formatted).toContain('1');
  });

  it('formatRelativeTime debe generar descripciones amigables', () => {
    const now = new Date();
    expect(formatRelativeTime(now, 'es-CO')).toBe('hace un momento');

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const relText = formatRelativeTime(fiveMinutesAgo, 'es-CO');
    expect(relText).toMatch(/5/);
  });

  it('getUserTimeZone debe retornar una zona horaria válida', () => {
    const tz = getUserTimeZone();
    expect(tz).toBeTruthy();
    expect(typeof tz).toBe('string');
  });
});
