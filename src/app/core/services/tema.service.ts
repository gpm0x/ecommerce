import { Injectable } from '@angular/core';

// A loja tem um único tema (claro). O atributo data-tema continua no <html>
// porque alguns estilos de componentes ainda se apoiam nele.
@Injectable({ providedIn: 'root' })
export class TemaService {
  aplicar(): void {
    document.documentElement.setAttribute('data-tema', 'claro');
  }
}
