import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProcessService } from '../../core/services/process.service';
import { ProcessListItem, RepresentedParty } from '../../core/models/process.model';
import { RadicadoPipe } from '../../shared/pipes/radicado.pipe';
import { OrganizationStore } from '../../core/state/organization.store';
import { LayoutStore } from '../../core/state/layout.store';
import { AuthService } from '../../core/auth/auth.service';
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
export type ProcessSortField = 'radicado' | 'parties' | 'despacho' | 'date' | 'status' | 'responsible' | 'party';

/**
 * Función pura para evaluar si un proceso coincide con la búsqueda
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
    CommonModule,
    RouterLink,
    FormsModule,
    RadicadoPipe,
    EmptyStateComponent,
    StatCardComponent,
    SkeletonCardGridComponent,
    SkeletonTableComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  readonly processService = inject(ProcessService);
  readonly orgStore = inject(OrganizationStore);
  readonly layoutStore = inject(LayoutStore);
  readonly authService = inject(AuthService);

  /** Lista completa de procesos bajo vigilancia del tenant actual */
  readonly processes = signal<ProcessListItem[]>([]);
  /** Estado de carga de la lista de procesos */
  readonly loading = signal(true);
  /** Filtro de pestaña activo */
  readonly activeTab = signal<DashboardTabFilter>('ALL');
  /** Señal interna para reactividad de búsqueda */
  readonly searchQuerySignal = signal<string>('');
  /** Radicado recientemente copiado al portapapeles */
  readonly copiedRadicado = signal<string | null>(null);

  /** Estado de ordenamiento de columnas */
  readonly sortField = signal<ProcessSortField>('date');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  /** Conjunto de IDs de expedientes seleccionados para acciones por lote */
  readonly selectedIds = signal<Set<string>>(new Set());
  /** Confirmación temporal de copia masiva de radicados */
  readonly bulkCopied = signal<boolean>(false);
  /** Confirmación temporal de exportación CSV */
  readonly csvExported = signal<boolean>(false);

  /** Paginación de la tabla (9 filas por página como en el diseño de referencia) */
  readonly pageSize = signal<number>(9);
  readonly currentPage = signal<number>(1);

  /** Getter/Setter compatible con enlace [(ngModel)] y pruebas unitarias */
  get searchQuery(): string {
    return this.searchQuerySignal();
  }

  set searchQuery(value: string) {
    this.searchQuerySignal.set(value);
    if (this.layoutStore.globalSearchQuery() !== value) {
      this.layoutStore.setGlobalSearch(value);
    }
    this.currentPage.set(1);
  }

  constructor() {
    // Recarga reactivamente cuando el inquilino activo cambia
    effect(() => {
      const orgId = this.authService.activeOrgId();
      if (orgId) {
        untracked(() => {
          this.loadProcesses();
          this.orgStore.loadActiveOrganization();
        });
      }
    });

    // Sincroniza pestaña seleccionada desde el menú lateral o campana de notificaciones
    effect(() => {
      const sidebarTab = this.layoutStore.activeDashboardTab();
      untracked(() => {
        if (this.activeTab() !== sidebarTab) {
          this.activeTab.set(sidebarTab);
          this.currentPage.set(1);
        }
      });
    });

    // Sincroniza búsqueda global desde la barra superior (⌘K / Ctrl+K)
    effect(() => {
      const globalQuery = this.layoutStore.globalSearchQuery();
      untracked(() => {
        if (this.searchQuerySignal() !== globalQuery) {
          this.searchQuerySignal.set(globalQuery);
          this.currentPage.set(1);
        }
      });
    });

    // Publica conteos reales hacia el AppShell (Sidebar y campana Topbar)
    effect(() => {
      const unread = this.totalWithNews();
      const total = this.processes().length;
      untracked(() => {
        this.layoutStore.unreadNewsCount.set(unread);
        this.layoutStore.totalProcessesCount.set(total);
      });
    });
  }

  ngOnInit(): void {
    // Carga garantizada ante navegación o recarga de página (F5)
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
  readonly totalWithNews = computed(() => this.processes().filter(p => p.newCount > 0).length);

  /** Conteo de procesos sin abogado responsable asignado */
  readonly totalUnassigned = computed(() => this.processes().filter(p => !p.responsibleUserId).length);

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
   * Lista de procesos filtrada reactivamente por pestaña y búsqueda
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
   * Lista de procesos ordenada según la columna activa
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
    const total = this.sortedProcesses().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  /** Subconjunto de procesos de la página actual */
  readonly paginatedProcesses = computed(() => {
    const list = this.sortedProcesses();
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  /** Índice inicial mostrado en el pie de tabla (1-based) */
  readonly pageStartIndex = computed(() => {
    const total = this.sortedProcesses().length;
    if (total === 0) return 0;
    return (Math.min(this.currentPage(), this.totalPages()) - 1) * this.pageSize() + 1;
  });

  /** Índice final mostrado en el pie de tabla */
  readonly pageEndIndex = computed(() => {
    const total = this.sortedProcesses().length;
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

  /** Indica si todos los procesos de la página actual están seleccionados */
  readonly isAllPageSelected = computed(() => {
    const pageItems = this.paginatedProcesses();
    if (pageItems.length === 0) return false;
    const selected = this.selectedIds();
    return pageItems.every(p => selected.has(p.id));
  });

  /**
   * Consulta al servicio backend los procesos del tenant activo
   */
  loadProcesses(): void {
    this.loading.set(true);
    this.processService.listProcesses().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.processes.set(res.data);
          this.selectedIds.set(new Set());
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  /**
   * Selecciona una pestaña de filtro y sincroniza con el estado global
   */
  setTab(tab: DashboardTabFilter): void {
    this.activeTab.set(tab);
    this.layoutStore.selectDashboardTab(tab);
    this.currentPage.set(1);
  }

  /**
   * Restablece los filtros de pestaña y búsqueda
   */
  resetFilters(): void {
    this.activeTab.set('ALL');
    this.layoutStore.selectDashboardTab('ALL');
    this.searchQuery = '';
    this.currentPage.set(1);
  }

  /**
   * Limpia únicamente el campo de búsqueda
   */
  clearSearch(): void {
    this.searchQuery = '';
  }

  /**
   * Alterna el ordenamiento de una columna de la tabla
   */
  toggleSort(field: ProcessSortField): void {
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
    const pageItems = this.paginatedProcesses();
    const allSelected = this.isAllPageSelected();
    this.selectedIds.update(prev => {
      const next = new Set(prev);
      for (const item of pageItems) {
        if (allSelected) {
          next.delete(item.id);
        } else {
          next.add(item.id);
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
   * Copia todos los radicados seleccionados al portapapeles (acción por lote)
   */
  async copySelectedRadicados(): Promise<void> {
    const selected = this.selectedIds();
    const radicados = this.processes()
      .filter(p => selected.has(p.id))
      .map(p => p.radicado)
      .join('\n');

    if (!radicados) return;
    const copied = await copyTextToClipboard(radicados);
    if (copied) {
      this.bulkCopied.set(true);
      setTimeout(() => this.bulkCopied.set(false), LEGAL_CONSTANTS.CLIPBOARD_FEEDBACK_DURATION_MS);
    }
  }

  /**
   * Exporta los expedientes (seleccionados o filtrados) a un archivo CSV compatible con Excel
   */
  exportProcessesCsv(onlySelected = false): void {
    const selected = this.selectedIds();
    const source = onlySelected && selected.size > 0
      ? this.sortedProcesses().filter(p => selected.has(p.id))
      : this.sortedProcesses();

    if (source.length === 0) return;

    const headers = [
      'Radicado (23 digitos)',
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

    const rows = source.map(p => [
      escapeCsv(p.radicado),
      escapeCsv(p.demandantes[0] || 'Sin registro'),
      escapeCsv(p.demandados[0] || 'Sin registro'),
      escapeCsv(p.despacho || 'Sin despacho'),
      escapeCsv(p.fechaUltimaActuacion || 'Sin fecha'),
      escapeCsv(p.newCount),
      escapeCsv(p.responsibleName || 'Sin asignar'),
      escapeCsv(this.formatParty(p.representedParty))
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
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
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

  /**
   * Obtiene iniciales del sujeto procesal principal para el avatar de fila
   */
  getPartyInitials(p: ProcessListItem): string {
    const primary = p.demandantes[0] || p.demandados[0] || 'SJ';
    return extractUserInitials(primary);
  }

  /**
   * Devuelve una clase de color semántico determinista para el avatar del sujeto procesal
   */
  getPartyAvatarTone(p: ProcessListItem): string {
    const code = (p.radicado.charCodeAt(p.radicado.length - 3) || 0) % 4;
    switch (code) {
      case 0: return 'bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-foreground';
      case 1: return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300';
      case 2: return 'bg-amber-500/15 text-amber-800 dark:text-amber-300';
      default: return 'bg-violet-500/15 text-violet-800 dark:text-violet-300';
    }
  }

  /**
   * Formatea la parte representada delegando en función pura
   */
  formatParty(party?: RepresentedParty | null): string {
    return formatRepresentedParty(party);
  }

  /**
   * Genera el texto resumen con todas las partes para accesibilidad y tooltip
   */
  formatAllParties(p: ProcessListItem): string {
    const list = [...p.demandantes, ...p.demandados];
    return list.join(' · ');
  }
}
