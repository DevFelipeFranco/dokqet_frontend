import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { OrganizationSwitcherComponent } from './organization-switcher.component';

describe('OrganizationSwitcherComponent', () => {
  let component: OrganizationSwitcherComponent;
  let fixture: ComponentFixture<OrganizationSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationSwitcherComponent],
      providers: [
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationSwitcherComponent);
    component = fixture.componentInstance;
  });

  it('should create the switcher component', () => {
    expect(component).toBeTruthy();
  });

  it('should identify personal organization correctly', () => {
    expect(component.isPersonal({ isPersonal: true, name: 'Mi Despacho' })).toBeTrue();
    expect(component.isPersonal({ isPersonal: false, name: 'Espacio Personal' })).toBeTrue();
    expect(component.isPersonal({ isPersonal: false, name: 'Bufete Jurídico' })).toBeFalse();
    expect(component.isPersonal(null)).toBeFalse();
  });
});
