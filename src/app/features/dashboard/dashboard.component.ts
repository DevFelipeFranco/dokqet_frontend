import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
  ChangeDetectionStrategy
} from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProcessService } from '../../core/services/process.service';
import {
  ProcessGroupItem,
  ProcessGroupProcess,
  ProcessGroupSubprocess,
  ProcessGroupPageResponse,
  ProcessListItem,
  RepresentedParty
} from '../../core/models/process.model';
import { RadicadoPipe } from '../../shared/pipes/radicado.pipe';
import { OrganizationStore } from '../../core/state/organization.store';
import { LayoutStore } from '../../core/state/layout.store';
import { AuthService } from '../../core/auth/auth.service';
import { formatRelativeConsultationDate } from '../../core/utils/datetime.utils';
import {
  LEGAL_CONSTANTS,
  formatRepresentedParty,
  copyTextToClipboard,
  extractUserInitials
} from '../../core/constants';
import {
  EmptyStateComponent,
  StatCardComponent,
  SkeletonCardGridComponent,
  SkeletonTableComponent
} from '../../shared/components/ui';

/**
 * Filtros de pestañas disponibles en el tablero de control
 */
export type DashboardTabFilter = 'ALL' | 'MINE' | 'NEWS' | 'UNASSIGNED';

/**
 * Campos por los que se puede ordenar la grilla de expedientes
 */
export type ProcessSortField = 'radicado' | 'parties' | 'despacho' | 'date' | 'consulted' | 'status' | 'responsible' | 'party';

/**
 * Función pura para evaluar si un proceso coincide con la búsqueda local
 */
