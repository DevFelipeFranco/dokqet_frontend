import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente e inicializar el contenido oficial de la landing de Miguel (DOKQET)', () => {
    expect(component).toBeTruthy();
    expect(component.hero.time).toBe('Lunes, 7:40 a. m.');
    expect(component.hero.notice.radicado).toBe('99999-31-03-001-2023-00001-00');
    expect(component.problem.beats.length).toBe(3);
    expect(component.how.steps.length).toBe(4);
    expect(component.how.features.length).toBe(3);
    expect(component.demo.captions.length).toBe(3);
    expect(component.plans.items.length).toBe(3);
    expect(component.consulting.items.length).toBe(4);
    expect(component.closing.time).toBe('Lunes, 6:00 p. m. Ningún término vencido.');
    expect(component.activeBirdPieces()).toBeGreaterThanOrEqual(1);
    expect(component.problemCounter()).toBeGreaterThanOrEqual(1);
  });

  it('debe abrir y cerrar el menú móvil de navegación', () => {
    expect(component.mobileMenuOpen()).toBeFalse();

    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBeTrue();

    component.closeMobileMenu();
    expect(component.mobileMenuOpen()).toBeFalse();
  });

  it('debe renderizar las tres pantallas de demostración con datos ficticios de origami (99999)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('DOBLEZ & ASOCIADOS ABOGADOS');
    expect(compiled.textContent).toContain('PAPELERA LA GRULLA S.A.S.');
    expect(compiled.textContent).toContain('99999-31-03-001-2023-00001-00');
  });
});
