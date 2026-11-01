import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { SignUpComponent } from './sign-up.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignUpComponent],
      providers: [
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create sign up component', () => {
    expect(component).toBeTruthy();
  });

  it('should invalidate form until required consents are given', () => {
    component.form.patchValue({
      documentNumber: '1020304050',
      firstName: 'Carlos',
      lastName: 'Gómez',
      email: 'carlos@firma.co',
      password: 'StrongPassword123',
      acceptTerms: false,
      acceptPrivacy: false
    });
    expect(component.form.valid).toBeFalse();

    component.form.patchValue({
      acceptTerms: true,
      acceptPrivacy: true
    });
    expect(component.form.valid).toBeTrue();
  });

  describe('HU-20: Registro sin Auto-Login y Redirección a Activación Pendiente', () => {
    it('debe navegar a /activacion-pendiente con el correo registrado tras respuesta exitosa', () => {
      const navigateSpy = spyOn(router, 'navigate');
      spyOn(authService, 'register').and.returnValue(
        of({
          success: true,
          data: {
            email: 'litigante@firma.co',
            requiresEmailVerification: true,
            cooldownSeconds: 60
          }
        })
      );

      component.form.patchValue({
        documentType: 'CC',
        documentNumber: '1020304050',
        firstName: 'Carlos',
        lastName: 'Gómez',
        email: 'litigante@firma.co',
        password: 'StrongPassword123',
        acceptTerms: true,
        acceptPrivacy: true
      });

      component.onSubmit();

      expect(navigateSpy).toHaveBeenCalledWith(['/activacion-pendiente'], {
        queryParams: { email: 'litigante@firma.co' }
      });
    });
  });
});
