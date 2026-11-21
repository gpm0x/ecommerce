import { Component, computed, effect, inject, input, signal, untracked, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ProdutosService } from '../../core/services/produtos.service';
import { CarrinhoService } from '../../core/services/carrinho.service';
import { FavoritosService } from '../../core/services/favoritos.service';
import { SessaoService } from '../../core/services/sessao.service';
import { StorageService } from '../../core/services/storage.service';
import { ToastService } from '../../core/services/toast.service';
import { UiService } from '../../core/services/ui.service';
import { FRETE_GRATIS, LOJA, PARCELAS } from '../../core/config/loja.config';
import { calcularDesconto, formatarPreco } from '../../core/utils/loja.utils';
import { CardProdutoComponent } from '../../shared/components/card-produto/card-produto.component';
import { VazioComponent } from '../../shared/components/vazio/vazio.component';
import { QuantidadeComponent } from '../../shared/components/quantidade/quantidade.component';
import { RevelarDirective } from '../../shared/directives/revelar.directive';
import { ImgPipe } from '../../shared/pipes/img.pipe';
import { PrecoPipe } from '../../shared/pipes/preco.pipe';

/* --- DETALHE DO PRODUTO (rota /produto/:id) --- */
@Component({
  selector: 'app-detalhe',
  imports: [RouterLink, CardProdutoComponent, VazioComponent, QuantidadeComponent, RevelarDirective, ImgPipe, PrecoPipe],
  templateUrl: './produto-detalhe.component.html',
  styleUrl: './produto-detalhe.component.scss',
  // estilos sem encapsulamento: classes como .btn e .card atravessam componentes,
  // como no CSS original
  encapsulation: ViewEncapsulation.None
})
export class ProdutoDetalheComponent {
  private produtos = inject(ProdutosService);
  private carrinho = inject(CarrinhoService);
  private favoritos = inject(FavoritosService);
  private storage = inject(StorageService);
  private toast = inject(ToastService);
  private ui = inject(UiService);
  private titulo = inject(Title);
  protected sessao = inject(SessaoService);

  // o :id da rota chega aqui (withComponentInputBinding)
  readonly id = input.required<string>();

  readonly parcelas = PARCELAS;
  readonly entrega = ['Frete grátis acima de ' + formatarPreco(FRETE_GRATIS), 'Troca em até 30 dias', 'Enviado em até 24h úteis'];

  readonly tamanho = signal('');
  readonly quantidade = signal(1);
  readonly aviso = signal('');

  readonly produto = computed(() => this.produtos.buscar(this.id()));
  readonly desconto = computed(() => this.produto() ? calcularDesconto(this.produto()!) : 0);
  readonly favorito = computed(() => this.favoritos.ids().includes(Number(this.id())));

  // Combina com: mesma categoria
  readonly relacionados = computed(() => {
    const atual = this.produto();
    if (!atual) return [];
    return this.produtos.lista().filter(p => p.id !== atual.id && p.categoria === atual.categoria).slice(0, 4);
  });

  // DIFERENCIAL 12: vistos recentemente (sem a peça atual)
  readonly vistos = computed(() => (this.storage.ler<number[]>('verso_vistos') || [])
    .filter(id => id !== Number(this.id()))
    .map(id => this.produtos.buscar(id))
    .filter(p => p !== null));

  constructor() {
    // a cada peça aberta (inclusive clicando num relacionado): zera a escolha,
    // atualiza o título da aba e guarda a peça nos vistos
    effect(() => {
      const id = Number(this.id());
      untracked(() => {
        this.tamanho.set('');
        this.quantidade.set(1);
        this.aviso.set('');
        const produto = this.produtos.buscar(id);
        if (!produto) return;
        this.titulo.setTitle(produto.nome + ' — ' + LOJA);
        this.registrarVisto(id);
      });
    });
  }

  escolherTamanho(valor: string): void {
    this.tamanho.set(valor);
    this.aviso.set('');
  }

  mudarQuantidade(passo: number): void {
    this.quantidade.update(q => Math.max(1, q + passo));
  }

  adicionar(): void {
    const produto = this.produto()!;
    if (!this.tamanho()) {
      this.aviso.set('Escolha um tamanho antes de adicionar.');
      return;
    }
    this.carrinho.adicionar(produto.id, this.tamanho(), this.quantidade());
    this.ui.pulsarCarrinho();
    this.toast.mostrar(produto.nome + ' (' + this.tamanho() + ') no carrinho');
    this.ui.abrirGaveta(); // mostra o mini-carrinho na hora
  }

  alternarFavorito(): void {
    this.favoritos.alternar(this.produto()!.id);
  }

  // guarda os 4 últimos produtos abertos
  private registrarVisto(id: number): void {
    const vistos = (this.storage.ler<number[]>('verso_vistos') || []).filter(v => v !== id);
    vistos.unshift(id);
    this.storage.salvar('verso_vistos', vistos.slice(0, 4));
  }
}
