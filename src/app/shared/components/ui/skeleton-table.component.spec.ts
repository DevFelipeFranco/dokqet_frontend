import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonTableComponent } from './skeleton-table.component';

describe('SkeletonTableComponent', () => {
  let component: SkeletonTableComponent;
  let fixture: ComponentFixture<SkeletonTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create skeleton table component', () => {
    expect(component).toBeTruthy();
  });

  it('should generate rows according to rows input', () => {
    fixture.componentRef.setInput('rows', 3);
    fixture.detectChanges();
    expect(component.rowIndices().length).toBe(3);
  });

  it('should render appropriate variant', () => {
    fixture.componentRef.setInput('variant', 'processes');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('th')?.textContent).toBeDefined();
  });
});

