import { Pipe, PipeTransform } from '@angular/core';
import { urlImagem } from '../../core/utils/loja.utils';

// [src]="produto.imagem | img"
@Pipe({ name: 'img' })
export class ImgPipe implements PipeTransform {
  transform(caminho: string): string { return urlImagem(caminho); }
}
