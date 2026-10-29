import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { AuthService } from '../../../core/auth/auth.service';
import {
  CityDto,
  ConsentTypeDto,
  CountryDto,
  DepartmentDto,
  DismissalReasonDto,
  DocumentTypeDto,
  GenderDto,
  JudicialSpecialtyDto,
  PartyCategoryDto,
  PersonTypeDto
} from '../../../core/models/catalog.model';
import {
  BadgeComponent,
  BreadcrumbsComponent,
  ButtonComponent,
  CardComponent,
  CardContentComponent,
  CardDescriptionComponent,
  CardHeaderComponent,
  CardTitleComponent,
  EmptyStateComponent,
  FormAlertComponent,
  ModalComponent
} from '../../../shared/components/ui';

export type CatalogKey =
  | 'document-types'
  | 'genders'
  | 'countries'
  | 'departments'
  | 'cities'
  | 'person-types'
  | 'party-categories'
  | 'dismissal-reasons'
  | 'judicial-specialties'
  | 'consent-types';

export type CatalogCategory = 'all' | 'identity' | 'territorial' | 'judicial' | 'compliance';

export interface CategoryDefinition {
  key: CatalogCategory;
  name: string;
  shortName: string;
  icon: string;
}

export interface CatalogMetadata {
  key: CatalogKey;
  title: string;
  singular: string;
  description: string;
  icon: string;
  category: 'identity' | 'territorial' | 'judicial' | 'compliance';
  categoryLabel: string;
  badge: string;
  keywords: string[];
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { key: 'all', name: 'Todas las tablas', shortName: 'Todas', icon: 'layers' },
  { key: 'identity', name: 'Identidad y Sujetos', shortName: 'Identidad', icon: 'users' },
  { key: 'territorial', name: 'División Territorial (DANE)', shortName: 'Territorial', icon: 'map' },
  { key: 'judicial', name: 'Ámbito Judicial y Procesal', shortName: 'Judicial', icon: 'scale' },
  { key: 'compliance', name: 'Normativa & Cumplimiento', shortName: 'Cumplimiento', icon: 'shield' }
];

