import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { RegisterProcessComponent, cleanRadicadoDigits } from './register-process.component';
import { FoundProcess } from '../../../core/models/process.model';

describe('RegisterProcessComponent', () => {
  let component: RegisterProcessComponent;
  let fixture: ComponentFixture<RegisterProcessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterProcessComponent],
      providers: [
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterProcessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the register component', () => {
    expect(component).toBeTruthy();
  });

  describe('cleanRadicadoDigits pure function', () => {
    it('should strip spaces, dots and dashes', () => {
      expect(cleanRadicadoDigits('05001-33-33-000-2013-01577-02')).toBe('05001333300020130157702');
      expect(cleanRadicadoDigits('05001.33.33 000')).toBe('050013333000');
    });

    it('should handle empty or null values', () => {
      expect(cleanRadicadoDigits('')).toBe('');
      expect(cleanRadicadoDigits(null)).toBe('');
    });
  });

  describe('Candidate selection and submission readiness', () => {
    it('should not allow submit when no candidate is selected', () => {
      expect(component.canSubmit()).toBeFalse();
    });

    it('should not allow submit if candidate already exists in organization', () => {
      const mockCandidate: FoundProcess = {
        idProceso: 101,
        idConexion: 1,
        llaveProceso: '05001333300020130157702',
        esPrivado: false,
        alreadyInOrganization: true
      };
      component.selectCandidate(mockCandidate);
      expect(component.canSubmit()).toBeFalse();
    });

    it('should allow submit when valid available candidate is selected', () => {
      const mockCandidate: FoundProcess = {
        idProceso: 102,
        idConexion: 1,
        llaveProceso: '05001333300020130157702',
        esPrivado: false,
        alreadyInOrganization: false
      };
      component.selectCandidate(mockCandidate);
      expect(component.canSubmit()).toBeTrue();
    });
  });
});
