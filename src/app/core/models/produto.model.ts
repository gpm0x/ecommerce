export interface Produto {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  precoAntigo?: number;
  descricao: string;
  tamanhos: string[];
  cor: string;
  imagem: string;
  destaque: boolean;
  lancamento: boolean;
  vendidos: number;
  estoque?: number;
  colecao: string;
}

// Resumo de uma coleção, montado a partir dos produtos (palco e grade da home)
export interface Colecao {
  nome: string;
  texto: string;
  total: number;
  menorPreco: number;
  categoria: string;
  capa: Produto;
  miniaturas: Produto[];
}
