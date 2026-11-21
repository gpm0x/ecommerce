# VERSO — e-commerce de streetwear (Angular + API em JSON)

Loja feita em **Angular 21** (componentes standalone, signals, sem zone.js) com estilos em **SCSS**.
O banco de dados não é MySQL nem Supabase: é o arquivo **`api/db.json`**, servido como API REST pelo **json-server**.

## Rodar

```bash
npm install
npm run dev        # sobe a API (porta 3000) e o site (porta 4200) juntos
```

| Comando | O que faz |
|---|---|
| `npm run dev` | API + site ao mesmo tempo |
| `npm run api` | só a API — http://localhost:3000 |
| `npm start` | só o site — http://localhost:4200 |
| `npm run api:reset` | devolve o `db.json` ao estado inicial (`db.seed.json`) |
| `npm run build` | gera a versão final em `dist/` |

Se o site abrir sem a API ligada, aparece um aviso vermelho no topo explicando o que rodar.

Contas de teste: `admin@verso.com` / `admin123` e `cliente@verso.com` / `cliente123`.

## Site publicado (Vercel)

https://verso-streetwear.vercel.app

Na Vercel só ficam os arquivos do `npm run build` — não existe json-server lá. Por isso o build de produção
usa o **modo local** do `ApiService` (`environment.apiUrl` vazio): as mesmas rotas (`/produtos`, `/usuarios`,
`/pedidos`...) são respondidas no próprio navegador, começando pelos dados de `api/db.seed.json` e gravando no
localStorage (chave `verso_db`). Login, cadastro de conta, cadastro/edição de produto, carrinho, cupom e pedidos
funcionam normalmente; os dados ficam salvos naquele navegador. O botão "Limpar e recriar" do dashboard volta tudo
ao estado inicial.

No `npm run dev` (configuração `development`) o site continua usando a API de verdade em `http://localhost:3000`.
A configuração da Vercel está em `vercel.json`.

## A API (`api/`)

```
api/
├── db.json        # O BANCO: tudo que o sistema grava e lê
├── db.seed.json   # cópia com os dados iniciais (usada pelo reset)
└── server.js      # json-server + rota POST /reset
```

Cada lista do `db.json` vira uma rota REST com `GET`, `POST`, `PUT`, `PATCH` e `DELETE`:

| Coleção | Rota | Conteúdo |
|---|---|---|
| `produtos` | `/produtos` | catálogo: preço, tamanhos, cor, imagem, estoque, vendidos, coleção |
| `colecoes` | `/colecoes` | texto de vitrine de cada coleção (`id` = nome da coleção) |
| `cupons` | `/cupons` | `id` = código do cupom, `porcentagem` = desconto |
| `usuarios` | `/usuarios` | contas (`tipo`: `admin` ou `cliente`) |
| `pedidos` | `/pedidos` | pedidos fechados no carrinho |
| `carrinhos` | `/carrinhos` | carrinho de cada usuário (`id` = id do usuário) |
| `favoritos` | `/favoritos` | favoritos de cada usuário (`id` = id do usuário) |

**Cadastrar dados à mão:** é só editar o `api/db.json` (com a API ligada ou não). Ele é relido sozinho.
Exemplos: um cupom novo é `{ "id": "BLACK30", "porcentagem": 30 }` dentro de `cupons`; um produto novo
precisa de `id`, `nome`, `categoria`, `preco`, `descricao`, `tamanhos`, `cor`, `imagem` (caminho em
`public/assets/img/`), `destaque`, `lancamento`, `vendidos`, `estoque` e `colecao`.

Fica no navegador (localStorage), por ser de cada visitante: a sessão de quem está logado, o tema,
o carrinho/favoritos de quem ainda não entrou, os "vistos recentemente" e o relógio do drop.

> Trabalho acadêmico: as senhas ficam em texto puro no `db.json` e o login é conferido no navegador.
> Num sistema real isso seria feito por um backend com senha criptografada.

## Estrutura do código

```
src/
├── app/
│   ├── core/                      # regras da loja (sem tela)
│   │   ├── config/                # constantes da loja
│   │   ├── guards/                # rotas protegidas (login e admin)
│   │   ├── models/                # interfaces: Produto, Usuario, Pedido...
│   │   ├── services/              # api, sessão, produtos, carrinho, favoritos, pedidos...
│   │   ├── utils/                 # formatação de preço, busca sem acento...
│   │   └── validators/            # regras de e-mail e senha
│   ├── features/                  # uma pasta por tela (cada uma é uma rota)
│   │   ├── home/                  # + palco/ (carrossel do topo)
│   │   ├── catalogo/  produto-detalhe/  carrinho/  favoritos/
│   │   ├── auth/login/
│   │   ├── admin/                 # dashboard do administrador
│   │   └── relatorio/
│   ├── layout/                    # cabeçalho, rodapé e gaveta do mini-carrinho
│   ├── shared/                    # components/, directives/, pipes/
│   └── app.component.*  app.config.ts  app.routes.ts
├── environments/environment.ts    # endereço da API
├── styles/                        # SCSS global: tokens, base, botões, layout, formulários...
└── styles.scss                    # junta os globais
```

Cada componente tem seu `.component.ts`, `.component.html` e, quando tem estilo próprio,
seu `.component.scss`. Os componentes usam `ViewEncapsulation.None`: classes como `.btn`
e `.card` aparecem em várias telas, então os estilos valem para a página toda, como no CSS original.
Em `src/styles/` fica só o que é compartilhado pelo site inteiro.

## Rotas

| Rota | Tela | Acesso |
|---|---|---|
| `/` | Home | livre |
| `/produtos` (`?busca=`, `?categoria=`, `?colecao=`, `?ordem=`) | Catálogo | livre |
| `/produto/:id` | Detalhe do produto | livre |
| `/carrinho` | Carrinho | livre (finalizar exige login) |
| `/favoritos` | Favoritos | login |
| `/login` | Entrar / criar conta | livre |
| `/admin` | Dashboard (atualiza sozinho a cada 5s) | admin |
| `/relatorio` | Relatório | admin |
