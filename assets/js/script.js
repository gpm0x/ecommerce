/* =========================================================
   VERSO — e-commerce de streetwear
   JavaScript puro, sem bibliotecas e sem backend.
   A "base de dados" é o localStorage do navegador.

   Todo o JavaScript do site mora neste arquivo, em blocos
   separados por divisores (#####) e nesta ordem:
     config     caminhos, configurações
     storage    acesso ao localStorage
     seed       dados iniciais da primeira visita
     services   regras da loja: sessão, produtos, carrinho...
     ui         render, animações, navbar e cabeçalho
     pages      o código de cada página (iniciarHome, iniciarCatalogo...)
     main       o ponto de partida — fica por último

   É um script comum (não módulo), então tudo fica no escopo global
   e o site continua abrindo com duplo clique no index.html.
   A ordem dos blocos importa: main sempre por último.
   ========================================================= */


/* ===== CAMINHOS =====
   O index.html fica na raiz e as outras páginas dentro de pages/.
   Cada página avisa onde está pelo atributo data-raiz do <body>:
     index.html      -> data-raiz=""     (já está na raiz)
     pages/*.html    -> data-raiz="../"  (precisa subir um nível)
   Com isso o mesmo JavaScript monta o caminho certo para as imagens e os links.
   (o <script> fica no fim do <body>, então document.body já existe aqui) */

   var RAIZ = document.body.dataset.raiz || "";
   var PASTA_PAGINAS = RAIZ + "pages/";
   
   
   /* ===== CONFIG ===== */
   
   var LOJA = "VERSO";                 // nome da loja em uma única constante
   var FRETE_GRATIS = 299;             // valor mínimo para frete grátis (R$)
   var VALOR_FRETE = 24.9;             // frete cobrado abaixo desse valor
   var PARCELAS = 6;                   // parcelamento sem juros
   var POR_PAGINA = 8;                 // quantos produtos o "Carregar mais" revela
   var DIAS_DO_DROP = 3;               // duração da contagem regressiva
   
   // Cupons aceitos: código -> porcentagem de desconto
   var CUPONS = { "VERSO10": 10, "DROP20": 20 };
   
   // Texto de vitrine de cada coleção. O carrossel do hero e a grade de
   // coleções leem daqui; coleção nova cadastrada no admin ganha um texto
   // automático até alguém escrever o dela.
   var DESCRICOES_COLECAO = {
     "Asfalto": "Preto no preto. O uniforme de quem não quer ser notado — e acaba sendo.",
     "Quadra": "Mesh, número nas costas e cor que grita. Veio do ginásio, ficou na calçada.",
     "Verão 88": "Tricô furadinho, slide e tom claro. Calor com corte caprichado."
   };
   
   // Arquivos que existem dentro de assets/img/ (caminho a partir dela).
   // O JavaScript não consegue listar pastas, então a lista fica aqui
   // e alimenta o <select> de imagem do painel admin.
   var IMAGENS_DISPONIVEIS = [
     "produtos/calca-alfaiataria-corte-seco.webp",
     "produtos/calca-jeans-wide-rasgada.webp",
     "produtos/calca-jogger-padronagem.webp",
     "produtos/camiseta-avenida-noturna.webp",
     "produtos/camiseta-clube-por-do-sol.webp",
     "produtos/camiseta-gola-neon.jpeg",
     "produtos/camiseta-nevoa.webp",
     "produtos/camiseta-padronagem-indigo.jpg",
     "produtos/camiseta-ribana-grafica.jpg",
     "produtos/camiseta-ringer-contraste.webp",
     "produtos/camiseta-traco-ouro.webp",
     "produtos/conjunto-trico-damas.jpeg",
     "produtos/jersey-mesh-00.webp",
     "produtos/kit-polo-meio-ziper.jpeg",
     "produtos/slide-monobloco.png",
     "produtos/tenis-cadence-areia.jpeg",
     "produtos/tenis-cadence-marinho.webp",
     "produtos/tenis-high-fusao.webp",
     "produtos/tenis-high-neblina.webp",
     "produtos/tenis-high-taxi.jpeg",
     "produtos/tenis-low-camurca-corda.webp",
     "produtos/tenis-low-ceu.webp",
     "produtos/tenis-low-cromado.webp",
     "produtos/tenis-low-mostarda.jpeg",
     "produtos/tenis-low-royal.webp",
     "produtos/tenis-low-rubi.jpeg",
     "produtos/tenis-low-sola-leite.png",
     "produtos/tenis-low-universitario.jpeg",
     "produtos/tenis-mid-ametista.webp",
     "produtos/tenis-mid-brasa.webp",
     "produtos/tenis-mid-girassol.jpeg",
     "produtos/tenis-plataforma-breu.webp",
     "vitrine/atalho-colecao-asfalto.jpg",
     "vitrine/drop-fundo.jpeg",
     "vitrine/editorial-camiseta-letras.jpeg",
     "vitrine/editorial-tenis-manchas.jpg",
     "vitrine/estilo-trico.webp",
     "vitrine/palco-hero.jpg",
     "vitrine/tenis-mid-preto-amarelo.jpeg"
   ];
   
   
   /* #########################################################
      core/storage.js
      ######################################################### */
   
   /* ===== STORAGE =====
      Duas funções genéricas usadas em todo o projeto.
      Tudo é gravado como JSON. */
   
   function lerStorage(chave) {
     var bruto = localStorage.getItem(chave);
     if (!bruto) return null;
     try {
       return JSON.parse(bruto);
     } catch (e) {
       return null; // se o valor estiver corrompido, tratamos como vazio
     }
   }
   
   function salvarStorage(chave, valor) {
     localStorage.setItem(chave, JSON.stringify(valor));
   }
   
   function apagarStorage(chave) {
     localStorage.removeItem(chave);
   }
   
   
   /* #########################################################
      data/seed.js
      ######################################################### */
   
   /* ===== SEED (primeira visita) =====
      Cada produto nasceu de uma imagem real de assets/img/produtos/. */
   
   var TAM_ROUPA = ["P", "M", "G", "GG"];
   var TAM_PE = ["38", "39", "40", "41", "42", "43", "44"];
   
   var PRODUTOS_INICIAIS = [
     { id: 1, nome: "Camiseta Ribana Gráfica", categoria: "Camisetas", preco: 179.9, descricao: "Malha pesada preta com ribana contrastante na gola e nos punhos. Caimento solto, ombro caído.", tamanhos: TAM_ROUPA, cor: "Preto", imagem: "assets/img/produtos/camiseta-ribana-grafica.jpg", destaque: true, lancamento: false, vendidos: 94, colecao: "Asfalto" },
     { id: 2, nome: "Camiseta Clube Pôr do Sol", categoria: "Camisetas", preco: 199.9, precoAntigo: 249.9, descricao: "Camiseta branca de algodão com estampa frontal em aquarela de quadra e palmeiras. Peça leve pro calor.", tamanhos: TAM_ROUPA, cor: "Off-white", imagem: "assets/img/produtos/camiseta-clube-por-do-sol.webp", destaque: false, lancamento: true, vendidos: 71, colecao: "Verão 88" },
     { id: 3, nome: "Camiseta Névoa", categoria: "Camisetas", preco: 189.9, descricao: "Padronagem monocromática borrada em cima de base branca. Toque macio e barra reta.", tamanhos: TAM_ROUPA, cor: "Branco", imagem: "assets/img/produtos/camiseta-nevoa.webp", destaque: false, lancamento: false, vendidos: 58, colecao: "" },
     { id: 4, nome: "Camiseta Gola Néon", categoria: "Camisetas", preco: 159.9, descricao: "Preta com lettering colorido aplicado em volta da gola. Simples de frente, barulhenta de perto.", tamanhos: TAM_ROUPA, cor: "Preto", imagem: "assets/img/produtos/camiseta-gola-neon.jpeg", destaque: false, lancamento: false, vendidos: 112, colecao: "Asfalto" },
     { id: 5, nome: "Camiseta Traço Ouro", categoria: "Camisetas", preco: 219.9, descricao: "Base preta com desenho em contorno branco e detalhes dourados ocupando o peito inteiro.", tamanhos: TAM_ROUPA, cor: "Preto", imagem: "assets/img/produtos/camiseta-traco-ouro.webp", destaque: false, lancamento: true, vendidos: 44, colecao: "Asfalto" },
     { id: 6, nome: "Camiseta Ringer Contraste", categoria: "Camisetas", preco: 129.9, precoAntigo: 169.9, descricao: "O básico bem feito: corpo preto, gola e punho brancos. Entra em qualquer combinação.", tamanhos: TAM_ROUPA, cor: "Preto e branco", imagem: "assets/img/produtos/camiseta-ringer-contraste.webp", destaque: false, lancamento: false, vendidos: 138, colecao: "Asfalto" },
     { id: 7, nome: "Camiseta Padronagem Índigo", categoria: "Camisetas", preco: 209.9, descricao: "Fundo off-white com padronagem azul-marinho repetida de ponta a ponta. Gola careca reforçada.", tamanhos: TAM_ROUPA, cor: "Off-white", imagem: "assets/img/produtos/camiseta-padronagem-indigo.jpg", destaque: false, lancamento: false, vendidos: 36, colecao: "" },
     { id: 8, nome: "Camiseta Avenida Noturna", categoria: "Camisetas", preco: 169.9, descricao: "Estampa grande nas costas: arco iluminado, folhagem e céu de madrugada. Frente limpa.", tamanhos: TAM_ROUPA, cor: "Preto", imagem: "assets/img/produtos/camiseta-avenida-noturna.webp", destaque: false, lancamento: true, vendidos: 87, colecao: "Asfalto" },
     { id: 9, nome: "Jersey Mesh 00", categoria: "Camisetas", preco: 259.9, descricao: "Camisa de futebol americano em mesh azul e amarelo, numeração aplicada na frente e nas costas.", tamanhos: TAM_ROUPA, cor: "Azul", imagem: "assets/img/produtos/jersey-mesh-00.webp", destaque: true, lancamento: false, vendidos: 63, colecao: "Quadra" },
     { id: 10, nome: "Kit Polo Meio-Zíper", categoria: "Camisetas", preco: 289.9, precoAntigo: 349.9, descricao: "Duas polas de piquê com gola estampada e fechamento meio-zíper: uma branca e uma preta.", tamanhos: TAM_ROUPA, cor: "Branco e preto", imagem: "assets/img/produtos/kit-polo-meio-ziper.jpeg", destaque: false, lancamento: false, vendidos: 29, colecao: "" },
   
     { id: 11, nome: "Conjunto Tricô Damas", categoria: "Conjuntos", preco: 349.9, descricao: "Camisa e shorts de tricô furadinho branco com faixa quadriculada azul. Vendido como conjunto.", tamanhos: TAM_ROUPA, cor: "Branco e azul", imagem: "assets/img/produtos/conjunto-trico-damas.jpeg", destaque: false, lancamento: true, vendidos: 41, colecao: "Verão 88" },
   
     { id: 12, nome: "Calça Alfaiataria Corte Seco", categoria: "Calças", preco: 249.9, descricao: "Alfaiataria preta com regulagem na cintura e barra acima do tornozelo. Tecido com leve elastano.", tamanhos: TAM_ROUPA, cor: "Preto", imagem: "assets/img/produtos/calca-alfaiataria-corte-seco.webp", destaque: false, lancamento: false, vendidos: 76, colecao: "Asfalto" },
     { id: 13, nome: "Calça Jeans Wide Rasgada", categoria: "Calças", preco: 329.9, precoAntigo: 399.9, descricao: "Jeans claro de modelagem larga com rasgos aplicados na altura da coxa e joelho.", tamanhos: TAM_ROUPA, cor: "Azul claro", imagem: "assets/img/produtos/calca-jeans-wide-rasgada.webp", destaque: false, lancamento: true, vendidos: 52, colecao: "" },
     { id: 14, nome: "Calça Jogger Padronagem", categoria: "Calças", preco: 299.9, descricao: "Jogger de nylon leve com padronagem preta e branca, punho elástico e bolso lateral.", tamanhos: TAM_ROUPA, cor: "Preto e branco", imagem: "assets/img/produtos/calca-jogger-padronagem.webp", destaque: false, lancamento: false, vendidos: 33, colecao: "Asfalto" },
   
     { id: 15, nome: "Slide Monobloco", categoria: "Chinelos", preco: 139.9, descricao: "Slide inteiriço off-white com tira texturizada e solado macio. Veste de casa até a esquina.", tamanhos: TAM_PE, cor: "Off-white", imagem: "assets/img/produtos/slide-monobloco.png", destaque: false, lancamento: false, vendidos: 119, colecao: "Verão 88" },
   
     { id: 16, nome: "Tênis Mid Brasa", categoria: "Tênis", preco: 699.9, descricao: "Cano médio vermelho com painéis pretos e entressola branca. Couro encorpado.", tamanhos: TAM_PE, cor: "Vermelho e preto", imagem: "assets/img/produtos/tenis-mid-brasa.webp", destaque: false, lancamento: false, vendidos: 81, colecao: "Quadra" },
     { id: 17, nome: "Tênis Low Céu", categoria: "Tênis", preco: 749.9, precoAntigo: 899.9, descricao: "Cano baixo azul-claro inteiro, com detalhe vermelho no cadarço. Silhueta limpa.", tamanhos: TAM_PE, cor: "Azul claro", imagem: "assets/img/produtos/tenis-low-ceu.webp", destaque: true, lancamento: false, vendidos: 67, colecao: "Quadra" },
     { id: 18, nome: "Tênis Low Sola Leite", categoria: "Tênis", preco: 429.9, descricao: "Couro preto liso sobre sola branca alta. O par que combina com tudo que é escuro.", tamanhos: TAM_PE, cor: "Preto", imagem: "assets/img/produtos/tenis-low-sola-leite.png", destaque: false, lancamento: false, vendidos: 143, colecao: "Asfalto" },
     { id: 19, nome: "Tênis Low Rubi", categoria: "Tênis", preco: 519.9, descricao: "Cano baixo vermelho e branco com recorte clássico. Cadarço off-white encorpado.", tamanhos: TAM_PE, cor: "Vermelho e branco", imagem: "assets/img/produtos/tenis-low-rubi.jpeg", destaque: false, lancamento: false, vendidos: 58, colecao: "Quadra" },
     { id: 20, nome: "Tênis High Táxi", categoria: "Tênis", preco: 779.9, descricao: "Cano alto amarelo, preto e creme. Forro acolchoado e gravação no cano.", tamanhos: TAM_PE, cor: "Amarelo e preto", imagem: "assets/img/produtos/tenis-high-taxi.jpeg", destaque: false, lancamento: true, vendidos: 49, colecao: "Quadra" },
     { id: 21, nome: "Tênis Mid Girassol", categoria: "Tênis", preco: 659.9, descricao: "Cano médio amarelo com painéis brancos e entressola limpa. Bem confortável de primeira.", tamanhos: TAM_PE, cor: "Amarelo e branco", imagem: "assets/img/produtos/tenis-mid-girassol.jpeg", destaque: false, lancamento: false, vendidos: 38, colecao: "Quadra" },
     { id: 22, nome: "Tênis Low Mostarda", categoria: "Tênis", preco: 699.9, descricao: "Cano baixo amarelo do cabedal à sola, com etiqueta lateral aplicada.", tamanhos: TAM_PE, cor: "Amarelo", imagem: "assets/img/produtos/tenis-low-mostarda.jpeg", destaque: false, lancamento: false, vendidos: 27, colecao: "Quadra" },
     { id: 23, nome: "Tênis Low Universitário", categoria: "Tênis", preco: 589.9, precoAntigo: 679.9, descricao: "Azul-claro com detalhes brancos e sola na mesma cor. Couro liso fácil de limpar.", tamanhos: TAM_PE, cor: "Azul e branco", imagem: "assets/img/produtos/tenis-low-universitario.jpeg", destaque: false, lancamento: false, vendidos: 95, colecao: "Quadra" },
     { id: 24, nome: "Tênis Plataforma Breu", categoria: "Tênis", preco: 639.9, descricao: "All black em nylon com sola plataforma grossa e triângulo metálico na lateral.", tamanhos: TAM_PE, cor: "Preto", imagem: "assets/img/produtos/tenis-plataforma-breu.webp", destaque: false, lancamento: false, vendidos: 44, colecao: "Asfalto" },
     { id: 25, nome: "Tênis Cadence Marinho", categoria: "Tênis", preco: 829.9, descricao: "Chunky com cabedal bege padronado, recortes azul-marinho e sola branca encorpada.", tamanhos: TAM_PE, cor: "Bege e marinho", imagem: "assets/img/produtos/tenis-cadence-marinho.webp", destaque: false, lancamento: true, vendidos: 31, colecao: "" },
     { id: 26, nome: "Tênis Cadence Areia", categoria: "Tênis", preco: 829.9, descricao: "Mesma silhueta chunky do Cadence, em versão mais clara com lateral azul profunda.", tamanhos: TAM_PE, cor: "Areia e marinho", imagem: "assets/img/produtos/tenis-cadence-areia.jpeg", destaque: false, lancamento: false, vendidos: 22, colecao: "" },
     { id: 27, nome: "Tênis High Fusão", categoria: "Tênis", preco: 899.9, descricao: "Cano alto branco com blocos vermelho e amarelo. Couro texturizado e sola preta.", tamanhos: TAM_PE, cor: "Vermelho e amarelo", imagem: "assets/img/produtos/tenis-high-fusao.webp", destaque: false, lancamento: false, vendidos: 55, colecao: "Quadra" },
     { id: 28, nome: "Tênis Low Cromado", categoria: "Tênis", preco: 679.9, descricao: "Painéis em azul metálico espelhado com couro branco e sola translúcida.", tamanhos: TAM_PE, cor: "Azul metálico", imagem: "assets/img/produtos/tenis-low-cromado.webp", destaque: false, lancamento: false, vendidos: 40, colecao: "Quadra" },
     { id: 29, nome: "Tênis Mid Ametista", categoria: "Tênis", preco: 949.9, precoAntigo: 1099.9, descricao: "Branco total com ilhós e detalhes em roxo. Visual de quadra coberta.", tamanhos: TAM_PE, cor: "Branco e roxo", imagem: "assets/img/produtos/tenis-mid-ametista.webp", destaque: true, lancamento: false, vendidos: 61, colecao: "" },
     { id: 30, nome: "Tênis High Neblina", categoria: "Tênis", preco: 1299.9, descricao: "Cano alto azul e creme com acabamento desconstruído e lacre na lateral. Edição contada.", tamanhos: TAM_PE, cor: "Azul e creme", imagem: "assets/img/produtos/tenis-high-neblina.webp", destaque: false, lancamento: true, vendidos: 73, colecao: "" },
     { id: 31, nome: "Tênis Low Royal", categoria: "Tênis", preco: 729.9, descricao: "Azul royal do cabedal à sola, com logo amarelo aplicado na lateral e no cadarço.", tamanhos: TAM_PE, cor: "Azul royal", imagem: "assets/img/produtos/tenis-low-royal.webp", destaque: false, lancamento: false, vendidos: 36, colecao: "Quadra" },
     { id: 32, nome: "Tênis Low Camurça Corda", categoria: "Tênis", preco: 559.9, descricao: "Camurça preta com cadarço de corda grossa e entressola branca. Pisada firme.", tamanhos: TAM_PE, cor: "Preto", imagem: "assets/img/produtos/tenis-low-camurca-corda.webp", destaque: false, lancamento: false, vendidos: 104, colecao: "Asfalto" }
   ];
   
   var USUARIOS_INICIAIS = [
     { id: 1, nome: "Administração VERSO", email: "admin@verso.com", senha: "admin123", tipo: "admin" }
   ];
   
   // Perfis fictícios que o botão "Preencher com dados de exemplo" joga no cadastro.
   // Não são salvos de antemão: só viram conta quando alguém clica em "Criar conta".
   var CONSUMIDORES_EXEMPLO = [
     { nome: "Ana Ribeiro", email: "ana.ribeiro@email.com", senha: "cliente123" },
     { nome: "Lucas Ferreira", email: "lucas.ferreira@email.com", senha: "cliente123" },
     { nome: "Marina Costa", email: "marina.costa@email.com", senha: "cliente123" },
     { nome: "Rafael Souza", email: "rafael.souza@email.com", senha: "cliente123" },
     { nome: "Júlia Almeida", email: "julia.almeida@email.com", senha: "cliente123" }
   ];
   
   // Sobe quando os dados iniciais mudam de formato (ex.: as imagens mudaram
   // de pasta). Quem já tinha visitado o site recebe o catálogo novo.
   var VERSAO_DADOS = 2;
   
   // Cria as chaves que ainda não existem. Roda em toda página.
   function semearDados() {
     if (lerStorage("verso_versao") !== VERSAO_DADOS) {
       salvarStorage("verso_produtos", PRODUTOS_INICIAIS);
       salvarStorage("verso_versao", VERSAO_DADOS);
     }
     if (!lerStorage("verso_produtos")) salvarStorage("verso_produtos", PRODUTOS_INICIAIS);
     if (!lerStorage("verso_usuarios")) salvarStorage("verso_usuarios", USUARIOS_INICIAIS);
     if (!lerStorage("verso_pedidos")) salvarStorage("verso_pedidos", []);
     if (!lerStorage("verso_vistos")) salvarStorage("verso_vistos", []);
     garantirDrop();
   }
   
   // Recria tudo do zero (usado pelo botão "Limpar dados" do relatório).
   function restaurarSeed() {
     var i;
     for (i = localStorage.length - 1; i >= 0; i--) {
       var chave = localStorage.key(i);
       if (chave.indexOf("verso_") === 0 && chave !== "verso_tema") apagarStorage(chave);
     }
     semearDados();
   }
   
   
   /* #########################################################
      services/sessao.js
      ######################################################### */
   
   /* ===== SESSÃO ===== */
   
   function usuarioLogado() {
     return lerStorage("verso_sessao");
   }
   
   function lerUsuarios() {
     return lerStorage("verso_usuarios") || [];
   }
   
   function salvarUsuario(usuario) {
     var usuarios = lerUsuarios();
     usuarios.push(usuario);
     salvarStorage("verso_usuarios", usuarios);
   }
   
   function buscarUsuarioPorEmail(email) {
     var usuarios = lerUsuarios();
     var i;
     for (i = 0; i < usuarios.length; i++) {
       if (usuarios[i].email.toLowerCase() === email.toLowerCase()) return usuarios[i];
     }
     return null;
   }
   
   function fazerLogin(email, senha) {
     var usuario = buscarUsuarioPorEmail(email);
     if (!usuario || usuario.senha !== senha) return false;
     // a sessão guarda só o necessário — nunca a senha
     salvarStorage("verso_sessao", { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo });
     migrarCarrinhoVisitante();
     migrarFavoritosVisitante();
     return true;
   }
   
   // Quem monta o carrinho antes de entrar não perde nada ao fazer login:
   // as peças do "visitante" passam para a conta.
   function migrarCarrinhoVisitante() {
     var doVisitante = lerStorage("verso_carrinho_visitante") || [];
     var i;
     for (i = 0; i < doVisitante.length; i++) {
       adicionarAoCarrinho(doVisitante[i].idProduto, doVisitante[i].tamanho, doVisitante[i].quantidade);
     }
     apagarStorage("verso_carrinho_visitante");
   }
   
   function migrarFavoritosVisitante() {
     var doVisitante = lerStorage("verso_favoritos_visitante") || [];
     var i;
     for (i = 0; i < doVisitante.length; i++) {
       if (!ehFavorito(doVisitante[i])) alternarFavorito(doVisitante[i]);
     }
     apagarStorage("verso_favoritos_visitante");
   }
   
   function fazerLogout() {
     apagarStorage("verso_sessao");
   }
   
   // DIFERENCIAL 4: rotas protegidas
   function exigirLogin() {
     if (usuarioLogado()) return true;
     window.location.href = PASTA_PAGINAS + "login.html?voltar=" + encodeURIComponent(nomeDaPagina());
     return false;
   }
   
   function exigirAdmin() {
     var usuario = usuarioLogado();
     if (usuario && usuario.tipo === "admin") return true;
     if (!usuario) {
       window.location.href = PASTA_PAGINAS + "login.html?voltar=" + encodeURIComponent(nomeDaPagina());
     } else {
       window.location.href = RAIZ + "index.html";
     }
     return false;
   }
   
   function nomeDaPagina() {
     var partes = window.location.pathname.split("/");
     return partes[partes.length - 1] || "index.html";
   }
   
   
   /* #########################################################
      services/produtos.js
      ######################################################### */
   
   /* ===== PRODUTOS ===== */
   
   function lerProdutos() {
     return lerStorage("verso_produtos") || [];
   }
   
   function buscarProduto(id) {
     var produtos = lerProdutos();
     var i;
     for (i = 0; i < produtos.length; i++) {
       if (produtos[i].id === Number(id)) return produtos[i];
     }
     return null;
   }
   
   // REQUISITO 2: adicionar elemento na base
   function adicionarProduto(produto) {
     var produtos = lerProdutos();
     produtos.push(produto);
     salvarStorage("verso_produtos", produtos);
   }
   
   // REQUISITO 2: editar elemento da base (troca o produto de mesmo id)
   function atualizarProduto(produto) {
     var produtos = lerProdutos();
     var i;
     for (i = 0; i < produtos.length; i++) {
       if (produtos[i].id === produto.id) produtos[i] = produto;
     }
     salvarStorage("verso_produtos", produtos);
   }
   
   // REQUISITO 2: remover elemento da base
   function removerProduto(id) {
     var produtos = lerProdutos();
     var restantes = [];
     var i;
     for (i = 0; i < produtos.length; i++) {
       if (produtos[i].id !== Number(id)) restantes.push(produtos[i]);
     }
     salvarStorage("verso_produtos", restantes);
   }
   
   function proximoIdProduto() {
     var produtos = lerProdutos();
     var maior = 0;
     var i;
     for (i = 0; i < produtos.length; i++) {
       if (produtos[i].id > maior) maior = produtos[i].id;
     }
     return maior + 1;
   }
   
   
   /* #########################################################
      services/carrinho.js
      ######################################################### */
   
   /* ===== CARRINHO ===== */
   
   // Cada usuário tem o próprio carrinho: verso_carrinho_<id>
   function chaveCarrinho() {
     var usuario = usuarioLogado();
     return usuario ? "verso_carrinho_" + usuario.id : "verso_carrinho_visitante";
   }
   
   function lerCarrinho() {
     return lerStorage(chaveCarrinho()) || [];
   }
   
   function salvarCarrinho(itens) {
     salvarStorage(chaveCarrinho(), itens);
   }
   
   // REQUISITO 2: adicionar item na base
   function adicionarAoCarrinho(idProduto, tamanho, quantidade) {
     var itens = lerCarrinho();
     var i;
     // se a mesma peça no mesmo tamanho já está lá, só soma a quantidade
     for (i = 0; i < itens.length; i++) {
       if (itens[i].idProduto === idProduto && itens[i].tamanho === tamanho) {
         itens[i].quantidade += quantidade;
         salvarCarrinho(itens);
         return;
       }
     }
     itens.push({ idProduto: idProduto, tamanho: tamanho, quantidade: quantidade });
     salvarCarrinho(itens);
   }
   
   // REQUISITO 2: remover item da base
   function removerDoCarrinho(posicao) {
     var itens = lerCarrinho();
     itens.splice(posicao, 1);
     salvarCarrinho(itens);
   }
   
   function mudarQuantidade(posicao, passo) {
     var itens = lerCarrinho();
     itens[posicao].quantidade += passo;
     if (itens[posicao].quantidade < 1) itens[posicao].quantidade = 1;
     salvarCarrinho(itens);
   }
   
   function calcularSubtotal() {
     var itens = lerCarrinho();
     var total = 0;
     var i;
     for (i = 0; i < itens.length; i++) {
       var produto = buscarProduto(itens[i].idProduto);
       if (produto) total += produto.preco * itens[i].quantidade;
     }
     return total;
   }
   
   function contarItensCarrinho() {
     var itens = lerCarrinho();
     var total = 0;
     var i;
     for (i = 0; i < itens.length; i++) total += itens[i].quantidade;
     return total;
   }
   
   // DIFERENCIAL 9: valida o cupom digitado
   function aplicarCupom(codigo) {
     var limpo = codigo.trim().toUpperCase();
     if (CUPONS[limpo]) return { codigo: limpo, porcentagem: CUPONS[limpo] };
     return null;
   }
   
   
   /* #########################################################
      services/favoritos.js
      ######################################################### */
   
   /* ===== FAVORITOS ===== */
   
   function chaveFavoritos() {
     var usuario = usuarioLogado();
     return usuario ? "verso_favoritos_" + usuario.id : "verso_favoritos_visitante";
   }
   
   function lerFavoritos() {
     return lerStorage(chaveFavoritos()) || [];
   }
   
   function ehFavorito(idProduto) {
     return lerFavoritos().indexOf(idProduto) !== -1;
   }
   
   // REQUISITO 2: adiciona ou remove da base conforme o estado atual
   function alternarFavorito(idProduto) {
     var favoritos = lerFavoritos();
     var posicao = favoritos.indexOf(idProduto);
     if (posicao === -1) {
       favoritos.push(idProduto);
       salvarStorage(chaveFavoritos(), favoritos);
       return true;
     }
     favoritos.splice(posicao, 1);
     salvarStorage(chaveFavoritos(), favoritos);
     return false;
   }
   
   function contarFavoritos() {
     return lerFavoritos().length;
   }
   
   
   /* #########################################################
      services/vistos.js
      ######################################################### */
   
   /* ===== VISTOS RECENTEMENTE ===== */
   
   // DIFERENCIAL 12: guarda os 4 últimos produtos abertos
   function registrarVisto(idProduto) {
     var vistos = lerStorage("verso_vistos") || [];
     var posicao = vistos.indexOf(idProduto);
     if (posicao !== -1) vistos.splice(posicao, 1);
     vistos.unshift(idProduto);
     salvarStorage("verso_vistos", vistos.slice(0, 4));
   }
   
   
   /* #########################################################
      services/drop.js
      ######################################################### */
   
   /* ===== DROP (contagem regressiva) ===== */
   
   // Cria o fim do drop na primeira visita; se já passou, marca um novo.
   function garantirDrop() {
     var fim = lerStorage("verso_drop_fim");
     if (!fim || fim < Date.now()) {
       salvarStorage("verso_drop_fim", Date.now() + DIAS_DO_DROP * 24 * 60 * 60 * 1000);
     }
   }
   
   function doisDigitos(numero) {
     return numero < 10 ? "0" + numero : String(numero);
   }
   
   // DIFERENCIAL 11: atualiza o relógio a cada segundo
   function iniciarContagem(elemento) {
     function tique() {
       var restante = lerStorage("verso_drop_fim") - Date.now();
       if (restante <= 0) {
         garantirDrop();
         restante = lerStorage("verso_drop_fim") - Date.now();
       }
       var segundos = Math.floor(restante / 1000);
       var dias = Math.floor(segundos / 86400);
       var horas = Math.floor((segundos % 86400) / 3600);
       var minutos = Math.floor((segundos % 3600) / 60);
       var segs = segundos % 60;
       elemento.textContent = doisDigitos(dias) + "d " + doisDigitos(horas) + "h " +
                              doisDigitos(minutos) + "m " + doisDigitos(segs) + "s";
     }
     tique();
     setInterval(tique, 1000);
   }
   
   
   /* #########################################################
      services/tema.js
      ######################################################### */
   
   /* ===== TEMA ===== */
   
   // DIFERENCIAL 6: tema claro/escuro guardado no localStorage.
   // A identidade nasceu escura, então esse é o tema de partida.
   function aplicarTema() {
     var tema = lerStorage("verso_tema") || "escuro";
     document.documentElement.setAttribute("data-tema", tema);
   }
   
   function alternarTema() {
     var atual = lerStorage("verso_tema") || "escuro";
     var novo = atual === "claro" ? "escuro" : "claro";
     salvarStorage("verso_tema", novo);
     aplicarTema();
     mostrarToast("Tema " + novo);
   }
   
   
   /* #########################################################
      ui/render.js
      ######################################################### */
   
   /* ===== DOM / RENDER ===== */
   
   function formatarPreco(valor) {
     return "R$ " + valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
   }
   
   // encodeURI protege contra espaço ou acento no nome de uma imagem nova.
   function urlImagem(caminho) {
     return encodeURI(RAIZ + caminho);
   }
   
   function calcularDesconto(produto) {
     if (!produto.precoAntigo || produto.precoAntigo <= produto.preco) return 0;
     return Math.round((1 - produto.preco / produto.precoAntigo) * 100);
   }
   
   // DIFERENCIAL 5: toasts no lugar de alert()
   function mostrarToast(mensagem) {
     var area = document.getElementById("toastArea");
     if (!area) return;
     var toast = document.createElement("div");
     toast.className = "toast";
     toast.textContent = mensagem;
     area.appendChild(toast);
     setTimeout(function () { toast.remove(); }, 3000);
   }
   
   // REQUISITO 4: todo o card é montado com createElement / appendChild / classList
   function criarCardProduto(produto, posicao) {
     var card = document.createElement("article");
     card.className = "card aparece";
     if (posicao) card.style.animationDelay = (posicao % POR_PAGINA) * 0.04 + "s";
   
     var link = document.createElement("a");
     link.className = "card__foto";
     link.href = PASTA_PAGINAS + "produto.html?id=" + produto.id;
   
     var foto = document.createElement("img");
     foto.src = urlImagem(produto.imagem);
     foto.alt = produto.nome + " na cor " + produto.cor;
     foto.loading = "lazy";
     link.appendChild(foto);
   
     var desconto = calcularDesconto(produto);
     if (desconto > 0) {
       var selo = document.createElement("span");
       selo.className = "selo";
       selo.textContent = "-" + desconto + "%";
       link.appendChild(selo);
     }
   
     if (produto.destaque) {
       var seloDestaque = document.createElement("span");
       seloDestaque.className = "selo selo--destaque";
       seloDestaque.textContent = "Escolha da casa";
       link.appendChild(seloDestaque);
     }
   
     // DIFERENCIAL 8: coração de favorito
     var coracao = document.createElement("button");
     coracao.className = "coracao";
     coracao.type = "button";
     coracao.setAttribute("aria-label", "Favoritar " + produto.nome);
     coracao.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5C12 20.5 3.5 14.4 3.5 8.9A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.5 2.5c0 5.5-8.5 11.6-8.5 11.6Z"/></svg>';
     if (ehFavorito(produto.id)) coracao.classList.add("ativo");
     coracao.addEventListener("click", function () {
       var virou = alternarFavorito(produto.id);
       coracao.classList.toggle("ativo", virou);
       atualizarContadores();
       reanimar(coracao, "pulo");
       reanimar(document.getElementById("contadorFavoritos"), "pulsa");
       mostrarToast(virou ? "Salvo nos favoritos" : "Removido dos favoritos");
       // na página de favoritos a peça some da lista na hora
       if (document.body.dataset.pagina === "favoritos" && !virou) card.remove();
     });
   
     var info = document.createElement("div");
     info.className = "card__info";
   
     var categoria = document.createElement("p");
     categoria.className = "card__categoria";
     categoria.textContent = produto.categoria;
   
     var nome = document.createElement("h3");
     nome.className = "card__nome";
     var linkNome = document.createElement("a");
     linkNome.href = PASTA_PAGINAS + "produto.html?id=" + produto.id;
     linkNome.textContent = produto.nome;
     nome.appendChild(linkNome);
   
     var precos = document.createElement("p");
     precos.className = "card__preco";
     if (produto.precoAntigo) {
       var antigo = document.createElement("s");
       antigo.textContent = formatarPreco(produto.precoAntigo);
       precos.appendChild(antigo);
     }
     var atual = document.createElement("strong");
     atual.textContent = formatarPreco(produto.preco);
     precos.appendChild(atual);
   
     var parcela = document.createElement("p");
     parcela.className = "card__parcela";
     parcela.textContent = PARCELAS + "x de " + formatarPreco(produto.preco / PARCELAS);
   
     info.appendChild(categoria);
     info.appendChild(nome);
     info.appendChild(precos);
     info.appendChild(parcela);
   
     card.appendChild(link);
     card.appendChild(coracao);
     card.appendChild(info);
     return card;
   }
   
   // Desenha uma lista de produtos dentro de um container
   function renderizarProdutos(container, produtos, comRanking) {
     container.textContent = ""; // limpa antes de redesenhar
     var i;
     for (i = 0; i < produtos.length; i++) {
       var card = criarCardProduto(produtos[i], i + 1);
       if (comRanking) {
         var rank = document.createElement("span");
         rank.className = "rank";
         rank.textContent = doisDigitos(i + 1);
         card.appendChild(rank);
       }
       container.appendChild(card);
     }
   }
   
   function mostrarVazio(container, mensagem, textoBotao, destino) {
     container.textContent = "";
     var caixa = document.createElement("div");
     caixa.className = "vazio";
     var texto = document.createElement("p");
     texto.textContent = mensagem;
     caixa.appendChild(texto);
     if (textoBotao) {
       var botao = document.createElement("a");
       botao.className = "btn btn--acento";
       botao.href = destino;
       botao.textContent = textoBotao;
       caixa.appendChild(botao);
     }
     container.appendChild(caixa);
   }
   
   function parametroDaUrl(nome) {
     return new URLSearchParams(window.location.search).get(nome) || "";
   }
   
   
   /* #########################################################
      ui/animacoes.js
      ######################################################### */
   
   /* ===== ANIMAÇÕES =====
      Quatro funções pequenas. O CSS faz o movimento; o JS só troca classes. */
   
   // Reinicia uma animação CSS: tira a classe, força o navegador a recalcular
   // e devolve a classe. Sem isso, animar duas vezes seguidas não repete.
   function reanimar(elemento, classe) {
     if (!elemento) return;
     elemento.classList.remove(classe);
     void elemento.offsetWidth; // leitura que obriga o recálculo
     elemento.classList.add(classe);
   }
   
   // DIFERENCIAL: os blocos aparecem conforme entram na tela.
   // O IntersectionObserver avisa quando o bloco ficou visível; aí só marcamos a classe.
   function revelarAoRolar() {
     // se o navegador for antigo, não escondemos nada (a página continua legível)
     if (!("IntersectionObserver" in window)) return;
   
     var seletores = ".secao, .drop, .manifesto, .confianca, .cabecalho-pagina," +
                     " .detalhe, .carrinho, .caixa-conta, .admin__form, .admin__tabela," +
                     " .resumo-cards, .bloco-tabela, .zona-perigo";
     var blocos = document.querySelectorAll(seletores);
     var i;
     for (i = 0; i < blocos.length; i++) blocos[i].classList.add("revelar");
   
     var observador = new IntersectionObserver(function (entradas) {
       var j;
       for (j = 0; j < entradas.length; j++) {
         if (!entradas[j].isIntersecting) continue;
         entradas[j].target.classList.add("visivel");
         observador.unobserve(entradas[j].target); // revela uma vez só
       }
     }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
   
     for (i = 0; i < blocos.length; i++) observador.observe(blocos[i]);
   
     // Rede de segurança: se depois de 1,5s nenhum bloco tiver aparecido,
     // é porque o observer não funcionou — então mostramos tudo.
     // Nunca pode sobrar conteúdo invisível no dia da apresentação.
     setTimeout(function () {
       if (document.querySelector(".revelar.visivel")) return;
       var k;
       for (k = 0; k < blocos.length; k++) blocos[k].classList.add("visivel");
     }, 1500);
   }
   
   // DIFERENCIAL: o cabeçalho encolhe e ganha sombra depois de rolar um pouco.
   function cabecalhoAoRolar() {
     var cabecalho = document.querySelector(".cabecalho");
     if (!cabecalho) return;
     window.addEventListener("scroll", function () {
       cabecalho.classList.toggle("compacto", window.scrollY > 40);
     });
   }
   
   // DIFERENCIAL: número do relatório sobe de 0 até o valor final.
   function animarNumero(elemento, valorFinal, ehDinheiro) {
     if (!elemento) return;
     var passos = 30;
     var passo = 0;
     var timer = setInterval(function () {
       passo++;
       var parcial = valorFinal * passo / passos;
       elemento.textContent = ehDinheiro ? formatarPreco(parcial) : Math.round(parcial);
       if (passo >= passos) clearInterval(timer);
     }, 20);
   }
   
   // DIFERENCIAL: títulos grandes entram letra por letra.
   // Quem quebra em letras é dividirEmLetras(), usada pelo palco da home;
   // aqui ficam os títulos escritos direto no HTML das outras páginas.
   function animarTitulos() {
     var titulos = document.querySelectorAll("[data-letras]");
     var i;
     for (i = 0; i < titulos.length; i++) dividirEmLetras(titulos[i], 0.15);
   }
   
   // DIFERENCIAL: a página dá um fade antes de trocar de endereço.
   // Um ouvinte só, no document, pega até os links criados depois.
   function transicaoDeSaida() {
     document.addEventListener("click", function (evento) {
       if (evento.defaultPrevented) return;      // alguém já tratou (gaveta, sair)
       if (evento.metaKey || evento.ctrlKey) return;  // abrir em nova aba
       if (!evento.target.closest) return;
   
       var link = evento.target.closest("a[href]");
       if (!link || link.hasAttribute("data-sem-transicao")) return;
   
       var destino = link.getAttribute("href");
       if (!destino || destino.charAt(0) === "#") return;
       if (destino.indexOf("http") === 0 || link.target === "_blank") return;
   
       evento.preventDefault();
       document.body.classList.add("saindo");
       setTimeout(function () { window.location.href = destino; }, 240);
     });
   }
   
   function iniciarAnimacoes() {
     revelarAoRolar();
     cabecalhoAoRolar();
     animarTitulos();
     transicaoDeSaida();
   }
   
   
   /* #########################################################
      ui/navbar.js
      ######################################################### */
   
   /* ===== NAVBAR =====
      Tudo aqui é montado com createElement e colado no header.
      Assim o HTML das 8 páginas continua idêntico e enxuto.   */
   
   // Guardado aqui para a página de detalhe conseguir abrir a gaveta
   // depois de adicionar uma peça ao carrinho.
   var abrirGaveta = null;
   
   // DIFERENCIAL: barra fina no topo mostrando quanto da página já foi rolado.
   function montarProgressoScroll() {
     var cabecalho = document.querySelector(".cabecalho");
     if (!cabecalho) return;
   
     var barra = document.createElement("span");
     barra.className = "progresso-scroll";
     cabecalho.appendChild(barra);
   
     window.addEventListener("scroll", function () {
       var rolavel = document.body.scrollHeight - window.innerHeight;
       var porcento = rolavel > 0 ? (window.scrollY / rolavel) * 100 : 0;
       barra.style.width = porcento + "%";
     });
   }
   
   // DIFERENCIAL: risco laranja que desliza por baixo do link do menu.
   function montarIndicadorMenu() {
     var menu = document.getElementById("menu");
     if (!menu) return;
   
     var indicador = document.createElement("span");
     indicador.className = "menu__indicador";
     menu.appendChild(indicador);
   
     // offsetLeft/offsetWidth dizem onde o link está dentro do menu.
     // O link da página atual já é uma cápsula ácida, então nele o risco
     // sai de cena para não dobrar a marcação.
     function mover(link) {
       if (link.classList.contains("ativo")) {
         indicador.classList.remove("visivel");
         return;
       }
       indicador.style.left = link.offsetLeft + "px";
       indicador.style.width = link.offsetWidth + "px";
       indicador.classList.add("visivel");
     }
   
     var links = menu.querySelectorAll("a");
     var i;
     for (i = 0; i < links.length; i++) {
       links[i].addEventListener("mouseenter", function () { mover(this); });
     }
   
     // ao tirar o mouse, o risco volta para o link da página atual
     var ativo = menu.querySelector("a.ativo");
     menu.addEventListener("mouseleave", function () {
       if (ativo) mover(ativo);
       else indicador.classList.remove("visivel");
     });
     if (ativo) mover(ativo);
   
     // remede depois que a fonte do Google carrega (o link muda de largura)
     // e sempre que a janela for redimensionada
     function remedir() { if (ativo) mover(ativo); }
     window.addEventListener("load", remedir);
     window.addEventListener("resize", remedir);
   }
   
   // DIFERENCIAL: o header sai de cena ao descer e volta ao subir.
   function esconderHeaderAoDescer() {
     var cabecalho = document.querySelector(".cabecalho");
     var menu = document.getElementById("menu");
     var busca = document.getElementById("buscaTopo");
     if (!cabecalho) return;
   
     var ultimaPosicao = 0;
     window.addEventListener("scroll", function () {
       var posicao = window.scrollY;
   
       // com busca ou menu abertos, o header nunca some
       var ocupado = (busca && !busca.hidden) ||
                     (menu && menu.classList.contains("aberto"));
       if (ocupado) {
         cabecalho.classList.remove("escondido");
         ultimaPosicao = posicao;
         return;
       }
   
       var descendo = posicao > ultimaPosicao && posicao > 260;
       cabecalho.classList.toggle("escondido", descendo);
       ultimaPosicao = posicao;
     });
   }
   
   // DIFERENCIAL: a busca mostra sugestões com foto enquanto você digita.
   function montarSugestoesBusca() {
     var campo = document.getElementById("campoBuscaTopo");
     var form = document.getElementById("buscaTopo");
     if (!campo || !form) return;
   
     var caixa = document.createElement("div");
     caixa.className = "sugestoes";
     form.appendChild(caixa);
   
     function fechar() {
       caixa.classList.remove("aberta");
       caixa.textContent = "";
     }
   
     campo.addEventListener("input", function () {
       var termo = campo.value.trim().toLowerCase();
       caixa.textContent = "";
   
       if (termo.length < 2) { fechar(); return; }
   
       var achados = procurarProdutos(termo).slice(0, 5);
       if (achados.length === 0) {
         var vazio = document.createElement("p");
         vazio.className = "sugestoes__vazio";
         vazio.textContent = "Nada encontrado para “" + campo.value.trim() + "”";
         caixa.appendChild(vazio);
       } else {
         var i;
         for (i = 0; i < achados.length; i++) {
           caixa.appendChild(criarSugestao(achados[i], i));
         }
       }
       caixa.classList.add("aberta");
     });
   
     campo.addEventListener("keydown", function (evento) {
       if (evento.key === "Escape") fechar();
     });
   
     // clicar fora fecha a lista
     document.addEventListener("click", function (evento) {
       if (!form.contains(evento.target)) fechar();
     });
   }
   
   // Deixa o texto em minúsculo e sem acento: "Tênis" vira "tenis".
   // Assim quem digita "tenis" ou "calca" também encontra a peça.
   // Sem regex: percorre letra a letra e troca o que estiver na tabela acima.
   var ACENTOS = {
     "á": "a", "à": "a", "ã": "a", "â": "a",
     "é": "e", "ê": "e", "í": "i",
     "ó": "o", "ô": "o", "õ": "o",
     "ú": "u", "ü": "u", "ç": "c"
   };
   
   function semAcento(texto) {
     var minusculo = texto.toLowerCase();
     var saida = "";
     var i;
     for (i = 0; i < minusculo.length; i++) {
       var letra = minusculo.charAt(i);
       saida += ACENTOS[letra] || letra; // troca se estiver na tabela, senao mantem
     }
     return saida;
   }
   
   function procurarProdutos(termo) {
     var produtos = lerProdutos();
     var procurado = semAcento(termo);
     var achados = [];
     var i;
     for (i = 0; i < produtos.length; i++) {
       var p = produtos[i];
       var texto = semAcento(p.nome + " " + p.categoria + " " + p.cor);
       if (texto.indexOf(procurado) !== -1) achados.push(p);
     }
     return achados;
   }
   
   function criarSugestao(produto, posicao) {
     var link = document.createElement("a");
     link.className = "sugestao";
     link.href = PASTA_PAGINAS + "produto.html?id=" + produto.id;
     link.style.animationDelay = (posicao * 0.05) + "s";
   
     var foto = document.createElement("img");
     foto.src = urlImagem(produto.imagem);
     foto.alt = produto.nome;
     foto.loading = "lazy";
   
     var info = document.createElement("div");
     var nome = document.createElement("strong");
     nome.textContent = produto.nome;
     var preco = document.createElement("span");
     preco.textContent = produto.categoria + " · " + formatarPreco(produto.preco);
     info.appendChild(nome);
     info.appendChild(preco);
   
     link.appendChild(foto);
     link.appendChild(info);
     return link;
   }
   
   // DIFERENCIAL: mini-carrinho que desliza da direita, sem sair da página.
   function montarMiniCarrinho() {
     // na própria página do carrinho a gaveta não faz sentido
     if (document.body.dataset.pagina === "carrinho") return;
   
     var atalho = document.querySelector('.acoes a[href*="carrinho.html"]');
     if (!atalho) return;
   
     var cortina = document.createElement("div");
     cortina.className = "cortina";
     var gaveta = document.createElement("aside");
     gaveta.className = "gaveta";
     gaveta.setAttribute("aria-label", "Resumo do carrinho");
     document.body.appendChild(cortina);
     document.body.appendChild(gaveta);
   
     function fechar() {
       gaveta.classList.remove("aberta");
       cortina.classList.remove("aberta");
       document.body.classList.remove("sem-rolagem");
     }
   
     function abrir() {
       desenharGaveta(gaveta, fechar);
       gaveta.classList.add("aberta");
       cortina.classList.add("aberta");
       document.body.classList.add("sem-rolagem");
     }
   
     abrirGaveta = abrir; // a página de detalhe usa isso depois de adicionar
   
     atalho.setAttribute("data-sem-transicao", "1");
     atalho.addEventListener("click", function (evento) {
       evento.preventDefault(); // abre a gaveta em vez de trocar de página
       abrir();
     });
   
     cortina.addEventListener("click", fechar);
     document.addEventListener("keydown", function (evento) {
       if (evento.key === "Escape") fechar();
     });
   }
   
   function desenharGaveta(gaveta, fechar) {
     gaveta.textContent = "";
   
     // cabeçalho da gaveta
     var topo = document.createElement("div");
     topo.className = "gaveta__topo";
     var titulo = document.createElement("h2");
     titulo.textContent = "Seu carrinho";
     var botaoFechar = document.createElement("button");
     botaoFechar.type = "button";
     botaoFechar.className = "gaveta__fechar";
     botaoFechar.setAttribute("aria-label", "Fechar carrinho");
     botaoFechar.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19"/></svg>';
     botaoFechar.addEventListener("click", fechar);
     topo.appendChild(titulo);
     topo.appendChild(botaoFechar);
     gaveta.appendChild(topo);
   
     var itens = lerCarrinho();
   
     if (itens.length === 0) {
       var vazio = document.createElement("div");
       vazio.className = "gaveta__vazio";
       var texto = document.createElement("p");
       texto.textContent = "Ainda não tem nada aqui.";
       var ir = document.createElement("a");
       ir.className = "btn btn--acento";
       ir.href = PASTA_PAGINAS + "produtos.html";
       ir.textContent = "Ver catálogo";
       vazio.appendChild(texto);
       vazio.appendChild(ir);
       gaveta.appendChild(vazio);
       return;
     }
   
     var lista = document.createElement("div");
     lista.className = "gaveta__lista";
     var i;
     for (i = 0; i < itens.length; i++) {
       (function (item, posicao) {
         var produto = buscarProduto(item.idProduto);
         if (!produto) return;
   
         var linha = document.createElement("article");
         linha.className = "gaveta__item";
         linha.style.animationDelay = (posicao * 0.06) + "s";
   
         var foto = document.createElement("img");
         foto.src = urlImagem(produto.imagem);
         foto.alt = produto.nome;
         foto.loading = "lazy";
   
         var info = document.createElement("div");
         var nome = document.createElement("strong");
         nome.textContent = produto.nome;
         var detalhe = document.createElement("span");
         detalhe.textContent = "Tam " + item.tamanho + " · " + item.quantidade + "x";
         var preco = document.createElement("span");
         preco.className = "gaveta__preco";
         preco.textContent = formatarPreco(produto.preco * item.quantidade);
         info.appendChild(nome);
         info.appendChild(detalhe);
         info.appendChild(preco);
   
         var tirar = document.createElement("button");
         tirar.type = "button";
         tirar.className = "gaveta__tirar";
         tirar.setAttribute("aria-label", "Remover " + produto.nome);
         tirar.textContent = "Remover";
         tirar.addEventListener("click", function () {
           removerDoCarrinho(posicao);
           atualizarContadores();
           reanimar(document.getElementById("contadorCarrinho"), "pulsa");
           desenharGaveta(gaveta, fechar); // redesenha a gaveta na hora
           mostrarToast("Item removido");
         });
   
         linha.appendChild(foto);
         linha.appendChild(info);
         linha.appendChild(tirar);
         lista.appendChild(linha);
       })(itens[i], i);
     }
     gaveta.appendChild(lista);
   
     // rodapé: barra de frete + subtotal + botões
     var subtotal = calcularSubtotal();
     var rodape = document.createElement("div");
     rodape.className = "gaveta__rodape";
   
     var freteTexto = document.createElement("p");
     freteTexto.className = "gaveta__frete";
     freteTexto.textContent = subtotal >= FRETE_GRATIS
       ? "Frete grátis liberado."
       : "Faltam " + formatarPreco(FRETE_GRATIS - subtotal) + " para o frete grátis";
   
     var barra = document.createElement("div");
     barra.className = "frete__barra";
     var progresso = document.createElement("span");
     progresso.style.width = Math.min(100, Math.round(subtotal / FRETE_GRATIS * 100)) + "%";
     barra.appendChild(progresso);
   
     var linhaTotal = document.createElement("div");
     linhaTotal.className = "gaveta__total";
     var rotuloTotal = document.createElement("span");
     rotuloTotal.textContent = "Subtotal";
     var valorTotal = document.createElement("strong");
     valorTotal.textContent = formatarPreco(subtotal);
     linhaTotal.appendChild(rotuloTotal);
     linhaTotal.appendChild(valorTotal);
   
     var irCarrinho = document.createElement("a");
     irCarrinho.className = "btn btn--acento btn--bloco";
     irCarrinho.href = PASTA_PAGINAS + "carrinho.html";
     irCarrinho.textContent = "Fechar pedido";
   
     var continuar = document.createElement("button");
     continuar.type = "button";
     continuar.className = "gaveta__continuar";
     continuar.textContent = "Continuar comprando";
     continuar.addEventListener("click", fechar);
   
     rodape.appendChild(freteTexto);
     rodape.appendChild(barra);
     rodape.appendChild(linhaTotal);
     rodape.appendChild(irCarrinho);
     rodape.appendChild(continuar);
     gaveta.appendChild(rodape);
   }
   
   
   /* #########################################################
      ui/cabecalho.js
      ######################################################### */
   
   /* ===== CABEÇALHO (roda em todas as páginas) ===== */
   
   // DIFERENCIAL 3: contadores do header sempre atualizados
   function atualizarContadores() {
     var carrinho = document.getElementById("contadorCarrinho");
     var favoritos = document.getElementById("contadorFavoritos");
     if (carrinho) carrinho.textContent = contarItensCarrinho();
     if (favoritos) favoritos.textContent = contarFavoritos();
   }
   
   function montarLinkConta() {
     var link = document.getElementById("linkConta");
     if (!link) return;
     var usuario = usuarioLogado();
     if (!usuario) {
       link.textContent = "Entrar";
       link.href = PASTA_PAGINAS + "login.html";
       return;
     }
     link.textContent = usuario.nome.split(" ")[0] + " · sair";
     link.href = "#";
     link.addEventListener("click", function (evento) {
       evento.preventDefault();
       fazerLogout();
       mostrarToast("Você saiu da conta");
       setTimeout(function () { window.location.href = RAIZ + "index.html"; }, 600);
     });
   }
   
   // Relatório e Admin só aparecem no menu para quem é admin.
   // Para o consumidor esses links nem existem na página.
   function montarLinkAdmin() {
     var usuario = usuarioLogado();
     var menu = document.getElementById("menu");
     if (!usuario || usuario.tipo !== "admin" || !menu) return;
     var pagina = document.body.dataset.pagina;
   
     var relatorio = document.createElement("a");
     relatorio.href = PASTA_PAGINAS + "relatorio.html";
     relatorio.textContent = "Relatório";
     if (pagina === "relatorio") relatorio.className = "ativo";
     menu.appendChild(relatorio);
   
     var link = document.createElement("a");
     link.href = PASTA_PAGINAS + "admin.html";
     link.textContent = "Admin";
     link.className = "menu__admin" + (pagina === "admin" ? " ativo" : "");
     menu.appendChild(link);
   }
   
   // O localStorage avisa as OUTRAS abas quando uma chave muda (evento "storage").
   // É assim que o painel do admin, aberto numa aba, fica sabendo da compra
   // que o cliente acabou de finalizar em outra — sem recarregar a página.
   function aoMudarDados(chaves, callback) {
     window.addEventListener("storage", function (evento) {
       if (evento.key === null || chaves.indexOf(evento.key) !== -1) callback(evento.key);
     });
   }
   
   // Números de venda usados pelo painel admin e pelo relatório
   function resumirVendas(pedidos) {
     var resumo = { pedidos: pedidos.length, itens: 0, total: 0, ultimo: null };
     var i, j;
     for (i = 0; i < pedidos.length; i++) {
       resumo.total += pedidos[i].total;
       for (j = 0; j < pedidos[i].itens.length; j++) resumo.itens += pedidos[i].itens[j].quantidade;
     }
     if (pedidos.length > 0) resumo.ultimo = pedidos[pedidos.length - 1];
     return resumo;
   }
   
   // DIFERENCIAL 1: menu hambúrguer no celular (vira tela cheia)
   var ICONE_MENU = '<path d="M3 6h18M3 12h18M3 18h18"/>';
   var ICONE_FECHAR = '<path d="M5 5 19 19M19 5 5 19"/>';
   
   function montarMenuMobile() {
     var botao = document.getElementById("btnMenu");
     var menu = document.getElementById("menu");
     if (!botao || !menu) return;
   
     botao.addEventListener("click", function () {
       var aberto = menu.classList.toggle("aberto");
       botao.setAttribute("aria-expanded", aberto ? "true" : "false");
       // o ícone de hambúrguer vira um X
       botao.querySelector("svg").innerHTML = aberto ? ICONE_FECHAR : ICONE_MENU;
       // com o menu em tela cheia, a página atrás não rola junto
       document.body.classList.toggle("sem-rolagem", aberto);
     });
   }
   
   function montarBuscaTopo() {
     var botao = document.getElementById("btnBusca");
     var form = document.getElementById("buscaTopo");
     var campo = document.getElementById("campoBuscaTopo");
     if (!botao || !form) return;
     botao.addEventListener("click", function () {
       form.hidden = !form.hidden;
       botao.setAttribute("aria-expanded", form.hidden ? "false" : "true");
       if (!form.hidden) campo.focus();
     });
     form.addEventListener("submit", function (evento) {
       evento.preventDefault();
       window.location.href = PASTA_PAGINAS + "produtos.html?busca=" + encodeURIComponent(campo.value);
     });
   }
   
   function montarBotaoTema() {
     var botao = document.getElementById("btnTema");
     if (botao) botao.addEventListener("click", alternarTema);
   }
   
   function montarAno() {
     var ano = document.getElementById("ano");
     if (ano) ano.textContent = new Date().getFullYear();
   }
   
   function montarCabecalho() {
     montarMenuMobile();
     montarBuscaTopo();
     montarBotaoTema();
     montarLinkConta();
     montarLinkAdmin();
     montarAno();
     atualizarContadores();
   
     // peças da navbar montadas por JS (o indicador precisa do link Admin já no lugar)
     montarProgressoScroll();
     montarIndicadorMenu();
     esconderHeaderAoDescer();
     montarSugestoesBusca();
     montarMiniCarrinho();
   }
   
   
   /* #########################################################
      pages/home.js
      ######################################################### */
   
   /* --- HOME --- */
   function iniciarHome() {
     var produtos = lerProdutos();
     var colecoes = agruparColecoes(produtos);
   
     // contagem regressiva do drop
     var relogio = document.getElementById("relogioDrop");
     if (relogio) iniciarContagem(relogio);
   
     // palco: uma cena por coleção da loja
     var palco = document.getElementById("palco");
     if (palco) montarPalco(palco, produtos, colecoes);
   
     var grade = document.getElementById("gradeColecoes");
     if (grade) montarGradeColecoes(grade, colecoes);
   
     var atalhos = document.getElementById("atalhosCarrossel");
     if (atalhos) iniciarCarrosselAtalhos(atalhos);
   
     // Lançamentos
     var lancamentos = [];
     var i;
     for (i = 0; i < produtos.length; i++) {
       if (produtos[i].lancamento) lancamentos.push(produtos[i]);
     }
     if (lancamentos.length === 0) lancamentos = produtos.slice(0, 8);
     renderizarProdutos(document.getElementById("gradeLancamentos"), lancamentos.slice(0, 8), false);
   
     // Mais vendidos da semana (ordenado por vendidos, com ranking)
     var vendidos = produtos.slice();
     vendidos.sort(function (a, b) { return b.vendidos - a.vendidos; });
     renderizarProdutos(document.getElementById("gradeVendidos"), vendidos.slice(0, 4), true);
   }
   
   /* ===== PALCO DA HOME =====
      O hero é montado por JS a partir das coleções que existem
      de verdade no catálogo. Cadastrou uma coleção nova no admin?
      Ela aparece aqui sozinha, sem mexer no HTML.                */
   
   // Agrupa os produtos por coleção, da mais cheia para a menos cheia.
   function agruparColecoes(produtos) {
     var mapa = {};
     var ordem = [];
     var i;
   
     for (i = 0; i < produtos.length; i++) {
       var nome = (produtos[i].colecao || "").trim();
       if (!nome) continue;                      // peça avulsa não forma coleção
       if (!mapa[nome]) { mapa[nome] = []; ordem.push(nome); }
       mapa[nome].push(produtos[i]);
     }
   
     var lista = [];
     for (i = 0; i < ordem.length; i++) lista.push(resumirColecao(ordem[i], mapa[ordem[i]]));
     lista.sort(function (a, b) { return b.total - a.total; });
     return lista;
   }
   
   // Tira do grupo os números que o palco mostra: quantidade, menor
   // preço, categoria predominante, foto de capa e miniaturas.
   function resumirColecao(nome, itens) {
     var capa = itens[0];
     var menor = itens[0].preco;
     var categorias = {};
     var i, chave;
   
     for (i = 0; i < itens.length; i++) {
       if (itens[i].preco < menor) menor = itens[i].preco;
       categorias[itens[i].categoria] = (categorias[itens[i].categoria] || 0) + 1;
       if (itens[i].destaque) capa = itens[i];   // a escolha da casa vira capa
     }
   
     var categoria = "";
     var maior = 0;
     for (chave in categorias) {
       if (categorias[chave] > maior) { maior = categorias[chave]; categoria = chave; }
     }
   
     var miniaturas = [];
     for (i = 0; i < itens.length && miniaturas.length < 3; i++) {
       if (itens[i] !== capa) miniaturas.push(itens[i]);
     }
   
     return {
       nome: nome,
       texto: DESCRICOES_COLECAO[nome] || "Recorte novo do catálogo: " + itens.length +
              " peça(s) separadas sob o mesmo nome.",
       total: itens.length,
       menorPreco: menor,
       categoria: categoria,
       capa: capa,
       miniaturas: miniaturas,
       destino: PASTA_PAGINAS + "produtos.html?colecao=" + encodeURIComponent(nome)
     };
   }
   
   // atalho para montar elemento + classe + texto numa linha
   function novo(tag, classe, texto) {
     var el = document.createElement(tag);
     if (classe) el.className = classe;
     if (texto !== undefined && texto !== null) el.textContent = texto;
     return el;
   }
   
   // Quebra cada linha do título em letras para subirem uma a uma.
   function dividirEmLetras(titulo, atrasoInicial) {
     var linhas = titulo.querySelectorAll(".linha");
     var contador = 0;
     var i, j;
   
     for (i = 0; i < linhas.length; i++) {
       var texto = linhas[i].textContent;
       linhas[i].textContent = "";
       for (j = 0; j < texto.length; j++) {
         var letra = novo("span", "letra", texto.charAt(j) === " " ? " " : texto.charAt(j));
         letra.style.animationDelay = (atrasoInicial + contador * 0.03) + "s";
         linhas[i].appendChild(letra);
         contador++;
       }
     }
   }
   
   // --- uma cena do palco ---
   function criarCena(dados, indice, total) {
     var cena = novo("article", "cena");
     cena.setAttribute("aria-roledescription", "slide");
     cena.setAttribute("aria-label", (indice + 1) + " de " + total);
   
     /* texto */
     var texto = novo("div", "cena__texto");
   
     var eixo = novo("p", "cena__eixo");
     eixo.appendChild(novo("span", null, dados.rotulo));
     eixo.appendChild(novo("b", null, doisDigitos(indice + 1)));
     eixo.appendChild(novo("i", null, "/"));
     eixo.appendChild(novo("em", null, doisDigitos(total)));
     texto.appendChild(eixo);
   
     var titulo = novo(indice === 0 ? "h1" : "h2", "cena__titulo");
     titulo.setAttribute("aria-label", dados.titulo.join(" "));
     var i;
     for (i = 0; i < dados.titulo.length; i++) {
       var classe = "linha" + (dados.acento === i ? " linha--acento" : "");
       titulo.appendChild(novo("span", classe, dados.titulo[i]));
     }
     texto.appendChild(titulo);
     dividirEmLetras(titulo, 0.2);
   
     texto.appendChild(novo("span", "cena__risco"));
     texto.appendChild(novo("p", "cena__linha", dados.linha));
   
     var dadosLista = novo("ul", "cena__dados");
     for (i = 0; i < dados.numeros.length; i++) {
       var item = novo("li");
       item.appendChild(novo("b", null, dados.numeros[i][0]));
       item.appendChild(novo("span", null, dados.numeros[i][1]));
       dadosLista.appendChild(item);
     }
     texto.appendChild(dadosLista);
   
     var botoes = novo("div", "cena__botoes");
     for (i = 0; i < dados.botoes.length; i++) {
       var link = novo("a", "btn " + dados.botoes[i][2]);
       link.href = dados.botoes[i][1];
       link.appendChild(novo("span", null, dados.botoes[i][0]));
       var seta = novo("span", null, "→");
       seta.setAttribute("aria-hidden", "true");
       link.appendChild(seta);
       botoes.appendChild(link);
     }
     texto.appendChild(botoes);
   
     /* mídia */
     var midia = novo("div", "cena__midia");
     var moldura = novo("div", "cena__moldura");
     var foto = novo("img");
     foto.src = urlImagem(dados.foto);
     foto.alt = dados.alt;
     if (indice > 0) foto.loading = "lazy";
     moldura.appendChild(foto);
     midia.appendChild(moldura);
   
     var numero = novo("span", "cena__numero", doisDigitos(indice + 1));
     numero.setAttribute("aria-hidden", "true");
     midia.appendChild(numero);
   
     if (dados.miniaturas && dados.miniaturas.length) {
       var pilha = novo("div", "cena__pilha");
       pilha.setAttribute("aria-hidden", "true");
       for (i = 0; i < dados.miniaturas.length; i++) {
         var mini = novo("img");
         mini.src = urlImagem(dados.miniaturas[i].imagem);
         mini.alt = "";
         mini.loading = "lazy";
         pilha.appendChild(mini);
       }
       midia.appendChild(pilha);
     }
   
     cena.appendChild(texto);
     cena.appendChild(midia);
     return cena;
   }
   
   // Transforma a loja em roteiro de cenas: abertura + uma por coleção.
   function roteiroDoPalco(produtos, colecoes) {
     var cenas = [];
     var i;
   
     cenas.push({
       rotulo: "Abertura",
       etiqueta: "Drop 04",
       titulo: ["O avesso", "da moda", "comum"],
       acento: 2,
       linha: "Peças de rua selecionadas uma a uma. Sem coleção infinita, sem enchimento de " +
              "vitrine: só o que a gente vestiria.",
       numeros: [
         [String(produtos.length), "peças no ar"],
         [doisDigitos(colecoes.length), "coleções"],
         ["R$ " + FRETE_GRATIS, "frete grátis"]
       ],
       botoes: [
         ["Ver catálogo", PASTA_PAGINAS + "produtos.html", "btn--branco"],
         ["Ver coleções", "#colecoes", "btn--claro"]
       ],
       foto: "assets/img/vitrine/palco-hero.jpg",
       alt: "Tênis cano médio preto e amarelo no chão, com uma camisa de basquete dourada ao fundo",
       // prévia: a capa de cada coleção, até três
       miniaturas: colecoes.slice(0, 3).map(function (c) { return c.capa; })
     });
   
     for (i = 0; i < colecoes.length; i++) {
       var c = colecoes[i];
       cenas.push({
         rotulo: "Coleção",
         etiqueta: c.nome,
         titulo: [c.nome],
         acento: -1,
         linha: c.texto,
         numeros: [
           [doisDigitos(c.total), c.total === 1 ? "peça" : "peças"],
           [formatarPreco(c.menorPreco), "a partir de"],
           [c.categoria || "Variado", "destaque"]
         ],
         botoes: [
           ["Ver coleção", c.destino, "btn--branco"],
           ["Catálogo inteiro", PASTA_PAGINAS + "produtos.html", "btn--claro"]
         ],
         foto: c.capa.imagem,
         alt: c.capa.nome + " na cor " + c.capa.cor + ", peça da coleção " + c.nome,
         miniaturas: c.miniaturas
       });
     }
   
     return cenas;
   }
   
   // DIFERENCIAL: carrossel automático do hero com abas, setas, deslize,
   // teclado e barra de tempo — e o conteúdo vem do próprio catálogo.
   function montarPalco(palco, produtos, colecoes) {
     var faixa = palco.querySelector(".palco__faixa");
     var guias = palco.querySelector(".palco__guias");
     var roteiro = roteiroDoPalco(produtos, colecoes);
     var cenas = [];
     var abas = [];
     var atual = 0;
     var timer = null;
     var i;
   
     faixa.textContent = "";
     guias.textContent = "";
   
     for (i = 0; i < roteiro.length; i++) {
       var cena = criarCena(roteiro[i], i, roteiro.length);
       faixa.appendChild(cena);
       cenas.push(cena);
   
       var aba = novo("button", "guia");
       aba.type = "button";
       aba.setAttribute("aria-label", roteiro[i].rotulo + " " + roteiro[i].etiqueta);
       aba.appendChild(novo("span", "guia__num", doisDigitos(i + 1)));
       aba.appendChild(novo("span", "guia__nome", roteiro[i].etiqueta));
       aba.appendChild(novo("span", "guia__barra"));
       aba.addEventListener("click", (function (indice) {
         return function () { mostrar(indice); reiniciarTimer(); };
       })(i));
       guias.appendChild(aba);
       abas.push(aba);
     }
   
     function mostrar(indice) {
       atual = (indice + cenas.length) % cenas.length;
       faixa.style.transform = "translateX(" + (-atual * 100) + "%)";
       var j;
       for (j = 0; j < cenas.length; j++) {
         // cena fora da tela não recebe foco nem é lida pelo leitor de tela
         cenas[j].inert = j !== atual;
         cenas[j].setAttribute("aria-hidden", j === atual ? "false" : "true");
         cenas[j].classList.toggle("ativo", j === atual);
         abas[j].classList.toggle("ativo", j === atual);
         abas[j].setAttribute("aria-current", j === atual ? "true" : "false");
       }
       reanimar(abas[atual].querySelector(".guia__barra"), "guia__barra");
       // mantém a aba ativa visível quando as abas rolam na horizontal
       if (guias.scrollWidth > guias.clientWidth) {
         guias.scrollTo({ left: abas[atual].offsetLeft - 20, behavior: "smooth" });
       }
     }
   
     var semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
     var sozinha = cenas.length < 2;
   
     function reiniciarTimer() {
       clearInterval(timer);
       palco.classList.remove("pausado");
       if (semMovimento || sozinha) return;
       timer = setInterval(function () { mostrar(atual + 1); }, 6500);
     }
     function pausar() {
       clearInterval(timer);
       palco.classList.add("pausado");
     }
   
     var ant = palco.querySelector(".palco__seta--ant");
     var prox = palco.querySelector(".palco__seta--prox");
     ant.addEventListener("click", function () { mostrar(atual - 1); reiniciarTimer(); });
     prox.addEventListener("click", function () { mostrar(atual + 1); reiniciarTimer(); });
   
     if (sozinha) {
       palco.querySelector(".palco__setas").hidden = true;
       guias.hidden = true;
     }
   
     // pausa com o mouse em cima ou com o foco do teclado dentro
     palco.addEventListener("mouseenter", pausar);
     palco.addEventListener("mouseleave", reiniciarTimer);
     palco.addEventListener("focusin", pausar);
     palco.addEventListener("focusout", reiniciarTimer);
   
     // setas do teclado quando o foco está no palco
     palco.addEventListener("keydown", function (evento) {
       if (evento.key === "ArrowLeft") { mostrar(atual - 1); reiniciarTimer(); }
       if (evento.key === "ArrowRight") { mostrar(atual + 1); reiniciarTimer(); }
     });
   
     // deslize no celular
     var inicioX = null;
     palco.addEventListener("touchstart", function (e) { inicioX = e.touches[0].clientX; }, { passive: true });
     palco.addEventListener("touchend", function (e) {
       if (inicioX === null) return;
       var distancia = e.changedTouches[0].clientX - inicioX;
       inicioX = null;
       if (Math.abs(distancia) < 50) return;
       mostrar(distancia < 0 ? atual + 1 : atual - 1);
       reiniciarTimer();
     });
   
     mostrar(0);
     reiniciarTimer();
   }
   
   // A grade de coleções da home também sai do catálogo.
   function montarGradeColecoes(grade, colecoes) {
     grade.textContent = "";
     var contagem = document.getElementById("contagemColecoes");
     if (contagem) {
       contagem.textContent = doisDigitos(colecoes.length) +
         (colecoes.length === 1 ? " recorte" : " recortes");
     }
   
     if (!colecoes.length) {
       mostrarVazio(grade, "Nenhuma coleção cadastrada ainda.", "Ver catálogo",
                    PASTA_PAGINAS + "produtos.html");
       return;
     }
   
     var i;
     for (i = 0; i < colecoes.length; i++) {
       var c = colecoes[i];
       var bloco = novo("article", "colecao");
   
       var foto = novo("img");
       foto.src = urlImagem(c.capa.imagem);
       foto.alt = "Peça da coleção " + c.nome + ": " + c.capa.nome;
       foto.loading = "lazy";
       bloco.appendChild(foto);
   
       var caixa = novo("div", "colecao__texto");
       caixa.appendChild(novo("p", "rotulo", doisDigitos(i + 1) + " · " + c.total +
                              (c.total === 1 ? " peça" : " peças")));
       caixa.appendChild(novo("h3", null, c.nome));
       caixa.appendChild(novo("p", null, c.texto));
   
       var botao = novo("a", "btn btn--claro", "Ver coleção");
       botao.href = c.destino;
       caixa.appendChild(botao);
   
       bloco.appendChild(caixa);
       grade.appendChild(bloco);
     }
   }
   
   // Cards de categoria: a rolagem é nativa (deslize + scroll-snap no CSS);
   // o JS só cria as setas, que andam uma "página" de cards por clique.
   function iniciarCarrosselAtalhos(caixa) {
     var trilho = caixa.querySelector(".atalhos");
   
     function criarSeta(classe, rotulo, desenho, direcao) {
       var seta = document.createElement("button");
       seta.type = "button";
       seta.className = "atalhos__seta " + classe;
       seta.setAttribute("aria-label", rotulo);
       seta.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + desenho + '"/></svg>';
       seta.addEventListener("click", function () {
         trilho.scrollBy({ left: direcao * trilho.clientWidth * 0.9, behavior: "smooth" });
       });
       caixa.appendChild(seta);
       return seta;
     }
   
     var anterior = criarSeta("atalhos__seta--ant", "Categorias anteriores", "M15 5l-7 7 7 7", -1);
     var proxima = criarSeta("atalhos__seta--prox", "Mais categorias", "M9 5l7 7-7 7", 1);
   
     // some com a seta quando já está no começo ou no fim
     function atualizarSetas() {
       var fim = trilho.scrollWidth - trilho.clientWidth - 4;
       anterior.disabled = trilho.scrollLeft <= 4;
       proxima.disabled = trilho.scrollLeft >= fim;
     }
   
     trilho.addEventListener("scroll", atualizarSetas, { passive: true });
     window.addEventListener("resize", atualizarSetas);
     atualizarSetas();
   }
   
   
   /* #########################################################
      pages/catalogo.js
      ######################################################### */
   
   /* --- CATÁLOGO --- */
   function iniciarCatalogo() {
     var campoBusca = document.getElementById("campoBusca");
     var filtroCategoria = document.getElementById("filtroCategoria");
     var filtroColecao = document.getElementById("filtroColecao");
     var filtroOrdem = document.getElementById("filtroOrdem");
     var grade = document.getElementById("gradeCatalogo");
     var contagem = document.getElementById("contagemProdutos");
     var btnMais = document.getElementById("btnCarregarMais");
     var btnLimpar = document.getElementById("btnLimparFiltros");
   
     var visiveis = POR_PAGINA;
   
     // monta os selects a partir do que existe no estoque
     preencherSelect(filtroCategoria, listaUnica("categoria"));
     preencherSelect(filtroColecao, listaUnica("colecao"));
   
     // filtros vindos da URL (faixa de categorias, banners de coleção, busca do header)
     campoBusca.value = parametroDaUrl("busca");
     filtroCategoria.value = parametroDaUrl("categoria");
     filtroColecao.value = parametroDaUrl("colecao");
     if (parametroDaUrl("ordem")) filtroOrdem.value = parametroDaUrl("ordem");
   
     function filtrar() {
       var produtos = lerProdutos();
       var termo = campoBusca.value.trim().toLowerCase();
       var resultado = [];
       var i;
       for (i = 0; i < produtos.length; i++) {
         var p = produtos[i];
         var texto = semAcento(p.nome + " " + p.categoria + " " + p.cor + " " + p.descricao);
         var combinaBusca = termo === "" || texto.indexOf(semAcento(termo)) !== -1;
         var combinaCategoria = filtroCategoria.value === "" || p.categoria === filtroCategoria.value;
         var combinaColecao = filtroColecao.value === "" || p.colecao === filtroColecao.value;
         if (combinaBusca && combinaCategoria && combinaColecao) resultado.push(p);
       }
       return ordenar(resultado, filtroOrdem.value);
     }
   
     function desenhar() {
       var lista = filtrar();
       contagem.textContent = lista.length + (lista.length === 1 ? " produto encontrado" : " produtos encontrados");
       if (lista.length === 0) {
         mostrarVazio(grade, "Nenhuma peça bate com esses filtros.", "Limpar filtros", PASTA_PAGINAS + "produtos.html");
         btnMais.hidden = true;
         return;
       }
       renderizarProdutos(grade, lista.slice(0, visiveis), false);
       btnMais.hidden = visiveis >= lista.length;
     }
   
     // DIFERENCIAL 2: tudo refiltra na hora, sem recarregar
     function reiniciar() { visiveis = POR_PAGINA; desenhar(); }
     campoBusca.addEventListener("input", reiniciar);
     filtroCategoria.addEventListener("change", reiniciar);
     filtroColecao.addEventListener("change", reiniciar);
     filtroOrdem.addEventListener("change", reiniciar);
   
     btnLimpar.addEventListener("click", function () {
       campoBusca.value = "";
       filtroCategoria.value = "";
       filtroColecao.value = "";
       filtroOrdem.value = "padrao";
       reiniciar();
     });
   
     // DIFERENCIAL 14: carregar mais
     btnMais.addEventListener("click", function () {
       visiveis += POR_PAGINA;
       desenhar();
     });
   
     desenhar();
   }
   
   function listaUnica(campo) {
     var produtos = lerProdutos();
     var valores = [];
     var i;
     for (i = 0; i < produtos.length; i++) {
       var valor = produtos[i][campo];
       if (valor && valores.indexOf(valor) === -1) valores.push(valor);
     }
     valores.sort();
     return valores;
   }
   
   function preencherSelect(select, valores) {
     var i;
     for (i = 0; i < valores.length; i++) {
       var opcao = document.createElement("option");
       opcao.value = valores[i];
       opcao.textContent = valores[i];
       select.appendChild(opcao);
     }
   }
   
   function ordenar(lista, criterio) {
     if (criterio === "menor") lista.sort(function (a, b) { return a.preco - b.preco; });
     if (criterio === "maior") lista.sort(function (a, b) { return b.preco - a.preco; });
     if (criterio === "az") lista.sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
     if (criterio === "vendidos") lista.sort(function (a, b) { return b.vendidos - a.vendidos; });
     return lista;
   }
   
   
   /* #########################################################
      pages/detalhe.js
      ######################################################### */
   
   /* --- DETALHE DO PRODUTO --- */
   function iniciarDetalhe() {
     var caixa = document.getElementById("detalhe");
     var produto = buscarProduto(parametroDaUrl("id"));
   
     if (!produto) {
       mostrarVazio(caixa, "Essa peça não está mais no catálogo.", "Ver catálogo", PASTA_PAGINAS + "produtos.html");
       return;
     }
   
     document.title = produto.nome + " — " + LOJA;
     document.getElementById("migalhaNome").textContent = produto.nome;
   
     montarDetalhe(caixa, produto);
     registrarVisto(produto.id);
     montarRelacionados(produto);
     montarVistos(produto.id);
   }
   
   function montarDetalhe(caixa, produto) {
     caixa.textContent = "";
   
     // coluna da foto
     var ladoFoto = document.createElement("div");
     ladoFoto.className = "detalhe__foto";
     var foto = document.createElement("img");
     foto.src = urlImagem(produto.imagem);
     foto.alt = produto.nome + " na cor " + produto.cor;
     ladoFoto.appendChild(foto);
     var desconto = calcularDesconto(produto);
     if (desconto > 0) {
       var selo = document.createElement("span");
       selo.className = "selo";
       selo.textContent = "-" + desconto + "%";
       ladoFoto.appendChild(selo);
     }
   
     // coluna das informações
     var lado = document.createElement("div");
     lado.className = "detalhe__info";
   
     var categoria = document.createElement("p");
     categoria.className = "rotulo";
     categoria.textContent = produto.categoria + (produto.colecao ? " · Coleção " + produto.colecao : "");
   
     var titulo = document.createElement("h1");
     titulo.textContent = produto.nome;
   
     var precos = document.createElement("p");
     precos.className = "detalhe__preco";
     if (produto.precoAntigo) {
       var antigo = document.createElement("s");
       antigo.textContent = formatarPreco(produto.precoAntigo);
       precos.appendChild(antigo);
     }
     var atual = document.createElement("strong");
     atual.textContent = formatarPreco(produto.preco);
     precos.appendChild(atual);
   
     // DIFERENCIAL 13: parcelamento calculado
     var parcela = document.createElement("p");
     parcela.className = "detalhe__parcela";
     parcela.textContent = "ou " + PARCELAS + "x de " + formatarPreco(produto.preco / PARCELAS) + " sem juros";
   
     var descricao = document.createElement("p");
     descricao.className = "detalhe__descricao";
     descricao.textContent = produto.descricao;
   
     var cor = document.createElement("p");
     cor.className = "detalhe__cor";
     cor.textContent = "Cor: " + produto.cor;
   
     // seletor de tamanho (obrigatório)
     var rotuloTamanho = document.createElement("p");
     rotuloTamanho.className = "rotulo";
     rotuloTamanho.textContent = "Tamanho";
   
     var tamanhos = document.createElement("div");
     tamanhos.className = "tamanhos";
     var escolhido = "";
     var i;
     for (i = 0; i < produto.tamanhos.length; i++) {
       (function (valor) {
         var botao = document.createElement("button");
         botao.type = "button";
         botao.className = "tamanho";
         botao.textContent = valor;
         botao.addEventListener("click", function () {
           var ativos = tamanhos.querySelectorAll(".tamanho");
           var j;
           for (j = 0; j < ativos.length; j++) ativos[j].classList.remove("ativo");
           botao.classList.add("ativo");
           escolhido = valor;
           aviso.textContent = "";
         });
         tamanhos.appendChild(botao);
       })(produto.tamanhos[i]);
     }
   
     // quantidade
     var quantidade = 1;
     var caixaQtd = document.createElement("div");
     caixaQtd.className = "quantidade";
     var menos = document.createElement("button");
     menos.type = "button";
     menos.textContent = "−";
     menos.setAttribute("aria-label", "Diminuir quantidade");
     var numero = document.createElement("span");
     numero.textContent = "1";
     var mais = document.createElement("button");
     mais.type = "button";
     mais.textContent = "+";
     mais.setAttribute("aria-label", "Aumentar quantidade");
     menos.addEventListener("click", function () {
       if (quantidade > 1) quantidade--;
       numero.textContent = quantidade;
     });
     mais.addEventListener("click", function () {
       quantidade++;
       numero.textContent = quantidade;
     });
     caixaQtd.appendChild(menos);
     caixaQtd.appendChild(numero);
     caixaQtd.appendChild(mais);
   
     var aviso = document.createElement("p");
     aviso.className = "erro";
   
     var botoes = document.createElement("div");
     botoes.className = "detalhe__botoes";
   
     var btnComprar = document.createElement("button");
     btnComprar.className = "btn btn--acento";
     btnComprar.type = "button";
     btnComprar.textContent = "Adicionar ao carrinho";
     btnComprar.addEventListener("click", function () {
       if (!escolhido) {
         aviso.textContent = "Escolha um tamanho antes de adicionar.";
         return;
       }
       adicionarAoCarrinho(produto.id, escolhido, quantidade);
       atualizarContadores();
       reanimar(document.getElementById("contadorCarrinho"), "pulsa");
       mostrarToast(produto.nome + " (" + escolhido + ") no carrinho");
       if (abrirGaveta) abrirGaveta(); // mostra o mini-carrinho na hora
     });
   
     var btnFavorito = document.createElement("button");
     btnFavorito.className = "btn btn--vazado";
     btnFavorito.type = "button";
     btnFavorito.textContent = ehFavorito(produto.id) ? "Remover dos favoritos" : "Favoritar";
     btnFavorito.addEventListener("click", function () {
       var virou = alternarFavorito(produto.id);
       btnFavorito.textContent = virou ? "Remover dos favoritos" : "Favoritar";
       atualizarContadores();
       reanimar(document.getElementById("contadorFavoritos"), "pulsa");
       mostrarToast(virou ? "Salvo nos favoritos" : "Removido dos favoritos");
     });
   
     botoes.appendChild(btnComprar);
     botoes.appendChild(btnFavorito);
   
     // Editar produto: só aparece para o administrador
     var usuario = usuarioLogado();
     if (usuario && usuario.tipo === "admin") {
       var btnEditar = document.createElement("a");
       btnEditar.className = "btn btn--claro detalhe__editar";
       btnEditar.href = PASTA_PAGINAS + "admin.html?editar=" + produto.id;
       btnEditar.textContent = "Editar produto";
       botoes.appendChild(btnEditar);
     }
   
     var entrega = document.createElement("ul");
     entrega.className = "detalhe__lista";
     var itens = [
       "Frete grátis acima de " + formatarPreco(FRETE_GRATIS),
       "Troca em até 30 dias",
       "Enviado em até 24h úteis"
     ];
     for (i = 0; i < itens.length; i++) {
       var li = document.createElement("li");
       li.textContent = itens[i];
       entrega.appendChild(li);
     }
   
     lado.appendChild(categoria);
     lado.appendChild(titulo);
     lado.appendChild(precos);
     lado.appendChild(parcela);
     lado.appendChild(descricao);
     lado.appendChild(cor);
     lado.appendChild(rotuloTamanho);
     lado.appendChild(tamanhos);
     lado.appendChild(caixaQtd);
     lado.appendChild(aviso);
     lado.appendChild(botoes);
     lado.appendChild(entrega);
   
     caixa.appendChild(ladoFoto);
     caixa.appendChild(lado);
   }
   
   function montarRelacionados(produto) {
     var produtos = lerProdutos();
     var relacionados = [];
     var i;
     for (i = 0; i < produtos.length; i++) {
       if (produtos[i].id !== produto.id && produtos[i].categoria === produto.categoria) {
         relacionados.push(produtos[i]);
       }
     }
     if (relacionados.length === 0) return;
     document.getElementById("secaoRelacionados").hidden = false;
     renderizarProdutos(document.getElementById("gradeRelacionados"), relacionados.slice(0, 4), false);
   }
   
   function montarVistos(idAtual) {
     var vistos = lerStorage("verso_vistos") || [];
     var lista = [];
     var i;
     for (i = 0; i < vistos.length; i++) {
       if (vistos[i] === idAtual) continue;
       var p = buscarProduto(vistos[i]);
       if (p) lista.push(p);
     }
     if (lista.length === 0) return;
     document.getElementById("secaoVistos").hidden = false;
     renderizarProdutos(document.getElementById("gradeVistos"), lista, false);
   }
   
   
   /* #########################################################
      pages/carrinho.js
      ######################################################### */
   
   /* --- CARRINHO --- */
   function iniciarCarrinho() {
     if (!exigirLogin()) return;
   
     var lista = document.getElementById("listaCarrinho");
     var resumo = document.getElementById("resumo");
     var cupomAtivo = null;
   
     function desenhar() {
       var itens = lerCarrinho();
       lista.textContent = "";
   
       if (itens.length === 0) {
         mostrarVazio(lista, "Seu carrinho está vazio.", "Ver catálogo", PASTA_PAGINAS + "produtos.html");
         resumo.hidden = true;
         atualizarContadores();
         return;
       }
   
       resumo.hidden = false;
       var i;
       for (i = 0; i < itens.length; i++) {
         lista.appendChild(criarLinhaCarrinho(itens[i], i, desenhar));
       }
       atualizarValores();
       atualizarContadores();
     }
   
     function atualizarValores() {
       var subtotal = calcularSubtotal();
       var desconto = cupomAtivo ? subtotal * cupomAtivo.porcentagem / 100 : 0;
       var temFreteGratis = subtotal >= FRETE_GRATIS;
       var frete = temFreteGratis ? 0 : VALOR_FRETE;
       var total = subtotal - desconto + frete;
   
       document.getElementById("valorSubtotal").textContent = formatarPreco(subtotal);
       document.getElementById("valorFrete").textContent = temFreteGratis ? "Grátis" : formatarPreco(frete);
       document.getElementById("valorTotal").textContent = formatarPreco(total);
   
       var linhaDesconto = document.getElementById("linhaDesconto");
       linhaDesconto.hidden = desconto === 0;
       document.getElementById("valorDesconto").textContent = "- " + formatarPreco(desconto);
   
       // DIFERENCIAL 10: barra de progresso do frete grátis
       var falta = FRETE_GRATIS - subtotal;
       var porcento = Math.min(100, Math.round(subtotal / FRETE_GRATIS * 100));
       document.getElementById("freteProgresso").style.width = porcento + "%";
       document.getElementById("freteTexto").textContent = temFreteGratis
         ? "Frete grátis liberado."
         : "Faltam " + formatarPreco(falta) + " para o frete grátis";
     }
   
     // cupom
     document.getElementById("formCupom").addEventListener("submit", function (evento) {
       evento.preventDefault();
       var erro = document.getElementById("erroCupom");
       var cupom = aplicarCupom(document.getElementById("campoCupom").value);
       if (!cupom) {
         cupomAtivo = null;
         erro.textContent = "Cupom inválido.";
         atualizarValores();
         return;
       }
       cupomAtivo = cupom;
       erro.textContent = "";
       mostrarToast("Cupom " + cupom.codigo + " aplicado (" + cupom.porcentagem + "% off)");
       atualizarValores();
     });
   
     // finalizar compra
     document.getElementById("btnFinalizar").addEventListener("click", function () {
       var itens = lerCarrinho();
       if (itens.length === 0) return;
       salvarPedido(cupomAtivo);
       salvarCarrinho([]);
       cupomAtivo = null;
       document.getElementById("campoCupom").value = "";
       desenhar();
       mostrarToast("Pedido fechado! Obrigado pela compra.");
     });
   
     desenhar();
   }
   
   function criarLinhaCarrinho(item, posicao, redesenhar) {
     var produto = buscarProduto(item.idProduto);
     var linha = document.createElement("article");
     linha.className = "item";
   
     if (!produto) {
       linha.textContent = "Peça removida do catálogo.";
       return linha;
     }
   
     var foto = document.createElement("img");
     foto.src = urlImagem(produto.imagem);
     foto.alt = produto.nome;
     foto.loading = "lazy";
   
     var info = document.createElement("div");
     info.className = "item__info";
   
     var nome = document.createElement("h3");
     var linkNome = document.createElement("a");
     linkNome.href = PASTA_PAGINAS + "produto.html?id=" + produto.id;
     linkNome.textContent = produto.nome;
     nome.appendChild(linkNome);
   
     var detalhe = document.createElement("p");
     detalhe.className = "item__detalhe";
     detalhe.textContent = "Tamanho " + item.tamanho + " · " + produto.cor;
   
     var preco = document.createElement("p");
     preco.className = "item__preco";
     preco.textContent = formatarPreco(produto.preco * item.quantidade);
   
     var controles = document.createElement("div");
     controles.className = "quantidade";
     var menos = document.createElement("button");
     menos.type = "button";
     menos.textContent = "−";
     menos.setAttribute("aria-label", "Diminuir quantidade de " + produto.nome);
     var numero = document.createElement("span");
     numero.textContent = item.quantidade;
     var mais = document.createElement("button");
     mais.type = "button";
     mais.textContent = "+";
     mais.setAttribute("aria-label", "Aumentar quantidade de " + produto.nome);
     menos.addEventListener("click", function () { mudarQuantidade(posicao, -1); redesenhar(); });
     mais.addEventListener("click", function () { mudarQuantidade(posicao, 1); redesenhar(); });
     controles.appendChild(menos);
     controles.appendChild(numero);
     controles.appendChild(mais);
   
     var remover = document.createElement("button");
     remover.type = "button";
     remover.className = "item__remover";
     remover.textContent = "Remover";
     remover.addEventListener("click", function () {
       removerDoCarrinho(posicao);
       redesenhar();
       mostrarToast("Item removido");
     });
   
     info.appendChild(nome);
     info.appendChild(detalhe);
     info.appendChild(controles);
     info.appendChild(remover);
   
     linha.appendChild(foto);
     linha.appendChild(info);
     linha.appendChild(preco);
     return linha;
   }
   
   // DIFERENCIAL 7: histórico de pedidos
   function salvarPedido(cupom) {
     var usuario = usuarioLogado();
     var itensCarrinho = lerCarrinho();
     var itens = [];
     var subtotal = 0;
     var i;
   
     for (i = 0; i < itensCarrinho.length; i++) {
       var produto = buscarProduto(itensCarrinho[i].idProduto);
       if (!produto) continue;
       itens.push({
         nome: produto.nome,
         tamanho: itensCarrinho[i].tamanho,
         quantidade: itensCarrinho[i].quantidade,
         preco: produto.preco
       });
       subtotal += produto.preco * itensCarrinho[i].quantidade;
       somarVenda(produto.id, itensCarrinho[i].quantidade);
     }
   
     var desconto = cupom ? subtotal * cupom.porcentagem / 100 : 0;
     var pedidos = lerStorage("verso_pedidos") || [];
   
     pedidos.push({
       id: pedidos.length + 1,
       idUsuario: usuario.id,
       data: new Date().toLocaleString("pt-BR"),
       itens: itens,
       subtotal: subtotal,
       desconto: desconto,
       cupom: cupom ? cupom.codigo : "",
       total: subtotal - desconto
     });
   
     salvarStorage("verso_pedidos", pedidos);
   }
   
   // cada compra alimenta o "mais vendidos"
   function somarVenda(idProduto, quantidade) {
     var produtos = lerProdutos();
     var i;
     for (i = 0; i < produtos.length; i++) {
       if (produtos[i].id === idProduto) produtos[i].vendidos += quantidade;
     }
     salvarStorage("verso_produtos", produtos);
   }
   
   
   /* #########################################################
      pages/favoritos.js
      ######################################################### */
   
   /* --- FAVORITOS --- */
   function iniciarFavoritos() {
     if (!exigirLogin()) return;
     var grade = document.getElementById("gradeFavoritos");
     var ids = lerFavoritos();
     var lista = [];
     var i;
     for (i = 0; i < ids.length; i++) {
       var produto = buscarProduto(ids[i]);
       if (produto) lista.push(produto);
     }
     if (lista.length === 0) {
       mostrarVazio(grade, "Você ainda não salvou nenhuma peça.", "Ver catálogo", PASTA_PAGINAS + "produtos.html");
       return;
     }
     renderizarProdutos(grade, lista, false); // reaproveita a mesma função de card
   }
   
   
   /* #########################################################
      pages/login.js
      ######################################################### */
   
   /* --- LOGIN / CADASTRO --- */
   function iniciarLogin() {
     var abaEntrar = document.getElementById("abaEntrar");
     var abaCriar = document.getElementById("abaCriar");
     var painelEntrar = document.getElementById("painelEntrar");
     var painelCriar = document.getElementById("painelCriar");
   
     function trocarAba(mostrarCadastro) {
       painelEntrar.hidden = mostrarCadastro;
       painelCriar.hidden = !mostrarCadastro;
       abaEntrar.classList.toggle("ativa", !mostrarCadastro);
       abaCriar.classList.toggle("ativa", mostrarCadastro);
       abaEntrar.setAttribute("aria-selected", mostrarCadastro ? "false" : "true");
       abaCriar.setAttribute("aria-selected", mostrarCadastro ? "true" : "false");
       document.querySelector(".cabecalho-pagina h1").textContent = mostrarCadastro ? "Criar conta" : "Entrar";
     }
   
     abaEntrar.addEventListener("click", function () { trocarAba(false); });
     abaCriar.addEventListener("click", function () { trocarAba(true); });
   
     // atalho pra apresentação: enche o cadastro com um consumidor pronto
     document.getElementById("btnDadosExemplo").addEventListener("click", function () {
       var exemplo = CONSUMIDORES_EXEMPLO[Math.floor(Math.random() * CONSUMIDORES_EXEMPLO.length)];
       var email = exemplo.email;
       var n = 2;
       // se esse e-mail já virou conta, ganha um número no fim (ana2@..., ana3@...)
       while (buscarUsuarioPorEmail(email)) {
         email = exemplo.email.replace("@", n + "@");
         n++;
       }
       document.getElementById("cadNome").value = exemplo.nome;
       document.getElementById("cadEmail").value = email;
       document.getElementById("cadSenha").value = exemplo.senha;
       document.getElementById("cadSenha2").value = exemplo.senha;
       document.getElementById("erroCadastro").textContent = "";
       mostrarToast("Dados de exemplo prontos. Senha: " + exemplo.senha);
     });
   
     // REQUISITO 1 + DIFERENCIAL: validação no JS, erro no DOM (sem alert)
     painelEntrar.addEventListener("submit", function (evento) {
       evento.preventDefault();
       var erro = document.getElementById("erroLogin");
       var email = document.getElementById("loginEmail").value.trim();
       var senha = document.getElementById("loginSenha").value;
   
       if (!emailValido(email)) { erro.textContent = "Digite um e-mail válido."; return; }
       if (senha.length < 6) { erro.textContent = "A senha tem no mínimo 6 caracteres."; return; }
       if (!fazerLogin(email, senha)) { erro.textContent = "E-mail ou senha não conferem."; return; }
   
       erro.textContent = "";
       mostrarToast("Bem-vindo de volta!");
       setTimeout(irParaDestino, 600);
     });
   
     painelCriar.addEventListener("submit", function (evento) {
       evento.preventDefault();
       var erro = document.getElementById("erroCadastro");
       var nome = document.getElementById("cadNome").value.trim();
       var email = document.getElementById("cadEmail").value.trim();
       var senha = document.getElementById("cadSenha").value;
       var senha2 = document.getElementById("cadSenha2").value;
   
       if (nome.length < 2) { erro.textContent = "Escreva seu nome."; return; }
       if (!emailValido(email)) { erro.textContent = "Digite um e-mail válido."; return; }
       if (senha.length < 6) { erro.textContent = "A senha precisa de pelo menos 6 caracteres."; return; }
       if (senha !== senha2) { erro.textContent = "As duas senhas não são iguais."; return; }
       if (buscarUsuarioPorEmail(email)) { erro.textContent = "Esse e-mail já tem conta."; return; }
   
       var usuarios = lerUsuarios();
       salvarUsuario({ id: usuarios.length + 1, nome: nome, email: email, senha: senha, tipo: "cliente" });
       fazerLogin(email, senha);
   
       erro.textContent = "";
       mostrarToast("Conta criada. Boas compras!");
       setTimeout(irParaDestino, 600);
     });
   }
   
   // validação simples de e-mail: tem texto, @, texto, ponto e texto
   function emailValido(email) {
     var arroba = email.indexOf("@");
     var ponto = email.lastIndexOf(".");
     return arroba > 0 && ponto > arroba + 1 && ponto < email.length - 1;
   }
   
   function irParaDestino() {
     var voltar = parametroDaUrl("voltar");
     window.location.href = voltar ? voltar : RAIZ + "index.html";
   }
   
   
   /* #########################################################
      pages/admin.js
      ######################################################### */
   
   /* --- ADMIN --- */
   
   // id da peça que está no formulário (null = cadastrando uma peça nova)
   var idEmEdicao = null;
   
   function iniciarAdmin() {
     if (!exigirAdmin()) return;
   
     var selectImagem = document.getElementById("pImagem");
   
     // select com as imagens que existem em assets/img/
     var i;
     for (i = 0; i < IMAGENS_DISPONIVEIS.length; i++) {
       var opcao = document.createElement("option");
       opcao.value = "assets/img/" + IMAGENS_DISPONIVEIS[i];
       opcao.textContent = IMAGENS_DISPONIVEIS[i];
       selectImagem.appendChild(opcao);
     }
   
     selectImagem.addEventListener("change", atualizarPreviaAdmin);
     atualizarPreviaAdmin();
   
     document.getElementById("btnCancelarEdicao").addEventListener("click", function () {
       sairDaEdicao();
     });
   
     document.getElementById("formProduto").addEventListener("submit", function (evento) {
       evento.preventDefault();
       var erro = document.getElementById("erroProduto");
       var nome = document.getElementById("pNome").value.trim();
       var preco = parseFloat(document.getElementById("pPreco").value);
       var precoAntigo = parseFloat(document.getElementById("pPrecoAntigo").value);
       var descricao = document.getElementById("pDescricao").value.trim();
       var cor = document.getElementById("pCor").value.trim();
       var tamanhos = separarTamanhos(document.getElementById("pTamanhos").value);
   
       if (nome.length < 3) { erro.textContent = "Dê um nome à peça."; return; }
       if (isNaN(preco) || preco <= 0) { erro.textContent = "Informe um preço maior que zero."; return; }
       if (tamanhos.length === 0) { erro.textContent = "Informe ao menos um tamanho."; return; }
   
       // na edição a peça mantém o id e as vendas que já tinha
       var original = idEmEdicao !== null ? buscarProduto(idEmEdicao) : null;
   
       var peca = {
         id: original ? original.id : proximoIdProduto(),
         nome: nome,
         categoria: document.getElementById("pCategoria").value,
         preco: preco,
         descricao: descricao || "Peça da loja VERSO.",
         tamanhos: tamanhos,
         cor: cor || "Única",
         imagem: selectImagem.value,
         destaque: document.getElementById("pDestaque").checked,
         lancamento: document.getElementById("pLancamento").checked,
         vendidos: original ? original.vendidos : 0,
         colecao: document.getElementById("pColecao").value
       };
       if (!isNaN(precoAntigo) && precoAntigo > preco) peca.precoAntigo = precoAntigo;
   
       if (original) {
         atualizarProduto(peca);
         mostrarToast(nome + " atualizada");
       } else {
         adicionarProduto(peca);
         mostrarToast(nome + " entrou no catálogo");
       }
       sairDaEdicao();
       desenharTabelaAdmin();   // atualiza a tabela sem recarregar a página
     });
   
     desenharTabelaAdmin();
     desenharVendasAdmin();
   
     // cliente finalizou compra em outra aba -> vendas e tabela se atualizam
     aoMudarDados(["verso_pedidos", "verso_produtos"], function (chave) {
       desenharVendasAdmin();
       desenharTabelaAdmin();
       if (chave === "verso_pedidos") mostrarToast("Nova venda registrada");
     });
   
     // veio do botão "Editar produto" da página da peça (admin.html?editar=ID)
     var paraEditar = buscarProduto(parametroDaUrl("editar"));
     if (paraEditar) entrarEmEdicao(paraEditar);
   }
   
   function desenharVendasAdmin() {
     var vendas = resumirVendas(lerStorage("verso_pedidos") || []);
     animarNumero(document.getElementById("admPedidos"), vendas.pedidos, false);
     animarNumero(document.getElementById("admItens"), vendas.itens, false);
     animarNumero(document.getElementById("admVendido"), vendas.total, true);
     document.getElementById("admUltimo").textContent = vendas.ultimo
       ? "#" + vendas.ultimo.id + " · " + formatarPreco(vendas.ultimo.total) + " · " + vendas.ultimo.data
       : "—";
   }
   
   function atualizarPreviaAdmin() {
     var selectImagem = document.getElementById("pImagem");
     var previa = document.getElementById("previaImagem");
     previa.src = urlImagem(selectImagem.value);
     previa.alt = "Prévia de " + selectImagem.options[selectImagem.selectedIndex].textContent;
   }
   
   // Marca a opção com esse valor; se ela não existir no <select>
   // (ex.: coleção ou imagem cadastrada fora da lista), cria na hora.
   function escolherOpcao(select, valor) {
     var i;
     for (i = 0; i < select.options.length; i++) {
       if (select.options[i].value === valor) { select.selectedIndex = i; return; }
     }
     var opcao = document.createElement("option");
     opcao.value = valor;
     opcao.textContent = valor;
     select.appendChild(opcao);
     select.value = valor;
   }
   
   // Joga a peça no formulário e troca os textos para o modo "editar"
   function entrarEmEdicao(produto) {
     idEmEdicao = produto.id;
   
     document.getElementById("pNome").value = produto.nome;
     escolherOpcao(document.getElementById("pCategoria"), produto.categoria);
     escolherOpcao(document.getElementById("pColecao"), produto.colecao || "");
     document.getElementById("pPreco").value = produto.preco;
     document.getElementById("pPrecoAntigo").value = produto.precoAntigo || "";
     document.getElementById("pCor").value = produto.cor;
     document.getElementById("pTamanhos").value = produto.tamanhos.join(", ");
     document.getElementById("pDescricao").value = produto.descricao;
     escolherOpcao(document.getElementById("pImagem"), produto.imagem);
     document.getElementById("pDestaque").checked = !!produto.destaque;
     document.getElementById("pLancamento").checked = !!produto.lancamento;
     atualizarPreviaAdmin();
   
     document.getElementById("tituloNovoProduto").textContent = "Editar peça";
     document.getElementById("btnSalvarProduto").textContent = "Salvar alterações";
     document.getElementById("btnCancelarEdicao").hidden = false;
     document.getElementById("erroProduto").textContent = "";
   
     document.getElementById("secaoFormProduto").scrollIntoView({ behavior: "smooth", block: "start" });
     document.getElementById("pNome").focus({ preventScroll: true });
   }
   
   // Limpa o formulário e volta para o modo "nova peça"
   function sairDaEdicao() {
     idEmEdicao = null;
     document.getElementById("formProduto").reset();
     atualizarPreviaAdmin();
     document.getElementById("tituloNovoProduto").textContent = "Nova peça";
     document.getElementById("btnSalvarProduto").textContent = "Adicionar ao catálogo";
     document.getElementById("btnCancelarEdicao").hidden = true;
     document.getElementById("erroProduto").textContent = "";
   }
   
   function separarTamanhos(texto) {
     var partes = texto.split(",");
     var lista = [];
     var i;
     for (i = 0; i < partes.length; i++) {
       var limpo = partes[i].trim().toUpperCase();
       if (limpo) lista.push(limpo);
     }
     return lista;
   }
   
   function desenharTabelaAdmin() {
     var corpo = document.getElementById("corpoTabelaProdutos");
     var produtos = lerProdutos();
     corpo.textContent = "";
     document.getElementById("totalProdutosAdmin").textContent = produtos.length;
   
     var i;
     for (i = 0; i < produtos.length; i++) {
       (function (produto) {
         var linha = document.createElement("tr");
   
         var tdFoto = document.createElement("td");
         var foto = document.createElement("img");
         foto.className = "mini-foto";
         foto.src = urlImagem(produto.imagem);
         foto.alt = produto.nome;
         foto.loading = "lazy";
         tdFoto.appendChild(foto);
   
         linha.appendChild(tdFoto);
         linha.appendChild(celula(produto.nome));
         linha.appendChild(celula(produto.categoria));
         linha.appendChild(celula(formatarPreco(produto.preco)));
         linha.appendChild(celula(String(produto.vendidos)));
   
         var tdAcao = document.createElement("td");
         tdAcao.className = "tabela__acoes";
   
         var editar = document.createElement("button");
         editar.type = "button";
         editar.className = "btn-editar";
         editar.textContent = "Editar";
         editar.addEventListener("click", function () {
           entrarEmEdicao(produto);
         });
         tdAcao.appendChild(editar);
   
         var botao = document.createElement("button");
         botao.type = "button";
         botao.className = "btn-remover";
         botao.textContent = "Remover";
         botao.addEventListener("click", function () {
           if (!confirm("Remover \"" + produto.nome + "\" do catálogo?")) return;
           removerProduto(produto.id);
           if (idEmEdicao === produto.id) sairDaEdicao();
           linha.remove();                 // tira a linha da árvore DOM
           desenharTabelaAdmin();
           mostrarToast("Peça removida");
         });
         tdAcao.appendChild(botao);
         linha.appendChild(tdAcao);
   
         corpo.appendChild(linha);
       })(produtos[i]);
     }
   }
   
   function celula(texto) {
     var td = document.createElement("td");
     td.textContent = texto;
     return td;
   }
   
   
   /* #########################################################
      pages/relatorio.js
      ######################################################### */
   
   /* --- RELATÓRIO --- */
   // Página restrita: consumidor comum é mandado de volta para o início
   function iniciarRelatorio() {
     if (!exigirAdmin()) return;
   
     desenharRelatorio();
   
     // compra finalizada (ou peça/usuário novo) em outra aba -> relatório atualiza
     aoMudarDados(["verso_pedidos", "verso_produtos", "verso_usuarios"], function (chave) {
       desenharRelatorio();
       if (chave === "verso_pedidos") mostrarToast("Nova venda registrada");
     });
   
     document.getElementById("btnLimparDados").addEventListener("click", function () {
       if (!confirm("Isso apaga produtos, usuários, pedidos e carrinhos. Continuar?")) return;
       restaurarSeed();
       fazerLogout();
       window.location.href = RAIZ + "index.html";
     });
   }
   
   function desenharRelatorio() {
     var produtos = lerProdutos();
     var usuarios = lerUsuarios();
     var pedidos = lerStorage("verso_pedidos") || [];
     var vendas = resumirVendas(pedidos);
   
     animarNumero(document.getElementById("totProdutos"), produtos.length, false);
     animarNumero(document.getElementById("totUsuarios"), usuarios.length, false);
     animarNumero(document.getElementById("totPedidos"), vendas.pedidos, false);
     animarNumero(document.getElementById("totVendido"), vendas.total, true);
     document.getElementById("totCampeao").textContent = produtoMaisVendido(produtos);
   
     desenharPedidos(pedidos, usuarios);
     desenharProdutosRelatorio(produtos);
     desenharUsuarios(usuarios);
   }
   
   function produtoMaisVendido(produtos) {
     if (produtos.length === 0) return "—";
     var campeao = produtos[0];
     var i;
     for (i = 1; i < produtos.length; i++) {
       if (produtos[i].vendidos > campeao.vendidos) campeao = produtos[i];
     }
     return campeao.nome + " (" + campeao.vendidos + ")";
   }
   
   function desenharPedidos(pedidos, usuarios) {
     var corpo = document.getElementById("corpoPedidos");
     corpo.textContent = "";
   
     if (pedidos.length === 0) {
       corpo.appendChild(linhaVazia(6, "Nenhum pedido registrado ainda."));
       return;
     }
   
     var i, j;
     for (i = 0; i < pedidos.length; i++) {
       var pedido = pedidos[i];
       var linha = document.createElement("tr");
       linha.appendChild(celula("#" + pedido.id));
       linha.appendChild(celula(pedido.data));
       linha.appendChild(celula(nomeDoCliente(usuarios, pedido.idUsuario)));
   
       var tdItens = document.createElement("td");
       var lista = document.createElement("ul");
       lista.className = "lista-itens";
       for (j = 0; j < pedido.itens.length; j++) {
         var item = pedido.itens[j];
         var li = document.createElement("li");
         li.textContent = item.quantidade + "x " + item.nome + " (" + item.tamanho + ") — " + formatarPreco(item.preco);
         lista.appendChild(li);
       }
       tdItens.appendChild(lista);
       linha.appendChild(tdItens);
   
       linha.appendChild(celula(pedido.cupom || "—"));
       linha.appendChild(celula(formatarPreco(pedido.total)));
       corpo.appendChild(linha);
     }
   }
   
   function nomeDoCliente(usuarios, id) {
     var i;
     for (i = 0; i < usuarios.length; i++) {
       if (usuarios[i].id === id) return usuarios[i].nome;
     }
     return "—";
   }
   
   function desenharProdutosRelatorio(produtos) {
     var corpo = document.getElementById("corpoProdutosRel");
     corpo.textContent = "";
     var i;
     for (i = 0; i < produtos.length; i++) {
       var p = produtos[i];
       var linha = document.createElement("tr");
       linha.appendChild(celula(String(p.id)));
       linha.appendChild(celula(p.nome));
       linha.appendChild(celula(p.categoria));
       linha.appendChild(celula(p.colecao || "—"));
       linha.appendChild(celula(formatarPreco(p.preco)));
       linha.appendChild(celula(String(p.vendidos)));
       corpo.appendChild(linha);
     }
   }
   
   function desenharUsuarios(usuarios) {
     var corpo = document.getElementById("corpoUsuarios");
     corpo.textContent = "";
     var i;
     for (i = 0; i < usuarios.length; i++) {
       var u = usuarios[i];
       var linha = document.createElement("tr");
       linha.appendChild(celula(String(u.id)));
       linha.appendChild(celula(u.nome));
       linha.appendChild(celula(u.email));
       linha.appendChild(celula(u.tipo));
       corpo.appendChild(linha);
     }
   }
   
   function linhaVazia(colunas, texto) {
     var linha = document.createElement("tr");
     var td = document.createElement("td");
     td.colSpan = colunas;
     td.className = "tabela__vazio";
     td.textContent = texto;
     linha.appendChild(td);
     return linha;
   }
   
   
   /* #########################################################
      main.js
      ######################################################### */
   
   /* ===== INÍCIO =====
      Cada página diz quem é pelo atributo data-pagina do <body>,
      e só o código dela roda. */
   
   aplicarTema(); // antes de pintar a tela, pra não piscar branco no tema escuro
   
   document.addEventListener("DOMContentLoaded", function () {
     semearDados();
     montarCabecalho();
   
     var pagina = document.body.dataset.pagina;
   
     if (pagina === "home") iniciarHome();
     if (pagina === "catalogo") iniciarCatalogo();
     if (pagina === "detalhe") iniciarDetalhe();
     if (pagina === "carrinho") iniciarCarrinho();
     if (pagina === "favoritos") iniciarFavoritos();
     if (pagina === "login") iniciarLogin();
     if (pagina === "admin") iniciarAdmin();
     if (pagina === "relatorio") iniciarRelatorio();
   
     iniciarAnimacoes(); // por último: os blocos já existem na tela
   });
   