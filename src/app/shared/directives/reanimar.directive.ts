import { Directive, ElementRef, effect, inject, input } from '@angular/core';

// Reinicia uma animação CSS sempre que o gatilho muda (e não é 0/falso):
// tira a classe, força o navegador a recalcular e devolve a classe.
// O CSS faz o movimento; a diretiva só troca a classe.
//   <span [appReanimar]="ui.pulsoCarrinho()" reanimarClasse="pulsa">
@Directive({ selector: '[appReanimar]' })
export class ReanimarDirective {
  readonly gatilho = input<unknown>(0, { alias: 'appReanimar' });
  readonly classe = input.required<string>({ alias: 'reanimarClasse' });

  constructor() {
    const el: HTMLElement = inject(ElementRef).nativeElement;
    effect(() => {
      const gatilho = this.gatilho();
      const classe = this.classe();
      if (!gatilho) return;
      el.classList.remove(classe);
      void el.offsetWidth; // leitura que obriga o recálculo
      el.classList.add(classe);
    });
  }
}
