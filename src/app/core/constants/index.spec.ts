import {
  LEGAL_CONSTANTS,
  REPRESENTED_PARTY_OPTIONS,
  formatRepresentedParty,
  formatMemberRole,
  formatPersonType,
  formatPartyCategory,
  formatDocumentType,
  formatGender,
  formatDismissalReason,
  formatMembershipStatus,
  extractUserInitials,
  extractFirstName,
  copyTextToClipboard
} from './index';
import { RepresentedParty, PartyCategory } from '../models/process.model';
import { MemberRole, PersonType } from '../models/organization.model';

describe('Legal Constants and Pure Utility Functions', () => {
  it('should define core legal constants', () => {
    expect(LEGAL_CONSTANTS.RADICADO_LENGTH).toBe(23);
    expect(LEGAL_CONSTANTS.NOTES_MAX_LENGTH).toBe(2000);
    expect(LEGAL_CONSTANTS.DEFAULT_PAGE_SIZE).toBe(10);
    expect(LEGAL_CONSTANTS.ORGANIZATION_COOLDOWN_DAYS).toBe(30);
  });

  describe('formatRepresentedParty', () => {
    it('should format DEMANDANTE', () => {
      expect(formatRepresentedParty(RepresentedParty.DEMANDANTE)).toBe('Demandante');
    });

    it('should format DEMANDADO', () => {
      expect(formatRepresentedParty(RepresentedParty.DEMANDADO)).toBe('Demandado');
    });

    it('should format OTRA', () => {
      expect(formatRepresentedParty(RepresentedParty.OTRA)).toBe('Otra parte');
    });

    it('should fallback to Sin definir for null, undefined or SIN_DEFINIR', () => {
      expect(formatRepresentedParty(null)).toBe('Sin definir');
      expect(formatRepresentedParty(undefined)).toBe('Sin definir');
      expect(formatRepresentedParty(RepresentedParty.SIN_DEFINIR)).toBe('Sin definir');
    });
  });

  describe('formatMemberRole', () => {
    it('should format ADMIN', () => {
      expect(formatMemberRole(MemberRole.ADMIN)).toBe('Administrador');
    });

    it('should format LAWYER', () => {
      expect(formatMemberRole(MemberRole.LAWYER)).toBe('Abogado litigante');
    });

    it('should fallback to Miembro', () => {
      expect(formatMemberRole(null)).toBe('Miembro');
    });
  });

  describe('formatDocumentType', () => {
    it('should format CC, CE and PASAPORTE', () => {
      expect(formatDocumentType('CC')).toBe('Cédula de Ciudadanía');
      expect(formatDocumentType('CE')).toBe('Cédula de Extranjería');
      expect(formatDocumentType('PASAPORTE')).toBe('Pasaporte');
      expect(formatDocumentType(null)).toBe('Documento');
    });
  });

  describe('formatMembershipStatus', () => {
    it('should format ACTIVE and SUSPENDED', () => {
      expect(formatMembershipStatus('ACTIVE')).toBe('Activo');
      expect(formatMembershipStatus('SUSPENDED')).toBe('Suspendido');
      expect(formatMembershipStatus(null)).toBe('Activo');
    });
  });

  describe('formatPersonType', () => {
    it('should format JURIDICA and NATURAL', () => {
      expect(formatPersonType(PersonType.JURIDICA)).toBe('Persona jurídica');
      expect(formatPersonType(PersonType.NATURAL)).toBe('Persona natural');
      expect(formatPersonType(null)).toBe('Persona natural');
    });
  });

  describe('formatPartyCategory', () => {
    it('should format known categories', () => {
      expect(formatPartyCategory(PartyCategory.DEMANDANTE)).toBe('Demandante');
      expect(formatPartyCategory(PartyCategory.DEMANDADO)).toBe('Demandado');
      expect(formatPartyCategory(PartyCategory.MINISTERIO_PUBLICO)).toBe('Ministerio Público');
      expect(formatPartyCategory(PartyCategory.APODERADO)).toBe('Apoderado');
      expect(formatPartyCategory(PartyCategory.TERCERO)).toBe('Tercero interviniente');
    });
  });

  describe('formatGender', () => {
    it('should format M, F, NB, O, NR', () => {
      expect(formatGender('M')).toBe('Masculino');
      expect(formatGender('F')).toBe('Femenino');
      expect(formatGender('NB')).toBe('No Binario');
      expect(formatGender('O')).toBe('Otro');
      expect(formatGender('NR')).toBe('Prefiere no responder');
      expect(formatGender(null)).toBe('No especificado');
    });
  });

  describe('formatDismissalReason', () => {
    it('should format dismissal reasons', () => {
      expect(formatDismissalReason('DESCARTADA')).toBe('Instancia descartada');
      expect(formatDismissalReason('DEJO_DE_SEGUIR')).toBe('Dejó de seguir el proceso');
      expect(formatDismissalReason('PROCESO_TERMINADO')).toBe('Terminación del proceso');
    });
  });

  describe('extractUserInitials', () => {
    it('should extract first letters of two names', () => {
      expect(extractUserInitials('Carlos Mendoza')).toBe('CM');
    });

    it('should handle single name or fallback', () => {
      expect(extractUserInitials('Abogado')).toBe('AB');
      expect(extractUserInitials('')).toBe('AB');
      expect(extractUserInitials(null)).toBe('AB');
    });
  });

  describe('extractFirstName', () => {
    it('should return first word', () => {
      expect(extractFirstName('Juan Camilo Restrepo')).toBe('Juan');
    });

    it('should fallback for empty strings', () => {
      expect(extractFirstName('')).toBe('Abogado');
      expect(extractFirstName(null, 'Colega')).toBe('Colega');
    });
  });

  describe('copyTextToClipboard', () => {
    it('should return false for empty text', async () => {
      const result = await copyTextToClipboard('');
      expect(result).toBeFalse();
    });
  });
});
