import { Component, OnDestroy, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProdutosService } from '../../core/services/produtos.service';
import { StorageService } from '../../core/services/storage.service';
import { DadosService } from '../../core/services/dados.service';
import { FRETE_GRATIS, PARCELAS } from '../../core/config/loja.config';
import { doisDigitos } from '../../core/utils/loja.utils';
import { CardProdutoComponent } from '../../shared/components/card-produto/card-produto.component';
import { VazioComponent } from '../../shared/components/vazio/vazio.component';
import { RevelarDirective } from '../../shared/directives/revelar.directive';
import { ImgPipe } from '../../shared/pipes/img.pipe';
import { PalcoComponent } from './palco/palco.component';

interface ParteRelogio { valor: string; rotulo: string; }

/* REQUISITO 5: página inicial com menu, logo, informação do site e produtos na tela */
@Component({
  selector: 'app-home',
  imports: [RouterLink, CardProdutoComponent, VazioComponent, RevelarDirective, ImgPipe, PalcoComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  // estilos sem encapsulamento: classes como .btn e .card atravessam componentes,
  // como no CSS original
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnDestroy {
  protected produtos = inject(ProdutosService);
  private storage = inject(StorageService);
  private dados = inject(DadosService);

  readonly freteGratis = FRETE_GRATIS;
  readonly parcelas = PARCELAS;

  // Lançamentos (se nenhum estiver marcado, os 8 primeiros)
  readonly lancamentos = computed(() => {
    const lista = this.produtos.lista().filter(p => p.lancamento);
    return (lista.length ? lista : this.produtos.lista()).slice(0, 8);
  });

  // DIFERENCIAL 12: mais vendidos da semana (com ranking)
  readonly vendidos = computed(() =>
    [...this.produtos.lista()].sort((a, b) => b.vendidos - a.vendidos).slice(0, 8));

  // atalhos por categoria (abrem o catálogo já filtrado)
  readonly categorias = ['Tênis', 'Camisetas', 'Calças', 'Conjuntos', 'Chinelos'];

  readonly beneficios = [
    'Frete grátis acima de R$ ' + FRETE_GRATIS,
    'Troca em 30 dias',
    'Pix, boleto ou ' + PARCELAS + 'x sem juros',
    'Envio em 24h',
    'Retirada em Guarulhos',
    'Foto real de cada peça'
  ];

  /* --- DIFERENCIAL 11: contagem regressiva do próximo drop --- */
  readonly relogio = signal<ParteRelogio[]>(this.partes(0, 0, 0, 0));
  private timerDrop: ReturnType<typeof setInterval>;

  constructor() {
    this.tique();
    this.timerDrop = setInterval(() => this.tique(), 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timerDrop);
  }

  private tique(): void {
    let restante = (this.storage.ler<number>('verso_drop_fim') || 0) - Date.now();
    if (restante <= 0) {
      this.dados.garantirDrop();
      restante = (this.storage.ler<number>('verso_drop_fim') || 0) - Date.now();
    }
    const segundos = Math.max(0, Math.floor(restante / 1000));
    this.relogio.set(this.partes(
      Math.floor(segundos / 86400),
      Math.floor((segundos % 86400) / 3600),
      Math.floor((segundos % 3600) / 60),
      segundos % 60
    ));
  }

  private partes(d: number, h: number, m: number, s: number): ParteRelogio[] {
    return [
      { valor: doisDigitos(d), rotulo: 'dias' },
      { valor: doisDigitos(h), rotulo: 'horas' },
      { valor: doisDigitos(m), rotulo: 'min' },
      { valor: doisDigitos(s), rotulo: 'seg' }
    ];
  }
}
