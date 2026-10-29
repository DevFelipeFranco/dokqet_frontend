import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SignUpComponent } from './sign-up.component';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;

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
});
