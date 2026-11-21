import { Directive, ElementRef, OnDestroy, inject } from '@angular/core';

// DIFERENCIAL: os blocos aparecem conforme entram na tela.
//   <section class="secao" appRevelar>
@Directive({ selector: '[appRevelar]', host: { class: 'revelar' } })
export class RevelarDirective implements OnDestroy {
  private el: HTMLElement = inject(ElementRef).nativeElement;
  private observador?: IntersectionObserver;
  private timer: ReturnType<typeof setTimeout>;

  constructor() {
    if (!('IntersectionObserver' in window)) {
      this.el.classList.add('visivel');
    } else {
      this.observador = new IntersectionObserver(entradas => {
        if (!entradas.some(e => e.isIntersecting)) return;
        this.el.classList.add('visivel');
        this.observador?.disconnect(); // revela uma vez só
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      this.observador.observe(this.el);
    }

    // Rede de segurança: se depois de 1,5s nenhum bloco tiver aparecido,
    // o observer não funcionou — então mostramos tudo.
    this.timer = setTimeout(() => {
      if (!document.querySelector('.revelar.visivel')) this.el.classList.add('visivel');
    }, 1500);
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
    clearTimeout(this.timer);
  }
}
