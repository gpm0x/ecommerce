# VERSO — e-commerce de streetwear

Trabalho acadêmico feito com **HTML, CSS e JavaScript puros**. Sem framework, sem biblioteca, sem build e sem backend. A "base de dados" é o **localStorage** do navegador.

---

## Como abrir

Dê **duplo clique em `index.html`**. É só isso — não precisa instalar nem rodar servidor.

Na primeira visita o site se popula sozinho: cria os 32 produtos, o usuário admin de teste e agenda o drop. Para começar do zero de novo, entre como admin e use **Relatório → Limpar dados da loja**.

## Contas e cupons de teste

| O quê | Valor |
|---|---|
| Admin | `admin@verso.com` / `admin123` |
| Cliente | crie o seu em **pages/login.html → Criar conta** |
| Cupom 10% off | `VERSO10` |
| Cupom 20% off | `DROP20` |
| Frete grátis | pedidos acima de R$ 299 |

---

## Páginas (8)

| Arquivo | `data-pagina` | O que faz |
|---|---|---|
| `index.html` | `home` | Hero, contagem do drop, lançamentos, mais vendidos, coleções, bloco 01–04 |
| `pages/produtos.html` | `catalogo` | Catálogo com busca, filtros, ordenação e "Carregar mais" |
| `pages/produto.html?id=N` | `detalhe` | Foto grande, tamanho, quantidade, relacionados, vistos recentemente |
| `pages/carrinho.html` | `carrinho` | Itens, cupom, barra de frete, fechamento do pedido *(exige login)* |
| `pages/favoritos.html` | `favoritos` | Peças salvas *(exige login)* |
| `pages/login.html` | `login` | Entrar e Criar conta em abas |
| `pages/admin.html` | `admin` | Cadastro e remoção de peças *(exige tipo admin)* |
| `pages/relatorio.html` | `relatorio` | O que está no localStorage *(exige login)* |

O bloco `main.js` (o último do `assets/js/script.js`) lê `document.body.dataset.pagina` e chama só a função daquela página.

---

## Roteiro da apresentação — requisito → onde está

| # | Requisito | Arquivo | Função / trecho |
|---|---|---|---|
| 1 | Formulário de login e cadastro | `pages/login.html` + `assets/js/script.js` (blocos `pages/login.js` e `services/sessao.js`) | `iniciarLogin()`, `fazerLogin()`, `emailValido()` |
| 2 | Adicionar e remover na base | `assets/js/script.js` (blocos `services/produtos.js`, `carrinho.js`, `favoritos.js`) | `adicionarProduto()` / `removerProduto()` (admin), `adicionarAoCarrinho()` / `removerDoCarrinho()`, `alternarFavorito()` |
| 3 | Relatório do armazenado | `pages/relatorio.html` | `iniciarRelatorio()`, `desenharPedidos()`, `desenharUsuarios()` |
| 4 | Manipulação da árvore DOM | `assets/js/script.js` (bloco `ui/render.js`) | `criarCardProduto()` — `createElement`, `appendChild`, `classList`, `textContent`, `remove()` |
| 5 | Home com menu, logo, info e produtos | `index.html` | seção `.manifesto` + `iniciarHome()` |
| 6 | Mínimo de 5 páginas | — | são 8, todas ligadas pelo menu do header |
| 7 | JS além do localStorage | `assets/js/script.js` (blocos `ui/` e `services/`) | busca, validação, `mostrarToast()`, `alternarTema()`, `iniciarContagem()`, menu mobile |

Procure os comentários `// REQUISITO:` e `// DIFERENCIAL:` dentro de `assets/js/script.js` — eles marcam cada ponto.

## Diferenciais → onde está

| # | Diferencial | Onde |
|---|---|---|
| 1 | Responsividade mobile-first | `assets/css/style.css` (bloco RESPONSIVO), blocos de `@media` (480 / 760 / 1000px) |
| 2 | Busca e filtros em tempo real | `iniciarCatalogo()` → `filtrar()` no evento `input` |
| 3 | Contadores no header | `atualizarContadores()` |
| 4 | Rotas protegidas | `exigirLogin()` e `exigirAdmin()` |
| 5 | Toasts no lugar de `alert()` | `mostrarToast()` |
| 6 | Tema claro/escuro persistido | `aplicarTema()` / `alternarTema()` + tokens `[data-tema="escuro"]` |
| 7 | Histórico de pedidos | `salvarPedido()` → tabela em `relatorio.html` |
| 8 | Favoritos por usuário | `chaveFavoritos()` → `verso_favoritos_<idUsuario>` |
| 9 | Cupom de desconto | `aplicarCupom()` + constante `CUPONS` |
| 10 | Barra de frete grátis | `atualizarValores()` dentro de `iniciarCarrinho()` |
| 11 | Contagem regressiva do drop | `iniciarContagem()` com `setInterval` de 1s |
| 12 | Mais vendidos e vistos recentemente | `iniciarHome()` e `registrarVisto()` |
| 13 | Selo de desconto e parcelamento | `calcularDesconto()` e `PARCELAS` |
| 14 | Botão "Carregar mais" | `iniciarCatalogo()`, variável `visiveis` (8 por vez) |
| 15 | Microinterações e animações | `assets/css/style.css` (bloco ANIMACOES) + `assets/js/script.js` (bloco `ui/animacoes.js`) |