export const CATALOG_DEFINITIONS: CatalogMetadata[] = [
  {
    key: 'document-types',
    title: 'Tipos de Documento',
    singular: 'Tipo de Documento',
    description: 'Documentos oficiales de identidad (CC, CE, Pasaporte, NIT, PPT) y validaciones DIAN.',
    icon: 'id',
    category: 'identity',
    categoryLabel: 'Identidad',
    badge: 'DIAN & Registro',
    keywords: ['cc', 'ce', 'nit', 'pasaporte', 'ppt', 'identidad', 'cedula']
  },
  {
    key: 'genders',
    title: 'Géneros',
    singular: 'Género',
    description: 'Catálogo de género para caracterización demográfica de usuarios y sujetos procesales.',
    icon: 'user',
    category: 'identity',
    categoryLabel: 'Identidad',
    badge: 'Demografía',
    keywords: ['genero', 'masculino', 'femenino', 'sexo']
  },
  {
    key: 'person-types',
    title: 'Tipos de Persona',
    singular: 'Tipo de Persona',
    description: 'Clasificación jurídica (Persona Natural, Jurídica, Patrimonio Autónomo) para representación.',
    icon: 'briefcase',
    category: 'identity',
    categoryLabel: 'Identidad',
    badge: 'Clasificación Jurídica',
    keywords: ['natural', 'juridica', 'sociedad', 'empresa', 'patrimonio']
  },
  {
    key: 'party-categories',
    title: 'Categorías de Parte',
    singular: 'Categoría de Parte',
    description: 'Roles procesales (Demandante, Demandado, Coadyuvante) y facultades de representación en litigios.',
    icon: 'users',
    category: 'identity',
    categoryLabel: 'Identidad',
    badge: 'Sujetos Procesales',
    keywords: ['demandante', 'demandado', 'parte', 'victima', 'tercero', 'representado']
  },
  {
    key: 'countries',
    title: 'Países',
    singular: 'País',
    description: 'Países de residencia, indicativos telefónicos mundiales y códigos oficiales ISO 3166-1.',
    icon: 'globe',
    category: 'territorial',
    categoryLabel: 'Territorial',
    badge: 'ISO 3166',
    keywords: ['pais', 'colombia', 'internacional', 'iso', 'indicativo']
  },
  {
    key: 'departments',
    title: 'Departamentos',
    singular: 'Departamento',
    description: 'Divisiones territoriales de primer nivel y codificación DANE DIVIPOLA de 2 dígitos.',
    icon: 'map',
    category: 'territorial',
    categoryLabel: 'Territorial',
    badge: 'DANE DIVIPOLA',
    keywords: ['departamento', 'dane', 'antioquia', 'cundinamarca', 'valle']
  },
  {
    key: 'cities',
    title: 'Ciudades / Municipios',
    singular: 'Ciudad / Municipio',
    description: 'Municipios y distritos con códigos DANE de 5 dígitos para radicación y jurisdicción judicial.',
    icon: 'building',
    category: 'territorial',
    categoryLabel: 'Territorial',
    badge: 'DANE 5 dígitos',
    keywords: ['ciudad', 'municipio', 'bogota', 'medellin', 'cali', 'despacho']
  },
  {
    key: 'judicial-specialties',
    title: 'Especialidades Judiciales',
    singular: 'Especialidad Judicial',
    description: 'Jurisdicciones y materias del derecho (Civil, Penal, Laboral, Familia) según la Rama Judicial.',
    icon: 'scale',
    category: 'judicial',
    categoryLabel: 'Judicial',
    badge: 'Rama Judicial',
    keywords: ['civil', 'penal', 'laboral', 'familia', 'administrativo', 'jurisdiccion', 'especialidad']
  },
  {
    key: 'dismissal-reasons',
    title: 'Motivos de Descarte',
    singular: 'Motivo de Descarte',
    description: 'Causales tipificadas de desvinculación, archivo y cese de monitoreo de expedientes.',
    icon: 'slash',
    category: 'judicial',
    categoryLabel: 'Judicial',
    badge: 'Gestión Procesal',
    keywords: ['descarte', 'archivo', 'terminacion', 'desvinculacion', 'inactivo']
  },
  {
    key: 'consent-types',
    title: 'Políticas y Consentimientos',
    singular: 'Consentimiento Legal',
    description: 'Políticas de tratamiento de datos personales Ley 1581 de 2012, términos y versiones activas.',
    icon: 'file-text',
    category: 'compliance',
    categoryLabel: 'Cumplimiento',
    badge: 'Ley 1581 / Habeas Data',
    keywords: ['consentimiento', 'habeas data', 'terminos', 'privacidad', 'ley 1581', 'politica']
  }
];

