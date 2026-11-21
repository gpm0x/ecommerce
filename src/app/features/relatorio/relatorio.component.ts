import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ProdutosService } from '../../core/services/produtos.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { SessaoService } from '../../core/services/sessao.service';
import { DadosService } from '../../core/services/dados.service';
import { ContadorDirective } from '../../shared/directives/contador.directive';
import { RevelarDirective } from '../../shared/directives/revelar.directive';
import { PrecoPipe } from '../../shared/pipes/preco.pipe';

/* --- RELATÓRIO (REQUISITO 3: relatório do que está armazenado) --- */
@Component({
  selector: 'app-relatorio',
  imports: [ContadorDirective, RevelarDirective, PrecoPipe],
  templateUrl: './relatorio.component.html'
})
export class RelatorioComponent {
  protected produtos = inject(ProdutosService);
  protected pedidos = inject(PedidosService);
  protected sessao = inject(SessaoService);
  private dados = inject(DadosService);
  private router = inject(Router);

  readonly totalVendido = computed(() => this.pedidos.lista().reduce((t, p) => t + p.total, 0));
  readonly campeao = computed(() =>
    [...this.produtos.lista()].sort((a, b) => b.vendidos - a.vendidos)[0]?.nome ?? '—');
  readonly pedidosRecentes = computed(() => [...this.pedidos.lista()].reverse());

  constructor() {
    // pedidos e usuários vêm da API ao abrir a página
    this.pedidos.carregar().catch(() => {});
    this.sessao.carregarUsuarios().catch(() => {});
  }

  nomeDoCliente(id: number): string {
    return this.sessao.usuarios().find(u => u.id === id)?.nome ?? '—';
  }

  async limparDados(): Promise<void> {
    if (!confirm('Isso devolve o api/db.json ao estado inicial: produtos, usuários, pedidos e carrinhos. Continuar?')) return;
    try {
      await this.dados.restaurar();
    } catch {
      return;
    }
    this.sessao.logout();
    this.router.navigateByUrl('/');
  }
}
