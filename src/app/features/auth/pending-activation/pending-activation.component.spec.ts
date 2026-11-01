import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { PendingActivationComponent } from './pending-activation.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('PendingActivationComponent (HU-20: Espera de Activación y Webmail)', () => {
  let component: PendingActivationComponent;
  let fixture: ComponentFixture<PendingActivationComponent>;
  let authService: AuthService;

  const activatedRouteMock = {
    snapshot: {
      queryParams: {
        email: 'litigante@gmail.com'
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingActivationComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PendingActivationComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
  });

  it('debe crearse exitosamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe leer el correo de los queryParams y detectar el proveedor de webmail Gmail', () => {
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.email()).toBe('litigante@gmail.com');
    expect(component.webmailProvider()?.name).toBe('Abrir Gmail');
    expect(component.webmailProvider()?.url).toBe('https://mail.google.com');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('litigante@gmail.com');
    expect(compiled.textContent).toContain('Abrir Gmail');
  });

  it('debe iniciar cooldown de 60 segundos al reenviar correo exitosamente', () => {
    spyOn(authService, 'resendVerificationEmail').and.returnValue(
      of({ success: true, message: 'Enviado' })
    );

    component.email.set('litigante@firma.co');
    component.resendEmail();

    expect(authService.resendVerificationEmail).toHaveBeenCalledWith('litigante@firma.co');
    expect(component.cooldownRemaining()).toBe(60);
    expect(component.resendSuccess()).toContain('reenviado exitosamente');
  });
});
