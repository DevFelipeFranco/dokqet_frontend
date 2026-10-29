export enum PersonType {
  NATURAL = 'NATURAL',
  JURIDICA = 'JURIDICA'
}

export enum MemberRole {
  ADMIN = 'ADMIN',
  LAWYER = 'LAWYER'
}

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum ProcessVisibility {
  ALL_MEMBERS = 'ALL_MEMBERS',
  OWN_ONLY = 'OWN_ONLY'
}

export interface Organization {
  id: string;
  name: string;
  personType: PersonType | string;
  legalName?: string | null;
  nit?: string | null;
  nitDv?: string | null;
  cityId?: string | null;
  isPersonal: boolean;
  isCreator: boolean;
  dataUpdatedAt?: string | null;
  processVisibility: ProcessVisibility;
}

export interface Member {
  userId: string;
  name: string;
  email?: string | null;
  role: MemberRole;
  status: MembershipStatus;
  isCreator: boolean;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  invitedName?: string | null;
  role: MemberRole;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
  invitedByName?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
}
