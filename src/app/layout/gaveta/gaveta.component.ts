import { Component, computed, effect, inject, signal, untracked, ViewEncapsulation } from '@angular/core';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CarrinhoService } from '../../core/services/carrinho.service';
import { ProdutosService } from '../../core/services/produtos.service';
import { ToastService } from '../../core/services/toast.service';
import { UiService } from '../../core/services/ui.service';
import { FRETE_GRATIS } from '../../core/config/loja.config';
import { ImgPipe } from '../../shared/pipes/img.pipe';
import { PrecoPipe } from '../../shared/pipes/preco.pipe';

// DIFERENCIAL: mini-carrinho que desliza da direita, sem sair da página.
@Component({
  selector: 'app-gaveta',
  imports: [RouterLink, ImgPipe, PrecoPipe],
  host: { '(document:keydown.escape)': 'ui.fecharGaveta()' },
  templateUrl: './gaveta.component.html',
  styleUrl: './gaveta.component.scss',
  // estilos sem encapsulamento: classes como .btn e .card atravessam componentes,
  // como no CSS original
  encapsulation: ViewEncapsulation.None
})
export class GavetaComponent {
  protected ui = inject(UiService);
  protected carrinho = inject(CarrinhoService);
  private produtos = inject(ProdutosService);
  private toast = inject(ToastService);

  readonly freteGratis = FRETE_GRATIS;
  // sobe a cada abertura: os itens são recriados e a animação de entrada repete
  readonly aberturas = signal(0);

  // junta cada item com o produto dele (peça removida do catálogo some da lista)
  readonly linhas = computed(() => this.carrinho.itens()
    .map((item, posicao) => ({ item, posicao, produto: this.produtos.buscar(item.idProduto)! }))
    .filter(l => l.produto));

  readonly porcentoFrete = computed(() => Math.min(100, Math.round(this.carrinho.subtotal() / FRETE_GRATIS * 100)));

  constructor() {
    // com a gaveta aberta a página atrás não rola
    effect(() => {
      const aberta = this.ui.gavetaAberta();
      document.body.classList.toggle('sem-rolagem', aberta);
      if (aberta) untracked(() => this.aberturas.update(v => v + 1));
    });
    // trocar de página fecha a gaveta
    inject(Router).events.pipe(filter(e => e instanceof NavigationStart), takeUntilDestroyed())
      .subscribe(() => this.ui.fecharGaveta());
  }

  remover(posicao: number): void {
    this.carrinho.remover(posicao);
    this.ui.pulsarCarrinho();
    this.toast.mostrar('Item removido');
  }
}
