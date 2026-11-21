/* ===== CONFIG ===== */

export const LOJA = 'VERSO';           // nome da loja em uma única constante
export const FRETE_GRATIS = 299;       // valor mínimo para frete grátis (R$)
export const VALOR_FRETE = 24.9;       // frete cobrado abaixo desse valor
export const PARCELAS = 6;             // parcelamento sem juros
export const POR_PAGINA = 8;           // quantos produtos o "Carregar mais" revela
export const DIAS_DO_DROP = 3;         // duração da contagem regressiva
export const ESTOQUE_BAIXO = 5;        // abaixo disso (ou igual) acende o alerta


// Cupons, produtos, coleções e usuários ficam na API: api/db.json

// Arquivos que existem dentro de public/assets/img/ (caminho a partir dela).
// O navegador não consegue listar pastas, então a lista alimenta o <select> do admin.
export const IMAGENS_DISPONIVEIS = [
  'produtos/calca-alfaiataria-corte-seco.webp',
  'produtos/calca-jeans-wide-rasgada.webp',
  'produtos/calca-jogger-padronagem.webp',
  'produtos/camiseta-avenida-noturna.webp',
  'produtos/camiseta-clube-por-do-sol.webp',
  'produtos/camiseta-gola-neon.jpeg',
  'produtos/camiseta-nevoa.webp',
  'produtos/camiseta-padronagem-indigo.jpg',
  'produtos/camiseta-ribana-grafica.jpg',
  'produtos/camiseta-ringer-contraste.webp',
  'produtos/camiseta-traco-ouro.webp',
  'produtos/conjunto-trico-damas.jpeg',
  'produtos/jersey-mesh-00.webp',
  'produtos/kit-polo-meio-ziper.jpeg',
  'produtos/slide-monobloco.png',
  'produtos/tenis-cadence-areia.jpeg',
  'produtos/tenis-cadence-marinho.webp',
  'produtos/tenis-high-fusao.webp',
  'produtos/tenis-high-neblina.webp',
  'produtos/tenis-high-taxi.jpeg',
  'produtos/tenis-low-camurca-corda.webp',
  'produtos/tenis-low-ceu.webp',
  'produtos/tenis-low-cromado.webp',
  'produtos/tenis-low-mostarda.jpeg',
  'produtos/tenis-low-royal.webp',
  'produtos/tenis-low-rubi.jpeg',
  'produtos/tenis-low-sola-leite.png',
  'produtos/tenis-low-universitario.jpeg',
  'produtos/tenis-mid-ametista.webp',
  'produtos/tenis-mid-brasa.webp',
  'produtos/tenis-mid-girassol.jpeg',
  'produtos/tenis-plataforma-breu.webp',
  'vitrine/atalho-colecao-asfalto.jpg',
  'vitrine/drop-fundo.jpeg',
  'vitrine/editorial-camiseta-letras.jpeg',
  'vitrine/editorial-tenis-manchas.jpg',
  'vitrine/estilo-trico.webp',
  'vitrine/palco-hero.jpg',
  'vitrine/tenis-mid-preto-amarelo.jpeg'
];

// ACESSO RÁPIDO (apresentação acadêmica): atalhos para as contas de demonstração
// que já existem em api/db.json. O modal do login só PREENCHE os campos.
export const CONTAS_DEMO = [
  { perfil: 'admin', rotulo: 'Administrador', descricao: 'Dashboard, estoque, pedidos e cadastro de peças.',
    nome: 'Administração VERSO', email: 'admin@verso.com', senha: 'admin123', tipo: 'admin' as const },
  { perfil: 'cliente', rotulo: 'Cliente', descricao: 'Catálogo, favoritos, carrinho e finalização de compra.',
    nome: 'Cliente Demonstração', email: 'cliente@verso.com', senha: 'cliente123', tipo: 'cliente' as const }
];

// Perfis fictícios do botão "Preencher com dados de exemplo".
export const CONSUMIDORES_EXEMPLO = [
  { nome: 'Ana Ribeiro', email: 'ana.ribeiro@email.com', senha: 'Cliente@123' },
  { nome: 'Lucas Ferreira', email: 'lucas.ferreira@email.com', senha: 'Cliente@123' },
  { nome: 'Marina Costa', email: 'marina.costa@email.com', senha: 'Cliente@123' },
  { nome: 'Rafael Souza', email: 'rafael.souza@email.com', senha: 'Cliente@123' },
  { nome: 'Júlia Almeida', email: 'julia.almeida@email.com', senha: 'Cliente@123' }
];
