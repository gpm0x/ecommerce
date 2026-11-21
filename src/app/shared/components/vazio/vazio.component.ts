import { Component, input, output, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

// Caixa de "lista vazia" com um botão opcional (link ou ação).
//   <div appVazio mensagem="..." textoBotao="Ver catálogo" destino="/produtos"></div>
@Component({
  selector: 'div[appVazio]',
  imports: [RouterLink],
  host: { class: 'vazio' },
  templateUrl: './vazio.component.html',
  styleUrl: './vazio.component.scss',
  // estilos sem encapsulamento: classes como .btn e .card atravessam componentes,
  // como no CSS original
  encapsulation: ViewEncapsulation.None
})
export class VazioComponent {
  readonly mensagem = input.required<string>();
  readonly textoBotao = input('');
  readonly destino = input('');
  readonly acao = output();
}
