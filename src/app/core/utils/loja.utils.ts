/* ===== UTILITÁRIOS =====
   Funções puras (sem estado) usadas em vários lugares. */

import { ItemCarrinho, Produto } from '../models';

export function formatarPreco(valor: number): string {
  return 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function doisDigitos(numero: number): string {
  return numero < 10 ? '0' + numero : String(numero);
}

// encodeURI protege contra espaço ou acento no nome de uma imagem nova.
// O caminho é relativo: o <base href="/"> resolve a partir da raiz.
export function urlImagem(caminho: string): string {
  return encodeURI(caminho);
}

export function calcularDesconto(produto: Produto): number {
  if (!produto.precoAntigo || produto.precoAntigo <= produto.preco) return 0;
  return Math.round((1 - produto.preco / produto.precoAntigo) * 100);
}


// Deixa o texto em minúsculo e sem acento: "Tênis" vira "tenis".
const ACENTOS: Record<string, string> = {
  'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a',
  'é': 'e', 'ê': 'e', 'í': 'i',
  'ó': 'o', 'ô': 'o', 'õ': 'o',
  'ú': 'u', 'ü': 'u', 'ç': 'c'
};

export function semAcento(texto: string): string {
  return Array.from(texto.toLowerCase()).map(letra => ACENTOS[letra] || letra).join('');
}

// Se a mesma peça no mesmo tamanho já está no carrinho, só soma a quantidade
export function somarItem(itens: ItemCarrinho[], idProduto: number, tamanho: string, quantidade: number): ItemCarrinho[] {
  const existente = itens.find(i => i.idProduto === idProduto && i.tamanho === tamanho);
  if (existente) existente.quantidade += quantidade;
  else itens.push({ idProduto, tamanho, quantidade });
  return itens;
}
