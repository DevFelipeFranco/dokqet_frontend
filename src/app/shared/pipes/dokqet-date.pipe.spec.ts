import { DokqetDatePipe } from './dokqet-date.pipe';

describe('DokqetDatePipe', () => {
  let pipe: DokqetDatePipe;
  const sampleUtcString = '2026-11-01T20:12:27.489010Z';

  beforeEach(() => {
    pipe = new DokqetDatePipe();
  });

  it('debe crearse exitosamente', () => {
    expect(pipe).toBeTruthy();
  });

  it('debe transformar cadena ISO UTC a hora local amigable en timeZone America/Bogota', () => {
    const result = pipe.transform(sampleUtcString, 'time', 'America/Bogota', 'es-CO');
    expect(result.toLowerCase()).toMatch(/3:12/);
  });

  it('debe transformar en formato legal con COT', () => {
    const result = pipe.transform(sampleUtcString, 'legal');
    expect(result).toContain('COT');
  });

  it('debe devolver raya "—" para valores nulos o indefinidos', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
  });
});
