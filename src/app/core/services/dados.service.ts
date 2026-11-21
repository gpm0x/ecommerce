import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { ApiService } from './api.service';
import { ProdutosService } from './produtos.service';
import { SessaoService } from './sessao.service';
import { PedidosService } from './pedidos.service';
import { DIAS_DO_DROP } from '../config/loja.config';

/* ===== DADOS DA LOJA =====
   Relógio do drop (localStorage) e o "Limpar e recriar" do dashboard,
   que devolve o api/db.json ao estado inicial (api/db.seed.json). */
@Injectable({ providedIn: 'root' })
export class DadosService {
  private storage = inject(StorageService);
  private api = inject(ApiService);
  private produtos = inject(ProdutosService);
  private sessao = inject(SessaoService);
  private pedidos = inject(PedidosService);

  // Cria o fim do drop na primeira visita; se já passou, marca um novo.
  garantirDrop(): void {
    const fim = this.storage.ler<number>('verso_drop_fim');
    if (!fim || fim < Date.now()) {
      this.storage.salvar('verso_drop_fim', Date.now() + DIAS_DO_DROP * 24 * 60 * 60 * 1000);
    }
  }

  // A rota POST /reset (api/server.js) copia o db.seed.json por cima do db.json.
  // No navegador, limpa as chaves da loja (o tema fica).
  async restaurar(): Promise<void> {
    await this.api.criar('reset', {});
    this.storage.chaves()
      .filter(chave => chave.startsWith('verso_') && chave !== 'verso_tema')
      .forEach(chave => this.storage.apagar(chave));
    this.garantirDrop();
    await Promise.all([this.produtos.carregar(), this.sessao.carregarUsuarios(), this.pedidos.carregar()]);
  }
}
