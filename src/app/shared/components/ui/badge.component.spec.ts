import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create badge component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute default badge classes', () => {
    expect(component.computedClasses()).toContain('bg-primary');
  });

  it('should apply variant class correctly', () => {
    fixture.componentRef.setInput('variant', 'warning');
    fixture.detectChanges();
    expect(component.computedClasses()).toContain('bg-amber-500/15');
  });
});
