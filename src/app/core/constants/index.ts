import { RepresentedParty, PartyCategory } from '../models/process.model';
import { MemberRole, PersonType, MembershipStatus } from '../models/organization.model';
import { DocumentType } from '../models/user.model';

/**
 * Constantes del dominio legal colombiano y configuración de Dokqet
 */
export const LEGAL_CONSTANTS = {
  /** Longitud obligatoria del número de radicado único nacional en Colombia */
  RADICADO_LENGTH: 23,
  /** Longitud máxima permitida para notas internas del expediente */
  NOTES_MAX_LENGTH: 2000,
  /** Tamaño de página estándar optimizado para paginación de actuaciones en servidor */
  DEFAULT_PAGE_SIZE: 10,
  /** Opciones de tamaño de página disponibles para consultar actuaciones en el backend */
  ACTUACIONES_PAGE_SIZE_OPTIONS: [10, 20, 40] as const,
  /** Días de espera requeridos entre modificaciones de datos fiscales RUT/DIAN */
  ORGANIZATION_COOLDOWN_DAYS: 30,
  /** Tiempo de visualización (en milisegundos) del indicador de copiado exitoso */
  CLIPBOARD_FEEDBACK_DURATION_MS: 2000
} as const;

/**
 * Opciones para selección de parte representada en el proceso judicial
 */
export const REPRESENTED_PARTY_OPTIONS = [
  { value: RepresentedParty.SIN_DEFINIR, label: 'Sin definir' },
  { value: RepresentedParty.DEMANDANTE, label: 'Demandante / Actor' },
  { value: RepresentedParty.DEMANDADO, label: 'Demandado' },
  { value: RepresentedParty.OTRA, label: 'Otra parte / Tercero' }
] as const;

/**
 * Función pura para formatear la parte procesal representada
 */
export function formatRepresentedParty(party?: RepresentedParty | string | null): string {
  switch (party) {
    case RepresentedParty.DEMANDANTE:
      return 'Demandante';
    case RepresentedParty.DEMANDADO:
      return 'Demandado';
    case RepresentedParty.OTRA:
      return 'Otra parte';
    default:
      return 'Sin definir';
  }
}

/**
 * Opciones para roles de miembros en la organización
 */
export const MEMBER_ROLE_OPTIONS = [
  { value: MemberRole.ADMIN, label: 'Administrador' },
  { value: MemberRole.LAWYER, label: 'Abogado litigante' }
] as const;

/**
 * Opciones para tipo de documento de identidad
 */
export const DOCUMENT_TYPE_OPTIONS = [
  { value: DocumentType.CC, label: 'Cédula de Ciudadanía (C.C.)' },
  { value: DocumentType.CE, label: 'Cédula de Extranjería (C.E.)' },
  { value: DocumentType.PASAPORTE, label: 'Pasaporte' }
] as const;

/**
 * Función pura para formatear el tipo de documento
 */
export function formatDocumentType(type?: DocumentType | string | null): string {
  switch (type) {
    case DocumentType.CC:
    case 'CC':
      return 'Cédula de Ciudadanía';
    case DocumentType.CE:
    case 'CE':
      return 'Cédula de Extranjería';
    case DocumentType.PASAPORTE:
    case 'PASAPORTE':
      return 'Pasaporte';
    case 'NIT':
      return 'NIT (Número de Identificación Tributaria)';
    case 'TI':
      return 'Tarjeta de Identidad';
    case 'PPT':
      return 'Permiso por Protección Temporal (PPT)';
    default:
      return type || 'Documento';
  }
}

/**
 * Función pura para formatear el género
 */
export function formatGender(gender?: string | null): string {
  switch (gender) {
    case 'M':
      return 'Masculino';
    case 'F':
      return 'Femenino';
    case 'NB':
      return 'No Binario';
    case 'O':
      return 'Otro';
    case 'NR':
      return 'Prefiere no responder';
    default:
      return gender || 'No especificado';
  }
}

