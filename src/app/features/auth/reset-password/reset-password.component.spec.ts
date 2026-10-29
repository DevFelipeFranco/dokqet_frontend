import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'token' ? 'sample-recovery-token' : null)
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create reset password component', () => {
    expect(component).toBeTruthy();
    expect(component.token()).toBe('sample-recovery-token');
  });

  it('should reject non-matching passwords on submit', () => {
    component.form.patchValue({
      newPassword: 'Password123',
      confirmPassword: 'DifferentPassword123'
    });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Las contraseñas no coinciden.');
  });
});
