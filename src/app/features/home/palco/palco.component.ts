import { Component, OnDestroy, computed, effect, input, signal, untracked, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Colecao, Produto } from '../../../core/models';
import { formatarPreco } from '../../../core/utils/loja.utils';
import { ImgPipe } from '../../../shared/pipes/img.pipe';
import { ReanimarDirective } from '../../../shared/directives/reanimar.directive';

interface Botao { texto: string; preco?: string; link: string; fragmento?: string; queryParams?: Record<string, string>; classe: string; }
interface Cena {
  rotulo: string;      // "Destaque", "Coleção Asfalto"...
  titulo: string;
  detalhe: string;     // cor / categoria, em cinza ao lado do título
  linha: string;
  botoes: Botao[];
  foto: string;
  alt: string;
}

/* ===== PALCO DA HOME =====
   Slideshow do topo: foto grande arredondada, cartão de legenda com o nome
   da peça ou coleção, contador "1 / N", setas, deslize e teclado.
   As cenas saem do catálogo: a peça mais pedida abre, depois uma cena por
   coleção. Cadastrou uma coleção nova no admin? Ela aparece aqui sozinha. */
@Component({
  selector: 'section[appPalco]',
  imports: [RouterLink, ImgPipe, ReanimarDirective],
  host: {
    class: 'palco',
    id: 'palco',
    'aria-roledescription': 'carrossel',
    'aria-label': 'Destaques da VERSO',
    '[class.pausado]': 'pausado()',
    '(mouseenter)': 'pausar()',
    '(mouseleave)': 'reiniciarTimer()',
    '(focusin)': 'pausar()',
    '(focusout)': 'reiniciarTimer()',
    '(keydown.arrowleft)': 'ir(atual() - 1)',
    '(keydown.arrowright)': 'ir(atual() + 1)',
    '(touchstart)': 'inicioToque($event)',
    '(touchend)': 'fimToque($event)'
  },
  templateUrl: './palco.component.html',
  styleUrl: './palco.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class PalcoComponent implements OnDestroy {
  readonly produtos = input.required<Produto[]>();
  readonly colecoes = input.required<Colecao[]>();

  readonly atual = signal(0);
  readonly pausado = signal(false);
  readonly ciclo = signal(1); // reinicia a barra de tempo do ponto ativo

  private timer?: ReturnType<typeof setInterval>;
  private inicioX: number | null = null;
  private semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  readonly cenas = computed(() => roteiroDoPalco(this.produtos(), this.colecoes()));
  readonly totalCenas = computed(() => this.cenas().length);
  readonly sozinha = computed(() => this.totalCenas() < 2);

  constructor() {
    // começa pela primeira cena quando o número de cenas muda
    // (favoritar uma peça na home não deve reiniciar o carrossel)
    effect(() => {
      this.totalCenas();
      untracked(() => { this.mostrar(0); this.reiniciarTimer(); });
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private mostrar(indice: number): void {
    const total = this.cenas().length || 1;
    this.atual.set((indice + total) % total);
    this.ciclo.update(v => v + 1);
  }

  ir(indice: number): void {
    this.mostrar(indice);
    this.reiniciarTimer();
  }

  reiniciarTimer(): void {
    clearInterval(this.timer);
    this.pausado.set(false);
    if (this.semMovimento || this.sozinha()) return;
    this.timer = setInterval(() => this.mostrar(this.atual() + 1), 6500);
  }

  pausar(): void {
    clearInterval(this.timer);
    this.pausado.set(true);
  }

  // deslize no celular
  inicioToque(evento: TouchEvent): void {
    this.inicioX = evento.touches[0].clientX;
  }

  fimToque(evento: TouchEvent): void {
    if (this.inicioX === null) return;
    const distancia = evento.changedTouches[0].clientX - this.inicioX;
    this.inicioX = null;
    if (Math.abs(distancia) < 50) return;
    this.ir(distancia < 0 ? this.atual() + 1 : this.atual() - 1);
  }
}

// Transforma a loja em roteiro de cenas: abertura + uma por coleção.
function roteiroDoPalco(produtos: Produto[], colecoes: Colecao[]): Cena[] {
  const cenas: Cena[] = [{
    rotulo: 'Drop 04',
    titulo: 'O avesso da moda comum',
    detalhe: produtos.length + ' peças no ar',
    linha: 'Peças de rua selecionadas uma a uma. Sem coleção infinita, sem enchimento de vitrine.',
    botoes: [
      { texto: 'Ver coleções', link: '/', fragmento: 'colecoes', classe: 'btn--claro' },
      { texto: 'Comprar agora', link: '/produtos', classe: 'btn--acento' }
    ],
    foto: 'assets/img/vitrine/palco-hero.jpg',
    alt: 'Tênis cano médio preto e amarelo no chão, com uma camisa de basquete dourada ao fundo'
  }];

  for (const c of colecoes) {
    cenas.push({
      rotulo: 'Coleção',
      titulo: c.nome,
      detalhe: c.total + (c.total === 1 ? ' peça' : ' peças') + ' · ' + (c.categoria || 'Variado'),
      linha: c.texto,
      botoes: [
        { texto: 'Peça de capa', link: '/produto/' + c.capa.id, classe: 'btn--claro' },
        { texto: 'Ver coleção', preco: 'a partir de ' + formatarPreco(c.menorPreco), link: '/produtos',
          queryParams: { colecao: c.nome }, classe: 'btn--acento' }
      ],
      foto: c.capa.imagem,
      alt: c.capa.nome + ' na cor ' + c.capa.cor + ', peça da coleção ' + c.nome
    });
  }
  return cenas;
}
