import { ChangeDetectorRef, Component, ElementRef, OnDestroy, WritableSignal, afterNextRender, computed, inject, input, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProdutosService } from '../../core/services/produtos.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { SessaoService } from '../../core/services/sessao.service';
import { ApiService } from '../../core/services/api.service';
import { DadosService } from '../../core/services/dados.service';
import { ToastService } from '../../core/services/toast.service';
import { ItemCarrinho, ItemPedido, Pedido, Produto } from '../../core/models';
import { ESTOQUE_BAIXO, IMAGENS_DISPONIVEIS } from '../../core/config/loja.config';
import { doisDigitos, formatarPreco, semAcento } from '../../core/utils/loja.utils';
import { ContadorDirective } from '../../shared/directives/contador.directive';
import { RevelarDirective } from '../../shared/directives/revelar.directive';
import { ImgPipe } from '../../shared/pipes/img.pipe';
import { PrecoPipe } from '../../shared/pipes/preco.pipe';

type Aba = 'visao' | 'produtos' | 'clientes' | 'pedidos';
interface Barra { rotulo: string; valor: number; texto: string; }
interface ResumoCliente { pedidos: number; total: number; ultimo: Pedido | null; }

const ABAS: Aba[] = ['visao', 'produtos', 'clientes', 'pedidos'];
const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function formularioVazio() {
  return {
    nome: '', categoria: 'Camisetas', colecao: '',
    preco: null as number | null, precoAntigo: null as number | null, estoque: null as number | null,
    cor: '', tamanhos: '', descricao: '',
    imagem: 'assets/img/' + IMAGENS_DISPONIVEIS[0],
    destaque: false, lancamento: false
  };
}

/* --- DASHBOARD DO ADMINISTRADOR (rota protegida por exigirAdmin) ---
   Quatro abas: Visão geral (indicadores e gráficos), Produtos (cadastrar,
   listar, editar e excluir), Clientes e Pedidos. Tudo é computed() em cima
   do localStorage: uma compra feita em outra aba atualiza o painel sozinha. */
