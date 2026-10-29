import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CatalogService } from './catalog.service';
import {
  CatalogBootstrapDto,
  DocumentTypeDto,
  GenderDto,
  CountryDto,
  DepartmentDto,
  CityDto,
  PersonTypeDto,
  PartyCategoryDto,
  DismissalReasonDto,
  JudicialSpecialtyDto,
  ConsentTypeDto
} from '../models/catalog.model';

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;

  const mockDocumentTypes: DocumentTypeDto[] = [
    { id: '1', code: 'CC', dianCode: '13', name: 'Cédula de Ciudadanía', requiresSecondLastName: true, displayOrder: 1, isActive: true },
    { id: '2', code: 'PPT', dianCode: '47', name: 'Permiso Especial', requiresSecondLastName: false, displayOrder: 2, isActive: true }
  ];

  const mockGenders: GenderDto[] = [
    { id: 'g1', code: 'M', name: 'Masculino', displayOrder: 1, isActive: true },
    { id: 'g2', code: 'F', name: 'Femenino', displayOrder: 2, isActive: true }
  ];

  const mockCountries: CountryDto[] = [
    { id: 'c1', code: 'CO', isoAlpha3: 'COL', name: 'Colombia', phoneCode: '+57', displayOrder: 1, isActive: true }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CatalogService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch active document types from public endpoint', () => {
    service.getDocumentTypes('NATURAL').subscribe(types => {
      expect(types.length).toBe(2);
      expect(types[0].code).toBe('CC');
      expect(types[1].code).toBe('PPT');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/catalogs/document-types?personType=NATURAL');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockDocumentTypes });
  });

  it('should fetch active genders from public endpoint', () => {
    service.getGenders().subscribe(genders => {
      expect(genders.length).toBe(2);
      expect(genders[0].code).toBe('M');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/catalogs/genders');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockGenders });
  });

  it('should fetch departments cascading from country', () => {
    const mockDepts: DepartmentDto[] = [
      { id: 'd1', code: '05', name: 'Antioquia', countryCode: 'CO', displayOrder: 1, isActive: true }
    ];

    service.getDepartmentsByCountry('CO').subscribe(depts => {
      expect(depts.length).toBe(1);
      expect(depts[0].code).toBe('05');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/catalogs/countries/CO/departments');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockDepts });
  });

  it('should fetch cities cascading from department', () => {
    const mockCities: CityDto[] = [
      { id: 'ci1', code: '05001', name: 'Medellín', departmentCode: '05', displayOrder: 1, isActive: true }
    ];

    service.getCitiesByDepartment('05').subscribe(cities => {
      expect(cities.length).toBe(1);
      expect(cities[0].name).toBe('Medellín');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/catalogs/departments/05/cities');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockCities });
  });

  it('should fetch bootstrap catalogs and populate cache', () => {
    const mockBootstrap: CatalogBootstrapDto = {
      documentTypes: mockDocumentTypes,
      genders: mockGenders,
      countries: mockCountries,
      personTypes: [],
      partyCategories: [],
      dismissalReasons: [],
      judicialSpecialties: [],
      consentTypes: []
    };

    service.getBootstrap().subscribe(boot => {
      expect(boot.documentTypes.length).toBe(2);
      expect(service.bootstrap()).toEqual(mockBootstrap);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/catalogs/bootstrap');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockBootstrap });
  });

  it('should update document type status in admin endpoint', () => {
    const updatedDt: DocumentTypeDto = { ...mockDocumentTypes[0], isActive: false };

    service.updateDocumentTypeStatus('1', false).subscribe(result => {
      expect(result.isActive).toBeFalse();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/admin/catalogs/document-types/1/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ isActive: false });
    req.flush({ success: true, data: updatedDt });
  });
});
