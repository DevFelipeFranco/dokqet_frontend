import { HttpErrorResponse } from '@angular/common/http';

export type HttpErrorKind =
  | 'CONNECTION_OFFLINE'
  | 'SERVICE_UNAVAILABLE'
  | 'SERVER_ERROR'
  | 'RATE_LIMITED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_SUSPENDED'
  | 'EMAIL_NOT_VERIFIED'
  | 'INVALID_CREDENTIALS'
  | 'BAD_REQUEST'
  | 'UNKNOWN';

export interface ParsedHttpError {
  kind: HttpErrorKind;
  status: number;
  title: string;
  message: string;
  advice?: string;
  isConnectionOrServerError: boolean;
  canRetry: boolean;
  errorCode?: string;
}

/**
 * Analiza un error HTTP retornado por Angular HttpClient y lo clasifica semánticamente
 * para evitar atribuir caídas del servidor o fallas de red a errores de credenciales.
 */
export function parseHttpAuthError(error: unknown): ParsedHttpError {
  let status = 0;
  let detail: string | undefined;
  let message: string | undefined;
  let errorCode: string | undefined;

  if (error instanceof HttpErrorResponse) {
    status = error.status;
    detail = error.error?.detail;
    message = error.error?.message;
    errorCode = error.error?.errorCode;
  } else if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, any>;
    status = typeof errObj['status'] === 'number' ? errObj['status'] : 0;
    detail = errObj['error']?.detail;
    message = errObj['error']?.message;
    errorCode = errObj['error']?.errorCode || errObj['errorCode'];
  }

  // 1. Backend no responde / Sin conexión / Caída de red / CORS bloqueado por caída (Status 0)
  if (status === 0) {
    return {
      kind: 'CONNECTION_OFFLINE',
      status: 0,
      title: 'Error de conexión con el servidor',
      message: 'No fue posible comunicarse con el servicio de Dokqet. El servidor no responde o no tienes conexión a internet.',
      advice: 'Tus credenciales no fueron evaluadas ni rechazadas. No es necesario cambiar tu contraseña; intenta nuevamente cuando el servicio se restablezca.',
      isConnectionOrServerError: true,
      canRetry: true
    };
  }

  // 2. Puerta de enlace / Proxy inverso / Mantenimiento (Status 502, 503, 504)
  if (status === 502 || status === 503 || status === 504) {
    return {
      kind: 'SERVICE_UNAVAILABLE',
      status,
      title: 'Servicio temporalmente no disponible',
      message: `El servidor de autenticación se encuentra en mantenimiento o no está respondiendo (Código HTTP ${status}).`,
      advice: 'Tus credenciales no fueron rechazadas. Por favor espera unos minutos antes de volver a intentar.',
      isConnectionOrServerError: true,
      canRetry: true
    };
  }

  // 3. Error interno del servidor en el procesamiento (Status 500)
  if (status >= 500) {
    return {
      kind: 'SERVER_ERROR',
      status,
      title: 'Falla interna del servidor',
      message: detail || message || 'Ocurrió un error inesperado en el servidor al intentar validar tu acceso.',
      advice: 'Tus datos de acceso no han sido rechazados. Si el error persiste, contacta al soporte técnico de tu despacho.',
      isConnectionOrServerError: true,
      canRetry: true
    };
  }

  // 4. Rate Limiting / Demasiadas solicitudes (Status 429)
  if (status === 429) {
    return {
      kind: 'RATE_LIMITED',
      status: 429,
      title: 'Límite de solicitudes superado',
      message: detail || message || 'Has realizado demasiados intentos en poco tiempo. Por seguridad, el acceso se ha pausado brevemente.',
      advice: 'Espera un momento antes de volver a ingresar.',
      isConnectionOrServerError: false,
      canRetry: false
    };
  }

  // 5. Cuenta bloqueada por seguridad (Status 423)
  if (status === 423) {
    return {
      kind: 'ACCOUNT_LOCKED',
      status: 423,
      title: 'Cuenta bloqueada por seguridad',
      message: detail || message || 'Cuenta bloqueada temporalmente por exceso de intentos fallidos.',
      isConnectionOrServerError: false,
      canRetry: false,
      errorCode
    };
  }

  // 5.0 Cuenta suspendida (Status 403 con ACCOUNT_SUSPENDED - HU-21 / US-020)
  if (status === 403 && (errorCode === 'ACCOUNT_SUSPENDED' || detail?.toLowerCase().includes('suspend') || message?.toLowerCase().includes('suspend'))) {
    return {
      kind: 'ACCOUNT_SUSPENDED',
      status: 403,
      title: 'Cuenta suspendida',
      message: detail || message || 'Tu cuenta ha sido suspendida y no es posible iniciar sesión. Contacta al administrador.',
      advice: 'Comunícate con soporte técnico para revisar el estado de tu cuenta.',
      isConnectionOrServerError: false,
      canRetry: false,
      errorCode: 'ACCOUNT_SUSPENDED'
    };
  }

  // 5.1 Correo electrónico no verificado (Status 403 con EMAIL_NOT_VERIFIED)
  if (status === 403 && (errorCode === 'EMAIL_NOT_VERIFIED' || detail?.toLowerCase().includes('activ') || message?.toLowerCase().includes('activ') || detail?.toLowerCase().includes('verific') || message?.toLowerCase().includes('verific'))) {
    return {
      kind: 'EMAIL_NOT_VERIFIED',
      status: 403,
      title: 'Cuenta pendiente de activación',
      message: detail || message || 'Tu cuenta aún no ha sido activada. Hemos enviado un correo de verificación a tu bandeja de entrada.',
      advice: 'Revisa tu correo electrónico para activar tu cuenta antes de iniciar sesión.',
      isConnectionOrServerError: false,
      canRetry: false,
      errorCode: 'EMAIL_NOT_VERIFIED'
    };
  }

  // 6. Solicitud incorrecta o intentos restantes (Status 400)
  if (status === 400) {
    return {
      kind: 'BAD_REQUEST',
      status: 400,
      title: 'Datos de acceso incorrectos',
      message: detail || message || 'Verifica los datos ingresados en el formulario.',
      isConnectionOrServerError: false,
      canRetry: false
    };
  }

  // 7. Credenciales incorrectas explícitas (Status 401, 404)
  if (status === 401 || status === 404) {
    return {
      kind: 'INVALID_CREDENTIALS',
      status,
      title: 'Credenciales inválidas',
      message: detail || message || 'Credenciales inválidas o correo profesional no registrado.',
      advice: 'Si no recuerdas tu contraseña, puedes restablecerla.',
      isConnectionOrServerError: false,
      canRetry: false
    };
  }

  // Fallback por defecto para otros errores HTTP 4xx
  return {
    kind: 'UNKNOWN',
    status,
    title: 'Error de autenticación',
    message: detail || message || 'No fue posible completar el inicio de sesión. Por favor verifica tus datos.',
    isConnectionOrServerError: false,
    canRetry: false
  };
}

