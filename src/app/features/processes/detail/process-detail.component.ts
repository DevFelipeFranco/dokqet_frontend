import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProcessService } from '../../../core/services/process.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { AuthService } from '../../../core/auth/auth.service';
import { OrganizationStore } from '../../../core/state/organization.store';
import { ProcessDetailView, RepresentedParty, PartyCategory } from '../../../core/models/process.model';
import { DismissalReasonDto, PartyCategoryDto } from '../../../core/models/catalog.model';
import { Member } from '../../../core/models/organization.model';
import { RadicadoPipe } from '../../../shared/pipes/radicado.pipe';
import {
  LEGAL_CONSTANTS,
  formatRepresentedParty,
  formatPartyCategory,
  copyTextToClipboard
} from '../../../core/constants';
import {
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  CardFooterComponent,
  ButtonComponent,
  FormAlertComponent,
  BreadcrumbsComponent,
  ModalComponent,
  StatCardComponent,
  EmptyStateComponent
} from '../../../shared/components/ui';

/** Pestañas de sección principal dentro de la ficha del expediente */
export type ProcessDetailSectionTab = 'ACTUACIONES' | 'PARTIES' | 'TECHNICAL';

/** Sub-filtros rápidos para la grilla de actuaciones */
export type ActuacionFilterType = 'ALL' | 'NEW' | 'TERMS' | 'DOCS';

/** Modo de visualización del historial de actuaciones */
export type ActuacionViewMode = 'TABLE' | 'TIMELINE';

