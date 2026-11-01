import { HttpErrorResponse } from '@angular/common/http';
import { parseHttpAuthError } from './http-error.utils';

describe('http-error.utils - parseHttpAuthError', () => {
  it('debe identificar status 0 como CONNECTION_OFFLINE con advertencia de no cambiar contraseña', () => {
    const error = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
    const result = parseHttpAuthError(error);

    expect(result.kind).toBe('CONNECTION_OFFLINE');
    expect(result.status).toBe(0);
    expect(result.isConnectionOrServerError).toBeTrue();
    expect(result.canRetry).toBeTrue();
    expect(result.title).toContain('Error de conexión');
    expect(result.advice).toContain('No es necesario cambiar tu contraseña');
  });

  it('debe identificar status 503 como SERVICE_UNAVAILABLE', () => {
    const error = new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' });
    const result = parseHttpAuthError(error);

    expect(result.kind).toBe('SERVICE_UNAVAILABLE');
    expect(result.status).toBe(503);
    expect(result.isConnectionOrServerError).toBeTrue();
    expect(result.canRetry).toBeTrue();
    expect(result.title).toContain('temporalmente no disponible');
  });

  it('debe identificar status 500 como SERVER_ERROR con mensaje adecuado', () => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
      error: { detail: 'Database connection failed' }
    });
    const result = parseHttpAuthError(error);

    expect(result.kind).toBe('SERVER_ERROR');
    expect(result.status).toBe(500);
    expect(result.isConnectionOrServerError).toBeTrue();
    expect(result.message).toBe('Database connection failed');
  });

  it('debe identificar status 401 como INVALID_CREDENTIALS', () => {
    const error = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      error: { detail: 'Credenciales inválidas' }
    });
    const result = parseHttpAuthError(error);

    expect(result.kind).toBe('INVALID_CREDENTIALS');
    expect(result.status).toBe(401);
    expect(result.isConnectionOrServerError).toBeFalse();
    expect(result.message).toBe('Credenciales inválidas');
  });

  it('debe identificar status 423 como ACCOUNT_LOCKED', () => {
    const error = new HttpErrorResponse({
      status: 423,
      statusText: 'Locked',
      error: { detail: 'Cuenta bloqueada' }
    });
    const result = parseHttpAuthError(error);

    expect(result.kind).toBe('ACCOUNT_LOCKED');
    expect(result.status).toBe(423);
    expect(result.isConnectionOrServerError).toBeFalse();
  });

  it('debe manejar objetos planos no instanciados con HttpErrorResponse', () => {
    const error = { status: 0 };
    const result = parseHttpAuthError(error);

    expect(result.kind).toBe('CONNECTION_OFFLINE');
    expect(result.isConnectionOrServerError).toBeTrue();
  });
});

