import { Pipe, PipeTransform } from '@angular/core';
import { formatarPreco } from '../../core/utils/loja.utils';

// {{ 179.9 | preco }} -> "R$ 179,90"
@Pipe({ name: 'preco' })
export class PrecoPipe implements PipeTransform {
  transform(valor: number): string { return formatarPreco(valor); }
}
