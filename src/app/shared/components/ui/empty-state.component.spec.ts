import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create empty state component', () => {
    expect(component).toBeTruthy();
    expect(component.title()).toBe('No hay elementos');
  });

  it('should emit actionClick when button is clicked', () => {
    let emitted = false;
    component.actionClick.subscribe(() => (emitted = true));
    component.actionClick.emit();
    expect(emitted).toBeTrue();
  });
});
