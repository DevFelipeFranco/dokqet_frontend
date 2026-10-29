import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserService, UpdateProfilePayload, ChangePasswordPayload } from './user.service';
import { DocumentType, User } from '../models/user.model';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 'usr-1',
    email: 'abogado@dokqet.com',
    name: 'Carlos Gómez',
    firstName: 'Carlos',
    middleName: null,
    lastName: 'Gómez',
    secondLastName: null,
    documentType: DocumentType.CC,
    documentNumber: '10203040',
    emailVerified: true,
    isSuperAdmin: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getProfile should GET /api/v1/users/me', () => {
    service.getProfile().subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.email).toBe('abogado@dokqet.com');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/users/me');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockUser });
  });

  it('updateProfile should PUT /api/v1/users/me', () => {
    const payload: UpdateProfilePayload = {
      firstName: 'Carlos',
      lastName: 'Gómez',
      documentType: DocumentType.CC,
      documentNumber: '10203040'
    };

    service.updateProfile(payload).subscribe(res => {
      expect(res.success).toBeTrue();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/users/me');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true, data: mockUser, message: 'Actualizado' });
  });

  it('changePassword should PUT /api/v1/users/me/password', () => {
    const payload: ChangePasswordPayload = {
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword456'
    };

    service.changePassword(payload).subscribe(res => {
      expect(res.success).toBeTrue();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/users/me/password');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true, message: 'Contraseña cambiada' });
  });

  it('unlockUser should POST /api/v1/users/{id}/unlock', () => {
    const targetUserId = 'usr-target-456';
    service.unlockUser(targetUserId).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.isLocked).toBeFalse();
      expect(res.data.failedLoginAttempts).toBe(0);
      expect(res.data.lockedUntil).toBeNull();
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/v1/users/${targetUserId}/unlock`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({
      success: true,
      message: 'Cuenta de usuario desbloqueada exitosamente.',
      data: {
        userId: targetUserId,
        email: 'abogado.bloqueado@dokqet.com',
        failedLoginAttempts: 0,
        lockedUntil: null,
        isLocked: false
      }
    });
  });
});