@Component({
  selector: 'app-catalogs-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    ButtonComponent,
    BadgeComponent,
    FormAlertComponent,
    BreadcrumbsComponent,
    ModalComponent,
    EmptyStateComponent
  ],
  templateUrl: './catalogs-admin.component.html'
})
export class CatalogsAdminComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly catalogService = inject(CatalogService);
  readonly authService = inject(AuthService);

  readonly catalogDefinitions = CATALOG_DEFINITIONS;
  readonly activeCatalogKey = signal<CatalogKey>('document-types');
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly togglingStatus = signal<string | null>(null);

  // Navegación, búsqueda y categorización de Tablas Maestras
  readonly categories = CATEGORY_DEFINITIONS;
  readonly selectedCategory = signal<CatalogCategory>('all');
  readonly catalogSearchQuery = signal<string>('');
  readonly mobileSelectorOpen = signal<boolean>(false);

  readonly categoryCounts = computed(() => {
    const defs = this.catalogDefinitions;
    return {
      all: defs.length,
      identity: defs.filter(c => c.category === 'identity').length,
      territorial: defs.filter(c => c.category === 'territorial').length,
      judicial: defs.filter(c => c.category === 'judicial').length,
      compliance: defs.filter(c => c.category === 'compliance').length
    };
  });

  readonly filteredCatalogList = computed(() => {
    const q = this.catalogSearchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();

    return this.catalogDefinitions.filter(item => {
      if (cat !== 'all' && item.category !== cat) {
        return false;
      }
      if (!q) return true;

      const title = item.title.toLowerCase();
      const desc = item.description.toLowerCase();
      const singular = item.singular.toLowerCase();
      const badge = item.badge.toLowerCase();
      const keywords = (item.keywords || []).some(k => k.toLowerCase().includes(q));

      return title.includes(q) || desc.includes(q) || singular.includes(q) || badge.includes(q) || keywords;
    });
  });

  // Datos en memoria
  readonly items = signal<any[]>([]);
  readonly searchQuery = signal<string>('');

  // Notificaciones
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Modal de Crear / Editar
  readonly showEditModal = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly currentEditingId = signal<string | null>(null);

  // Formulario Reactivo dinámico para Upsert
  readonly editForm = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    displayOrder: [0, [Validators.required]],
    isActive: [true],
    
    // Específicos DocumentType
    dianCode: [''],
    applicablePersonType: ['NATURAL'],
    validationRegex: [''],
    requiresSecondLastName: [false],

    // Específicos Country
    isoAlpha3: [''],
    phoneCode: [''],

    // Específicos Department
    countryCode: ['CO'],

    // Específicos City
    departmentCode: ['05'],

    // Específicos PersonType
    requiresNit: [false],
    requiresLegalName: [false],

    // Específicos PartyCategory
    selectableAsRepresented: [true],
    matchingKeywords: [''],

    // Específicos DismissalReason
    scope: ['BOTH'],

    // Específicos JudicialSpecialty
    ramaSpecialtyCode: [''],

    // Específicos ConsentType
    currentVersion: ['v1.0'],
    isMandatory: [true],
    documentUrl: ['']
  });

  readonly activeDefinition = computed(() => {
    return this.catalogDefinitions.find(c => c.key === this.activeCatalogKey()) || this.catalogDefinitions[0];
  });

  readonly filteredItems = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.items();
    if (!q) return list;
    return list.filter(item => {
      const code = (item.code || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return code.includes(q) || name.includes(q) || desc.includes(q);
    });
  });

  ngOnInit(): void {
    this.loadCatalog(this.activeCatalogKey());
  }

  selectCatalog(key: CatalogKey): void {
    this.activeCatalogKey.set(key);
    this.searchQuery.set('');
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.loadCatalog(key);
  }

  setCategory(cat: CatalogCategory): void {
    this.selectedCategory.set(cat);
  }

  clearCatalogSearch(): void {
    this.catalogSearchQuery.set('');
  }

  toggleMobileSelector(): void {
    this.mobileSelectorOpen.update(v => !v);
  }

  selectCatalogAndCloseMobile(key: CatalogKey): void {
    this.selectCatalog(key);
    this.mobileSelectorOpen.set(false);
  }

  loadCatalog(key: CatalogKey): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const isSuper = this.authService.isSuperAdmin();

    let request$;
    if (isSuper) {
      switch (key) {
        case 'document-types': request$ = this.catalogService.getAdminDocumentTypes(); break;
        case 'genders': request$ = this.catalogService.getAdminGenders(); break;
        case 'countries': request$ = this.catalogService.getAdminCountries(); break;
        case 'departments': request$ = this.catalogService.getAdminDepartments(); break;
        case 'cities': request$ = this.catalogService.getAdminCities(); break;
        case 'person-types': request$ = this.catalogService.getAdminPersonTypes(); break;
        case 'party-categories': request$ = this.catalogService.getAdminPartyCategories(); break;
        case 'dismissal-reasons': request$ = this.catalogService.getAdminDismissalReasons(); break;
        case 'judicial-specialties': request$ = this.catalogService.getAdminJudicialSpecialties(); break;
        case 'consent-types': request$ = this.catalogService.getAdminConsentTypes(); break;
      }
    } else {
      switch (key) {
        case 'document-types': request$ = this.catalogService.getDocumentTypes(); break;
        case 'genders': request$ = this.catalogService.getGenders(); break;
        case 'countries': request$ = this.catalogService.getCountries(); break;
        case 'departments': request$ = this.catalogService.getDepartments(); break;
        case 'cities': request$ = this.catalogService.getCities(); break;
        case 'person-types': request$ = this.catalogService.getPersonTypes(); break;
        case 'party-categories': request$ = this.catalogService.getPartyCategories(false); break;
        case 'dismissal-reasons': request$ = this.catalogService.getDismissalReasons(); break;
        case 'judicial-specialties': request$ = this.catalogService.getJudicialSpecialties(); break;
        case 'consent-types': request$ = this.catalogService.getConsentTypes(); break;
      }
    }

    request$.subscribe({
      next: (data) => {
        this.items.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar los datos del catálogo.');
      }
    });
  }

  toggleStatus(item: any): void {
    const key = this.activeCatalogKey();
    const id = item.id;
    const newStatus = !item.isActive;
    this.togglingStatus.set(id);

    let request$;
    switch (key) {
      case 'document-types': request$ = this.catalogService.updateDocumentTypeStatus(id, newStatus); break;
      case 'genders': request$ = this.catalogService.updateGenderStatus(id, newStatus); break;
      case 'countries': request$ = this.catalogService.updateCountryStatus(id, newStatus); break;
      case 'departments': request$ = this.catalogService.updateDepartmentStatus(id, newStatus); break;
      case 'cities': request$ = this.catalogService.updateCityStatus(id, newStatus); break;
      case 'person-types': request$ = this.catalogService.updatePersonTypeStatus(id, newStatus); break;
      case 'party-categories': request$ = this.catalogService.updatePartyCategoryStatus(id, newStatus); break;
      case 'dismissal-reasons': request$ = this.catalogService.updateDismissalReasonStatus(id, newStatus); break;
      case 'judicial-specialties': request$ = this.catalogService.updateJudicialSpecialtyStatus(id, newStatus); break;
      case 'consent-types': request$ = this.catalogService.updateConsentTypeStatus(id, newStatus); break;
    }

    request$.subscribe({
      next: (updated) => {
        this.togglingStatus.set(null);
        this.items.update(list => list.map(i => i.id === id ? { ...i, isActive: newStatus } : i));
        this.successMessage.set(`Estado de "${item.name}" actualizado a ${newStatus ? 'Activo' : 'Inactivo'}.`);
      },
      error: (err) => {
        this.togglingStatus.set(null);
        this.errorMessage.set(err.error?.message || 'Error al actualizar el estado del registro.');
      }
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.currentEditingId.set(null);
    this.editForm.reset({
      code: '',
      name: '',
      description: '',
      displayOrder: this.items().length + 1,
      isActive: true,
      dianCode: '',
      applicablePersonType: 'NATURAL',
      validationRegex: '',
      requiresSecondLastName: false,
      isoAlpha3: '',
      phoneCode: '',
      countryCode: 'CO',
      departmentCode: '05',
      requiresNit: false,
      requiresLegalName: false,
      selectableAsRepresented: true,
      matchingKeywords: '',
      scope: 'BOTH',
      ramaSpecialtyCode: '',
      currentVersion: 'v1.0',
      isMandatory: true,
      documentUrl: ''
    });
    this.editForm.get('code')?.enable();
    this.showEditModal.set(true);
  }

  openEditModal(item: any): void {
    this.isEditing.set(true);
    this.currentEditingId.set(item.id);
    this.editForm.patchValue({
      code: item.code,
      name: item.name,
      description: item.description || '',
      displayOrder: item.displayOrder ?? 0,
      isActive: item.isActive ?? true,
      dianCode: item.dianCode || '',
      applicablePersonType: item.applicablePersonType || 'NATURAL',
      validationRegex: item.validationRegex || '',
      requiresSecondLastName: !!item.requiresSecondLastName,
      isoAlpha3: item.isoAlpha3 || '',
      phoneCode: item.phoneCode || '',
      countryCode: item.countryCode || 'CO',
      departmentCode: item.departmentCode || '05',
      requiresNit: !!item.requiresNit,
      requiresLegalName: !!item.requiresLegalName,
      selectableAsRepresented: !!item.selectableAsRepresented,
      matchingKeywords: item.matchingKeywords || '',
      scope: item.scope || 'BOTH',
      ramaSpecialtyCode: item.ramaSpecialtyCode || '',
      currentVersion: item.currentVersion || 'v1.0',
      isMandatory: !!item.isMandatory,
      documentUrl: item.documentUrl || ''
    });
    // El código en edición suele ser inmutable
    this.editForm.get('code')?.disable();
    this.showEditModal.set(true);
  }

  closeModal(): void {
    this.showEditModal.set(false);
    this.currentEditingId.set(null);
  }

  saveItem(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const val = this.editForm.getRawValue();
    const key = this.activeCatalogKey();
    const isEdit = this.isEditing();
    const id = this.currentEditingId();

    const normalizedCode = (val.code || '').trim().toUpperCase();
    const payload: any = {
      code: normalizedCode,
      name: val.name?.trim(),
      description: val.description?.trim() || null,
      displayOrder: Number(val.displayOrder) || 0,
      isActive: !!val.isActive
    };

    // Atributos específicos según tipo
    if (key === 'document-types') {
      payload.dianCode = val.dianCode?.trim() || null;
      payload.applicablePersonType = val.applicablePersonType || null;
      payload.validationRegex = val.validationRegex?.trim() || null;
      payload.requiresSecondLastName = !!val.requiresSecondLastName;
    } else if (key === 'countries') {
      payload.isoAlpha3 = val.isoAlpha3?.trim().toUpperCase() || null;
      payload.phoneCode = val.phoneCode?.trim() || null;
    } else if (key === 'departments') {
      payload.countryCode = val.countryCode?.trim().toUpperCase() || 'CO';
    } else if (key === 'cities') {
      payload.departmentCode = val.departmentCode?.trim().toUpperCase() || '05';
    } else if (key === 'person-types') {
      payload.requiresNit = !!val.requiresNit;
      payload.requiresLegalName = !!val.requiresLegalName;
    } else if (key === 'party-categories') {
      payload.selectableAsRepresented = !!val.selectableAsRepresented;
      payload.matchingKeywords = val.matchingKeywords?.trim() || null;
    } else if (key === 'dismissal-reasons') {
      payload.scope = val.scope || 'BOTH';
    } else if (key === 'judicial-specialties') {
      payload.ramaSpecialtyCode = val.ramaSpecialtyCode?.trim() || null;
    } else if (key === 'consent-types') {
      payload.currentVersion = val.currentVersion?.trim() || 'v1.0';
      payload.isMandatory = !!val.isMandatory;
      payload.documentUrl = val.documentUrl?.trim() || null;
    }

    let request$;
    if (isEdit && id) {
      switch (key) {
        case 'document-types': request$ = this.catalogService.updateDocumentType(id, payload); break;
        case 'genders': request$ = this.catalogService.updateGender(id, payload); break;
        case 'countries': request$ = this.catalogService.updateCountry(id, payload); break;
        case 'departments': request$ = this.catalogService.updateDepartment(id, payload); break;
        case 'cities': request$ = this.catalogService.updateCity(id, payload); break;
        case 'person-types': request$ = this.catalogService.updatePersonType(id, payload); break;
        case 'party-categories': request$ = this.catalogService.updatePartyCategory(id, payload); break;
        case 'dismissal-reasons': request$ = this.catalogService.updateDismissalReason(id, payload); break;
        case 'judicial-specialties': request$ = this.catalogService.updateJudicialSpecialty(id, payload); break;
        case 'consent-types': request$ = this.catalogService.updateConsentType(id, payload); break;
      }
    } else {
      switch (key) {
        case 'document-types': request$ = this.catalogService.createDocumentType(payload); break;
        case 'genders': request$ = this.catalogService.createGender(payload); break;
        case 'countries': request$ = this.catalogService.createCountry(payload); break;
        case 'departments': request$ = this.catalogService.createDepartment(payload); break;
        case 'cities': request$ = this.catalogService.createCity(payload); break;
        case 'person-types': request$ = this.catalogService.createPersonType(payload); break;
        case 'party-categories': request$ = this.catalogService.createPartyCategory(payload); break;
        case 'dismissal-reasons': request$ = this.catalogService.createDismissalReason(payload); break;
        case 'judicial-specialties': request$ = this.catalogService.createJudicialSpecialty(payload); break;
        case 'consent-types': request$ = this.catalogService.createConsentType(payload); break;
      }
    }

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.successMessage.set(`Registro ${isEdit ? 'actualizado' : 'creado'} exitosamente.`);
        this.loadCatalog(key);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Error al guardar el registro en el catálogo.');
      }
    });
  }
}
