import { Component, computed, inject } from '@angular/core';
import { FavoritosService } from '../../core/services/favoritos.service';
import { ProdutosService } from '../../core/services/produtos.service';
import { CardProdutoComponent } from '../../shared/components/card-produto/card-produto.component';
import { VazioComponent } from '../../shared/components/vazio/vazio.component';
import { RevelarDirective } from '../../shared/directives/revelar.directive';

/* --- FAVORITOS (rota protegida: exige login) ---
   A lista é reativa: desfavoritou, o card some na hora. */
@Component({
  selector: 'app-favoritos',
  imports: [CardProdutoComponent, VazioComponent, RevelarDirective],
  templateUrl: './favoritos.component.html'
})
export class FavoritosComponent {
  private favoritos = inject(FavoritosService);
  private produtos = inject(ProdutosService);

  readonly lista = computed(() => this.favoritos.ids()
    .map(id => this.produtos.buscar(id))
    .filter(p => p !== null));
}