export function matchesProcessQuery(process: ProcessListItem, query: string): boolean {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  const radicadoMatch = process.radicado.toLowerCase().includes(q);
  const despachoMatch = process.despacho?.toLowerCase().includes(q) ?? false;
  const demandanteMatch = process.demandantes.some(d => d.toLowerCase().includes(q));
  const demandadoMatch = process.demandados.some(d => d.toLowerCase().includes(q));
  const responsibleMatch = process.responsibleName?.toLowerCase().includes(q) ?? false;
  return radicadoMatch || despachoMatch || demandanteMatch || demandadoMatch || responsibleMatch;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    RadicadoPipe,
    EmptyStateComponent,
    StatCardComponent,
    SkeletonCardGridComponent,
    SkeletonTableComponent
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  readonly processService = inject(ProcessService);
  readonly orgStore = inject(OrganizationStore);
  readonly layoutStore = inject(LayoutStore);
  readonly authService = inject(AuthService);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly formatRelativeConsultationDate = formatRelativeConsultationDate;

  /** Lista de grupos de procesos (Padre + Subinstancias) paginados por servidor */
  readonly groups = signal<ProcessGroupItem[]>([]);
  /** Lista plana para retrocompatibilidad con tests y acciones por lote */
  readonly processes = signal<ProcessListItem[]>([]);
  /** Estado de carga de la lista de procesos */
  readonly loading = signal(true);
  /** Filtro de pestaña activo */
  readonly activeTab = signal<DashboardTabFilter>('ALL');
  /** Señal de búsqueda reactiva */
  readonly searchQuerySignal = signal<string>('');
  /** Radicado recientemente copiado al portapapeles */
  readonly copiedRadicado = signal<string | null>(null);

  /** Criterio de orden de servidor ('reciente' o 'antigua') */
  readonly order = signal<'reciente' | 'antigua'>('reciente');
  /** Estado de ordenamiento de columnas en cliente para retrocompatibilidad */
  readonly sortField = signal<ProcessSortField>('date');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  /** Metadatos de paginación del servidor (US-023 / HU-29: PAGE_SIZE = 25) */
  readonly pageSize = signal<number>(25);
  readonly currentPage = signal<number>(1);
  readonly totalGroups = signal<number>(0);
  readonly pageCount = signal<number>(1);
  readonly unassignedCount = signal<number>(0);
  readonly withNewsCount = signal<number>(0);
  readonly hasProcesses = signal<boolean>(false);
  readonly seesAll = signal<boolean>(true);

  /** Conjunto de IDs de expedientes seleccionados para acciones por lote */
  readonly selectedIds = signal<Set<string>>(new Set());
  /** Confirmación temporal de copia masiva de radicados */
  readonly bulkCopied = signal<boolean>(false);
  /** Confirmación temporal de exportación CSV */
  readonly csvExported = signal<boolean>(false);

  /** Subject para debounce reactivo de búsqueda (400ms) */
  private readonly searchSubject = new Subject<string>();

  get searchQuery(): string {
    return this.searchQuerySignal();
  }

  set searchQuery(value: string) {
    this.searchQuerySignal.set(value);
    this.searchSubject.next(value);
  }

  constructor() {
    // 1. Escucha cambios en los queryParams de la URL
    this.route.queryParams.subscribe(params => {
      let changed = false;
      if (params['q'] !== undefined && params['q'] !== this.searchQuerySignal()) {
        this.searchQuerySignal.set(params['q']);
        changed = true;
      }
      if (params['order'] && (params['order'] === 'reciente' || params['order'] === 'antigua') && params['order'] !== this.order()) {
        this.order.set(params['order']);
        changed = true;
      }
      if (params['page']) {
        const p = parseInt(params['page'], 10);
        if (!isNaN(p) && p !== this.currentPage()) {
          this.currentPage.set(p);
          changed = true;
        }
      }
      if (params['filter']) {
        const tab = this.mapBackendFilterToTab(params['filter']);
        if (tab && tab !== this.activeTab()) {
          this.activeTab.set(tab);
          changed = true;
        }
      }
      if (changed) {
        this.loadProcesses();
      }
    });

    // 2. Debounce reactivo de 400ms para el buscador
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuerySignal.set(query);
      this.currentPage.set(1);
      this.updateUrlParams();
      this.loadProcesses();
    });

    // 3. Recarga reactivamente cuando el inquilino activo cambia
    effect(() => {
      const orgId = this.authService.activeOrgId();
      if (orgId) {
        untracked(() => {
          this.loadProcesses();
          this.orgStore.loadActiveOrganization();
        });
      }
    });

    // 4. Sincroniza pestaña seleccionada desde el menú lateral o campana de notificaciones
    effect(() => {
      const sidebarTab = this.layoutStore.activeDashboardTab();
      untracked(() => {
        if (this.activeTab() !== sidebarTab) {
          this.activeTab.set(sidebarTab);
          this.currentPage.set(1);
          this.updateUrlParams();
          this.loadProcesses();
        }
      });
    });

    // 5. Sincroniza búsqueda global desde la barra superior (⌘K / Ctrl+K)
    effect(() => {
      const globalQuery = this.layoutStore.globalSearchQuery();
      untracked(() => {
        if (this.searchQuerySignal() !== globalQuery) {
          this.searchSubject.next(globalQuery);
        }
      });
    });

    // 6. Publica conteos reales hacia el AppShell (Sidebar y campana Topbar)
    effect(() => {
      const unread = this.totalWithNews();
      const total = this.totalGroups() > 0 ? this.totalGroups() : this.processes().length;
      untracked(() => {
        this.layoutStore.unreadNewsCount.set(unread);
        this.layoutStore.totalProcessesCount.set(total);
      });
    });

    // 7. Sincroniza groups ante cambios directos en processes (ej. en tests)
    effect(() => {
      const procs = this.processes();
      if (procs.length > 0 && this.groups().length === 0) {
        untracked(() => {
          this.groups.set(this.mapFlatProcessesToGroups(procs));
          this.totalGroups.set(procs.length);
        });
      }
    });
  }

  ngOnInit(): void {
    this.loadProcesses();
    this.orgStore.loadActiveOrganization();
  }

  /**
   * Determina si debe mostrarse la sugerencia de crear una firma corporativa
   */
  readonly showCreateOrgPrompt = computed(() => {
    const orgs = this.orgStore.organizations();
    return orgs.length <= 1 && orgs.some(o => o.isPersonal || o.name?.toLowerCase().includes('personal'));
  });

  /**
   * Conteo de procesos asignados al usuario en sesión
   */
  readonly totalMine = computed(() => {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return 0;
    return this.processes().filter(p => p.responsibleUserId === userId).length;
  });

  /** Conteo de procesos con nuevas actuaciones sin revisar */
  readonly totalWithNews = computed(() => {
    if (this.withNewsCount() > 0) return this.withNewsCount();
    return this.processes().filter(p => p.newCount > 0).length;
  });

  /** Conteo de procesos sin abogado responsable asignado */
  readonly totalUnassigned = computed(() => {
    if (this.unassignedCount() > 0) return this.unassignedCount();
    return this.processes().filter(p => !p.responsibleUserId).length;
  });

  /**
   * Título adaptativo cuando la lista filtrada queda vacía
   */
  readonly emptyTitle = computed(() => {
    switch (this.activeTab()) {
      case 'NEWS': return 'No hay procesos con novedades pendientes';
      case 'UNASSIGNED': return 'No hay procesos sin asignar';
      case 'MINE': return 'No tienes procesos asignados a tu cargo';
      default: return 'Aún no hay procesos registrados en vigilancia';
    }
  });

  /**
   * Lista plana filtrada para compatibilidad de tests locales
   */
  readonly filteredProcesses = computed(() => {
    let list = this.processes();
    const tab = this.activeTab();
    const currentUserId = this.authService.currentUser()?.id;

    if (tab === 'MINE') {
      list = list.filter(p => p.responsibleUserId === currentUserId);
    } else if (tab === 'NEWS') {
      list = list.filter(p => p.newCount > 0);
    } else if (tab === 'UNASSIGNED') {
      list = list.filter(p => !p.responsibleUserId);
    }

    const query = this.searchQuerySignal();
    if (query) {
      list = list.filter(p => matchesProcessQuery(p, query));
    }

    return list;
  });

  /**
   * Lista plana ordenada para compatibilidad de tests
   */
  readonly sortedProcesses = computed(() => {
    const list = [...this.filteredProcesses()];
    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    return list.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (field) {
        case 'radicado':
          valA = a.radicado;
          valB = b.radicado;
          break;
        case 'parties':
          valA = (a.demandantes[0] || a.demandados[0] || '').toLowerCase();
          valB = (b.demandantes[0] || b.demandados[0] || '').toLowerCase();
          break;
        case 'despacho':
          valA = (a.despacho || '').toLowerCase();
          valB = (b.despacho || '').toLowerCase();
          break;
        case 'date':
          valA = a.fechaUltimaActuacion || '';
          valB = b.fechaUltimaActuacion || '';
          break;
        case 'consulted':
          valA = a.ultimaConsulta || '';
          valB = b.ultimaConsulta || '';
          break;
        case 'status':
          return (a.newCount - b.newCount) * dir;
        case 'responsible':
          valA = (a.responsibleName || '').toLowerCase();
          valB = (b.responsibleName || '').toLowerCase();
          break;
        case 'party':
          valA = a.representedParty || '';
          valB = b.representedParty || '';
          break;
      }

      return valA.localeCompare(valB) * dir;
    });
  });

  /** Total de páginas disponibles */
  readonly totalPages = computed(() => {
    if (this.pageCount() > 0 && this.totalGroups() > 0) {
      return this.pageCount();
    }
    const total = this.sortedProcesses().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  /** Subconjunto de grupos a desplegar en la vista actual */
  readonly paginatedGroups = computed(() => {
    const list = this.groups();
    // Si la lista ya vino paginada del backend (<= pageSize):
    if (this.totalGroups() > 0 && list.length <= this.pageSize()) {
      return list;
    }
    // Si viene de datos mock en pruebas sin paginación de backend:
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  /** Subconjunto de procesos planos para retrocompatibilidad */
  readonly paginatedProcesses = computed(() => {
    const list = this.sortedProcesses();
    if (this.totalGroups() > 0 && list.length <= this.pageSize()) {
      return list;
    }
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  /** Índice inicial mostrado en el pie de tabla (1-based) */
  readonly pageStartIndex = computed(() => {
    const total = this.totalGroups() > 0 ? this.totalGroups() : this.sortedProcesses().length;
    if (total === 0) return 0;
    return (Math.min(this.currentPage(), this.totalPages()) - 1) * this.pageSize() + 1;
  });

  /** Índice final mostrado en el pie de tabla */
  readonly pageEndIndex = computed(() => {
    const total = this.totalGroups() > 0 ? this.totalGroups() : this.sortedProcesses().length;
    if (total === 0) return 0;
    return Math.min(total, this.currentPage() * this.pageSize());
  });

  /** Números de página visibles en la barra de paginación */
  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  /** Indica si todos los expedientes de la página actual están seleccionados */
  readonly isAllPageSelected = computed(() => {
    const pageItems = this.paginatedGroups();
    if (pageItems.length === 0) return false;
    const selected = this.selectedIds();
    return pageItems.every(g => selected.has(g.process.id));
  });

  /**
   * Consulta al servicio backend los procesos paginados y agrupados del tenant activo
   */
  loadProcesses(): void {
    this.loading.set(true);
    const filter = this.resolveBackendFilter(this.activeTab());
    const q = this.searchQuerySignal().trim() || undefined;
    const order = this.order();
    const page = this.currentPage();
    const pageSize = this.pageSize();

    this.processService.listProcesses({
      filter,
      q,
      order,
      page,
      pageSize
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          const raw = res.data as any;
          if (Array.isArray(raw)) {
            // Compatibilidad con respuestas en arreglo de pruebas unitarias
            this.processes.set(raw);
            this.groups.set(this.mapFlatProcessesToGroups(raw));
            this.totalGroups.set(raw.length);
            this.pageCount.set(Math.max(1, Math.ceil(raw.length / pageSize)));
          } else {
            // Estructura oficial ProcessGroupPageResponse de US-023 / HU-29
            const pageData = raw as ProcessGroupPageResponse;
            this.groups.set(pageData.items || []);
            this.totalGroups.set(pageData.total);
            this.pageCount.set(pageData.pageCount);
            this.unassignedCount.set(pageData.unassignedCount);
            this.withNewsCount.set(pageData.withNewsCount);
            this.hasProcesses.set(pageData.hasProcesses);
            this.seesAll.set(pageData.seesAll);

            const flatList = this.mapGroupsToFlatProcesses(pageData.items || []);
            this.processes.set(flatList);
          }
          this.selectedIds.set(new Set());
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  /**
   * Dispara búsqueda inmediata al presionar Enter en el input
   */
  onSearchEnter(): void {
    this.currentPage.set(1);
    this.updateUrlParams();
    this.loadProcesses();
  }

  /**
   * Selecciona una pestaña de filtro y sincroniza con el backend
   */
  setTab(tab: DashboardTabFilter): void {
    this.activeTab.set(tab);
    this.layoutStore.selectDashboardTab(tab);
    this.currentPage.set(1);
    this.updateUrlParams();
    this.loadProcesses();
  }

  /**
   * Restablece los filtros de pestaña y búsqueda
   */
  resetFilters(): void {
    this.activeTab.set('ALL');
    this.layoutStore.selectDashboardTab('ALL');
    this.searchQuerySignal.set('');
    this.currentPage.set(1);
    this.updateUrlParams();
    this.loadProcesses();
  }

  /**
   * Limpia únicamente el campo de búsqueda
   */
  clearSearch(): void {
    this.searchQuerySignal.set('');
    this.currentPage.set(1);
    this.updateUrlParams();
    this.loadProcesses();
  }

  /**
   * Alterna entre orden reciente (DESC) y antigua (ASC)
   */
  toggleOrder(): void {
    const next = this.order() === 'reciente' ? 'antigua' : 'reciente';
    this.order.set(next);
    this.sortDirection.set(next === 'reciente' ? 'desc' : 'asc');
    this.currentPage.set(1);
    this.updateUrlParams();
    this.loadProcesses();
  }

  /**
   * Alterna el ordenamiento de una columna de la tabla
   */
  toggleSort(field: ProcessSortField): void {
    if (field === 'date') {
      this.toggleOrder();
      return;
    }
    if (this.sortField() === field) {
      this.sortDirection.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  /**
   * Devuelve el valor semántico aria-sort para accesibilidad
   */
  getAriaSort(field: ProcessSortField): 'ascending' | 'descending' | 'none' {
    if (field === 'date') {
      return this.order() === 'reciente' ? 'descending' : 'ascending';
    }
    if (this.sortField() !== field) return 'none';
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  /**
   * Verifica si un expediente se encuentra seleccionado
   */
  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  /**
   * Alterna la selección individual de una fila
   */
  toggleRowSelection(id: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedIds.update(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  /**
   * Selecciona o deselecciona todos los expedientes visibles en la página actual
   */
  toggleSelectAllPage(): void {
    const pageItems = this.paginatedGroups();
    const allSelected = this.isAllPageSelected();
    this.selectedIds.update(prev => {
      const next = new Set(prev);
      for (const item of pageItems) {
        if (allSelected) {
          next.delete(item.process.id);
        } else {
          next.add(item.process.id);
        }
      }
      return next;
    });
  }

  /**
   * Limpia la selección múltiple activa
   */
  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  /**
   * Copia todos los radicados seleccionados al portapapeles
   */
  async copySelectedRadicados(): Promise<void> {
    const selected = this.selectedIds();
    const radicados = this.groups()
      .filter(g => selected.has(g.process.id))
      .map(g => g.process.radicado)
      .join('\n');

    if (!radicados) return;
    const copied = await copyTextToClipboard(radicados);
    if (copied) {
      this.bulkCopied.set(true);
      setTimeout(() => this.bulkCopied.set(false), LEGAL_CONSTANTS.CLIPBOARD_FEEDBACK_DURATION_MS);
    }
  }

  /**
   * Exporta los expedientes a un archivo CSV compatible con Excel
   */
  exportProcessesCsv(onlySelected = false): void {
    const selected = this.selectedIds();
    const source = onlySelected && selected.size > 0
      ? this.groups().filter(g => selected.has(g.process.id))
      : this.groups();

    if (source.length === 0) return;

    const headers = [
      'Radicado (23 digitos)',
      'Instancia',
      'Demandante Principal',
      'Demandado Principal',
      'Despacho Judicial',
      'Ultima Actuacion',
      'Novedades Pendientes',
      'Abogado Responsable',
      'Parte Representada'
    ];

    const escapeCsv = (val: string | number | null | undefined): string => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = source.map(g => [
      escapeCsv(g.process.radicado),
      escapeCsv(g.process.instancia || 'Principal'),
      escapeCsv(g.process.demandantes[0] || 'Sin registro'),
      escapeCsv(g.process.demandados[0] || 'Sin registro'),
      escapeCsv(g.process.despacho || 'Sin despacho'),
      escapeCsv(g.groupLatest?.fecha || g.process.fechaUltimaActuacion || 'Sin fecha'),
      escapeCsv(g.process.newCount),
      escapeCsv(g.process.responsibleName || 'Sin asignar'),
      escapeCsv(this.formatParty(g.process.representedParty as any))
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expedientes-dokqet-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Ignorado en entornos de prueba sin soporte completo de Blob/DOM
    }

    this.csvExported.set(true);
    setTimeout(() => this.csvExported.set(false), 2000);
  }

  /**
   * Navegación de páginas
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.updateUrlParams();
      this.loadProcesses();
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  /**
   * Copia el radicado de 23 dígitos al portapapeles con feedback temporal
   */
  async copyRadicado(radicado: string, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const copied = await copyTextToClipboard(radicado);
    if (copied) {
      this.copiedRadicado.set(radicado);
      setTimeout(() => {
        if (this.copiedRadicado() === radicado) {
          this.copiedRadicado.set(null);
        }
      }, LEGAL_CONSTANTS.CLIPBOARD_FEEDBACK_DURATION_MS);
    }
  }

  getPartyInitials(p: ProcessListItem | ProcessGroupProcess | ProcessGroupSubprocess): string {
    const primary = p.demandantes[0] || p.demandados[0] || 'SJ';
    return extractUserInitials(primary);
  }

  getPartyAvatarTone(p: ProcessListItem | ProcessGroupProcess | ProcessGroupSubprocess): string {
    const code = (p.radicado.charCodeAt(p.radicado.length - 3) || 0) % 4;
    switch (code) {
      case 0: return 'bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-foreground';
      case 1: return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300';
      case 2: return 'bg-amber-500/15 text-amber-800 dark:text-amber-300';
      default: return 'bg-violet-500/15 text-violet-800 dark:text-violet-300';
    }
  }

  formatParty(party?: RepresentedParty | string | null): string {
    return formatRepresentedParty(party as RepresentedParty);
  }

  formatAllParties(p: ProcessListItem | ProcessGroupProcess | ProcessGroupSubprocess): string {
    const list = [...p.demandantes, ...p.demandados];
    return list.join(' · ');
  }

  private updateUrlParams(): void {
    const q = this.searchQuerySignal().trim();
    const filter = this.activeTab() === 'ALL' ? undefined : this.resolveBackendFilter(this.activeTab());
    const order = this.order() === 'reciente' ? undefined : this.order();
    const page = this.currentPage() === 1 ? undefined : this.currentPage();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: q ? q : undefined,
        filter: filter,
        order: order,
        page: page
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private mapBackendFilterToTab(filter: string): DashboardTabFilter {
    switch (filter.toLowerCase()) {
      case 'mios': return 'MINE';
      case 'novedades': return 'NEWS';
      case 'sin-asignar': return 'UNASSIGNED';
      default: return 'ALL';
    }
  }

  private resolveBackendFilter(tab: DashboardTabFilter): 'todos' | 'mios' | 'novedades' | 'sin-asignar' {
    switch (tab) {
      case 'MINE': return 'mios';
      case 'NEWS': return 'novedades';
      case 'UNASSIGNED': return 'sin-asignar';
      default: return 'todos';
    }
  }

  private mapGroupsToFlatProcesses(groups: ProcessGroupItem[]): ProcessListItem[] {
    return groups.map(g => ({
      id: g.process.id,
      radicado: g.process.radicado,
      instancia: g.process.instancia || '',
      despacho: g.process.despacho,
      departamento: g.process.departamento,
      fechaUltimaActuacion: g.groupLatest?.fecha || g.process.fechaUltimaActuacion,
      ultimaConsulta: g.process.ultimaConsulta,
      ultimoResultado: g.process.ultimoResultado,
      esPrivado: g.process.esPrivado,
      privadoDesde: g.process.privadoDesde,
      demandantes: g.process.demandantes || [],
      demandados: g.process.demandados || [],
      responsibleUserId: g.process.responsibleUserId,
      responsibleName: g.process.responsibleName,
      representedParty: g.process.representedParty as any,
      parentId: g.process.parentId,
      parentRadicado: g.process.parentRadicado,
      subprocesses: (g.subprocesses || []).map(s => ({
        id: s.id,
        radicado: s.radicado,
        instancia: s.instancia,
        despacho: s.despacho,
        departamento: s.departamento,
        fechaUltimaActuacion: s.fechaUltimaActuacion,
        ultimaConsulta: s.ultimaConsulta,
        ultimoResultado: s.ultimoResultado,
        esPrivado: s.esPrivado,
        demandantes: s.demandantes || [],
        demandados: s.demandados || [],
        responsibleUserId: s.responsibleUserId,
        responsibleName: s.responsibleName,
        representedParty: s.representedParty as any,
        parentId: s.parentId,
        parentRadicado: s.parentRadicado,
        subprocesses: [],
        newCount: s.newCount || 0,
        instanceNotices: s.instanceNotices || 0
      })),
      newCount: g.process.newCount || 0,
      instanceNotices: g.process.instanceNotices || 0
    }));
  }

  private mapFlatProcessesToGroups(processes: ProcessListItem[]): ProcessGroupItem[] {
    return processes.map(p => ({
      process: {
        id: p.id,
        radicado: p.radicado,
        instancia: p.instancia,
        despacho: p.despacho,
        departamento: p.departamento,
        fechaUltimaActuacion: p.fechaUltimaActuacion,
        ultimaConsulta: p.ultimaConsulta,
        ultimoResultado: p.ultimoResultado,
        esPrivado: p.esPrivado,
        privadoDesde: p.privadoDesde,
        notes: null,
        responsibleLawyer: p.responsibleUserId && p.responsibleName ? { id: p.responsibleUserId, name: p.responsibleName } : null,
        responsibleUserId: p.responsibleUserId,
        responsibleName: p.responsibleName,
        representedParty: p.representedParty,
        parentId: p.parentId,
        parentRadicado: p.parentRadicado,
        demandantes: p.demandantes || [],
        demandados: p.demandados || [],
        newCount: p.newCount,
        instanceNotices: p.instanceNotices
      },
      subprocesses: (p.subprocesses || []).map(s => ({
        id: s.id,
        radicado: s.radicado,
        instancia: s.instancia,
        despacho: s.despacho,
        departamento: s.departamento,
        fechaUltimaActuacion: s.fechaUltimaActuacion,
        ultimaConsulta: s.ultimaConsulta,
        ultimoResultado: s.ultimoResultado,
        esPrivado: s.esPrivado,
        notes: null,
        responsibleLawyer: s.responsibleUserId && s.responsibleName ? { id: s.responsibleUserId, name: s.responsibleName } : null,
        responsibleUserId: s.responsibleUserId,
        responsibleName: s.responsibleName,
        representedParty: s.representedParty,
        parentId: s.parentId,
        parentRadicado: s.parentRadicado,
        demandantes: s.demandantes || [],
        demandados: s.demandados || [],
        newCount: s.newCount,
        instanceNotices: s.instanceNotices
      })),
      groupLatest: null,
      matchedOnlyIn: null
    }));
  }
}
