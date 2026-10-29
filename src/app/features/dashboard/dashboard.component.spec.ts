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
});