/**
 * Función pura para formatear el motivo de descarte / desvinculación
 */
export function formatDismissalReason(reason?: string | null): string {
  switch (reason) {
    case 'DESCARTADA':
      return 'Instancia descartada';
    case 'DEJO_DE_SEGUIR':
      return 'Dejó de seguir el proceso';
    case 'RADICADO_HOMONIMO':
      return 'Radicado homónimo / No pertenece al cliente';
    case 'PROCESO_TERMINADO':
      return 'Terminación del proceso';
    case 'FIN_DEL_PODER':
      return 'Renuncia o revocatoria de poder';
    default:
      return reason || 'Desvinculado';
  }
}

/**
 * Función pura para formatear el estado de membresía
 */
export function formatMembershipStatus(status?: MembershipStatus | string | null): string {
  switch (status) {
    case MembershipStatus.ACTIVE:
      return 'Activo';
    case MembershipStatus.SUSPENDED:
      return 'Suspendido';
    default:
      return 'Activo';
  }
}

/**
 * Función pura para formatear el rol de un miembro
 */
export function formatMemberRole(role?: MemberRole | string | null): string {
  switch (role) {
    case MemberRole.ADMIN:
      return 'Administrador';
    case MemberRole.LAWYER:
      return 'Abogado litigante';
    default:
      return 'Miembro';
  }
}

/**
 * Opciones para tipo de persona fiscal
 */
export const PERSON_TYPE_OPTIONS = [
  { value: PersonType.NATURAL, label: 'Persona natural' },
  { value: PersonType.JURIDICA, label: 'Persona jurídica' }
] as const;

/**
 * Función pura para formatear tipo de persona
 */
export function formatPersonType(type?: PersonType | string | null): string {
  return type === PersonType.JURIDICA || type === 'JURIDICA' ? 'Persona jurídica' : 'Persona natural';
}

/**
 * Función pura para formatear la categoría de un sujeto procesal
 */
export function formatPartyCategory(category?: PartyCategory | string | null): string {
  switch (category) {
    case PartyCategory.DEMANDANTE:
    case 'DEMANDANTE':
      return 'Demandante';
    case PartyCategory.DEMANDADO:
    case 'DEMANDADO':
      return 'Demandado';
    case PartyCategory.MINISTERIO_PUBLICO:
    case 'MINISTERIO_PUBLICO':
      return 'Ministerio Público';
    case PartyCategory.APODERADO:
    case 'APODERADO':
      return 'Apoderado';
    case PartyCategory.TERCERO:
    case 'TERCERO':
      return 'Tercero interviniente';
    case 'SIN_DEFINIR':
      return 'Sin definir';
    case 'ACCIONANTE':
      return 'Accionante';
    case 'ACCIONADO':
      return 'Accionado';
    case 'VICTIMA':
      return 'Víctima';
    case 'PROCESADO':
      return 'Procesado';
    default:
      return category || 'Sujeto procesal';
  }
}

/**
 * Función pura para extraer las iniciales (1 o 2 letras) de un nombre de usuario
 */
export function extractUserInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'AB';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

/**
 * Función pura para extraer el primer nombre o título de cortesía
 */
export function extractFirstName(name?: string | null, fallback = 'Abogado'): string {
  if (!name || !name.trim()) return fallback;
  return name.trim().split(/\s+/)[0];
}

/**
 * Función pura/asíncrona para copiar texto al portapapeles de manera segura
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text || typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Función pura para formatear el estado de una invitación
 */
export function formatInvitationStatus(status?: string | null): string {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'ACCEPTED':
      return 'Aceptada';
    case 'REJECTED':
      return 'Rechazada';
    case 'CANCELED':
      return 'Cancelada';
    case 'EXPIRED':
      return 'Expirada';
    default:
      return status || 'Pendiente';
  }
}
