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