---

## A navbar

A navbar é a parte mais "loja de verdade" do projeto. O HTML das 8 páginas só tem o
básico — **todo o resto é montado por JavaScript** com `createElement`, na seção
`// ===== NAVBAR =====` do `assets/js/script.js` (bloco `ui/navbar.js`). Isso evita repetir markup 8 vezes e, de quebra,
é a melhor demonstração do **REQUISITO 4** (manipulação da árvore DOM).

| O que faz | Função | Como funciona |
|---|---|---|
| Barra de progresso de leitura no topo | `montarProgressoScroll()` | `scrollY ÷ altura rolável` vira a largura da barra |
| Risco laranja deslizando sob o menu | `montarIndicadorMenu()` | lê `offsetLeft`/`offsetWidth` do link e move um `<span>` |
| Header some ao descer, volta ao subir | `esconderHeaderAoDescer()` | compara a posição atual com a anterior |
| **Busca com sugestões ao vivo** | `montarSugestoesBusca()` | a cada tecla, filtra e mostra até 5 peças com foto e preço |
| **Mini-carrinho em gaveta lateral** | `montarMiniCarrinho()` | clicar na sacola abre uma gaveta, sem sair da página |
| Menu em tela cheia no celular | `montarMenuMobile()` | o hambúrguer vira X e os links entram em cascata |

Três detalhes bons de mostrar:

- **A busca ignora acento.** Digitar `tenis` acha os 17 tênis. Quem resolve isso é
  `semAcento()`, que percorre letra a letra trocando pelo que está na tabela `ACENTOS`
  — sem regex, como o resto do projeto.
- **A gaveta abre sozinha** quando você adiciona uma peça na página de detalhe,
  mostrando o item e a barra de frete grátis na hora.
- **O carrinho do visitante não se perde.** Se você montar o carrinho sem estar
  logado e depois entrar, `migrarCarrinhoVisitante()` leva as peças para a conta.

## Animações

Toda a parte visual mora nas seções **ANIMAÇÕES** e **NAVBAR AVANÇADA** no fim do
`assets/css/style.css` (blocos ANIMACOES e NAVBAR). O JavaScript nunca anima nada na mão — ele **só troca classe**.

| # | O que acontece | Como é feito |
|---|---|---|
| 1 | Título do hero entra letra por letra | `animarTituloHero()` quebra cada linha em `<span>` com atraso crescente |
| 2 | Foto do hero dá zoom-out | `@keyframes zoomHero` |
| 3 | Blocos sobem conforme você rola | `revelarAoRolar()` com `IntersectionObserver` → classe `.visivel` |
| 4 | Coleções, itens 01–04 e cards do relatório em cascata | `animation-delay` crescente no `:nth-child` |
| 5 | Fade ao trocar de página | `transicaoDeSaida()` → classe `.saindo` |
| 6 | Cabeçalho encolhe e ganha sombra ao rolar | `cabecalhoAoRolar()` → classe `.compacto` |
| 7 | Contador do header pulsa ao adicionar algo | `reanimar(elemento, "pulsa")` |
| 8 | Coração dá um pulo ao favoritar | `reanimar(coracao, "pulo")` |
| 9 | Números do relatório sobem de 0 até o valor | `animarNumero()` com `setInterval` |
| 10 | Sugestões da busca entram uma a uma | `@keyframes entrarSugestao` |
| 11 | Itens da gaveta deslizam da direita | `@keyframes entrarItemGaveta` |
| 12 | Brilho atravessa o botão no hover | `.btn::after` com `transition: left` |
| 13 | Foto do card dá zoom no hover | `.card:hover .card__foto img` |
| 14 | Toast com barra de tempo correndo | `.toast::after` com `@keyframes tempoToast` |
| 15 | Faixa de avisos pausa quando o mouse passa | `animation-play-state: paused` |
| 16 | Logo gira, ícones e categorias sobem no hover | `transform` no `:hover` |

