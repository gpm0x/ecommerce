import { Component, computed, inject, input, signal, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Produto } from '../../../core/models';
import { PARCELAS, POR_PAGINA } from '../../../core/config/loja.config';
import { calcularDesconto } from '../../../core/utils/loja.utils';
import { FavoritosService } from '../../../core/services/favoritos.service';
import { DoisDigitosPipe } from '../../pipes/dois-digitos.pipe';
import { ImgPipe } from '../../pipes/img.pipe';
import { PrecoPipe } from '../../pipes/preco.pipe';
import { ReanimarDirective } from '../../directives/reanimar.directive';

// REQUISITO 4: o card de produto, reaproveitado em todas as grades.
//   <article appCardProduto [produto]="p" [posicao]="i + 1" [rank]="i + 1"></article>
@Component({
  selector: 'article[appCardProduto]',
  imports: [RouterLink, PrecoPipe, ImgPipe, DoisDigitosPipe, ReanimarDirective],
  host: {
    class: 'card aparece',
    '[style.animation-delay]': 'atraso()'
  },
  templateUrl: './card-produto.component.html',
  styleUrl: './card-produto.component.scss',
  // estilos sem encapsulamento: classes como .btn e .card atravessam componentes,
  // como no CSS original
  encapsulation: ViewEncapsulation.None
})
export class CardProdutoComponent {
  private favoritos = inject(FavoritosService);

  readonly produto = input.required<Produto>();
  readonly posicao = input(0);
  readonly rank = input<number | null>(null);

  readonly parcelas = PARCELAS;
  readonly pulo = signal(0);
  readonly desconto = computed(() => calcularDesconto(this.produto()));
  readonly favorito = computed(() => this.favoritos.ids().includes(this.produto().id));
  readonly atraso = computed(() => this.posicao() ? (this.posicao() % POR_PAGINA) * 0.04 + 's' : null);

  alternar(): void {
    this.favoritos.alternar(this.produto().id);
    this.pulo.update(v => v + 1);
  }
}
