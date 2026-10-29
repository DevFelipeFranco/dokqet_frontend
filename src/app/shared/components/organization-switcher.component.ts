import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { OrganizationStore } from '../../core/state/organization.store';
import { DropdownComponent } from './ui/dropdown.component';

@Component({
  selector: 'app-organization-switcher',
  standalone: true,
  imports: [CommonModule, RouterLink, DropdownComponent],
  templateUrl: './organization-switcher.component.html'
})
export class OrganizationSwitcherComponent {
  readonly orgStore = inject(OrganizationStore);
  private readonly router = inject(Router);

  /** Modo compacto cuando el menú lateral está contraído */
  compact = input<boolean>(false);

  /** Iniciales de la organización activa para el avatar circular */
  readonly activeInitials = computed(() => {
    const name = this.orgStore.activeOrg()?.name || 'Espacio Personal';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  /**
   * Determina de forma pura si una organización es de carácter personal
   */
  isPersonal(org: { isPersonal?: boolean; name?: string | null } | null | undefined): boolean {
    if (!org) return false;
    return org.isPersonal === true || (org.name?.toLowerCase().includes('personal') ?? false);
  }

  /**
   * Cambia el inquilino/organización activa y redirige al panel
   */
  selectOrg(orgId: string): void {
    if (orgId === this.orgStore.activeOrg()?.id) return;
    this.orgStore.switchOrganization(orgId).subscribe({
      next: () => {
        this.router.navigate(['/panel']);
      }
    });
  }
}
