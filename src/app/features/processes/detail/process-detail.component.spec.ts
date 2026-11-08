import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ProcessDetailComponent } from './process-detail.component';
import { ProcessService } from '../../../core/services/process.service';
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
            paramMap: of(convertToParamMap({ id: 'proc-123' })),
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

  describe('HU-30 Providencias y estados judiciales del micrositio', () => {
    it('should correctly render and bind actuaciones with ActuacionEstado', () => {
      component.detail.set({
        id: 'proc-123',
        isHead: true,
        process: {
          radicado: '05001333300120240004500',
          instancia: '00',
          despacho: 'Juzgado 1 Civil de Medellín',
          esPrivado: false
        },
        organization: {
          responsibleUserId: 'u-1',
          responsibleName: 'Ana Gómez',
          representedParty: RepresentedParty.DEMANDANTE,
          notes: null,
          createdAt: '2026-01-01'
        },
        parties: [],
        actuaciones: [
          {
            id: 'act-found',
            consecutivo: 10,
            fechaActuacion: '2026-10-15',
            tipoActuacion: 'Fijación estado',
            anotacion: 'Auto admite demanda',
            fechaInicial: '2026-10-15',
            fechaFinal: '2026-10-18',
            tieneDocumentos: true,
            isNew: false,
            estado: {
              estadoVista: 'ENCONTRADO',
              processPdfUrl: 'https://publicacionesprocesales.ramajudicial.gov.co/documents/2024-45_Auto.pdf',
              processPdfName: '2024-45_Auto.pdf',
              estadoGeneralUrl: 'https://publicacionesprocesales.ramajudicial.gov.co/documents/Estado_045.pdf',
              estadoGeneralName: 'Estado_045.pdf'
            }
          },
          {
            id: 'act-solo',
            consecutivo: 9,
            fechaActuacion: '2026-10-10',
            tipoActuacion: 'Fijación estado',
            anotacion: 'Estado ordinario',
            tieneDocumentos: false,
            isNew: false,
            estado: {
              estadoVista: 'SOLO_ESTADO',
              processPdfUrl: null,
              processPdfName: null,
              estadoGeneralUrl: 'https://publicacionesprocesales.ramajudicial.gov.co/documents/Estado_040.pdf',
              estadoGeneralName: 'Estado_040.pdf'
            }
          },
          {
            id: 'act-buscando-initial',
            consecutivo: 8,
            fechaActuacion: '2026-10-08',
            tipoActuacion: 'Fijación estado',
            anotacion: 'Auto decreta pruebas',
            tieneDocumentos: false,
            isNew: false,
            estado: {
              estadoVista: 'BUSCANDO',
              processPdfUrl: null,
              processPdfName: null,
              estadoGeneralUrl: null,
              estadoGeneralName: null,
              buscadoAlMenosUnaVez: false
            }
          },
          {
            id: 'act-buscando-waiting',
            consecutivo: 7,
            fechaActuacion: '2026-10-07',
            tipoActuacion: 'Fijación estado',
            anotacion: 'Auto corre traslado',
            tieneDocumentos: false,
            isNew: false,
            estado: {
              estadoVista: 'BUSCANDO',
              processPdfUrl: null,
              processPdfName: null,
              estadoGeneralUrl: null,
              estadoGeneralName: null,
              buscadoAlMenosUnaVez: true
            }
          }
        ],
        totalActuaciones: 4,
        newActuacionesCount: 0,
        page: 1,
        pageSize: 10
      });

      fixture.detectChanges();

      const acts = component.visibleActuaciones();
      expect(acts.length).toBe(4);
      expect(acts[0].estado?.estadoVista).toBe('ENCONTRADO');
      expect(acts[0].estado?.processPdfName).toBe('2024-45_Auto.pdf');
      expect(acts[1].estado?.estadoVista).toBe('SOLO_ESTADO');
      expect(acts[2].estado?.estadoVista).toBe('BUSCANDO');
      expect(acts[3].estado?.estadoVista).toBe('BUSCANDO');

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Abrir PDF del auto');
      expect(compiled.textContent).toContain('Ver estado del juzgado');
      expect(compiled.textContent).toContain('Consultando publicaciones del juzgado en este momento');
      expect(compiled.textContent).toContain('Aún no publicado por el despacho · Revisión automática por 5 días hábiles');
      expect(compiled.textContent).toContain('Abrir portal oficial');
    });

    it('should trigger at most 2 silent background reloads when buscadoAlMenosUnaVez is false', fakeAsync(() => {
      const processService = TestBed.inject(ProcessService);
      const pendingDetail = {
        id: 'proc-123',
        isHead: true,
        process: {
          radicado: '05001333300120260010600',
          instancia: '00',
          despacho: 'Juzgado 1 Administrativo de Medellín',
          esPrivado: false
        },
        organization: {
          responsibleUserId: 'u-1',
          responsibleName: 'Ana Gómez',
          representedParty: RepresentedParty.DEMANDANTE,
          notes: null,
          createdAt: '2026-11-01'
        },
        parties: [],
        actuaciones: [
          {
            id: 'act-1',
            consecutivo: 5,
            fechaActuacion: '2026-11-06',
            tipoActuacion: 'POR ESTADO',
            anotacion: 'Fija fecha inicial',
            tieneDocumentos: false,
            isNew: false,
            estado: {
              estadoVista: 'BUSCANDO',
              buscadoAlMenosUnaVez: false
            }
          }
        ],
        totalActuaciones: 1,
        newActuacionesCount: 0,
        page: 1,
        pageSize: 10
      };

      const resolvedDetail = {
        ...pendingDetail,
        actuaciones: [
          {
            ...pendingDetail.actuaciones[0],
            estado: {
              estadoVista: 'ENCONTRADO',
              processPdfUrl: 'https://publicacionesprocesales.ramajudicial.gov.co/c/document_library/get_file?uuid=123&groupId=1',
              processPdfName: '2026-106 fija fecha inicial.pdf',
              estadoGeneralUrl: 'https://publicacionesprocesales.ramajudicial.gov.co/c/document_library/get_file?uuid=456&groupId=1',
              estadoGeneralName: 'Estado noviembre 06 2026.pdf',
              buscadoAlMenosUnaVez: true
            }
          }
        ]
      };

      const spy = spyOn(processService, 'getProcessDetail').and.returnValues(
        of({ success: true, data: pendingDetail }),
        of({ success: true, data: resolvedDetail })
      );

      component.loadDetail('proc-123', 1, 10);
      expect(spy.calls.count()).toBe(1);

      tick(4000);
      expect(spy.calls.count()).toBe(2);
      expect(component.detail()?.actuaciones[0].estado?.estadoVista).toBe('ENCONTRADO');

      // Ya quedó resuelto, no debe seguir haciendo polling infinito
      tick(20000);
      expect(spy.calls.count()).toBe(2);
    }));

    it('US-025: should consult documents via ProcessService and update state', () => {
      const processService = TestBed.inject(ProcessService);
      const docsResponse = {
        success: true,
        data: {
          actuacionId: 'act-1',
          kind: 'LISTA' as const,
          documentos: [
            {
              idRegDocumento: 1001,
              nombre: 'Auto interlocutorio.pdf',
              descripcion: 'Auto',
              fechaCarga: '2026-10-25T10:00:00Z',
              url: 'https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Descarga/Documento/1001'
            }
          ]
        }
      };

      const spy = spyOn(processService, 'consultActuacionDocumentos').and.returnValue(of(docsResponse));
      component.consultDocumentos('act-1');

      expect(spy).toHaveBeenCalledWith('proc-123', 'act-1');
      expect(component.isConsultingDocumentos('act-1')).toBeFalse();
      const view = component.getDocumentosView({ id: 'act-1' });
      expect(view).toBeTruthy();
      expect(view?.kind).toBe('LISTA');
      expect(view?.documentos.length).toBe(1);
      expect(view?.documentos[0].nombre).toBe('Auto interlocutorio.pdf');
    });

    it('US-025: should manage preview modal state lifecycle correctly', () => {
      const doc = {
        idRegDocumento: 1001,
        nombre: 'Auto interlocutorio.pdf',
        descripcion: 'Auto',
        fechaCarga: '2026-10-25T10:00:00Z',
        url: 'https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Descarga/Documento/1001'
      };

      component.openDocumentoPreview(doc);
      expect(component.previewDoc()).toEqual(doc);
      expect(component.previewState()).toBe('LOADING');

      component.closePreviewModal();
      expect(component.previewDoc()).toBeNull();
      expect(component.previewBlobUrl()).toBeNull();
    });
  });
});
