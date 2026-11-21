import { Directive, ElementRef, OnDestroy, effect, inject, input } from '@angular/core';
import { formatarPreco } from '../../core/utils/loja.utils';

// DIFERENCIAL: número do dashboard sobe de 0 até o valor final.
//   <span [appContador]="faturamento()" [dinheiro]="true">
@Directive({ selector: '[appContador]' })
export class ContadorDirective implements OnDestroy {
  readonly valor = input(0, { alias: 'appContador' });
  readonly dinheiro = input(false);
  private timer?: ReturnType<typeof setInterval>;

  constructor() {
    const el: HTMLElement = inject(ElementRef).nativeElement;
    effect(() => {
      const final = this.valor();
      const ehDinheiro = this.dinheiro();
      clearInterval(this.timer);
      const passos = 30;
      let passo = 0;
      this.timer = setInterval(() => {
        passo++;
        const parcial = final * passo / passos;
        el.textContent = ehDinheiro ? formatarPreco(parcial) : String(Math.round(parcial));
        if (passo >= passos) clearInterval(this.timer);
      }, 20);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
