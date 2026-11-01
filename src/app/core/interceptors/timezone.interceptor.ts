import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getUserTimeZone } from '../utils/datetime.utils';

export const TIMEZONE_HEADER = 'X-Timezone';

/**
 * Interceptor HTTP que adjunta automáticamente la zona horaria del cliente (IANA)
 * en la cabecera 'X-Timezone' para que el backend serialice las fechas
 * con el offset correspondiente a la ubicación física del usuario (HU-22).
 */
export const timezoneInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Solo aplicar a endpoints propios de la API de Dokqet para no invadir servicios externos (RN-FE-02)
  const isDokqetApi = req.url.includes('/api/v1/') || req.url.startsWith('/api/');

  if (!isDokqetApi) {
    return next(req);
  }

  const timeZone = getUserTimeZone();

  const modifiedReq = req.clone({
    setHeaders: {
      [TIMEZONE_HEADER]: timeZone
    }
  });

  return next(modifiedReq);
};
