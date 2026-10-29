import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let component: SkeletonComponent;
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create skeleton component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute default skeleton classes with text variant', () => {
    const classes = component.computedClasses();
    expect(classes).toContain('bg-muted/70');
    expect(classes).toContain('animate-pulse');
    expect(classes).toContain('rounded-md');
  });

  it('should support circular variant', () => {
    fixture.componentRef.setInput('variant', 'circular');
    fixture.detectChanges();
    expect(component.computedClasses()).toContain('rounded-full');
  });

  it('should disable animation when animate is false', () => {
    fixture.componentRef.setInput('animate', false);
    fixture.detectChanges();
    expect(component.computedClasses()).not.toContain('animate-pulse');
  });

  it('should allow custom rounded override', () => {
    fixture.componentRef.setInput('rounded', 'rounded-2xl');
    fixture.detectChanges();
    expect(component.computedClasses()).toContain('rounded-2xl');
  });
});

