import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AuthService } from './core/auth/auth.service';
import { LayoutStore } from './core/state/layout.store';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let authService: AuthService;
  let layoutStore: LayoutStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    layoutStore = TestBed.inject(LayoutStore);
  });

  it('should create the app component', () => {
    expect(component).toBeTruthy();
  });

  it('should return default name and initials when no user is logged in', () => {
    expect(component.userFirstName()).toBe('Abogado');
    expect(component.userInitials()).toBe('AB');
  });

  it('should toggle sidebar collapse state via layoutStore', () => {
    expect(layoutStore.sidebarCollapsed()).toBeFalse();
    layoutStore.toggleSidebarCollapse();
    expect(layoutStore.sidebarCollapsed()).toBeTrue();
  });

  it('should update dashboard filter tab when selecting from sidebar', () => {
    component.selectProcessFilter('NEWS');
    expect(layoutStore.activeDashboardTab()).toBe('NEWS');
  });

  it('should resolve Cron & Scheduler title for /admin/scheduler route', () => {
    component.currentUrl.set('/admin/scheduler');
    expect(component.pageTitle()).toBe('Cron & Scheduler');
  });

  it('should resolve correct pageTitle and isAdminActive for admin routes', () => {
    component.currentUrl.set('/admin/usuarios');
    expect(component.pageTitle()).toBe('Gestión de Usuarios');
    expect(component.isAdminActive()).toBeTrue();

    component.currentUrl.set('/admin/acciones');
    expect(component.pageTitle()).toBe('Registro de Acciones');
    expect(component.isAdminActive()).toBeTrue();

    component.currentUrl.set('/panel');
    expect(component.isAdminActive()).toBeFalse();
  });

  it('should toggle admin menu expansion and expand sidebar if collapsed', () => {
    expect(layoutStore.adminExpanded()).toBeTrue();
    layoutStore.toggleAdminMenu();
    expect(layoutStore.adminExpanded()).toBeFalse();

    // When sidebar is collapsed, toggleAdminMenu expands the sidebar and opens the menu
    layoutStore.sidebarCollapsed.set(true);
    layoutStore.toggleAdminMenu();
    expect(layoutStore.sidebarCollapsed()).toBeFalse();
    expect(layoutStore.adminExpanded()).toBeTrue();
  });
});
