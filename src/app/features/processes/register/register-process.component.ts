import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProcessService } from '../../../core/services/process.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { AuthService } from '../../../core/auth/auth.service';
import { OrganizationStore } from '../../../core/state/organization.store';
import { FoundProcess, RepresentedParty } from '../../../core/models/process.model';
import { PartyCategoryDto } from '../../../core/models/catalog.model';
import { Member } from '../../../core/models/organization.model';
import { RadicadoPipe } from '../../../shared/pipes/radicado.pipe';
import { radicadoValidator } from '../../../shared/validators/dian.validators';
import {
  LEGAL_CONSTANTS,
  REPRESENTED_PARTY_OPTIONS
} from '../../../core/constants';
import {
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  CardFooterComponent,
  ButtonComponent,
  BadgeComponent,
  FormAlertComponent,
  BreadcrumbsComponent
} from '../../../shared/components/ui';

/**
 * Función pura para normalizar un radicado eliminando caracteres no numéricos
 */
export function cleanRadicadoDigits(radicado?: string | null): string {
  if (!radicado) return '';
  return radicado.replace(/[\s.\-‐‑–—]/g, '');
}

@Component({
  selector: 'app-register-process',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink, 
    RadicadoPipe,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    ButtonComponent,
    BadgeComponent,
    FormAlertComponent,
    BreadcrumbsComponent
  ],
  templateUrl: './register-process.component.html'
})
export class RegisterProcessComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly processService = inject(ProcessService);
  private readonly orgService = inject(OrganizationService);
  private readonly catalogService = inject(CatalogService);
  private readonly authService = inject(AuthService);
  readonly orgStore = inject(OrganizationStore);
  private readonly router = inject(Router);

  readonly radicadoMaxLength = LEGAL_CONSTANTS.RADICADO_LENGTH;
  readonly notesMaxLength = LEGAL_CONSTANTS.NOTES_MAX_LENGTH;
  readonly representedPartyOptions = REPRESENTED_PARTY_OPTIONS;
  readonly representedParties = signal<PartyCategoryDto[]>([]);

  // Estados de consulta y candidatos
  readonly searching = signal(false);
  readonly searched = signal(false);
  readonly searchError = signal<string | null>(null);
  readonly candidates = signal<FoundProcess[]>([]);
  readonly selectedCandidate = signal<FoundProcess | null>(null);

  // Miembros y estado de registro
  readonly members = signal<Member[]>([]);
  readonly registering = signal(false);
  readonly registerError = signal<string | null>(null);

  readonly searchForm = this.fb.group({
    radicado: ['', [Validators.required, radicadoValidator()]]
  });

  readonly registerForm = this.fb.group({
    representedParty: [RepresentedParty.SIN_DEFINIR],
    responsibleUserId: [null as string | null],
    notes: ['']
  });

  readonly acceptPrivateControl = this.fb.control(false);

  readonly currentUserId = computed(() => this.authService.currentUser()?.id || '');
  readonly notesLength = computed(() => (this.registerForm.get('notes')?.value || '').length);

  /**
   * Conteo reactivo de dígitos limpios del radicado
   */
  readonly radicadoDigits = computed(() => {
    const val = this.searchForm.get('radicado')?.value || '';
    return cleanRadicadoDigits(val);
  });

  readonly radicadoLength = computed(() => this.radicadoDigits().length);

  /**
   * Valida si el formulario está listo para enviar
   */
  readonly canSubmit = computed(() => {
    const cand = this.selectedCandidate();
    if (!cand || cand.alreadyInOrganization) return false;
    if (cand.esPrivado && !this.acceptPrivateControl.value) return false;
    return true;
  });

  ngOnInit(): void {
    this.catalogService.getPartyCategories(true).subscribe({
      next: (cats) => {
        if (cats && cats.length > 0) {
          this.representedParties.set(cats);
        }
      },
      error: () => {}
    });

    const orgId = this.authService.activeOrgId();
    if (orgId) {
      this.orgService.listMembers(orgId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.members.set(res.data);
            // Por defecto asigna al abogado actual en sesión
            const current = this.authService.currentUser();
            if (current && res.data.some(m => m.userId === current.id)) {
              this.registerForm.patchValue({ responsibleUserId: current.id });
            }
          }
        }
      });
    }
  }

  /**
   * Realiza la búsqueda en los servicios judiciales
   */
  onSearch(): void {
    if (this.searchForm.invalid) return;

    this.searching.set(true);
    this.searched.set(true);
    this.searchError.set(null);
    this.selectedCandidate.set(null);

    const rad = cleanRadicadoDigits(this.searchForm.value.radicado);

    this.processService.searchRadicado(rad).subscribe({
      next: (res) => {
        this.searching.set(false);
        if (res.success && res.data) {
          this.candidates.set(res.data);
          const available = res.data.find(c => !c.alreadyInOrganization);
          if (available) {
            this.selectCandidate(available);
          }
        }
      },
      error: (err) => {
        this.searching.set(false);
        this.searchError.set(err.error?.message || 'Error al consultar la Rama Judicial. Intenta nuevamente.');
      }
    });
  }

  /**
   * Selecciona un expediente candidato entre los resultados
   */
  selectCandidate(candidate: FoundProcess): void {
    this.selectedCandidate.set(candidate);
    this.acceptPrivateControl.setValue(false);
  }

  /**
   * Registra el proceso judicial seleccionado bajo vigilancia
   */
  onRegister(): void {
    const cand = this.selectedCandidate();
    if (!cand || !this.canSubmit()) return;

    this.registering.set(true);
    this.registerError.set(null);

    const payload = {
      radicado: cand.llaveProceso,
      idProceso: cand.idProceso,
      responsibleUserId: this.registerForm.value.responsibleUserId || null,
      representedParty: this.registerForm.value.representedParty,
      notes: this.registerForm.value.notes?.trim() || null,
      acceptPrivate: cand.esPrivado ? !!this.acceptPrivateControl.value : false
    };

    this.processService.registerProcess(payload).subscribe({
      next: (res) => {
        this.registering.set(false);
        if (res.success && res.data) {
          this.router.navigate(['/procesos', res.data]);
        } else {
          this.router.navigate(['/panel']);
        }
      },
      error: (err) => {
        this.registering.set(false);
        this.registerError.set(err.error?.message || 'Error al registrar el proceso judicial.');
      }
    });
  }
}
