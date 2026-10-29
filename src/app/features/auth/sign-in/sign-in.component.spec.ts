import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SignInComponent } from './sign-in.component';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignInComponent],
      providers: [
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create sign in component', () => {
    expect(component).toBeTruthy();
  });

  it('should validate email and password controls', () => {
    expect(component.form.valid).toBeFalse();

    component.form.patchValue({
      email: 'invalid-email',
      password: ''
    });
    expect(component.form.valid).toBeFalse();

    component.form.patchValue({
      email: 'abogado@firma.co',
      password: 'SecretPassword123'
    });
    expect(component.form.valid).toBeTrue();
  });

  it('should toggle password visibility signal', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBeFalse();
  });

  it('should detect caps lock state from keyboard events', () => {
    const capsOnEvent = new KeyboardEvent('keydown', {
      modifierCapsLock: true
    });
    component.checkCapsLock(capsOnEvent);
    expect(component.capsLockActive()).toBeTrue();
  });
});
