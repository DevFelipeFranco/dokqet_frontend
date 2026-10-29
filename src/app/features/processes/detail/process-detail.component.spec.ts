import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ProcessDetailComponent } from './process-detail.component';
import { RepresentedParty, PartyCategory } from '../../../core/models/process.model';

describe('ProcessDetailComponent', () => {
  let component: ProcessDetailComponent;
  let fixture: ComponentFixture<ProcessDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'proc-123' : null)
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the detail component', () => {
    expect(component).toBeTruthy();
    expect(component.processId()).toBe('proc-123');
  });

  it('should format parties and categories with pure delegators', () => {
    expect(component.formatParty(RepresentedParty.DEMANDANTE)).toBe('Demandante');
    expect(component.formatParty(null)).toBe('Sin definir');
    expect(component.formatCategory(PartyCategory.DEMANDANTE)).toBe('Demandante');
    expect(component.formatCategory(PartyCategory.MINISTERIO_PUBLICO)).toBe('Ministerio Público');
  });

  it('should manage edit org state correctly', () => {
    component.cancelEditOrg();
    expect(component.editingOrg()).toBeFalse();
    expect(component.editError()).toBeNull();
  });

  it('should filter, search, paginate and expand actuaciones cleanly', () => {
    component.detail.set({
      id: 'proc-123',
      isHead: true,
      process: {
        radicado: '11001310300120240012300',
        despacho: 'Juzgado 01 Civil del Circuito',
        departamento: 'Bogotá D.C.',
        ponente: 'Juez Titular',
        tipoProceso: 'Declarativo',
        claseProceso: 'Verbal',
        recurso: null,
        ubicacion: 'Despacho',
        fechaInicio: '2024-01-15',
        fechaUltimaActuacion: '2026-03-10',
        ultimaConsulta: '2026-03-11',
        esPrivado: false,
        notaRadicacion: null,
        instancia: '00'
      },
      organization: {
        responsibleUserId: 'u-1',
        responsibleName: 'Ana Gómez',
        representedParty: RepresentedParty.DEMANDANTE,
        notes: 'Seguimiento prioritario',
        createdAt: '2026-01-01'
      },
      parties: [],
      actuaciones: Array.from({ length: 10 }, (_, idx) => ({
        id: `act-${idx + 1}`,
        consecutivo: 25 - idx,
        fechaActuacion: `2026-03-${String(25 - idx).padStart(2, '0')}`,
        tipoActuacion: idx === 0 ? 'Auto admite demanda' : 'Constancia secretarial',
        anotacion: idx === 0 ? 'Texto extenso de anotación judicial '.repeat(6) : 'Trámite ordinario',
        fechaInicial: idx < 2 ? '2026-03-15' : null,
        fechaFinal: idx < 2 ? '2026-03-25' : null,
        fechaRegistro: '2026-03-12',
        tieneDocumentos: idx === 0,
        isNew: idx < 3
      })),
      totalActuaciones: 25,
      newActuacionesCount: 3,
      page: 1,
      pageSize: 10
    });

    // Default server pageSize is 10, so totalPages for 25 totalActuaciones is 3
    expect(component.pageSize()).toBe(10);
    expect(component.filteredActuaciones().length).toBe(10);
    expect(component.visibleActuaciones().length).toBe(10);
    expect(component.totalPages()).toBe(3);
    expect(component.pageStartIndex()).toBe(1);
    expect(component.pageEndIndex()).toBe(10);

    // Filter by NEW
    component.setActuacionFilter('NEW');
    expect(component.filteredActuaciones().length).toBe(3);

    // Filter by TERMS
    component.setActuacionFilter('TERMS');
    expect(component.filteredActuaciones().length).toBe(2);

    // Filter by DOCS
    component.setActuacionFilter('DOCS');
    expect(component.filteredActuaciones().length).toBe(1);

    // Reset filters
    component.resetActuacionFilters();
    expect(component.actuacionFilter()).toBe('ALL');
    expect(component.filteredActuaciones().length).toBe(10);

    // Toggle individual annotation expansion
    expect(component.isActuacionExpanded('act-1')).toBeFalse();
    component.toggleActuacionExpand('act-1');
    expect(component.isActuacionExpanded('act-1')).toBeTrue();
  });
});
