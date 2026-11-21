import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; texto: string; }

// DIFERENCIAL 5: toasts no lugar de alert()
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private contador = 0;

  mostrar(texto: string): void {
    const id = ++this.contador;
    this.toasts.update(lista => [...lista, { id, texto }]);
    setTimeout(() => this.toasts.update(lista => lista.filter(t => t.id !== id)), 3000);
  }
}
