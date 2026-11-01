export enum DocumentType {
  CC = 'CC',
  CE = 'CE',
  PASAPORTE = 'PASAPORTE'
}

export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  documentType: DocumentType | string;
  documentNumber: string;
  genderCode?: string | null;
  cityId?: string | null;
  emailVerified: boolean;
  isSuperAdmin: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  lastFailedLoginAt?: string | null;
  lockReason?: string | null;
  isLocked?: boolean;
}

export interface ProblemDetailAccountLocked {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  success?: boolean;
  message?: string;
  timestamp?: string;
  lockedUntil: string;
  minutesRemaining: number;
}

export interface UserUnlockResponse {
  userId: string;
  email: string;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  isLocked: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  activeOrganizationId: string;
  role: string;
  organizations: OrganizationSummary[];
}

export interface OrganizationSummary {
  id: string;
  name: string;
  role: string;
  isPersonal: boolean;
}

// [HU-20] Respuesta de registro sin tokens PASETO
export interface SignUpResponse {
  email: string;
  requiresEmailVerification?: boolean;
  cooldownSeconds?: number;
  userId?: string;
  emailVerified?: boolean;
  message?: string;
}

// [HU-20] Respuesta de verificación idempotente de correo
export interface VerifyEmailResponse {
  status: 'ACTIVATED' | 'EXPIRED' | 'INVALID' | string;
  message?: string;
  email?: string;
  invitationToken?: string;
}

// [HU-20] Respuesta de Heartbeat de sesión
export interface SessionHeartbeatResponse {
  valid?: boolean;
  active?: boolean;
  sessionId?: string;
  lastActiveAt?: string | null;
  expiresAt?: string | null;
}

// [HU-20] Detalle de error ProblemDetail (RFC 7807 / RFC 9457)
export interface ProblemDetailResponse {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errorCode?: 'EMAIL_NOT_VERIFIED' | 'SESSION_INACTIVE' | 'SESSION_DAILY_CUTOFF' | 'RATE_LIMIT_EXCEEDED' | string;
  retryAfterSeconds?: number;
  retryMinutes?: number;
  verificationResent?: boolean;
  cooldownSeconds?: number;
}
