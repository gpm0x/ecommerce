import { Pipe, PipeTransform } from '@angular/core';
import { doisDigitos } from '../../core/utils/loja.utils';

// {{ 3 | dois }} -> "03"
@Pipe({ name: 'dois' })
export class DoisDigitosPipe implements PipeTransform {
  transform(numero: number): string { return doisDigitos(numero); }
}
