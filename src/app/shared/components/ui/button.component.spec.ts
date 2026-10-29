import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create button component', () => {
    expect(component).toBeTruthy();
  });

  it('should not emit buttonClick when disabled or loading', () => {
    let clicked = false;
    component.buttonClick.subscribe(() => (clicked = true));

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    component.onClick(new MouseEvent('click'));
    expect(clicked).toBeFalse();

    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    component.onClick(new MouseEvent('click'));
    expect(clicked).toBeFalse();
  });
});
