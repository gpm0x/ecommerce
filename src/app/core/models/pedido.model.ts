export interface ItemPedido {
  idProduto: number;
  nome: string;
  categoria: string;
  tamanho: string;
  quantidade: number;
  preco: number;
}

export interface Pedido {
  id: number;
  idUsuario: number;
  data: string;
  dataISO?: string;   // usada pelo gráfico de faturamento
  itens: ItemPedido[];
  subtotal: number;
  desconto: number;
  cupom: string;
  total: number;
}
