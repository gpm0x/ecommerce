import { Component, ElementRef, computed, inject, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarrinhoService } from '../../core/services/carrinho.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { ProdutosService } from '../../core/services/produtos.service';
import { SessaoService } from '../../core/services/sessao.service';
import { ToastService } from '../../core/services/toast.service';
import { Cupom } from '../../core/models';
import { FRETE_GRATIS, VALOR_FRETE } from '../../core/config/loja.config';
import { VazioComponent } from '../../shared/components/vazio/vazio.component';
import { QuantidadeComponent } from '../../shared/components/quantidade/quantidade.component';
import { ReanimarDirective } from '../../shared/directives/reanimar.directive';
import { RevelarDirective } from '../../shared/directives/revelar.directive';
import { ImgPipe } from '../../shared/pipes/img.pipe';
import { PrecoPipe } from '../../shared/pipes/preco.pipe';

/* --- CARRINHO ---
   Visitante pode montar e ver o carrinho; o login só é exigido ao finalizar. */
@Component({
  selector: 'app-carrinho',
  imports: [RouterLink, FormsModule, VazioComponent, QuantidadeComponent, ReanimarDirective, RevelarDirective, ImgPipe, PrecoPipe],
  templateUrl: './carrinho.component.html',
  styleUrl: './carrinho.component.scss',
  // estilos sem encapsulamento: classes como .btn e .card atravessam componentes,
  // como no CSS original
  encapsulation: ViewEncapsulation.None
})
export class CarrinhoComponent {
  protected carrinho = inject(CarrinhoService);
  private pedidos = inject(PedidosService);
  private produtos = inject(ProdutosService);
  private sessao = inject(SessaoService);
  private toast = inject(ToastService);

  private avisoConta = viewChild<ElementRef<HTMLElement>>('avisoConta');

  readonly codigoCupom = signal('');
  readonly cupom = signal<Cupom | null>(null);
  readonly erroCupom = signal('');
  readonly mostrarAvisoConta = signal(false);
  readonly avisoNovo = signal(0);
  readonly finalizando = signal(false); // evita pedido duplicado no clique duplo

  // cada item junto com o produto (null se a peça saiu do catálogo)
  readonly linhas = computed(() => this.carrinho.itens()
    .map((item, posicao) => ({ item, posicao, produto: this.produtos.buscar(item.idProduto) })));

  readonly subtotal = this.carrinho.subtotal;
  readonly desconto = computed(() => this.cupom() ? this.subtotal() * this.cupom()!.porcentagem / 100 : 0);
  readonly freteGratis = computed(() => this.subtotal() >= FRETE_GRATIS);
  readonly frete = computed(() => this.freteGratis() ? 0 : VALOR_FRETE);
  readonly total = computed(() => this.subtotal() - this.desconto() + this.frete());

  // DIFERENCIAL 10: barra de progresso do frete grátis
  readonly falta = computed(() => FRETE_GRATIS - this.subtotal());
  readonly porcentoFrete = computed(() => Math.min(100, Math.round(this.subtotal() / FRETE_GRATIS * 100)));

  mudarQuantidade(posicao: number, passo: number): void {
    this.carrinho.mudarQuantidade(posicao, passo);
  }

  remover(posicao: number): void {
    this.carrinho.remover(posicao);
    this.toast.mostrar('Item removido');
  }

  // DIFERENCIAL 9: cupom de desconto
  async aplicarCupom(evento: Event): Promise<void> {
    evento.preventDefault();
    let cupom: Cupom | null;
    try {
      cupom = await this.carrinho.aplicarCupom(this.codigoCupom());
    } catch {
      this.erroCupom.set('Não foi possível conferir o cupom agora.');
      return;
    }
    this.cupom.set(cupom);
    if (!cupom) {
      this.erroCupom.set('Cupom inválido.');
      return;
    }
    this.erroCupom.set('');
    this.toast.mostrar('Cupom ' + cupom.codigo + ' aplicado (' + cupom.porcentagem + '% off)');
  }

  async finalizar(): Promise<void> {
    if (this.carrinho.itens().length === 0) return;

    // sem conta não fecha pedido: mostra o aviso com "Entrar" e "Criar conta"
    if (!this.sessao.usuario()) {
      this.mostrarAvisoConta.set(true);
      this.avisoNovo.update(v => v + 1);
      setTimeout(() => this.avisoConta()?.nativeElement.focus());
      return;
    }
    this.mostrarAvisoConta.set(false);

    if (this.finalizando()) return;
    this.finalizando.set(true);
    try {
      await this.pedidos.fecharPedido(this.cupom());
    } catch {
      this.toast.mostrar('Não foi possível fechar o pedido. A API está ligada?');
      return;
    } finally {
      this.finalizando.set(false);
    }
    this.cupom.set(null);
    this.codigoCupom.set('');
    this.toast.mostrar('Pedido fechado! Obrigado pela compra.');
  }
}
