import { Component, input, output, ViewEncapsulation } from '@angular/core';

// Controle "−  1  +" usado na página do produto e no carrinho.
// (mudar) emite -1 ou +1; quem usa decide o que fazer com isso.
@Component({
  selector: 'div[appQuantidade]',
  host: { class: 'quantidade' },
  templateUrl: './quantidade.component.html',
  styleUrl: './quantidade.component.scss',
  // estilos sem encapsulamento: classes como .btn e .card atravessam componentes,
  // como no CSS original
  encapsulation: ViewEncapsulation.None
})
export class QuantidadeComponent {
  readonly valor = input.required<number>();
  readonly nomeProduto = input('');
  readonly mudar = output<number>();

  sufixo(): string {
    return this.nomeProduto() ? ' de ' + this.nomeProduto() : '';
  }
}
