/**
 * Modelos de datos para el módulo de Super Administrador, Observabilidad Global (HU-18)
 * y Gestión de Cuentas, Suspensión, Soporte y Auditoría (HU-21 / US-020).
 */

export interface AdminPlatformOverview {
  totalOrganizations: number;
  totalPersonalOrganizations: number;
  totalCollectiveOrganizations: number;
  totalUsers: number;
  totalProcesses: number;
}

export interface AdminOrganizationSummary {
  id: string;
  name: string;
  personType: 'NATURAL' | 'JURIDICA';
  legalName: string | null;
  nit: string | null;
  nitDv: string | null;
  isPersonal: boolean;
  membersCount: number;
  activeMembersCount: number;
  processesCount: number;
  createdAt: string; // ISO 8601 UTC
}

export interface AdminOrganizationDetail extends AdminOrganizationSummary {
  cityId: string | null;
  personalOwnerId: string | null;
  createdById: string | null;
  processVisibility: 'ALL_MEMBERS' | 'OWN_ONLY';
  updatedAt: string;
}

export interface AdminMember {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'LAWYER';
  status: 'ACTIVE' | 'SUSPENDED';
  joinedAt: string;
  lastUsedAt: string | null;
}

export type AdminUserStatusFilter = 'ALL' | 'ACTIVE' | 'UNVERIFIED' | 'SUSPENDED';

export type AdminActionType =
  | 'SUSPEND_USER'
  | 'REACTIVATE_USER'
  | 'GRANT_PLATFORM_ADMIN'
  | 'REVOKE_PLATFORM_ADMIN'
  | 'SEND_PASSWORD_RESET'
  | 'RESEND_VERIFICATION'
  | 'UNLOCK_USER';

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  cityId: string | null;
  emailVerified: boolean;
  isSuperAdmin: boolean;
  isAccountLocked: boolean;
  isSuspended: boolean;
  suspendedAt: string | null; // ISO 8601 UTC
  suspensionType: 'MANUAL' | null;
  lastSignInAt: string | null; // ISO 8601 UTC
  createdAt: string; // ISO 8601 UTC
}

export interface AdminUserOrganization {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  personType: 'NATURAL' | 'JURIDICA' | string;
  isPersonal: boolean;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'LAWYER' | string;
  membershipStatus?: 'ACTIVE' | 'SUSPENDED' | string;
  status?: 'ACTIVE' | 'SUSPENDED' | string;
  joinedAt: string; // ISO 8601 UTC
  lastUsedAt: string | null; // ISO 8601 UTC
}

export interface AdminUserConsent {
  id: string;
  type: 'TERMS' | 'PRIVACY' | string;
  version: string;
  acceptedAt: string; // ISO 8601 UTC
  ipAddress: string | null;
}

export interface AdminAction {
  id: string;
  type: AdminActionType;
  viaCommand: boolean;
  actorId: string | null;
  actorEmail: string | null;
  targetId: string | null;
  targetEmail: string;
  reason: string | null;
  createdAt: string; // ISO 8601 UTC
}

export interface AdminUserDetail {
  id: string;
  email: string;
  name: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  documentType: string;
  documentNumber: string;
  genderCode: string | null;
  cityId: string | null;
  status: 'ACTIVE' | 'UNVERIFIED' | 'SUSPENDED' | string;
  emailVerified: boolean;
  isSuperAdmin: boolean;
  isAccountLocked: boolean;
  lockedUntil: string | null; // ISO 8601 UTC
  isSuspended: boolean;
  suspendedAt: string | null; // ISO 8601 UTC
  suspensionType: 'MANUAL' | null;
  openSessionsCount: number;
  lastSignInAt: string | null; // ISO 8601 UTC
  createdAt: string; // ISO 8601 UTC
  organizations: AdminUserOrganization[];
  consents: AdminUserConsent[];
  adminActions: AdminAction[];
}

export interface AdminUserReasonRequest {
  reason: string;
}

export interface AdminSuperAdminRoleRequest {
  currentPassword: string;
  reason?: string;
}

export interface PageResponse<T> {
  content: T[];
  page?: number;
  pageable?: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  empty: boolean;
}

export interface AdminApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
