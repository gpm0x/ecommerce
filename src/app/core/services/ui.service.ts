import { Injectable, signal } from '@angular/core';

/* Estado de interface compartilhado entre componentes:
   a gaveta do mini-carrinho e os "pulsos" dos contadores do header. */
@Injectable({ providedIn: 'root' })
export class UiService {
  readonly gavetaAberta = signal(false);
  readonly pulsoCarrinho = signal(0);
  readonly pulsoFavoritos = signal(0);

  abrirGaveta(): void { this.gavetaAberta.set(true); }
  fecharGaveta(): void { this.gavetaAberta.set(false); }

  pulsarCarrinho(): void { this.pulsoCarrinho.update(v => v + 1); }
  pulsarFavoritos(): void { this.pulsoFavoritos.update(v => v + 1); }
}
