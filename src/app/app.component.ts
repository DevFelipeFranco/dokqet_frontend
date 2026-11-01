import { Component, ElementRef, HostListener, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/auth/auth.service';
import { SessionVigenciaService } from './core/auth/session-vigencia.service';
import { OrganizationStore } from './core/state/organization.store';
import { LayoutStore, SidebarTabFilter } from './core/state/layout.store';
import { ThemeService } from './core/services/theme.service';
import { NotificationService } from './core/services/notification.service';
import { SchedulerAdminService } from './core/services/scheduler-admin.service';
import { LogoComponent, DropdownComponent, FormAlertComponent } from './shared/components/ui';
import { OrganizationSwitcherComponent } from './shared/components/organization-switcher.component';
import { extractFirstName, extractUserInitials } from './core/constants';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    FormsModule,
    LogoComponent,
    DropdownComponent,
    FormAlertComponent,
    OrganizationSwitcherComponent
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  readonly authService = inject(AuthService);
  readonly sessionVigenciaService = inject(SessionVigenciaService);
  readonly orgStore = inject(OrganizationStore);
  readonly layoutStore = inject(LayoutStore);
  readonly themeService = inject(ThemeService);
  readonly notificationService = inject(NotificationService);
  readonly schedulerAdminService = inject(SchedulerAdminService);
  private readonly router = inject(Router);

  @ViewChild('globalSearchInput') globalSearchInput?: ElementRef<HTMLInputElement>;

  /** URL activa para determinar el título contextual de la cabecera y estados del árbol lateral */
  readonly currentUrl = signal<string>('/panel');

  constructor() {
    const initialUrl = this.router.url || '/panel';
    this.currentUrl.set(initialUrl);
    if (initialUrl.startsWith('/admin')) {
      this.layoutStore.adminExpanded.set(true);
    }

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = e.urlAfterRedirects || e.url;
        this.currentUrl.set(url);
        if (url.startsWith('/admin')) {
          this.layoutStore.adminExpanded.set(true);
        }
        this.layoutStore.closeMobileMenu();
      });

    effect(() => {
      if (this.authService.isSuperAdmin()) {
        untracked(() => {
          this.schedulerAdminService.getOverview().subscribe({ error: () => {} });
        });
      }
    });
  }

  /**
   * Primer nombre o título de cortesía para mostrar en la barra superior
   */
  readonly userFirstName = computed(() => {
    const user = this.authService.currentUser();
    return extractFirstName(user?.name);
  });

  /**
   * Iniciales de 2 letras para el avatar del abogado en sesión
   */
  readonly userInitials = computed(() => {
    const user = this.authService.currentUser();
    return extractUserInitials(user?.name);
  });

  /**
   * Título contextual mostrado en el extremo izquierdo de la barra superior
   */
  readonly pageTitle = computed(() => {
    const url = this.currentUrl();
    if (url.startsWith('/procesos/nuevo')) return 'Vigilar Radicado';
    if (url.startsWith('/procesos/')) return 'Detalle del Expediente';
    if (url.startsWith('/organizaciones/nueva')) return 'Crear Firma Jurídica';
    if (url.startsWith('/organizacion')) return 'Organización y Equipo';
    if (url.startsWith('/admin/usuarios')) return 'Gestión de Usuarios';
    if (url.startsWith('/admin/organizaciones')) return 'Observabilidad de Organizaciones';
    if (url.startsWith('/admin/scheduler')) return 'Cron & Scheduler';
    if (url.startsWith('/admin/catalogos') || url.startsWith('/catalogos')) return 'Catálogos Maestros';
    if (url.startsWith('/admin/acciones')) return 'Registro de Acciones';
    if (url.startsWith('/perfil')) return 'Mi Perfil y Seguridad';
    return 'Expedientes';
  });

  /**
   * Determina si la ruta actual pertenece al área o submódulos de administración
   */
  readonly isAdminActive = computed(() => {
    return this.currentUrl().startsWith('/admin');
  });

  /**
   * Determina con precisión si un módulo del menú lateral está activo
   */
  isActive(route: string): boolean {
    const url = this.currentUrl();
    if (route === '/panel') {
      return url === '/' || url.startsWith('/panel') || (url.startsWith('/procesos/') && !url.startsWith('/procesos/nuevo'));
    }
    return url.startsWith(route);
  }

  /**
   * Indica si la ruta actual corresponde al tablero principal o detalle de expedientes
   */
  readonly isDashboardRoute = computed(() => this.isActive('/panel'));

  /**
   * Determina si la tarjeta inferior del Sidebar sugiere crear una firma jurídica
   */
  readonly showCreateOrgCard = computed(() => {
    const active = this.orgStore.activeOrg();
    if (!active) return true;
    return active.isPersonal === true || (active.name?.toLowerCase().includes('personal') ?? false);
  });

  /**
   * Selecciona un filtro rápido de expedientes desde el submenú del Sidebar
   */
  selectProcessFilter(tab: SidebarTabFilter): void {
    this.layoutStore.selectDashboardTab(tab);
    if (!this.isDashboardRoute()) {
      this.router.navigate(['/panel']);
    }
  }

  /**
   * Filtra directamente los expedientes con actuaciones nuevas desde la campana de notificaciones
   */
  openNewsFilter(): void {
    this.layoutStore.selectDashboardTab('NEWS');
    if (!this.isDashboardRoute()) {
      this.router.navigate(['/panel']);
    }
  }

  /**
   * Actualiza la búsqueda global desde la barra superior
   */
  onGlobalSearchChange(query: string): void {
    this.layoutStore.setGlobalSearch(query);
    if (query.trim().length > 0 && !this.isDashboardRoute()) {
      this.router.navigate(['/panel']);
    }
  }

  /**
   * Limpia la búsqueda global
   */
  clearGlobalSearch(): void {
    this.layoutStore.setGlobalSearch('');
  }

  /**
   * Atajo de teclado global Ctrl+K / ⌘K para enfocar el buscador y Escape para cerrar cajón móvil
   */
  @HostListener('window:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.globalSearchInput?.nativeElement.focus();
      this.globalSearchInput?.nativeElement.select();
    } else if (event.key === 'Escape' && this.layoutStore.mobileMenuOpen()) {
      this.layoutStore.closeMobileMenu();
    }
  }

  /**
   * Cierra la sesión activa y redirige a la pantalla de acceso
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/iniciar-sesion']);
  }
}
