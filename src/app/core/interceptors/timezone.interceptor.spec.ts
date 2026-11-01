import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { timezoneInterceptor, TIMEZONE_HEADER } from './timezone.interceptor';
import { getUserTimeZone } from '../utils/datetime.utils';

describe('timezoneInterceptor (HU-22: Inyección de X-Timezone)', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([timezoneInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('debe adjuntar la cabecera X-Timezone en peticiones hacia la API de Dokqet (/api/v1/**)', () => {
    const expectedTz = getUserTimeZone();

    httpClient.get('/api/v1/auth/session/heartbeat').subscribe();

    const req = httpTestingController.expectOne('/api/v1/auth/session/heartbeat');
    expect(req.request.headers.has(TIMEZONE_HEADER)).toBeTrue();
    expect(req.request.headers.get(TIMEZONE_HEADER)).toBe(expectedTz);

    req.flush({ success: true });
  });

  it('NO debe adjuntar la cabecera X-Timezone a peticiones de dominios externos (RN-FE-02)', () => {
    httpClient.get('https://fonts.googleapis.com/css?family=Inter').subscribe();

    const req = httpTestingController.expectOne('https://fonts.googleapis.com/css?family=Inter');
    expect(req.request.headers.has(TIMEZONE_HEADER)).toBeFalse();

    req.flush({});
  });
});
