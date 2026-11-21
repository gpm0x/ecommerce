import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { StorageService } from './storage.service';
import { SessaoService } from './sessao.service';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import { UiService } from './ui.service';

const CHAVE_VISITANTE = 'verso_favoritos_visitante';

/* ===== FAVORITOS =====
   Logado: coleção "favoritos" do api/db.json — { id: <id do usuário>, produtos: [ids] }.
   Visitante: localStorage. Ao entrar, os favoritos do visitante passam para a conta. */
@Injectable({ providedIn: 'root' })
export class FavoritosService {
  private storage = inject(StorageService);
  private sessao = inject(SessaoService);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private ui = inject(UiService);

  readonly ids = signal<number[]>([]);
  readonly total = computed(() => this.ids().length);
  private fila: Promise<unknown> = Promise.resolve();

  constructor() {
    effect(() => {
      const id = this.sessao.idUsuario();
      untracked(() => this.carregar(id));
    });
  }

  private async carregar(id: number | null): Promise<void> {
    const doVisitante = this.storage.ler<number[]>(CHAVE_VISITANTE) || [];
    if (id === null) {
      this.ids.set(doVisitante);
      return;
    }
    try {
      await this.fila;
      const doc = await this.api.buscar<{ id: number; produtos: number[] }>('favoritos', id);
      const lista = doc?.produtos ?? [];
      const novos = doVisitante.filter(f => !lista.includes(f));
      if (doVisitante.length) this.storage.apagar(CHAVE_VISITANTE);
      if (novos.length) this.salvar([...lista, ...novos]);
      else this.ids.set(lista);
    } catch {
      this.ids.set([]);
    }
  }

  private salvar(lista: number[]): void {
    this.ids.set(lista);
    const id = this.sessao.idUsuario();
    if (id === null) {
      this.storage.salvar(CHAVE_VISITANTE, lista);
      return;
    }
    this.fila = this.fila
      .then(() => this.api.salvar('favoritos', { id, produtos: lista }))
      .catch(() => this.toast.mostrar('Não foi possível salvar os favoritos na API.'));
  }

  ehFavorito(idProduto: number): boolean {
    return this.ids().includes(idProduto);
  }

  // REQUISITO 2: adiciona ou remove da base conforme o estado atual.
  // Dá o retorno visual (contador pulsando + toast) e devolve o novo estado.
  alternar(idProduto: number): boolean {
    const virou = !this.ehFavorito(idProduto);
    this.salvar(virou ? [...this.ids(), idProduto] : this.ids().filter(id => id !== idProduto));
    this.ui.pulsarFavoritos();
    this.toast.mostrar(virou ? 'Salvo nos favoritos' : 'Removido dos favoritos');
    return virou;
  }
}
