import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field.component.html'
})
export class FormFieldComponent {
  /** Etiqueta que flota hacia el borde superior */
  @Input() label = '';
  /** ID para asociar el label con el control del formulario */
  @Input() id = '';
  /** Texto explicativo o de ayuda mostrado bajo el campo */
  @Input() hint = '';
  /** Mensaje de validación o error */
  @Input() error: string | null = null;
  /** Indica si el campo cuenta con icono o prefijo izquierdo */
  @Input() hasPrefix = false;
  /** Indica si el campo cuenta con botón o acción derecha */
  @Input() hasSuffix = false;
  /** Superficie de fondo donde reposa la muesca del label ('card' | 'background') */
  @Input() notchBg: 'card' | 'background' = 'card';
  /** Clases adicionales para el contenedor exterior */
  @Input() className = '';
}

