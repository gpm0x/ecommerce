import { Component, inject, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CabecalhoComponent } from './layout/cabecalho/cabecalho.component';
import { RodapeComponent } from './layout/rodape/rodape.component';
import { GavetaComponent } from './layout/gaveta/gaveta.component';
import { ToastService } from './core/services/toast.service';
import { ApiService } from './core/services/api.service';

/* Moldura comum a todas as páginas: faixa de aviso, cabeçalho,
   a página da rota atual, rodapé, gaveta do carrinho e toasts. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CabecalhoComponent, RodapeComponent, GavetaComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  // estilos sem encapsulamento: classes como .btn e .card atravessam componentes,
  // como no CSS original
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  protected toasts = inject(ToastService);
  protected api = inject(ApiService);

  pular(evento: Event): void {
    evento.preventDefault();
    const main = document.getElementById('conteudo');
    main?.setAttribute('tabindex', '-1');
    main?.focus();
  }
}
