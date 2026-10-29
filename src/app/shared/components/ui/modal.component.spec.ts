import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create modal component', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBeFalse();
  });

  it('should emit confirmed and cancelled outputs', () => {
    let confirmedEmitted = false;
    let cancelledEmitted = false;

    component.confirmed.subscribe(() => (confirmedEmitted = true));
    component.cancelled.subscribe(() => (cancelledEmitted = true));

    component.onConfirm();
    expect(confirmedEmitted).toBeTrue();

    component.onCancel();
    expect(cancelledEmitted).toBeTrue();
    expect(component.isOpen()).toBeFalse();
  });
});
