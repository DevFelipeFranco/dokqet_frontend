import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const DV_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

export function calculateNitCheckDigit(nit: string): string {
  if (!nit) return '';
  const cleanNit = nit.trim();
  if (!/^\d{6,15}$/.test(cleanNit)) return '';

  const digits = cleanNit.split('').reverse().map(Number);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * DV_WEIGHTS[i];
  }
  const remainder = sum % 11;
  return String(remainder < 2 ? remainder : 11 - remainder);
}

export function radicadoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const digits = control.value.replace(/[\s.\-‐‑–—]/g, '');
    return /^\d{23}$/.test(digits) ? null : { invalidRadicado: 'El radicado debe tener exactamente 23 dígitos.' };
  };
}

export function colombianDocumentValidator(typeControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const formGroup = control.parent;
    if (!formGroup) return null;

    const docType = formGroup.get(typeControlName)?.value;
    const val = String(control.value).trim();

    if (docType === 'CC' || docType === 'CE') {
      if (!/^\d{6,10}$/.test(val)) {
        return { invalidDocument: 'Debe contener entre 6 y 10 dígitos numéricos.' };
      }
    } else if (docType === 'PASAPORTE') {
      if (!/^[A-Za-z0-9]{6,20}$/.test(val)) {
        return { invalidDocument: 'Debe contener entre 6 y 20 letras o números.' };
      }
    }
    return null;
  };
}
