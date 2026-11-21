import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Colecao, Produto } from '../models';
import { semAcento } from '../utils/loja.utils';

interface DescricaoColecao { id: string; descricao: string; }

/* ===== PRODUTOS =====
   Fonte: coleções "produtos" e "colecoes" do api/db.json.
   A lista fica num signal: as telas se atualizam sozinhas a cada mudança. */
@Injectable({ providedIn: 'root' })
export class ProdutosService {
  private api = inject(ApiService);

  readonly lista = signal<Produto[]>([]);
  private readonly descricoes = signal<Record<string, string>>({});
  readonly colecoes = computed(() => agruparColecoes(this.lista(), this.descricoes()));

  async carregar(): Promise<void> {
    const [produtos, colecoes] = await Promise.all([
      this.api.listar<Produto>('produtos'),
      this.api.listar<DescricaoColecao>('colecoes')
    ]);
    this.lista.set(produtos);
    this.descricoes.set(Object.fromEntries(colecoes.map(c => [c.id, c.descricao])));
  }

  buscar(id: number | string | null | undefined): Produto | null {
    return this.lista().find(p => p.id === Number(id)) || null;
  }

  // REQUISITO 2: adicionar, editar e remover elementos da base
  async adicionar(produto: Omit<Produto, 'id'>): Promise<Produto> {
    const novo = await this.api.criar<Produto>('produtos', produto);
    this.lista.update(lista => [...lista, novo]);
    return novo;
  }

  async atualizar(produto: Produto): Promise<void> {
    const salvo = await this.api.atualizar<Produto>('produtos', produto.id, produto);
    this.lista.update(lista => lista.map(p => p.id === salvo.id ? salvo : p));
  }

  async remover(id: number): Promise<void> {
    await this.api.remover('produtos', id);
    this.lista.update(lista => lista.filter(p => p.id !== id));
  }

  // Cada compra alimenta o "mais vendidos" e tira as peças do estoque
  async registrarVenda(itens: { idProduto: number; quantidade: number }[]): Promise<void> {
    for (const item of itens) {
      const produto = this.buscar(item.idProduto);
      if (!produto) continue;
      await this.atualizar({
        ...produto,
        vendidos: produto.vendidos + item.quantidade,
        estoque: typeof produto.estoque === 'number' ? Math.max(0, produto.estoque - item.quantidade) : produto.estoque
      });
    }
  }

  // Valores distintos de um campo (categoria, coleção...), em ordem alfabética
  listaUnica(campo: 'categoria' | 'colecao'): string[] {
    const valores = new Set<string>();
    this.lista().forEach(p => { if (p[campo]) valores.add(p[campo]); });
    return [...valores].sort();
  }

  procurar(termo: string): Produto[] {
    const procurado = semAcento(termo);
    return this.lista().filter(p => semAcento(p.nome + ' ' + p.categoria + ' ' + p.cor).includes(procurado));
  }
}

// Agrupa os produtos por coleção, da mais cheia para a menos cheia.
function agruparColecoes(produtos: Produto[], descricoes: Record<string, string>): Colecao[] {
  const mapa = new Map<string, Produto[]>();
  for (const p of produtos) {
    const nome = (p.colecao || '').trim();
    if (!nome) continue; // peça avulsa não forma coleção
    if (!mapa.has(nome)) mapa.set(nome, []);
    mapa.get(nome)!.push(p);
  }
  return [...mapa.entries()]
    .map(([nome, itens]) => resumirColecao(nome, itens, descricoes[nome]))
    .sort((a, b) => b.total - a.total);
}

// Números que o palco mostra: quantidade, menor preço, categoria predominante, capa e miniaturas.
function resumirColecao(nome: string, itens: Produto[], descricao?: string): Colecao {
  let capa = itens[0];
  let menor = itens[0].preco;
  const categorias: Record<string, number> = {};

  for (const item of itens) {
    if (item.preco < menor) menor = item.preco;
    categorias[item.categoria] = (categorias[item.categoria] || 0) + 1;
    if (item.destaque) capa = item; // a escolha da casa vira capa
  }

  let categoria = '';
  let maior = 0;
  for (const chave in categorias) {
    if (categorias[chave] > maior) { maior = categorias[chave]; categoria = chave; }
  }

  return {
    nome,
    // coleção nova sem descrição no db.json ganha um texto automático
    texto: descricao || 'Recorte novo do catálogo: ' + itens.length + ' peça(s) separadas sob o mesmo nome.',
    total: itens.length,
    menorPreco: menor,
    categoria,
    capa,
    miniaturas: itens.filter(i => i !== capa).slice(0, 3)
  };
}
