import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { OrganizationAdminComponent, calculateRemainingCooldownDays } from './organization-admin.component';
import { PersonType, MemberRole } from '../../core/models/organization.model';

describe('OrganizationAdminComponent', () => {
  let component: OrganizationAdminComponent;
  let fixture: ComponentFixture<OrganizationAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationAdminComponent],
      providers: [
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the organization admin component', () => {
    expect(component).toBeTruthy();
  });

  describe('calculateRemainingCooldownDays pure function', () => {
    it('should return 0 when dataUpdatedAt is null or undefined', () => {
      expect(calculateRemainingCooldownDays(null)).toBe(0);
      expect(calculateRemainingCooldownDays(undefined)).toBe(0);
    });

    it('should calculate remaining days when within 30 days window', () => {
      const now = new Date('2026-05-15T12:00:00Z').getTime();
      const updatedTenDaysAgo = new Date('2026-05-05T12:00:00Z').toISOString();
      const remaining = calculateRemainingCooldownDays(updatedTenDaysAgo, 30, now);
      expect(remaining).toBe(20);
    });

    it('should return 0 when 30 days have elapsed', () => {
      const now = new Date('2026-05-15T12:00:00Z').getTime();
      const updatedFortyDaysAgo = new Date('2026-04-01T12:00:00Z').toISOString();
      const remaining = calculateRemainingCooldownDays(updatedFortyDaysAgo, 30, now);
      expect(remaining).toBe(0);
    });
  });

  describe('Pure format delegators', () => {
    it('should format person type and member role', () => {
      expect(component.formatPersonType(PersonType.JURIDICA)).toBe('Persona jurídica');
      expect(component.formatPersonType(PersonType.NATURAL)).toBe('Persona natural');
      expect(component.formatRole(MemberRole.ADMIN)).toBe('Administrador');
      expect(component.formatRole(MemberRole.LAWYER)).toBe('Abogado litigante');
    });
  });
});