@Component({
  selector: 'app-process-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    RadicadoPipe,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    ButtonComponent,
    FormAlertComponent,
    BreadcrumbsComponent,
    ModalComponent,
    StatCardComponent,
    EmptyStateComponent
  ],
  templateUrl: './process-detail.component.html'
})
export class ProcessDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly processService = inject(ProcessService);
  private readonly orgService = inject(OrganizationService);
  private readonly catalogService = inject(CatalogService);
  private readonly authService = inject(AuthService);
  readonly orgStore = inject(OrganizationStore);

  readonly RepresentedParty = RepresentedParty;

  // Catálogos dinámicos
  readonly representedParties = signal<PartyCategoryDto[]>([]);
  readonly dismissalReasons = signal<DismissalReasonDto[]>([]);
  selectedDismissalReason = 'DEJO_DE_SEGUIR';

  /** Identificador único del OrganizationProcess */
  readonly processId = signal<string>('');
  /** Información detallada consolidada del expediente */
  readonly detail = signal<ProcessDetailView | null>(null);
  /** Estado de carga inicial del expediente completo */
  readonly loading = signal(true);
  /** Estado de carga parcial exclusivo al paginar o cambiar pageSize en el backend */
  readonly loadingActuaciones = signal(false);
  /** Mensaje de error si falla la consulta */
  readonly error = signal<string | null>(null);
  /** Estado del indicador de radicado copiado */
  readonly copied = signal(false);

  /** Miembros del despacho para asignación de responsabilidad */
  readonly members = signal<Member[]>([]);

  /** Paginación real en servidor (?page=X&pageSize=Y) */
  readonly pageSizeOptions = LEGAL_CONSTANTS.ACTUACIONES_PAGE_SIZE_OPTIONS;
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(LEGAL_CONSTANTS.DEFAULT_PAGE_SIZE);

  // Controles UX para consulta ágil de Actuaciones
  readonly activeSectionTab = signal<ProcessDetailSectionTab>('ACTUACIONES');
  readonly actuacionFilter = signal<ActuacionFilterType>('ALL');
  readonly actuacionSearchSignal = signal<string>('');
  readonly actuacionViewMode = signal<ActuacionViewMode>('TABLE');
  readonly actuacionSortOrder = signal<'desc' | 'asc'>('desc');

  /** Conjunto de IDs de actuaciones cuya anotación completa está expandida */
  readonly expandedActuacionIds = signal<Set<string>>(new Set());
  /** Indica si todas las anotaciones visibles están expandidas */
  readonly expandAllAnnotations = signal<boolean>(false);
  /** ID de la actuación recientemente copiada al portapapeles */
  readonly copiedActuacionId = signal<string | null>(null);
  /** Confirmación temporal de exportación de actuaciones a CSV */
  readonly exportedCsv = signal<boolean>(false);

  // Edición in-place de metadatos de la organización
  readonly editingOrg = signal(false);
  editResponsibleId = '';
  editParty = RepresentedParty.SIN_DEFINIR;
  editNotes = '';
  readonly savingOrg = signal(false);
  readonly editError = signal<string | null>(null);

  // Modal para confirmar desvigilancia
  readonly confirmUnfollow = signal(false);

  get actuacionSearch(): string {
    return this.actuacionSearchSignal();
  }

  set actuacionSearch(value: string) {
    this.actuacionSearchSignal.set(value);
  }

  constructor() {
    // Recarga los detalles únicamente cuando cambia el tenant activo o el ID del proceso.
    // Se usa untracked() para evitar que las lecturas internas de detail() o pageSize() disparen el efecto en ciclo.
    effect(() => {
      const orgId = this.authService.activeOrgId();
      const id = this.processId();
      if (orgId && id) {
        untracked(() => {
          this.loadDetail(id, 1, this.pageSize());
          this.loadMembers();
        });
      }
    });
  }

  ngOnInit(): void {
    // Suscripción al paramMap para cargar siempre ante navegación o recarga directa (F5)
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.processId.set(id);
        this.loadDetail(id, 1, this.pageSize());
        this.loadMembers();
      }
    });

    this.catalogService.getPartyCategories(true).subscribe({
      next: (cats) => {
        if (cats && cats.length > 0) {
          this.representedParties.set(cats);
        }
      },
      error: () => {}
    });

    this.catalogService.getDismissalReasons('PROCESS').subscribe({
      next: (reasons) => {
        if (reasons && reasons.length > 0) {
          this.dismissalReasons.set(reasons);
          this.selectedDismissalReason = reasons[0].code;
        }
      },
      error: () => {}
    });
  }

  /** Conteo de actuaciones con términos procesales en la página actual */
  readonly actuacionesWithTermsCount = computed(() => {
    const acts = this.detail()?.actuaciones ?? [];
    return acts.filter(a => Boolean(a.fechaInicial || a.fechaFinal)).length;
  });

  /** Conteo de actuaciones con documentos adjuntos en la página actual */
  readonly actuacionesWithDocsCount = computed(() => {
    const acts = this.detail()?.actuaciones ?? [];
    return acts.filter(a => a.tieneDocumentos).length;
  });

  /** Conteo de actuaciones marcadas como nuevas en la página actual */
  readonly actuacionesNewInBatchCount = computed(() => {
    const acts = this.detail()?.actuaciones ?? [];
    return acts.filter(a => a.isNew).length;
  });

  /** Lista de actuaciones de la página actual del servidor, filtrada y ordenada */
  readonly filteredActuaciones = computed(() => {
    const acts = [...(this.detail()?.actuaciones ?? [])];
    const filterType = this.actuacionFilter();
    const query = this.actuacionSearchSignal().trim().toLowerCase();

    let list = acts;
    if (filterType === 'NEW') {
      list = list.filter(a => a.isNew);
    } else if (filterType === 'TERMS') {
      list = list.filter(a => Boolean(a.fechaInicial || a.fechaFinal));
    } else if (filterType === 'DOCS') {
      list = list.filter(a => a.tieneDocumentos);
    }

    if (query) {
      list = list.filter(a => {
        const tipo = (a.tipoActuacion || '').toLowerCase();
        const anot = (a.anotacion || '').toLowerCase();
        const fecha = (a.fechaActuacion || '').toLowerCase();
        const cons = String(a.consecutivo || '');
        return tipo.includes(query) || anot.includes(query) || fecha.includes(query) || cons.includes(query);
      });
    }

    const dir = this.actuacionSortOrder() === 'desc' ? -1 : 1;
    return list.sort((a, b) => {
      const dateA = a.fechaActuacion || '';
      const dateB = b.fechaActuacion || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB) * dir;
      }
      return ((a.consecutivo || 0) - (b.consecutivo || 0)) * dir;
    });
  });

  /** Actuaciones visibles de la página actual devuelta por el backend */
  readonly visibleActuaciones = computed(() => this.filteredActuaciones());

  /** Total de páginas en el servidor según totalActuaciones y pageSize */
  readonly totalPages = computed(() => {
    const total = this.detail()?.totalActuaciones ?? 0;
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  /** Índice global inicial de la página actual en el servidor */
  readonly pageStartIndex = computed(() => {
    const total = this.detail()?.totalActuaciones ?? 0;
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  /** Índice global final de la página actual en el servidor */
  readonly pageEndIndex = computed(() => {
    const total = this.detail()?.totalActuaciones ?? 0;
    if (total === 0) return 0;
    const loadedCount = this.detail()?.actuaciones.length ?? 0;
    return Math.min(total, (this.currentPage() - 1) * this.pageSize() + loadedCount);
  });

  /** Páginas numeradas visibles en el paginador conectado al backend */
  readonly visiblePageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  /**
   * Carga los datos del proceso y la página solicitada de actuaciones desde el backend.
   * Cuando ya existe un detalle cargado, ejecuta una actualización parcial sin desmontar la vista.
   */
  loadDetail(id: string, page: number, size: number = untracked(() => this.pageSize())): void {
    const currentDetail = untracked(() => this.detail());
    const isInitialLoad = currentDetail === null || currentDetail.id !== id;
    if (isInitialLoad) {
      this.loading.set(true);
    } else {
      this.loadingActuaciones.set(true);
    }
    this.error.set(null);

    this.processService.getProcessDetail(id, page, size).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.loadingActuaciones.set(false);
        if (res.success && res.data) {
          this.detail.set(res.data);
          this.currentPage.set(res.data.page || page);
          if (res.data.pageSize && res.data.pageSize !== untracked(() => this.pageSize())) {
            this.pageSize.set(res.data.pageSize);
          }
          this.expandedActuacionIds.set(new Set());
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.loadingActuaciones.set(false);
        if (isInitialLoad) {
          this.error.set(err.error?.message || 'No se pudo cargar el expediente judicial.');
        }
      }
    });
  }

  /**
   * Carga la lista de miembros de la organización activa
   */
  loadMembers(): void {
    const orgId = this.authService.activeOrgId();
    if (orgId) {
      this.orgService.listMembers(orgId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.members.set(res.data);
          }
        }
      });
    }
  }

  /**
   * Selecciona la pestaña principal del detalle del expediente
   */
  setSectionTab(tab: ProcessDetailSectionTab): void {
    this.activeSectionTab.set(tab);
  }

  /**
   * Selecciona un sub-filtro de actuaciones y posiciona la vista en Actuaciones
   */
  setActuacionFilter(filter: ActuacionFilterType): void {
    this.activeSectionTab.set('ACTUACIONES');
    this.actuacionFilter.set(filter);
  }

  /**
   * Limpia los filtros de búsqueda y tipo en actuaciones
   */
  resetActuacionFilters(): void {
    this.actuacionFilter.set('ALL');
    this.actuacionSearchSignal.set('');
  }

  /**
   * Cambia el tamaño de página (10, 20, 40) y consulta la página 1 directamente al backend
   */
  setPageSize(size: number): void {
    const newSize = Number(size);
    if (newSize === this.pageSize()) return;
    this.pageSize.set(newSize);
    this.currentPage.set(1);
    if (this.processId()) {
      this.loadDetail(this.processId(), 1, newSize);
    }
  }

  /**
   * Alterna el orden cronológico de las actuaciones (Más recientes primero vs. Más antiguas primero)
   */
  toggleActuacionSortOrder(): void {
    this.actuacionSortOrder.update(o => (o === 'desc' ? 'asc' : 'desc'));
  }

  /**
   * Determina si una anotación es lo suficientemente extensa para requerir botón de expansión
   */
  isLongAnnotation(text?: string | null): boolean {
    return Boolean(text && text.trim().length > 110);
  }

  /**
   * Verifica si una actuación específica tiene su anotación desplegada
   */
  isActuacionExpanded(id: string): boolean {
    return this.expandAllAnnotations() || this.expandedActuacionIds().has(id);
  }

  /**
   * Expande o contrae el texto completo de una actuación individual
   */
  toggleActuacionExpand(id: string): void {
    if (this.expandAllAnnotations()) {
      this.expandAllAnnotations.set(false);
    }
    this.expandedActuacionIds.update(prev => {
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
   * Expande o contrae todas las anotaciones de la vista actual
   */
  toggleExpandAllAnnotations(): void {
    const nextState = !this.expandAllAnnotations();
    this.expandAllAnnotations.set(nextState);
    if (!nextState) {
      this.expandedActuacionIds.set(new Set());
    }
  }

  /**
   * Copia el resumen estructurado de una actuación al portapapeles
   */
  async copyActuacion(a: ProcessDetailView['actuaciones'][0]): Promise<void> {
    const rad = this.detail()?.process.radicado || '';
    const terms = a.fechaInicial && a.fechaFinal ? ` | Término: ${a.fechaInicial} a ${a.fechaFinal}` : '';
    const summary = `[Radicado ${rad}] Actuación #${a.consecutivo} (${a.fechaActuacion || 'Sin fecha'}): ${a.tipoActuacion || 'Actuación'} - ${a.anotacion || 'Sin anotación'}${terms}`;
    const ok = await copyTextToClipboard(summary);
    if (ok) {
      this.copiedActuacionId.set(a.id);
      setTimeout(() => {
        if (this.copiedActuacionId() === a.id) {
          this.copiedActuacionId.set(null);
        }
      }, LEGAL_CONSTANTS.CLIPBOARD_FEEDBACK_DURATION_MS);
    }
  }

  /**
   * Exporta las actuaciones filtradas a un archivo CSV compatible con Excel
   */
  exportActuacionesCsv(): void {
    const list = this.filteredActuaciones();
    if (list.length === 0) return;

    const headers = [
      'Consecutivo',
      'Fecha Actuacion',
      'Fecha Registro',
      'Tipo de Actuacion',
      'Anotacion Judicial',
      'Termino Inicial',
      'Termino Final',
      'Tiene Anexos',
      'Estado'
    ];

    const escapeCsv = (val: string | number | boolean | null | undefined): string => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = list.map(a => [
      escapeCsv(a.consecutivo),
      escapeCsv(a.fechaActuacion || 'Sin fecha'),
      escapeCsv(a.fechaRegistro || 'Sin fecha'),
      escapeCsv(a.tipoActuacion || 'Actuación'),
      escapeCsv(a.anotacion || 'Sin anotación'),
      escapeCsv(a.fechaInicial || ''),
      escapeCsv(a.fechaFinal || ''),
      escapeCsv(a.tieneDocumentos ? 'Si' : 'No'),
      escapeCsv(a.isNew ? 'Nueva' : 'Leida')
    ].join(','));

    const rad = this.detail()?.process.radicado || 'expediente';
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `actuaciones-${rad}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Ignorado en entornos de prueba sin soporte completo de Blob
    }

    this.exportedCsv.set(true);
    setTimeout(() => this.exportedCsv.set(false), 2000);
  }

  /**
   * Inicia el modo de edición de datos internos de la organización
   */
  startEditOrg(): void {
    const d = this.detail();
    if (!d) return;
    this.activeSectionTab.set('TECHNICAL');
    this.editResponsibleId = d.organization.responsibleUserId || '';
    this.editParty = d.organization.representedParty || RepresentedParty.SIN_DEFINIR;
    this.editNotes = d.organization.notes || '';
    this.editError.set(null);
    this.editingOrg.set(true);
  }

  /**
   * Cancela la edición de datos internos
   */
  cancelEditOrg(): void {
    this.editingOrg.set(false);
    this.editError.set(null);
  }

  /**
   * Guarda los cambios de abogado responsable, parte y notas
   */
  saveEditOrg(): void {
    this.savingOrg.set(true);
    this.editError.set(null);

    const payload = {
      representedParty: this.editParty,
      responsibleUserId: this.editResponsibleId ? this.editResponsibleId : null,
      notes: this.editNotes ? this.editNotes.trim() : null
    };

    this.processService.updateProcess(this.processId(), payload).subscribe({
      next: () => {
        this.savingOrg.set(false);
        this.editingOrg.set(false);
        this.loadDetail(this.processId(), this.currentPage());
      },
      error: (err) => {
        this.savingOrg.set(false);
        this.editError.set(err.error?.message || 'Error al guardar los datos.');
      }
    });
  }

  /**
   * Navega a la página de actuaciones del servidor especificada (?page=X&pageSize=Y)
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    if (this.processId()) {
      this.loadDetail(this.processId(), page, this.pageSize());
    }
  }

  /**
   * Marca las actuaciones nuevas como leídas
   */
  markAsSeen(): void {
    this.processService.markSeen(this.processId()).subscribe({
      next: () => {
        this.loadDetail(this.processId(), this.currentPage());
      }
    });
  }

  /**
   * Detiene la vigilancia de este expediente en la organización
   */
  executeUnfollow(): void {
    this.confirmUnfollow.set(false);
    this.processService.unfollowProcess(this.processId()).subscribe({
      next: () => {
        this.router.navigate(['/panel']);
      }
    });
  }

  /**
   * Copia el radicado de 23 dígitos al portapapeles
   */
  async copyRadicado(): Promise<void> {
    const rad = this.detail()?.process.radicado;
    if (rad) {
      const copied = await copyTextToClipboard(rad);
      if (copied) {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), LEGAL_CONSTANTS.CLIPBOARD_FEEDBACK_DURATION_MS);
      }
    }
  }

  /**
   * Formatea la parte representada delegando en función pura
   */
  formatParty(party?: RepresentedParty | null): string {
    return formatRepresentedParty(party);
  }

  /**
   * Formatea la categoría procesal delegando en función pura
   */
  formatCategory(category?: PartyCategory | null): string {
    return formatPartyCategory(category);
  }
}
