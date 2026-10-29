import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { ConsentTypeDto, DocumentTypeDto, GenderDto } from '../../../core/models/catalog.model';
import {
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  CardFooterComponent,
  ButtonComponent,
  FormAlertComponent,
  LogoComponent
} from '../../../shared/components/ui';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    ButtonComponent,
    FormAlertComponent,
    LogoComponent
  ],
  templateUrl: './sign-up.component.html'
})
export class SignUpComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly catalogService = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Catálogos dinámicos
  readonly documentTypes = signal<DocumentTypeDto[]>([]);
  readonly genders = signal<GenderDto[]>([]);
  readonly consentTypes = signal<ConsentTypeDto[]>([]);

  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal(false);

  readonly form = this.fb.group({
    documentType: ['CC', [Validators.required]],
    documentNumber: ['', [Validators.required, Validators.minLength(4)]],
    genderCode: ['' as string | null],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    middleName: [''],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    secondLastName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    acceptTerms: [false, [Validators.requiredTrue]],
    acceptPrivacy: [false, [Validators.requiredTrue]]
  });

  ngOnInit(): void {
    const emailParam = this.route.snapshot.queryParams['email'];
    if (emailParam) {
      this.form.patchValue({ email: emailParam });
    }

    this.loadCatalogs();
    this.setupDynamicValidation();
  }

  /**
   * Carga los catálogos maestros para el formulario de registro
   */
  private loadCatalogs(): void {
    this.catalogService.getDocumentTypes('NATURAL').subscribe({
      next: (types) => {
        if (types && types.length > 0) {
          this.documentTypes.set(types);
          if (!this.form.get('documentType')?.value) {
            this.form.patchValue({ documentType: types[0].code });
          }
        }
      },
      error: () => {
        // Fallback predeterminado en caso de desconexión
        this.documentTypes.set([
          { id: '1', code: 'CC', name: 'Cédula de Ciudadanía', requiresSecondLastName: false, displayOrder: 1, isActive: true },
          { id: '2', code: 'CE', name: 'Cédula de Extranjería', requiresSecondLastName: false, displayOrder: 2, isActive: true },
          { id: '3', code: 'PASAPORTE', name: 'Pasaporte', requiresSecondLastName: false, displayOrder: 3, isActive: true }
        ]);
      }
    });

    this.catalogService.getGenders().subscribe({
      next: (items) => this.genders.set(items || []),
      error: () => {}
    });

    this.catalogService.getConsentTypes().subscribe({
      next: (consents) => {
        if (consents && consents.length > 0) {
          this.consentTypes.set(consents);
        }
      },
      error: () => {}
    });
  }

  /**
   * Ajusta los validadores según las reglas del tipo de documento seleccionado
   */
  private setupDynamicValidation(): void {
    this.form.get('documentType')?.valueChanges.subscribe(typeCode => {
      const selected = this.documentTypes().find(t => t.code === typeCode);
      const numberCtrl = this.form.get('documentNumber');
      if (selected?.validationRegex) {
        numberCtrl?.setValidators([Validators.required, Validators.pattern(new RegExp(selected.validationRegex))]);
      } else {
        numberCtrl?.setValidators([Validators.required, Validators.minLength(4)]);
      }
      numberCtrl?.updateValueAndValidity();
    });
  }

  /**
   * Registra un nuevo usuario en Dokqet
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const val = this.form.value;
    const registerPayload = {
      documentType: val.documentType,
      documentNumber: val.documentNumber?.trim(),
      genderCode: val.genderCode || null,
      firstName: val.firstName?.trim(),
      middleName: val.middleName?.trim() || null,
      lastName: val.lastName?.trim(),
      secondLastName: val.secondLastName?.trim() || null,
      email: val.email?.trim().toLowerCase(),
      password: val.password,
      acceptTerms: !!val.acceptTerms,
      acceptPrivacy: !!val.acceptPrivacy
    };

    this.authService.register(registerPayload).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/panel';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Error al crear la cuenta. Verifica los datos.');
      }
    });
  }
}
