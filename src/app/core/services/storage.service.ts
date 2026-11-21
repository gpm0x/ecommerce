import { Injectable, signal } from '@angular/core';

/* ===== STORAGE (localStorage) =====
   Guarda só o que é DESTE navegador: sessão, tema, carrinho e favoritos
   de quem ainda não entrou, "vistos recentemente" e o relógio do drop.
   Os dados da loja ficam na API (api/db.json).

   O signal "revisao" sobe a cada gravação — e também quando OUTRA aba
   muda uma chave (evento "storage"). Quem lê com ler() dentro de um
   computed() se atualiza sozinho. */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly revisao = signal(0);

  constructor() {
    window.addEventListener('storage', () => this.revisao.update(v => v + 1));
  }

  ler<T>(chave: string): T | null {
    this.revisao(); // registra a dependência para os computed()
    const bruto = localStorage.getItem(chave);
    if (!bruto) return null;
    try {
      return JSON.parse(bruto) as T;
    } catch {
      return null; // valor corrompido é tratado como vazio
    }
  }

  salvar(chave: string, valor: unknown): void {
    localStorage.setItem(chave, JSON.stringify(valor));
    this.revisao.update(v => v + 1);
  }

  apagar(chave: string): void {
    localStorage.removeItem(chave);
    this.revisao.update(v => v + 1);
  }

  chaves(): string[] {
    return Object.keys(localStorage);
  }
}