Quatro cuidados que valem mencionar na apresentação:

- **`reanimar()`** existe porque, para repetir uma animação CSS, não basta pôr a classe
  de novo: é preciso tirar, forçar o navegador a recalcular (`void elemento.offsetWidth`)
  e só então devolver.
- **O `main` não usa `animation-fill-mode: both`** de propósito. Animação CSS tem
  prioridade sobre declaração normal — com `both`, o `opacity` ficaria travado em 1
  e o fade de saída da página nunca apareceria.
- **Rede de segurança:** se o `IntersectionObserver` não rodar, um `setTimeout` de 1,5s
  revela tudo. Nunca sobra conteúdo invisível na hora de apresentar.
- Quem liga "reduzir movimento" no sistema recebe o site quase sem animação
  (`@media (prefers-reduced-motion: reduce)`).

---

## Como os dados ficam no localStorage

| Chave | Conteúdo |
|---|---|
| `verso_produtos` | lista de produtos |
| `verso_usuarios` | lista de usuários |
| `verso_sessao` | quem está logado (sem a senha) |
| `verso_carrinho_<idUsuario>` | carrinho daquele usuário |
| `verso_favoritos_<idUsuario>` | ids favoritados |
| `verso_pedidos` | histórico de pedidos |
| `verso_vistos` | últimos 4 produtos abertos |
| `verso_drop_fim` | timestamp do fim da contagem |
| `verso_tema` | `"claro"` ou `"escuro"` |
| `verso_versao` | versão dos dados iniciais; se mudar, o catálogo é recriado |

Tudo passa por duas funções: **`lerStorage(chave)`** e **`salvarStorage(chave, valor)`**.

> **Observação sobre o relatório:** a tabela de usuários e o botão "Limpar dados" aparecem só para o admin. O cliente comum vê os cards de resumo, o catálogo e **apenas os próprios pedidos**.

---

## Imagem → onde foi usada

Todas as **39 imagens** de `assets/img/` estão separadas em duas pastas: **32 em `produtos/`** (uma peça por foto, com o nome do produto) e **7 em `vitrine/`** (hero, banners e blocos).

### Editoriais (7)

| Arquivo | Onde foi usada |
|---|---|
| `vitrine/palco-hero.jpg` | Hero da home |
| `vitrine/drop-fundo.jpeg` | Fundo da contagem regressiva do drop |
| `vitrine/atalho-colecao-asfalto.jpg` | Banner da coleção **Asfalto** |
| `vitrine/tenis-mid-preto-amarelo.jpeg` | Sem uso nas páginas — fica disponível no select do admin |
| `vitrine/estilo-trico.webp` | Banner da coleção **Verão 88** |
| `vitrine/editorial-camiseta-letras.jpeg` | Bloco "Loja pequena, curadoria grande" |
| `vitrine/editorial-tenis-manchas.jpg` | Bloco de confiança 01–04 |

### Produtos (32)

