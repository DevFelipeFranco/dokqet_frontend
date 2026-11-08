import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OrigamiBrandPanelComponent } from './origami-brand-panel.component';

describe('OrigamiBrandPanelComponent', () => {
  let component: OrigamiBrandPanelComponent;
  let fixture: ComponentFixture<OrigamiBrandPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrigamiBrandPanelComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('debe crearse correctamente e inicializar los 48 triángulos del mosaico', () => {
    fixture = TestBed.createComponent(OrigamiBrandPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.triangles.length).toBe(48);
    expect(component.triangles[21].isNovedad).toBeTrue();
    expect(component.features.length).toBe(3);
  });

  it('debe saltar inmediatamente a fase "final" cuando animate es false', () => {
    fixture = TestBed.createComponent(OrigamiBrandPanelComponent);
    fixture.componentRef.setInput('animate', false);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.currentFase()).toBe('final');
  });

  it('debe transicionar por las fases de animación cuando animate es true', fakeAsync(() => {
    // Mock matchMedia para asegurar que no se detecte prefers-reduced-motion
    spyOn(window, 'matchMedia').and.returnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList);

    fixture = TestBed.createComponent(OrigamiBrandPanelComponent);
    fixture.componentRef.setInput('animate', true);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Fase inicial tras view init
    tick(30);
    expect(component.currentFase()).toBe('mosaico');

    // Al llegar a 2000ms pasa a fase pájaro
    tick(1970);
    expect(component.currentFase()).toBe('pajaro');

    // Al llegar a 3500ms se muestra el aviso simulado
    tick(1500);
    expect(component.showAviso()).toBeTrue();

    // Al llegar a 3700ms pasa a fase final
    tick(200);
    expect(component.currentFase()).toBe('final');

    // Al llegar a 4800ms se oculta el aviso simulado
    tick(1100);
    expect(component.showAviso()).toBeFalse();
  }));

  it('debe limpiar los temporizadores y la animación al destruirse', () => {
    fixture = TestBed.createComponent(OrigamiBrandPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(() => fixture.destroy()).not.toThrow();
  });
});
