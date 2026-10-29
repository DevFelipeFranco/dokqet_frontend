import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create forgot password component', () => {
    expect(component).toBeTruthy();
  });

  it('should validate email format', () => {
    component.form.patchValue({ email: 'invalid' });
    expect(component.form.valid).toBeFalse();

    component.form.patchValue({ email: 'abogado@dokqet.co' });
    expect(component.form.valid).toBeTrue();
  });
});
