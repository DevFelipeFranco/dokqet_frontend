import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonCardGridComponent } from './skeleton-card-grid.component';

describe('SkeletonCardGridComponent', () => {
  let component: SkeletonCardGridComponent;
  let fixture: ComponentFixture<SkeletonCardGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonCardGridComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonCardGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create skeleton card grid component', () => {
    expect(component).toBeTruthy();
  });

  it('should generate card items based on count input', () => {
    fixture.componentRef.setInput('count', 4);
    fixture.detectChanges();
    expect(component.items().length).toBe(4);
  });
});

