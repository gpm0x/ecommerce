import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProdutosService } from '../../core/services/produtos.service';
import { Produto } from '../../core/models';
import { POR_PAGINA } from '../../core/config/loja.config';
import { semAcento } from '../../core/utils/loja.utils';
import { CardProdutoComponent } from '../../shared/components/card-produto/card-produto.component';
import { VazioComponent } from '../../shared/components/vazio/vazio.component';
import { RevelarDirective } from '../../shared/directives/revelar.directive';

/* --- CATÁLOGO ---
   DIFERENCIAL 2: busca e filtros em tempo real.
   DIFERENCIAL 14: carregar mais (8 por vez). */
@Component({
  selector: 'app-catalogo',
  imports: [FormsModule, CardProdutoComponent, VazioComponent, RevelarDirective],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.scss',
  // estilos sem encapsulamento: classes como .btn e .card atravessam componentes,
  // como no CSS original
  encapsulation: ViewEncapsulation.None
})
export class CatalogoComponent {
  protected produtos = inject(ProdutosService);

  readonly busca = signal('');
  readonly categoria = signal('');
  readonly colecao = signal('');
  readonly ordem = signal('padrao');
  readonly visiveis = signal(POR_PAGINA);

  // os selects mostram só o que existe no estoque
  readonly categorias = computed(() => this.produtos.listaUnica('categoria'));
  readonly colecoes = computed(() => this.produtos.listaUnica('colecao'));

  readonly resultado = computed(() => {
    const termo = semAcento(this.busca().trim().toLowerCase());
    const lista = this.produtos.lista().filter(p =>
      (termo === '' || semAcento(p.nome + ' ' + p.categoria + ' ' + p.cor + ' ' + p.descricao).includes(termo)) &&
      (this.categoria() === '' || p.categoria === this.categoria()) &&
      (this.colecao() === '' || p.colecao === this.colecao()));
    return ordenar(lista, this.ordem());
  });

  readonly pagina = computed(() => this.resultado().slice(0, this.visiveis()));

  constructor() {
    // filtros vindos da URL (atalhos da home, banners de coleção, busca do header).
    // Assinando o queryParamMap, uma busca nova feita daqui mesmo também vale.
    inject(ActivatedRoute).queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.busca.set(params.get('busca') || '');
      this.categoria.set(params.get('categoria') || '');
      this.colecao.set(params.get('colecao') || '');
      this.ordem.set(params.get('ordem') || 'padrao');
      this.visiveis.set(POR_PAGINA);
    });
  }

  // qualquer filtro mexido volta para a primeira "página"
  reiniciar(): void {
    this.visiveis.set(POR_PAGINA);
  }

  limpar(): void {
    this.busca.set('');
    this.categoria.set('');
    this.colecao.set('');
    this.ordem.set('padrao');
    this.reiniciar();
  }

  carregarMais(): void {
    this.visiveis.update(v => v + POR_PAGINA);
  }
}

function ordenar(lista: Produto[], criterio: string): Produto[] {
  const copia = [...lista];
  if (criterio === 'menor') copia.sort((a, b) => a.preco - b.preco);
  if (criterio === 'maior') copia.sort((a, b) => b.preco - a.preco);
  if (criterio === 'az') copia.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  if (criterio === 'vendidos') copia.sort((a, b) => b.vendidos - a.vendidos);
  return copia;
}
