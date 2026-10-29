import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormAlertComponent } from './form-alert.component';

describe('FormAlertComponent', () => {
  let component: FormAlertComponent;
  let fixture: ComponentFixture<FormAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormAlertComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FormAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create form alert component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute error style by default', () => {
    expect(component.computedClasses()).toContain('border-destructive');
  });

  it('should compute success style when type is success', () => {
    fixture.componentRef.setInput('type', 'success');
    fixture.detectChanges();
    expect(component.computedClasses()).toContain('border-emerald-500');
  });
});