| # | Arquivo | Virou o produto | Categoria |
|---|---|---|---|
| 1 | `produtos/camiseta-ribana-grafica.jpg` | Camiseta Ribana Gráfica | Camisetas |
| 2 | `produtos/camiseta-clube-por-do-sol.webp` | Camiseta Clube Pôr do Sol | Camisetas |
| 3 | `produtos/camiseta-nevoa.webp` | Camiseta Névoa | Camisetas |
| 4 | `produtos/camiseta-gola-neon.jpeg` | Camiseta Gola Néon | Camisetas |
| 5 | `produtos/camiseta-traco-ouro.webp` | Camiseta Traço Ouro | Camisetas |
| 6 | `produtos/camiseta-ringer-contraste.webp` | Camiseta Ringer Contraste | Camisetas |
| 7 | `produtos/camiseta-padronagem-indigo.jpg` | Camiseta Padronagem Índigo | Camisetas |
| 8 | `produtos/camiseta-avenida-noturna.webp` | Camiseta Avenida Noturna | Camisetas |
| 9 | `produtos/jersey-mesh-00.webp` | Jersey Mesh 00 | Camisetas |
| 10 | `produtos/kit-polo-meio-ziper.jpeg` | Kit Polo Meio-Zíper | Camisetas |
| 11 | `produtos/conjunto-trico-damas.jpeg` | Conjunto Tricô Damas | Conjuntos |
| 12 | `produtos/calca-alfaiataria-corte-seco.webp` | Calça Alfaiataria Corte Seco | Calças |
| 13 | `produtos/calca-jeans-wide-rasgada.webp` | Calça Jeans Wide Rasgada | Calças |
| 14 | `produtos/calca-jogger-padronagem.webp` | Calça Jogger Padronagem | Calças |
| 15 | `produtos/slide-monobloco.png` | Slide Monobloco | Chinelos |
| 16 | `produtos/tenis-mid-brasa.webp` | Tênis Mid Brasa | Tênis |
| 17 | `produtos/tenis-low-ceu.webp` | Tênis Low Céu | Tênis |
| 18 | `produtos/tenis-low-sola-leite.png` | Tênis Low Sola Leite | Tênis |
| 19 | `produtos/tenis-low-rubi.jpeg` | Tênis Low Rubi | Tênis |
| 20 | `produtos/tenis-high-taxi.jpeg` | Tênis High Táxi | Tênis |
| 21 | `produtos/tenis-mid-girassol.jpeg` | Tênis Mid Girassol | Tênis |
| 22 | `produtos/tenis-low-mostarda.jpeg` | Tênis Low Mostarda | Tênis |
| 23 | `produtos/tenis-low-universitario.jpeg` | Tênis Low Universitário | Tênis |
| 24 | `produtos/tenis-plataforma-breu.webp` | Tênis Plataforma Breu | Tênis |
| 25 | `produtos/tenis-cadence-marinho.webp` | Tênis Cadence Marinho | Tênis |
| 26 | `produtos/tenis-cadence-areia.jpeg` | Tênis Cadence Areia | Tênis |
| 27 | `produtos/tenis-high-fusao.webp` | Tênis High Fusão | Tênis |
| 28 | `produtos/tenis-low-cromado.webp` | Tênis Low Cromado | Tênis |
| 29 | `produtos/tenis-mid-ametista.webp` | Tênis Mid Ametista | Tênis |
| 30 | `produtos/tenis-high-neblina.webp` | Tênis High Neblina | Tênis |
| 31 | `produtos/tenis-low-royal.webp` | Tênis Low Royal | Tênis |
| 32 | `produtos/tenis-low-camurca-corda.webp` | Tênis Low Camurça Corda | Tênis |

Os arquivos foram renomeados sem espaço nem acento. Mesmo assim toda `<img>` criada pelo JS passa por **`urlImagem()`**, que aplica `encodeURI()` — assim uma imagem nova com espaço no nome não quebra.

---

## Estrutura

```
/
├── index.html              única página na raiz (é a que você abre)
├── pages/                  as outras 7 páginas
│   ├── produtos.html   produto.html    carrinho.html
│   ├── favoritos.html  login.html      admin.html
│   └── relatorio.html
└── assets/
    ├── css/
    │   └── style.css       todo o CSS, em blocos na ordem da cascata
    │                       (tokens → base → componentes → seções → páginas
    │                        → responsivo → animações)
    ├── js/
    │   └── script.js       todo o JS, em blocos: config · storage · seed
    │                       · services · ui · pages · main (sempre por último)
    └── img/
        ├── produtos/       32 fotos, uma por peça
        └── vitrine/        7 fotos editoriais
```

Cada página carrega só **um CSS e um JS**. O `script.js` é um **script comum** (não módulo ES),
então tudo fica no escopo global e o site abre com duplo clique, sem servidor. Cada bloco
é separado por um divisor `#####` com o nome da parte, e o bloco `main.js` no fim decide o que rodar.

### Como os caminhos funcionam

O `index.html` está na raiz e as outras páginas ficam em `pages/`. Para o mesmo
JavaScript servir aos dois níveis, cada página diz onde está no `<body>`:

| Página | Atributo no body |
|---|---|
| `index.html` | `data-pagina="home"` |
| `pages/*.html` | `data-pagina="..."` + `data-raiz="../"` |

O bloco de config, no topo do `assets/js/script.js`, lê isso em duas constantes e monta todo caminho a partir delas:

```js
var RAIZ = document.body.dataset.raiz || "";   // "" na raiz, "../" dentro de pages/
var PASTA_PAGINAS = RAIZ + "pages/";
```

Imagem vira `RAIZ + "assets/img/produtos/x.jpg"` e link de página vira `PASTA_PAGINAS + "produto.html"`.
O resultado é o mesmo abrindo da raiz ou de dentro de `pages/`.

Única dependência externa: **Google Fonts** (Bebas Neue nos títulos, Inter no corpo).
