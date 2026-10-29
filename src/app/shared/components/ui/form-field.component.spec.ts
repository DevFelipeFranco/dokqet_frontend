import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldComponent } from './form-field.component';

describe('FormFieldComponent', () => {
  let component: FormFieldComponent;
  let fixture: ComponentFixture<FormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente de campo con label flotante', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar el label con el ID asociado', () => {
    component.label = 'Correo institucional';
    component.id = 'email-input';
    fixture.detectChanges();

    const labelEl = fixture.nativeElement.querySelector('label');
    expect(labelEl).toBeTruthy();
    expect(labelEl.textContent.trim()).toBe('Correo institucional');
    expect(labelEl.getAttribute('for')).toBe('email-input');
  });

  it('debe mostrar el mensaje de error cuando se proporciona', () => {
    component.error = 'El correo es obligatorio';
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.floating-error');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('El correo es obligatorio');
  });

  it('debe mostrar el hint explicativo cuando no hay error', () => {
    component.hint = 'Ejemplo: contacto@firma.co';
    fixture.detectChanges();

    const hintEl = fixture.nativeElement.querySelector('.floating-hint');
    expect(hintEl).toBeTruthy();
    expect(hintEl.textContent).toContain('Ejemplo: contacto@firma.co');
  });
});

