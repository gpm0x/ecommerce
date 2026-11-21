import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { StorageService } from './storage.service';
import { SessaoService } from './sessao.service';
import { ProdutosService } from './produtos.service';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import { Cupom, ItemCarrinho } from '../models';
import { somarItem } from '../utils/loja.utils';

const CHAVE_VISITANTE = 'verso_carrinho_visitante';

/* ===== CARRINHO =====
   Logado: coleção "carrinhos" do api/db.json — { id: <id do usuário>, itens: [...] }.
   Visitante: localStorage. Ao entrar, as peças do visitante passam para a conta.
   A tela muda na hora (signal) e a gravação na API acontece logo em seguida. */
@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private storage = inject(StorageService);
  private sessao = inject(SessaoService);
  private produtos = inject(ProdutosService);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly itens = signal<ItemCarrinho[]>([]);
  // gravações em fila, uma de cada vez, para não chegarem fora de ordem
  private fila: Promise<unknown> = Promise.resolve();

  readonly quantidadeTotal = computed(() => this.itens().reduce((total, i) => total + i.quantidade, 0));

  readonly subtotal = computed(() => this.itens().reduce((total, item) => {
    const produto = this.produtos.buscar(item.idProduto);
    return produto ? total + produto.preco * item.quantidade : total;
  }, 0));

  constructor() {
    // entrou, saiu ou trocou de conta -> carrega o carrinho certo
    effect(() => {
      const id = this.sessao.idUsuario();
      untracked(() => this.carregar(id));
    });
  }

  private async carregar(id: number | null): Promise<void> {
    const doVisitante = this.storage.ler<ItemCarrinho[]>(CHAVE_VISITANTE) || [];
    if (id === null) {
      this.itens.set(doVisitante);
      return;
    }
    try {
      await this.fila;
      const doc = await this.api.buscar<{ id: number; itens: ItemCarrinho[] }>('carrinhos', id);
      const itens = doc?.itens ?? [];
      if (doVisitante.length) {
        doVisitante.forEach(i => somarItem(itens, i.idProduto, i.tamanho, i.quantidade));
        this.storage.apagar(CHAVE_VISITANTE);
        this.salvar(itens);
      } else {
        this.itens.set(itens);
      }
    } catch {
      this.itens.set([]);
    }
  }

  private salvar(itens: ItemCarrinho[]): void {
    this.itens.set(itens);
    const id = this.sessao.idUsuario();
    if (id === null) {
      this.storage.salvar(CHAVE_VISITANTE, itens);
      return;
    }
    this.fila = this.fila
      .then(() => this.api.salvar('carrinhos', { id, itens }))
      .catch(() => this.toast.mostrar('Não foi possível salvar o carrinho na API.'));
  }

  // REQUISITO 2: adicionar item na base
  adicionar(idProduto: number, tamanho: string, quantidade: number): void {
    this.salvar(somarItem(this.copia(), idProduto, tamanho, quantidade));
  }

  // REQUISITO 2: remover item da base
  remover(posicao: number): void {
    const itens = this.copia();
    itens.splice(posicao, 1);
    this.salvar(itens);
  }

  mudarQuantidade(posicao: number, passo: number): void {
    const itens = this.copia();
    itens[posicao].quantidade = Math.max(1, itens[posicao].quantidade + passo);
    this.salvar(itens);
  }

  limpar(): void {
    this.salvar([]);
  }

  // DIFERENCIAL 9: valida o cupom na coleção "cupons" do db.json
  async aplicarCupom(codigo: string): Promise<Cupom | null> {
    const limpo = codigo.trim().toUpperCase();
    if (!limpo) return null;
    const cupom = await this.api.buscar<{ id: string; porcentagem: number }>('cupons', limpo);
    return cupom ? { codigo: cupom.id, porcentagem: cupom.porcentagem } : null;
  }

  private copia(): ItemCarrinho[] {
    return this.itens().map(i => ({ ...i }));
  }
}
