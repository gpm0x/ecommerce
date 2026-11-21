import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { SessaoService } from './sessao.service';
import { ProdutosService } from './produtos.service';
import { CarrinhoService } from './carrinho.service';
import { Cupom, ItemPedido, Pedido } from '../models';

/* ===== PEDIDOS =====
   Fonte: coleção "pedidos" do api/db.json. */
@Injectable({ providedIn: 'root' })
export class PedidosService {
  private api = inject(ApiService);
  private sessao = inject(SessaoService);
  private produtos = inject(ProdutosService);
  private carrinho = inject(CarrinhoService);

  readonly lista = signal<Pedido[]>([]);

  async carregar(): Promise<void> {
    this.lista.set(await this.api.listar<Pedido>('pedidos'));
  }

  // DIFERENCIAL 7: histórico de pedidos.
  // Grava o pedido, atualiza vendidos/estoque das peças e esvazia o carrinho.
  async fecharPedido(cupom: Cupom | null): Promise<void> {
    const usuario = this.sessao.usuario();
    if (!usuario) return;

    const itens: ItemPedido[] = [];
    for (const item of this.carrinho.itens()) {
      const produto = this.produtos.buscar(item.idProduto);
      if (!produto) continue;
      itens.push({
        idProduto: produto.id,
        nome: produto.nome,
        categoria: produto.categoria,
        tamanho: item.tamanho,
        quantidade: item.quantidade,
        preco: produto.preco
      });
    }

    const subtotal = itens.reduce((total, i) => total + i.preco * i.quantidade, 0);
    const desconto = cupom ? subtotal * cupom.porcentagem / 100 : 0;
    const agora = new Date();

    // sem id: o json-server numera o pedido (1, 2, 3...)
    const novo = await this.api.criar<Pedido>('pedidos', {
      idUsuario: usuario.id,
      data: agora.toLocaleString('pt-BR'),
      dataISO: agora.toISOString(), // usada pelo gráfico de faturamento
      itens,
      subtotal,
      desconto,
      cupom: cupom ? cupom.codigo : '',
      total: subtotal - desconto
    });
    this.lista.update(lista => [...lista, novo]);

    await this.produtos.registrarVenda(itens);
    this.carrinho.limpar();
  }
}
