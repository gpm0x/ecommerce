import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'footer[appRodape]',
  imports: [RouterLink],
  host: { class: 'rodape' },
  templateUrl: './rodape.component.html',
  styleUrl: './rodape.component.scss',
  // estilos sem encapsulamento: classes como .btn e .card atravessam componentes,
  // como no CSS original
  encapsulation: ViewEncapsulation.None
})
export class RodapeComponent {
  readonly ano = new Date().getFullYear();
}
