/**
 * Definiciones de tipos y DTOs para las Tablas Maestras (Catálogos) de Dokqet
 * Según especificación de HU-13: Parametrización Dinámica de Tablas Maestras
 */

export interface DocumentTypeDto {
  id: string;
  code: string;
  dianCode?: string | null;
  name: string;
  description?: string | null;
  applicablePersonType?: 'NATURAL' | 'JURIDICA' | 'BOTH' | string | null;
  validationRegex?: string | null;
  requiresSecondLastName: boolean;
  displayOrder: number;
  isActive: boolean;
}

export interface GenderDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface CountryDto {
  id: string;
  code: string;
  isoAlpha3?: string | null;
  name: string;
  phoneCode?: string | null;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface DepartmentDto {
  id: string;
  countryId?: string | null;
  countryCode?: string | null;
  code: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface CityDto {
  id: string;
  departmentId?: string | null;
  departmentCode?: string | null;
  departmentName?: string | null;
  countryCode?: string | null;
  code: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface PersonTypeDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  requiresNit: boolean;
  requiresLegalName: boolean;
  displayOrder: number;
  isActive: boolean;
}

export interface PartyCategoryDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  selectableAsRepresented: boolean;
  matchingKeywords?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface DismissalReasonDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  scope?: 'INSTANCE' | 'PROCESS' | 'BOTH' | string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface JudicialSpecialtyDto {
  id: string;
  code: string;
  ramaSpecialtyCode?: string | null;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface ConsentTypeDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  currentVersion?: string | null;
  isMandatory: boolean;
  documentUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface CatalogBootstrapDto {
  documentTypes: DocumentTypeDto[];
  genders: GenderDto[];
  countries: CountryDto[];
  personTypes: PersonTypeDto[];
  partyCategories: PartyCategoryDto[];
  dismissalReasons: DismissalReasonDto[];
  judicialSpecialties: JudicialSpecialtyDto[];
  consentTypes: ConsentTypeDto[];
}

export interface CatalogApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Peticiones de creación / actualización administrativa (Upsert)
 */
export interface UpsertCountryRequest {
  code: string;
  isoAlpha3?: string;
  name: string;
  phoneCode?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpsertDepartmentRequest {
  countryCode: string;
  code: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpsertCityRequest {
  departmentCode: string;
  code: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpsertDocumentTypeRequest {
  code: string;
  dianCode?: string;
  name: string;
  description?: string;
  applicablePersonType?: string;
  validationRegex?: string;
  requiresSecondLastName?: boolean;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpsertGenderRequest {
  code: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpsertPersonTypeRequest {
  code: string;
  name: string;
  description?: string;
  requiresNit?: boolean;
  requiresLegalName?: boolean;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpsertPartyCategoryRequest {
  code: string;
  name: string;
  description?: string;
  selectableAsRepresented?: boolean;
  matchingKeywords?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpsertDismissalReasonRequest {
  code: string;
  name: string;
  description?: string;
  scope?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpsertJudicialSpecialtyRequest {
  code: string;
  ramaSpecialtyCode?: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpsertConsentTypeRequest {
  code: string;
  name: string;
  description?: string;
  currentVersion?: string;
  isMandatory?: boolean;
  documentUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCatalogStatusRequest {
  isActive: boolean;
}
