import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { DashboardComponent, matchesProcessQuery } from './dashboard.component';
import { ProcessService } from '../../core/services/process.service';
import { ProcessListItem, RepresentedParty } from '../../core/models/process.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let processService: ProcessService;

  const mockProcesses: ProcessListItem[] = [
    {
      id: 'p-1',
      radicado: '05001333300020130157700',
      instancia: '1',
      despacho: 'Juzgado 1 Civil Municipal de Medellín',
      esPrivado: false,
      demandantes: ['Carlos Gómez'],
      demandados: ['Banco de Bogotá'],
      fechaUltimaActuacion: '2026-10-20',
      responsibleUserId: 'user-1',
      responsibleName: 'Felipe Montoya',
      representedParty: RepresentedParty.DEMANDANTE,
      subprocesses: [],
      newCount: 2,
      instanceNotices: 0
    },
    {
      id: 'p-2',
      radicado: '11001333300020180123400',
      instancia: '1',
      despacho: 'Tribunal Administrativo de Cundinamarca',
      esPrivado: true,
      demandantes: ['María Pérez'],
      demandados: ['Alcaldía de Bogotá'],
      fechaUltimaActuacion: '2026-10-15',
      responsibleUserId: null,
      responsibleName: null,
      representedParty: RepresentedParty.SIN_DEFINIR,
      subprocesses: [],
      newCount: 0,
      instanceNotices: 0
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    processService = TestBed.inject(ProcessService);
  });

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
  });

  describe('matchesProcessQuery pure function', () => {
    it('should match by radicado', () => {
      expect(matchesProcessQuery(mockProcesses[0], '0500133')).toBeTrue();
      expect(matchesProcessQuery(mockProcesses[0], '99999')).toBeFalse();
    });

    it('should match by despacho', () => {
      expect(matchesProcessQuery(mockProcesses[0], 'Medellín')).toBeTrue();
    });

    it('should match by party name', () => {
      expect(matchesProcessQuery(mockProcesses[0], 'Carlos')).toBeTrue();
      expect(matchesProcessQuery(mockProcesses[0], 'Banco')).toBeTrue();
    });

    it('should return true for empty or whitespace query', () => {
      expect(matchesProcessQuery(mockProcesses[0], '')).toBeTrue();
      expect(matchesProcessQuery(mockProcesses[0], '   ')).toBeTrue();
    });
  });

  describe('Signal filters and metrics', () => {
    beforeEach(() => {
      component.processes.set(mockProcesses);
    });

    it('should compute totalWithNews correctly', () => {
      expect(component.totalWithNews()).toBe(1);
    });

    it('should compute totalUnassigned correctly', () => {
      expect(component.totalUnassigned()).toBe(1);
    });

    it('should switch tabs and update activeTab signal', () => {
      component.setTab('NEWS');
      expect(component.activeTab()).toBe('NEWS');
      expect(component.filteredProcesses().length).toBe(1);

      component.setTab('UNASSIGNED');
      expect(component.activeTab()).toBe('UNASSIGNED');
      expect(component.filteredProcesses().length).toBe(1);
    });

    it('should reset filters', () => {
      component.setTab('NEWS');
      component.searchQuery = 'Medellín';
      component.resetFilters();
      expect(component.activeTab()).toBe('ALL');
      expect(component.searchQuery).toBe('');
    });

    it('should toggle row selection and select all on page', () => {
      expect(component.isSelected('p-1')).toBeFalse();
      component.toggleRowSelection('p-1');
      expect(component.isSelected('p-1')).toBeTrue();

      component.toggleSelectAllPage();
      expect(component.isAllPageSelected()).toBeTrue();
      expect(component.selectedIds().size).toBe(2);

      component.clearSelection();
      expect(component.selectedIds().size).toBe(0);
    });

    it('should sort processes by column and expose aria-sort', () => {
      component.toggleSort('radicado');
      expect(component.sortField()).toBe('radicado');
      expect(component.sortDirection()).toBe('asc');
      expect(component.getAriaSort('radicado')).toBe('ascending');
      expect(component.sortedProcesses()[0].id).toBe('p-1');

      component.toggleSort('radicado');
      expect(component.sortDirection()).toBe('desc');
      expect(component.getAriaSort('radicado')).toBe('descending');
      expect(component.sortedProcesses()[0].id).toBe('p-2');
    });
  });

  describe('HU-29 Hierarchical grouping, server-side pagination and ordering', () => {
    const mockGroups = [
      {
        process: {
          id: 'root-1',
          radicado: '11001333300020200000100',
          instancia: '01',
          despacho: 'Juzgado 1 Civil del Circuito de Bogotá',
          departamento: 'BOGOTA D.C.',
          fechaUltimaActuacion: '2026-10-10',
          ultimaConsulta: '2026-10-25T10:00:00Z',
          ultimoResultado: null,
          esPrivado: false,
          notes: 'Cliente muy importante',
          responsibleLawyer: { id: 'u-1', name: 'Dra. Andrea' },
          responsibleUserId: 'u-1',
          responsibleName: 'Dra. Andrea',
          representedParty: RepresentedParty.DEMANDANTE,
          parentId: null,
          parentRadicado: null,
          demandantes: ['Empresa A'],
          demandados: ['Entidad B'],
          newCount: 1,
          instanceNotices: 0
        },
        subprocesses: [
          {
            id: 'sub-1',
            radicado: '11001333300020200000101',
            instancia: '02',
            despacho: 'Tribunal Superior de Bogotá',
            departamento: 'BOGOTA D.C.',
            fechaUltimaActuacion: '2026-10-22',
            ultimaConsulta: '2026-10-25T10:00:00Z',
            ultimoResultado: null,
            esPrivado: false,
            notes: null,
            responsibleLawyer: null,
            responsibleUserId: null,
            responsibleName: null,
            representedParty: RepresentedParty.DEMANDANTE,
            parentId: 'root-1',
            parentRadicado: '11001333300020200000100',
            demandantes: ['Empresa A'],
            demandados: ['Entidad B'],
            newCount: 0,
            instanceNotices: 0
          }
        ],
        groupLatest: {
          fecha: '2026-10-22',
          instancia: '02',
          isSubprocess: true,
          radicado: '11001333300020200000101',
          despacho: 'Tribunal Superior de Bogotá'
        },
        matchedOnlyIn: 'notas' as const
      },
      {
        process: {
          id: 'root-2',
          radicado: '05001333300020210000200',
          instancia: '01',
          despacho: 'Juzgado 2 Laboral de Medellín',
          departamento: 'ANTIOQUIA',
          fechaUltimaActuacion: '2026-09-01',
          ultimaConsulta: '2026-10-25T10:00:00Z',
          ultimoResultado: null,
          esPrivado: false,
          notes: null,
          responsibleLawyer: null,
          responsibleUserId: null,
          responsibleName: null,
          representedParty: RepresentedParty.SIN_DEFINIR,
          parentId: null,
          parentRadicado: null,
          demandantes: ['Pedro Gómez'],
          demandados: ['Compañía C'],
          newCount: 0,
          instanceNotices: 0
        },
        subprocesses: [],
        groupLatest: {
          fecha: '2026-09-01',
          instancia: '01',
          isSubprocess: false,
          radicado: '05001333300020210000200',
          despacho: 'Juzgado 2 Laboral de Medellín'
        },
        matchedOnlyIn: 'actuaciones' as const
      }
    ];

    beforeEach(() => {
      component.groups.set(mockGroups);
      component.totalGroups.set(2);
      component.pageSize.set(25);
      component.currentPage.set(1);
      component.pageCount.set(1);
    });

    it('should correctly expose paginatedGroups and totalGroups', () => {
      expect(component.groups().length).toBe(2);
      expect(component.paginatedGroups().length).toBe(2);
      expect(component.totalGroups()).toBe(2);
      expect(component.totalPages()).toBe(1);
      expect(component.pageStartIndex()).toBe(1);
      expect(component.pageEndIndex()).toBe(2);
    });

    it('should toggle server order between reciente and antigua', () => {
      expect(component.order()).toBe('reciente');
      component.toggleOrder();
      expect(component.order()).toBe('antigua');
      expect(component.sortDirection()).toBe('asc');

      component.toggleOrder();
      expect(component.order()).toBe('reciente');
      expect(component.sortDirection()).toBe('desc');
    });

    it('should handle pagination navigation boundaries', () => {
      component.totalGroups.set(60);
      component.pageCount.set(3);
      component.pageSize.set(25);

      expect(component.totalPages()).toBe(3);
      expect(component.currentPage()).toBe(1);

      component.nextPage();
      expect(component.currentPage()).toBe(2);

      component.nextPage();
      expect(component.currentPage()).toBe(3);

      // No should exceed max pages
      component.nextPage();
      expect(component.currentPage()).toBe(3);

      component.prevPage();
      expect(component.currentPage()).toBe(2);

      component.goToPage(1);
      expect(component.currentPage()).toBe(1);

      // No should go below 1
      component.prevPage();
      expect(component.currentPage()).toBe(1);
    });

    it('should compute visiblePages properly', () => {
      component.totalGroups.set(150);
      component.pageCount.set(6);
      component.pageSize.set(25);

      component.goToPage(3);
      const visible = component.visiblePages();
      expect(visible).toContain(1);
      expect(visible).toContain(2);
      expect(visible).toContain(3);
      expect(visible).toContain(4);
      expect(visible).toContain(5);
    });

    it('should contain matchedOnlyIn in group items for badges', () => {
      const items = component.paginatedGroups();
      expect(items[0].matchedOnlyIn).toBe('notas');
      expect(items[1].matchedOnlyIn).toBe('actuaciones');
      expect(items[0].groupLatest?.instancia).toBe('02');
      expect(items[0].groupLatest?.isSubprocess).toBeTrue();
    });
  });
});