@Component({
  selector: 'app-admin',
  imports: [FormsModule, NgTemplateOutlet, ContadorDirective, RevelarDirective, ImgPipe, PrecoPipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  // estilos sem encapsulamento: classes como .btn e .card atravessam componentes,
  // como no CSS original
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnDestroy {
  protected produtos = inject(ProdutosService);
  private pedidosService = inject(PedidosService);
  private sessao = inject(SessaoService);
  private api = inject(ApiService);
  private dados = inject(DadosService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // ?editar=ID (botão "Editar produto" da página da peça)
  readonly editar = input<string>();

  readonly aba = signal<Aba>('visao');
  readonly abas = ABAS;
  readonly nomesAbas: Record<Aba, string> = { visao: 'Visão geral', produtos: 'Produtos', clientes: 'Clientes', pedidos: 'Pedidos' };

  /* ---------- dados base ---------- */
  readonly pedidos = this.pedidosService.lista;
  readonly clientes = this.sessao.clientes;
  readonly lista = this.produtos.lista;

  readonly resumoClientes = computed(() => {
    const resumo: Record<number, ResumoCliente> = {};
    for (const p of this.pedidos()) {
      resumo[p.idUsuario] ??= { pedidos: 0, total: 0, ultimo: null };
      resumo[p.idUsuario].pedidos++;
      resumo[p.idUsuario].total += p.total;
      resumo[p.idUsuario].ultimo = p;
    }
    return resumo;
  });

  /* ---------- visão geral: indicadores ---------- */
  readonly faturamento = computed(() => this.pedidos().reduce((t, p) => t + p.total, 0));
  readonly totalPedidos = computed(() => this.pedidos().length);
  readonly ticket = computed(() => this.totalPedidos() ? this.faturamento() / this.totalPedidos() : 0);
  readonly pecasVendidas = computed(() => this.pedidos().reduce((t, p) => t + p.itens.reduce((s, i) => s + i.quantidade, 0), 0));
  readonly estoqueTotal = computed(() => this.lista().reduce((t, p) => t + estoqueDe(p), 0));
  readonly estoqueBaixo = computed(() =>
    this.lista().filter(p => estoqueDe(p) <= ESTOQUE_BAIXO).sort((a, b) => estoqueDe(a) - estoqueDe(b)));

  /* ---------- visão geral: gráficos (só HTML + CSS, sem biblioteca) ---------- */

  // Colunas com o faturamento de cada um dos últimos 7 dias
  readonly dias = computed(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dias = Array.from({ length: 7 }, (_, i) => {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - (6 - i));
      return { data, total: 0 };
    });
    for (const pedido of this.pedidos()) {
      const data = dataDoPedido(pedido);
      if (!data || isNaN(data.getTime())) continue;
      data.setHours(0, 0, 0, 0);
      const dia = dias.find(d => d.data.getTime() === data.getTime());
      if (dia) dia.total += pedido.total;
    }
    const maior = Math.max(0, ...dias.map(d => d.total));
    return dias.map((d, i) => ({
      total: d.total,
      // dia sem venda ganha um tracinho para o eixo não ficar vazio
      altura: maior > 0 ? Math.max(d.total / maior * 100, 2) : 2,
      hoje: i === 6,
      rotulo: i === 6 ? 'hoje' : DIAS_SEMANA[d.data.getDay()] + ' ' + doisDigitos(d.data.getDate()),
      descricao: doisDigitos(d.data.getDate()) + '/' + doisDigitos(d.data.getMonth() + 1) + ': ' + formatarPreco(d.total)
    }));
  });
  readonly totalSemana = computed(() => this.dias().reduce((t, d) => t + d.total, 0));
  readonly descricaoDias = computed(() => 'Faturamento por dia. ' + this.dias().map(d => d.descricao).join('; '));

  readonly porCategoria = computed(() => {
    const soma: Record<string, number> = {};
    for (const pedido of this.pedidos()) {
      for (const item of pedido.itens) {
        const cat = this.categoriaDoItem(item);
        soma[cat] = (soma[cat] || 0) + item.preco * item.quantidade;
      }
    }
    return emBarras(objetoEmLista(soma, true));
  });

  readonly top = computed(() => emBarras([...this.lista()]
    .sort((a, b) => b.vendidos - a.vendidos).slice(0, 5)
    .map(p => ({ rotulo: p.nome, valor: p.vendidos, texto: p.vendidos + ' un.' }))));

  readonly estoquePorCategoria = computed(() => {
    const soma: Record<string, number> = {};
    for (const p of this.lista()) soma[p.categoria] = (soma[p.categoria] || 0) + estoqueDe(p);
    return emBarras(objetoEmLista(soma, false));
  });

  readonly melhoresClientes = computed(() => emBarras(this.clientes()
    .map(c => ({ c, r: this.resumoDe(c.id) }))
    .filter(({ r }) => r.total > 0)
    .map(({ c, r }) => ({ rotulo: c.nome, valor: r.total,
      texto: formatarPreco(r.total) + ' · ' + r.pedidos + (r.pedidos === 1 ? ' pedido' : ' pedidos') }))
    .sort((a, b) => b.valor - a.valor).slice(0, 5)));

  /* ---------- produtos: formulário (REQUISITO 2) ---------- */
  form = formularioVazio();
  readonly idEmEdicao = signal<number | null>(null);
  readonly erroProduto = signal('');
  readonly opcoesCategoria = signal(['Camisetas', 'Calças', 'Tênis', 'Conjuntos', 'Chinelos']);
  readonly opcoesColecao = signal(['Asfalto', 'Quadra', 'Verão 88']);
  readonly opcoesImagem = signal(IMAGENS_DISPONIVEIS.map(i => 'assets/img/' + i));
  private secaoForm = viewChild.required<ElementRef<HTMLElement>>('secaoForm');
  private campoNome = viewChild.required<ElementRef<HTMLInputElement>>('campoNome');
  private campoEstoque = viewChild.required<ElementRef<HTMLInputElement>>('campoEstoque');

  /* ---------- produtos: tabela ---------- */
  readonly buscaProduto = signal('');
  readonly filtroCategoria = signal('');
  readonly categorias = computed(() => this.produtos.listaUnica('categoria'));
  readonly produtosFiltrados = computed(() => {
    const termo = semAcento(this.buscaProduto().trim());
    const categoria = this.categorias().includes(this.filtroCategoria()) ? this.filtroCategoria() : '';
    return this.lista().filter(p =>
      (!categoria || p.categoria === categoria) &&
      (!termo || semAcento(p.nome + ' ' + p.cor + ' ' + (p.colecao || '')).includes(termo)));
  });

  /* ---------- clientes ---------- */
  readonly buscaCliente = signal('');
  readonly idClienteAberto = signal<number | null>(null);
  readonly clientesFiltrados = computed(() => {
    const termo = semAcento(this.buscaCliente().trim());
    return this.clientes().filter(c => !termo || semAcento(c.nome + ' ' + c.email).includes(termo));
  });

  // Ficha com os dados e o histórico de compras do cliente escolhido
  readonly ficha = computed(() => {
    const cliente = this.clientes().find(c => c.id === this.idClienteAberto());
    if (!cliente) return null;
    const r = this.resumoDe(cliente.id);
    const carrinho = this.carrinhos().find(c => c.id === cliente.id)?.itens ?? [];
    const favoritos = this.favoritosClientes().find(f => f.id === cliente.id)?.produtos ?? [];
    return {
      cliente,
      pedidos: this.pedidos().filter(p => p.idUsuario === cliente.id).reverse(),
      dados: [
        ['ID do cliente', '#' + cliente.id],
        ['Pedidos', String(r.pedidos)],
        ['Total gasto', formatarPreco(r.total)],
        ['Ticket médio', formatarPreco(r.pedidos ? r.total / r.pedidos : 0)],
        ['Peças no carrinho', String(carrinho.reduce((t, i) => t + i.quantidade, 0))],
        ['Favoritos', String(favoritos.length)]
      ]
    };
  });

  // carrinhos e favoritos de todos os clientes (usados na ficha)
  readonly carrinhos = signal<{ id: number; itens: ItemCarrinho[] }[]>([]);
  readonly favoritosClientes = signal<{ id: number; produtos: number[] }[]>([]);
  private timer: ReturnType<typeof setInterval>;
  private primeiraCarga = true;

  /* ---------- pedidos (mais recente primeiro) ---------- */
  readonly pedidosRecentes = computed(() => [...this.pedidos()].reverse());

  constructor() {
    // busca tudo na API ao abrir e depois a cada 5s: uma compra feita
    // por um cliente em outro navegador aparece aqui sem recarregar
    this.atualizar();
    this.timer = setInterval(() => this.atualizar(), 5000);

    // aba inicial: veio do "Editar produto" (?editar=ID) ou de um link com #produtos, #clientes...
    afterNextRender(() => {
      const paraEditar = this.produtos.buscar(this.editar());
      if (paraEditar) {
        this.mostrarAba('produtos');
        this.entrarEmEdicao(paraEditar);
      } else {
        const hash = window.location.hash.replace('#', '') as Aba;
        this.mostrarAba(ABAS.includes(hash) ? hash : 'visao');
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private async atualizar(): Promise<void> {
    const antes = this.pedidos().length;
    try {
      const [carrinhos, favoritos] = await Promise.all([
        this.api.listar<{ id: number; itens: ItemCarrinho[] }>('carrinhos'),
        this.api.listar<{ id: number; produtos: number[] }>('favoritos'),
        this.pedidosService.carregar(),
        this.produtos.carregar(),
        this.sessao.carregarUsuarios()
      ]);
      this.carrinhos.set(carrinhos);
      this.favoritosClientes.set(favoritos);
      if (this.primeiraCarga) this.primeiraCarga = false;
      else if (this.pedidos().length > antes) this.toast.mostrar('Nova venda registrada');
    } catch {
      // API fora do ar: o aviso do topo já explica; tenta de novo no próximo ciclo
    }
  }

  mostrarAba(nome: Aba): void {
    this.aba.set(nome);
    // guarda a aba no endereço sem pular a página
    history.replaceState(history.state, '', location.pathname + location.search + '#' + nome);
  }

  /* ---------- ajudantes ---------- */
  estoqueDe = estoqueDe;

  resumoDe(id: number): ResumoCliente {
    return this.resumoClientes()[id] || { pedidos: 0, total: 0, ultimo: null };
  }

  classeEstoque(p: Produto): string {
    const qtd = estoqueDe(p);
    if (qtd === 0) return 'selo-estoque selo-estoque--zerado';
    if (qtd <= ESTOQUE_BAIXO) return 'selo-estoque selo-estoque--baixo';
    return 'selo-estoque';
  }

  textoEstoque(p: Produto): string {
    return estoqueDe(p) === 0 ? 'esgotado' : estoqueDe(p) + ' un.';
  }

  nomeDoCliente(id: number): string {
    return this.sessao.usuarios().find(u => u.id === id)?.nome ?? '—';
  }

  // Pedidos novos guardam a categoria do item; nos antigos procura pelo nome
  private categoriaDoItem(item: ItemPedido): string {
    if (item.categoria) return item.categoria;
    return this.lista().find(p => p.id === item.idProduto || p.nome === item.nome)?.categoria ?? 'Outros';
  }

  /* ---------- produtos: cadastrar e editar ---------- */

  async salvarProduto(evento: Event): Promise<void> {
    evento.preventDefault();
    const f = this.form;
    const nome = f.nome.trim();
    const preco = Number(f.preco);
    const estoque = f.estoque;
    const tamanhos = f.tamanhos.split(',').map(t => t.trim().toUpperCase()).filter(t => t);

    if (nome.length < 3) { this.erroProduto.set('Dê um nome à peça.'); return; }
    if (f.preco === null || isNaN(preco) || preco <= 0) { this.erroProduto.set('Informe um preço maior que zero.'); return; }
    if (estoque === null || isNaN(estoque) || estoque < 0 || Math.floor(estoque) !== estoque) {
      this.erroProduto.set('Informe o estoque em unidades (0 ou mais).'); return;
    }
    if (tamanhos.length === 0) { this.erroProduto.set('Informe ao menos um tamanho.'); return; }

    // na edição a peça mantém o id e as vendas que já tinha
    const original = this.idEmEdicao() !== null ? this.produtos.buscar(this.idEmEdicao()) : null;

    // peça nova vai sem id: a API gera
    const peca: Omit<Produto, 'id'> = {
      nome,
      categoria: f.categoria,
      preco,
      descricao: f.descricao.trim() || 'Peça da loja VERSO.',
      tamanhos,
      cor: f.cor.trim() || 'Única',
      imagem: f.imagem,
      destaque: f.destaque,
      lancamento: f.lancamento,
      vendidos: original ? original.vendidos : 0,
      estoque,
      colecao: f.colecao
    };
    if (f.precoAntigo !== null && f.precoAntigo > preco) peca.precoAntigo = f.precoAntigo;

    try {
      if (original) {
        await this.produtos.atualizar({ ...peca, id: original.id });
        this.toast.mostrar(nome + ' atualizada');
      } else {
        await this.produtos.adicionar(peca);
        this.toast.mostrar(nome + ' entrou no catálogo');
      }
    } catch {
      this.erroProduto.set('Não foi possível salvar na API. Ela está ligada?');
      return;
    }
    this.sairDaEdicao();
  }

  // Joga a peça no formulário e troca os textos para o modo "editar"
  entrarEmEdicao(produto: Produto, focarEstoque = false): void {
    this.idEmEdicao.set(produto.id);
    // coleção, categoria ou imagem fora da lista ganham a opção na hora
    garantirOpcao(this.opcoesCategoria, produto.categoria);
    if (produto.colecao) garantirOpcao(this.opcoesColecao, produto.colecao);
    garantirOpcao(this.opcoesImagem, produto.imagem);

    this.form = {
      nome: produto.nome,
      categoria: produto.categoria,
      colecao: produto.colecao || '',
      preco: produto.preco,
      precoAntigo: produto.precoAntigo ?? null,
      estoque: estoqueDe(produto),
      cor: produto.cor,
      tamanhos: produto.tamanhos.join(', '),
      descricao: produto.descricao,
      imagem: produto.imagem,
      destaque: !!produto.destaque,
      lancamento: !!produto.lancamento
    };
    this.erroProduto.set('');
    this.cdr.markForCheck(); // o form é um objeto comum (ngModel), não um signal

    setTimeout(() => {
      this.secaoForm().nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      (focarEstoque ? this.campoEstoque() : this.campoNome()).nativeElement.focus({ preventScroll: true });
    });
  }

  repor(produto: Produto): void {
    this.mostrarAba('produtos');
    this.entrarEmEdicao(produto, true);
  }

  // Limpa o formulário e volta para o modo "nova peça"
  sairDaEdicao(): void {
    this.idEmEdicao.set(null);
    this.form = formularioVazio();
    this.erroProduto.set('');
    this.cdr.markForCheck();
  }

  // REQUISITO 2: excluir da base
  async excluir(produto: Produto): Promise<void> {
    if (!confirm('Excluir "' + produto.nome + '" do catálogo?')) return;
    try {
      await this.produtos.remover(produto.id);
    } catch {
      this.toast.mostrar('Não foi possível excluir. A API está ligada?');
      return;
    }
    if (this.idEmEdicao() === produto.id) this.sairDaEdicao();
    this.toast.mostrar('Produto excluído');
  }

  /* ---------- clientes ---------- */
  abrirFicha(id: number, ficha: HTMLElement): void {
    this.idClienteAberto.set(id);
    setTimeout(() => ficha.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  /* ---------- zona de perigo ---------- */
  async limparDados(): Promise<void> {
    if (!confirm('Isso devolve o api/db.json ao estado inicial: produtos, usuários, pedidos e carrinhos. Continuar?')) return;
    try {
      await this.dados.restaurar();
    } catch {
      this.toast.mostrar('Não foi possível limpar os dados. A API está ligada?');
      return;
    }
    this.sessao.logout();
    this.router.navigateByUrl('/');
  }
}

/* ---------- funções puras do dashboard ---------- */

function estoqueDe(produto: Produto): number {
  return typeof produto.estoque === 'number' ? produto.estoque : 0;
}

// Pedidos novos guardam dataISO; os antigos só têm "dd/mm/aaaa, hh:mm:ss"
function dataDoPedido(pedido: Pedido): Date | null {
  if (pedido.dataISO) return new Date(pedido.dataISO);
  const partes = String(pedido.data || '').split(/[\/,\s:]+/);
  if (partes.length < 3) return null;
  return new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
}

// { "Tênis": 10, ... } -> [{rotulo, valor, texto}] em ordem decrescente
function objetoEmLista(objeto: Record<string, number>, ehDinheiro: boolean): Barra[] {
  return Object.entries(objeto)
    .map(([rotulo, valor]) => ({ rotulo, valor, texto: ehDinheiro ? formatarPreco(valor) : valor + ' un.' }))
    .sort((a, b) => b.valor - a.valor);
}

// Barras horizontais: a maior ocupa 100% e as outras são proporcionais
function emBarras(lista: Barra[]): (Barra & { largura: number })[] {
  const maior = Math.max(0, ...lista.map(b => b.valor));
  return lista.map(b => ({ ...b, largura: maior > 0 ? b.valor / maior * 100 : 0 }));
}

function garantirOpcao(opcoes: WritableSignal<string[]>, valor: string): void {
  if (!opcoes().includes(valor)) opcoes.update(lista => [...lista, valor]);
}
