import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import {
  CatalogApiResponse,
  CatalogBootstrapDto,
  CityDto,
  ConsentTypeDto,
  CountryDto,
  DepartmentDto,
  DismissalReasonDto,
  DocumentTypeDto,
  GenderDto,
  JudicialSpecialtyDto,
  PartyCategoryDto,
  PersonTypeDto,
  UpdateCatalogStatusRequest,
  UpsertCityRequest,
  UpsertConsentTypeRequest,
  UpsertCountryRequest,
  UpsertDepartmentRequest,
  UpsertDismissalReasonRequest,
  UpsertDocumentTypeRequest,
  UpsertGenderRequest,
  UpsertJudicialSpecialtyRequest,
  UpsertPartyCategoryRequest,
  UpsertPersonTypeRequest
} from '../models/catalog.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly PUBLIC_API_URL = 'http://localhost:8080/api/v1/catalogs';
  private readonly ADMIN_API_URL = 'http://localhost:8080/api/v1/admin/catalogs';

  // Caché reactiva global para inicio rápido de formularios
  private readonly bootstrapSignal = signal<CatalogBootstrapDto | null>(null);
  readonly bootstrap = this.bootstrapSignal.asReadonly();

  // ==========================================
  // 1. ENDPOINTS PÚBLICOS / DE FORMULARIO
  // ==========================================

  /**
   * Carga en una sola llamada los catálogos estáticos ligeros para inicializar el frontend
   */
  getBootstrap(forceRefresh = false): Observable<CatalogBootstrapDto> {
    if (!forceRefresh && this.bootstrapSignal()) {
      return of(this.bootstrapSignal()!);
    }
    return this.http.get<CatalogApiResponse<CatalogBootstrapDto>>(`${this.PUBLIC_API_URL}/bootstrap`).pipe(
      map(res => res.data),
      tap(data => this.bootstrapSignal.set(data))
    );
  }

  /**
   * Obtiene tipos de documento activos (opcionalmente filtrados por persona)
   */
  getDocumentTypes(personType?: string): Observable<DocumentTypeDto[]> {
    const url = personType 
      ? `${this.PUBLIC_API_URL}/document-types?personType=${encodeURIComponent(personType)}`
      : `${this.PUBLIC_API_URL}/document-types`;
    return this.http.get<CatalogApiResponse<DocumentTypeDto[]>>(url).pipe(map(r => r.data));
  }

  /**
   * Obtiene la lista de géneros activos
   */
  getGenders(): Observable<GenderDto[]> {
    return this.http.get<CatalogApiResponse<GenderDto[]>>(`${this.PUBLIC_API_URL}/genders`).pipe(map(r => r.data));
  }

  /**
   * Obtiene la lista de países activos
   */
  getCountries(): Observable<CountryDto[]> {
    return this.http.get<CatalogApiResponse<CountryDto[]>>(`${this.PUBLIC_API_URL}/countries`).pipe(map(r => r.data));
  }

  /**
   * Obtiene departamentos por país (cascada nivel 1)
   */
  getDepartmentsByCountry(countryIdOrCode: string): Observable<DepartmentDto[]> {
    return this.http.get<CatalogApiResponse<DepartmentDto[]>>(`${this.PUBLIC_API_URL}/countries/${countryIdOrCode}/departments`).pipe(
      map(r => r.data)
    );
  }

  getDepartments(country?: string): Observable<DepartmentDto[]> {
    const url = country ? `${this.PUBLIC_API_URL}/departments?country=${encodeURIComponent(country)}` : `${this.PUBLIC_API_URL}/departments`;
    return this.http.get<CatalogApiResponse<DepartmentDto[]>>(url).pipe(map(r => r.data));
  }

  /**
   * Obtiene ciudades/municipios por departamento (cascada nivel 2)
   */
  getCitiesByDepartment(departmentIdOrCode: string): Observable<CityDto[]> {
    return this.http.get<CatalogApiResponse<CityDto[]>>(`${this.PUBLIC_API_URL}/departments/${departmentIdOrCode}/cities`).pipe(
      map(r => r.data)
    );
  }

  getCities(department?: string): Observable<CityDto[]> {
    const url = department ? `${this.PUBLIC_API_URL}/cities?department=${encodeURIComponent(department)}` : `${this.PUBLIC_API_URL}/cities`;
    return this.http.get<CatalogApiResponse<CityDto[]>>(url).pipe(map(r => r.data));
  }

  /**
   * Obtiene tipos de persona activos
   */
  getPersonTypes(): Observable<PersonTypeDto[]> {
    return this.http.get<CatalogApiResponse<PersonTypeDto[]>>(`${this.PUBLIC_API_URL}/person-types`).pipe(map(r => r.data));
  }

  /**
   * Obtiene categorías de parte procesal (filtro para partes representables)
   */
  getPartyCategories(selectableOnly = true): Observable<PartyCategoryDto[]> {
    return this.http.get<CatalogApiResponse<PartyCategoryDto[]>>(`${this.PUBLIC_API_URL}/party-categories?selectableOnly=${selectableOnly}`).pipe(
      map(r => r.data)
    );
  }

  /**
   * Obtiene motivos de descarte o desvinculación
   */
  getDismissalReasons(scope?: string): Observable<DismissalReasonDto[]> {
    const url = scope ? `${this.PUBLIC_API_URL}/dismissal-reasons?scope=${encodeURIComponent(scope)}` : `${this.PUBLIC_API_URL}/dismissal-reasons`;
    return this.http.get<CatalogApiResponse<DismissalReasonDto[]>>(url).pipe(map(r => r.data));
  }

  /**
   * Obtiene especialidades judiciales activas
   */
  getJudicialSpecialties(): Observable<JudicialSpecialtyDto[]> {
    return this.http.get<CatalogApiResponse<JudicialSpecialtyDto[]>>(`${this.PUBLIC_API_URL}/judicial-specialties`).pipe(map(r => r.data));
  }

  /**
   * Obtiene tipos de consentimiento legal y políticas vigentes
   */
  getConsentTypes(): Observable<ConsentTypeDto[]> {
    return this.http.get<CatalogApiResponse<ConsentTypeDto[]>>(`${this.PUBLIC_API_URL}/consent-types`).pipe(map(r => r.data));
  }

  // ==========================================
  // 2. ENDPOINTS DE ADMINISTRACIÓN (SuperAdmin)
  // ==========================================

  // Países
  getAdminCountries(): Observable<CountryDto[]> {
    return this.http.get<CatalogApiResponse<CountryDto[]>>(`${this.ADMIN_API_URL}/countries`).pipe(map(r => r.data));
  }
  createCountry(req: UpsertCountryRequest): Observable<CountryDto> {
    return this.http.post<CatalogApiResponse<CountryDto>>(`${this.ADMIN_API_URL}/countries`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updateCountry(id: string, req: UpsertCountryRequest): Observable<CountryDto> {
    return this.http.put<CatalogApiResponse<CountryDto>>(`${this.ADMIN_API_URL}/countries/${id}`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updateCountryStatus(id: string, isActive: boolean): Observable<CountryDto> {
    return this.http.patch<CatalogApiResponse<CountryDto>>(`${this.ADMIN_API_URL}/countries/${id}/status`, { isActive }).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }

  // Departamentos
  getAdminDepartments(): Observable<DepartmentDto[]> {
    return this.http.get<CatalogApiResponse<DepartmentDto[]>>(`${this.ADMIN_API_URL}/departments`).pipe(map(r => r.data));
  }
  createDepartment(req: UpsertDepartmentRequest): Observable<DepartmentDto> {
    return this.http.post<CatalogApiResponse<DepartmentDto>>(`${this.ADMIN_API_URL}/departments`, req).pipe(map(r => r.data));
  }
  updateDepartment(id: string, req: UpsertDepartmentRequest): Observable<DepartmentDto> {
    return this.http.put<CatalogApiResponse<DepartmentDto>>(`${this.ADMIN_API_URL}/departments/${id}`, req).pipe(map(r => r.data));
  }
  updateDepartmentStatus(id: string, isActive: boolean): Observable<DepartmentDto> {
    return this.http.patch<CatalogApiResponse<DepartmentDto>>(`${this.ADMIN_API_URL}/departments/${id}/status`, { isActive }).pipe(map(r => r.data));
  }

  // Ciudades / Municipios
  getAdminCities(): Observable<CityDto[]> {
    return this.http.get<CatalogApiResponse<CityDto[]>>(`${this.ADMIN_API_URL}/cities`).pipe(map(r => r.data));
  }
  createCity(req: UpsertCityRequest): Observable<CityDto> {
    return this.http.post<CatalogApiResponse<CityDto>>(`${this.ADMIN_API_URL}/cities`, req).pipe(map(r => r.data));
  }
  updateCity(id: string, req: UpsertCityRequest): Observable<CityDto> {
    return this.http.put<CatalogApiResponse<CityDto>>(`${this.ADMIN_API_URL}/cities/${id}`, req).pipe(map(r => r.data));
  }
  updateCityStatus(id: string, isActive: boolean): Observable<CityDto> {
    return this.http.patch<CatalogApiResponse<CityDto>>(`${this.ADMIN_API_URL}/cities/${id}/status`, { isActive }).pipe(map(r => r.data));
  }

  // Tipos de Documento
  getAdminDocumentTypes(): Observable<DocumentTypeDto[]> {
    return this.http.get<CatalogApiResponse<DocumentTypeDto[]>>(`${this.ADMIN_API_URL}/document-types`).pipe(map(r => r.data));
  }
  createDocumentType(req: UpsertDocumentTypeRequest): Observable<DocumentTypeDto> {
    return this.http.post<CatalogApiResponse<DocumentTypeDto>>(`${this.ADMIN_API_URL}/document-types`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updateDocumentType(id: string, req: UpsertDocumentTypeRequest): Observable<DocumentTypeDto> {
    return this.http.put<CatalogApiResponse<DocumentTypeDto>>(`${this.ADMIN_API_URL}/document-types/${id}`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updateDocumentTypeStatus(id: string, isActive: boolean): Observable<DocumentTypeDto> {
    return this.http.patch<CatalogApiResponse<DocumentTypeDto>>(`${this.ADMIN_API_URL}/document-types/${id}/status`, { isActive }).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }

  // Géneros
  getAdminGenders(): Observable<GenderDto[]> {
    return this.http.get<CatalogApiResponse<GenderDto[]>>(`${this.ADMIN_API_URL}/genders`).pipe(map(r => r.data));
  }
  createGender(req: UpsertGenderRequest): Observable<GenderDto> {
    return this.http.post<CatalogApiResponse<GenderDto>>(`${this.ADMIN_API_URL}/genders`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updateGender(id: string, req: UpsertGenderRequest): Observable<GenderDto> {
    return this.http.put<CatalogApiResponse<GenderDto>>(`${this.ADMIN_API_URL}/genders/${id}`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updateGenderStatus(id: string, isActive: boolean): Observable<GenderDto> {
    return this.http.patch<CatalogApiResponse<GenderDto>>(`${this.ADMIN_API_URL}/genders/${id}/status`, { isActive }).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }

  // Tipos de Persona
  getAdminPersonTypes(): Observable<PersonTypeDto[]> {
    return this.http.get<CatalogApiResponse<PersonTypeDto[]>>(`${this.ADMIN_API_URL}/person-types`).pipe(map(r => r.data));
  }
  createPersonType(req: UpsertPersonTypeRequest): Observable<PersonTypeDto> {
    return this.http.post<CatalogApiResponse<PersonTypeDto>>(`${this.ADMIN_API_URL}/person-types`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updatePersonType(id: string, req: UpsertPersonTypeRequest): Observable<PersonTypeDto> {
    return this.http.put<CatalogApiResponse<PersonTypeDto>>(`${this.ADMIN_API_URL}/person-types/${id}`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updatePersonTypeStatus(id: string, isActive: boolean): Observable<PersonTypeDto> {
    return this.http.patch<CatalogApiResponse<PersonTypeDto>>(`${this.ADMIN_API_URL}/person-types/${id}/status`, { isActive }).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }

  // Categorías de Parte Procesal
  getAdminPartyCategories(): Observable<PartyCategoryDto[]> {
    return this.http.get<CatalogApiResponse<PartyCategoryDto[]>>(`${this.ADMIN_API_URL}/party-categories`).pipe(map(r => r.data));
  }
  createPartyCategory(req: UpsertPartyCategoryRequest): Observable<PartyCategoryDto> {
    return this.http.post<CatalogApiResponse<PartyCategoryDto>>(`${this.ADMIN_API_URL}/party-categories`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updatePartyCategory(id: string, req: UpsertPartyCategoryRequest): Observable<PartyCategoryDto> {
    return this.http.put<CatalogApiResponse<PartyCategoryDto>>(`${this.ADMIN_API_URL}/party-categories/${id}`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updatePartyCategoryStatus(id: string, isActive: boolean): Observable<PartyCategoryDto> {
    return this.http.patch<CatalogApiResponse<PartyCategoryDto>>(`${this.ADMIN_API_URL}/party-categories/${id}/status`, { isActive }).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }

  // Motivos de Descarte
  getAdminDismissalReasons(): Observable<DismissalReasonDto[]> {
    return this.http.get<CatalogApiResponse<DismissalReasonDto[]>>(`${this.ADMIN_API_URL}/dismissal-reasons`).pipe(map(r => r.data));
  }
  createDismissalReason(req: UpsertDismissalReasonRequest): Observable<DismissalReasonDto> {
    return this.http.post<CatalogApiResponse<DismissalReasonDto>>(`${this.ADMIN_API_URL}/dismissal-reasons`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updateDismissalReason(id: string, req: UpsertDismissalReasonRequest): Observable<DismissalReasonDto> {
    return this.http.put<CatalogApiResponse<DismissalReasonDto>>(`${this.ADMIN_API_URL}/dismissal-reasons/${id}`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updateDismissalReasonStatus(id: string, isActive: boolean): Observable<DismissalReasonDto> {
    return this.http.patch<CatalogApiResponse<DismissalReasonDto>>(`${this.ADMIN_API_URL}/dismissal-reasons/${id}/status`, { isActive }).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }

  // Especialidades Judiciales
  getAdminJudicialSpecialties(): Observable<JudicialSpecialtyDto[]> {
    return this.http.get<CatalogApiResponse<JudicialSpecialtyDto[]>>(`${this.ADMIN_API_URL}/judicial-specialties`).pipe(map(r => r.data));
  }
  createJudicialSpecialty(req: UpsertJudicialSpecialtyRequest): Observable<JudicialSpecialtyDto> {
    return this.http.post<CatalogApiResponse<JudicialSpecialtyDto>>(`${this.ADMIN_API_URL}/judicial-specialties`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updateJudicialSpecialty(id: string, req: UpsertJudicialSpecialtyRequest): Observable<JudicialSpecialtyDto> {
    return this.http.put<CatalogApiResponse<JudicialSpecialtyDto>>(`${this.ADMIN_API_URL}/judicial-specialties/${id}`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updateJudicialSpecialtyStatus(id: string, isActive: boolean): Observable<JudicialSpecialtyDto> {
    return this.http.patch<CatalogApiResponse<JudicialSpecialtyDto>>(`${this.ADMIN_API_URL}/judicial-specialties/${id}/status`, { isActive }).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }

  // Tipos de Consentimiento
  getAdminConsentTypes(): Observable<ConsentTypeDto[]> {
    return this.http.get<CatalogApiResponse<ConsentTypeDto[]>>(`${this.ADMIN_API_URL}/consent-types`).pipe(map(r => r.data));
  }
  createConsentType(req: UpsertConsentTypeRequest): Observable<ConsentTypeDto> {
    return this.http.post<CatalogApiResponse<ConsentTypeDto>>(`${this.ADMIN_API_URL}/consent-types`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updateConsentType(id: string, req: UpsertConsentTypeRequest): Observable<ConsentTypeDto> {
    return this.http.put<CatalogApiResponse<ConsentTypeDto>>(`${this.ADMIN_API_URL}/consent-types/${id}`, req).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
  updateConsentTypeStatus(id: string, isActive: boolean): Observable<ConsentTypeDto> {
    return this.http.patch<CatalogApiResponse<ConsentTypeDto>>(`${this.ADMIN_API_URL}/consent-types/${id}/status`, { isActive }).pipe(
      map(r => r.data),
      tap(() => this.bootstrapSignal.set(null))
    );
  }
}
