import { Injectable, signal } from '@angular/core';

export type SidebarTabFilter = 'ALL' | 'MINE' | 'NEWS' | 'UNASSIGNED';

/**
 * Estado reactivo global del layout (AppShell, Sidebar, Topbar y filtros sincronizados)
 */
@Injectable({
  providedIn: 'root'
})
export class LayoutStore {
  /** Indica si el menú lateral en escritorio está contraído (modo compacto) */
  readonly sidebarCollapsed = signal<boolean>(false);

  /** Indica si el cajón de navegación móvil está abierto */
  readonly mobileMenuOpen = signal<boolean>(false);

  /** Controla la expansión del submenú de Expedientes en el Sidebar */
  readonly expedientesExpanded = signal<boolean>(true);

  /** Controla la expansión del submenú de Configuración en el Sidebar */
  readonly settingsExpanded = signal<boolean>(true);

  /** Término de búsqueda sincronizado desde la barra superior (Ctrl+K / ⌘K) */
  readonly globalSearchQuery = signal<string>('');

  /** Pestaña activa del tablero de procesos seleccionada desde el Sidebar o Dashboard */
  readonly activeDashboardTab = signal<SidebarTabFilter>('ALL');

  /** Conteo en tiempo real de expedientes con actuaciones nuevas para la campana superior */
  readonly unreadNewsCount = signal<number>(0);

  /** Conteo total de expedientes vigilados en la organización activa */
  readonly totalProcessesCount = signal<number>(0);

  /**
   * Alterna el colapso del menú lateral en escritorio
   */
  toggleSidebarCollapse(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  /**
   * Abre o cierra el menú lateral en pantallas móviles
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  /**
   * Cierra el menú lateral móvil
   */
  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /**
   * Alterna el acordeón de Expedientes en el menú lateral
   */
  toggleExpedientesMenu(): void {
    if (this.sidebarCollapsed()) {
      this.sidebarCollapsed.set(false);
      this.expedientesExpanded.set(true);
      return;
    }
    this.expedientesExpanded.update(v => !v);
  }

  /**
   * Alterna el acordeón de Configuración en el menú lateral
   */
  toggleSettingsMenu(): void {
    if (this.sidebarCollapsed()) {
      this.sidebarCollapsed.set(false);
      this.settingsExpanded.set(true);
      return;
    }
    this.settingsExpanded.update(v => !v);
  }

  /**
   * Actualiza la pestaña activa del tablero y cierra el cajón móvil si estaba abierto
   */
  selectDashboardTab(tab: SidebarTabFilter): void {
    this.activeDashboardTab.set(tab);
    this.closeMobileMenu();
  }

  /**
   * Actualiza la consulta global de búsqueda
   */
  setGlobalSearch(query: string): void {
    this.globalSearchQuery.set(query);
  }
}

