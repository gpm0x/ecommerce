import { Component, ElementRef, computed, inject, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessaoService } from '../../core/services/sessao.service';
import { CarrinhoService } from '../../core/services/carrinho.service';
import { FavoritosService } from '../../core/services/favoritos.service';
import { ProdutosService } from '../../core/services/produtos.service';
import { ToastService } from '../../core/services/toast.service';
import { UiService } from '../../core/services/ui.service';
import { ImgPipe } from '../../shared/pipes/img.pipe';
import { PrecoPipe } from '../../shared/pipes/preco.pipe';
import { ReanimarDirective } from '../../shared/directives/reanimar.directive';

/* ===== CABEÇALHO (todas as páginas) =====
   O seletor é o próprio <header>: assim o position: sticky do CSS continua
   valendo (um elemento <app-...> em volta prenderia o sticky). */
@Component({
  selector: 'header[appCabecalho]',
  imports: [RouterLink, RouterLinkActive, FormsModule, ImgPipe, PrecoPipe, ReanimarDirective],
  host: {
    class: 'cabecalho',
    '[class.compacto]': 'compacto()',
    '[class.escondido]': 'escondido()',
    '(window:scroll)': 'aoRolar()',
    '(window:resize)': 'remedirIndicador()',
    '(document:click)': 'cliqueFora($event)'
  },
  templateUrl: './cabecalho.component.html',
  styleUrl: './cabecalho.component.scss',
  // estilos sem encapsulamento: classes como .btn e .card atravessam componentes,
  // como no CSS original
  encapsulation: ViewEncapsulation.None
})
export class CabecalhoComponent {
  protected sessao = inject(SessaoService);
  protected carrinho = inject(CarrinhoService);
  protected favoritos = inject(FavoritosService);
  protected ui = inject(UiService);
  private produtos = inject(ProdutosService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private host: HTMLElement = inject(ElementRef).nativeElement;

  private menu = viewChild.required<ElementRef<HTMLElement>>('menu');
  private campoBusca = viewChild<ElementRef<HTMLInputElement>>('campoBusca');

  // DIFERENCIAL 1: menu hambúrguer no celular (vira tela cheia)
  readonly menuAberto = signal(false);
  readonly buscaAberta = signal(false);
  readonly termo = signal('');
  readonly sugestoesFechadas = signal(false);

  readonly compacto = signal(false);
  readonly escondido = signal(false);
  readonly progresso = signal(0);
  readonly indicador = signal<{ left: number; width: number } | null>(null);
  private ultimaPosicao = 0;

  readonly primeiroNome = computed(() => this.sessao.usuario()?.nome.split(' ')[0] ?? '');

  // DIFERENCIAL: a busca mostra sugestões com foto enquanto você digita
  readonly sugestoesVisiveis = computed(() => this.termo().trim().length >= 2 && !this.sugestoesFechadas());
  readonly sugestoes = computed(() => this.produtos.procurar(this.termo().trim().toLowerCase()).slice(0, 5));

  constructor() {
    // cada troca de página fecha menu e busca (como um recarregamento faria)
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed()).subscribe(() => {
      this.fecharMenu();
      this.buscaAberta.set(false);
      this.fecharSugestoes();
      setTimeout(() => this.remedirIndicador()); // o routerLinkActive já marcou o link
    });
    document.fonts?.ready.then(() => this.remedirIndicador());
  }

  alternarMenu(): void {
    this.menuAberto.update(v => !v);
    document.body.classList.toggle('sem-rolagem', this.menuAberto());
  }

  private fecharMenu(): void {
    if (!this.menuAberto()) return;
    this.menuAberto.set(false);
    document.body.classList.remove('sem-rolagem');
  }

  alternarBusca(): void {
    this.buscaAberta.update(v => !v);
    if (this.buscaAberta()) setTimeout(() => this.campoBusca()?.nativeElement.focus());
  }

  buscar(evento: Event): void {
    evento.preventDefault();
    this.router.navigate(['/produtos'], { queryParams: { busca: this.termo() } });
  }

  digitou(valor: string): void {
    this.termo.set(valor);
    this.sugestoesFechadas.set(false);
  }

  fecharSugestoes(): void {
    this.sugestoesFechadas.set(true);
  }

  cliqueFora(evento: Event): void {
    const form = this.host.querySelector('.busca-topo');
    if (form && !form.contains(evento.target as Node)) this.fecharSugestoes();
  }

  // Fora da página do carrinho, o ícone abre a gaveta em vez de trocar de página
  abrirCarrinho(evento: Event): void {
    evento.preventDefault();
    if (this.router.url.startsWith('/carrinho')) return;
    this.ui.abrirGaveta();
  }

  sair(evento: Event): void {
    evento.preventDefault();
    this.sessao.logout();
    this.toast.mostrar('Você saiu da conta');
    setTimeout(() => this.router.navigateByUrl('/'), 600);
  }

  /* --- efeitos de rolagem --- */
  aoRolar(): void {
    const posicao = window.scrollY;

    // DIFERENCIAL: o cabeçalho encolhe e ganha sombra depois de rolar um pouco
    this.compacto.set(posicao > 40);

    // DIFERENCIAL: barra fina mostrando quanto da página já foi rolado
    const rolavel = document.body.scrollHeight - window.innerHeight;
    this.progresso.set(rolavel > 0 ? (posicao / rolavel) * 100 : 0);

    // DIFERENCIAL: o header sai de cena ao descer e volta ao subir
    // (com busca ou menu abertos ele nunca some)
    if (this.buscaAberta() || this.menuAberto()) {
      this.escondido.set(false);
    } else {
      this.escondido.set(posicao > this.ultimaPosicao && posicao > 260);
    }
    this.ultimaPosicao = posicao;
  }

  /* --- DIFERENCIAL: risco que desliza por baixo do link do menu ---
     O link da página atual já é uma cápsula, então nele o risco some. */
  moverIndicador(link: EventTarget | null): void {
    const a = link as HTMLElement | null;
    if (!a || a.classList.contains('ativo')) {
      this.indicador.set(null);
      return;
    }
    this.indicador.set({ left: a.offsetLeft, width: a.offsetWidth });
  }

  remedirIndicador(): void {
    this.moverIndicador(this.menu().nativeElement.querySelector('a.ativo'));
  }
}
