import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import seed from '../../../../api/db.seed.json';

/* ===== API =====
   Único lugar que conversa com o json-server (api/db.json).
   Cada "coleção" do db.json vira uma rota REST:
     GET    /produtos        lista
     GET    /produtos/5      um item
     POST   /produtos        cria (o json-server gera o id)
     PUT    /produtos/5      substitui
     DELETE /produtos/5      apaga

   MODO LOCAL (site publicado, ex.: Vercel): lá não existe json-server.
   Com environment.apiUrl vazio, as mesmas operações são feitas aqui
   mesmo, num "db.json" guardado no localStorage (chave verso_db),
   que começa com os dados de api/db.seed.json.                     */
type Item = { id: string | number } & Record<string, unknown>;
type Banco = Record<string, Item[]>;

const CHAVE_BANCO = 'verso_db';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private url = environment.apiUrl;
  private readonly local = !this.url;

  // true quando a API não respondeu (json-server desligado)
  readonly offline = signal(false);

  listar<T>(colecao: string): Promise<T[]> {
    if (this.local) return this.localmente(banco => banco[colecao] ?? []) as Promise<T[]>;
    return this.chamar(this.http.get<T[]>(this.rota(colecao)));
  }

  // Devolve null quando o item não existe.
  // Usa o filtro ?id= (lista vazia) em vez de /colecao/id (404 no console).
  async buscar<T>(colecao: string, id: string | number): Promise<T | null> {
    if (this.local) {
      return this.localmente(banco => (banco[colecao] ?? []).find(item => String(item.id) === String(id)) ?? null) as Promise<T | null>;
    }
    const achados = await this.chamar(this.http.get<T[]>(this.rota(colecao), { params: { id: String(id) } }));
    return achados[0] ?? null;
  }

  criar<T>(colecao: string, item: unknown): Promise<T> {
    if (this.local) return this.localmente(banco => this.criarLocal(banco, colecao, item as Partial<Item>), true) as Promise<T>;
    return this.chamar(this.http.post<T>(this.rota(colecao), item));
  }

  atualizar<T>(colecao: string, id: string | number, item: unknown): Promise<T> {
    if (this.local) {
      return this.localmente(banco => {
        const lista = banco[colecao] ?? [];
        const pos = lista.findIndex(atual => String(atual.id) === String(id));
        if (pos < 0) throw new Error(`${colecao}/${id} não encontrado`);
        lista[pos] = { ...(item as object), id: lista[pos].id } as Item;
        return lista[pos];
      }, true) as Promise<T>;
    }
    return this.chamar(this.http.put<T>(this.rota(colecao, id), item));
  }

  async remover(colecao: string, id: string | number): Promise<void> {
    if (this.local) {
      await this.localmente(banco => {
        banco[colecao] = (banco[colecao] ?? []).filter(item => String(item.id) !== String(id));
      }, true);
      return;
    }
    await this.chamar(this.http.delete(this.rota(colecao, id)));
  }

  // Grava um documento de id conhecido (ex.: o carrinho do usuário 3):
  // substitui se já existe; senão, cria.
  async salvar<T extends { id: string | number }>(colecao: string, item: T): Promise<T> {
    const existe = await this.buscar<T>(colecao, item.id);
    return existe ? this.atualizar<T>(colecao, item.id, item) : this.criar<T>(colecao, item);
  }

  private rota(colecao: string, id?: string | number): string {
    return id === undefined ? `${this.url}/${colecao}` : `${this.url}/${colecao}/${encodeURIComponent(String(id))}`;
  }

  private async chamar<T>(requisicao: Observable<T>): Promise<T> {
    try {
      const resposta = await firstValueFrom(requisicao);
      this.offline.set(false);
      return resposta;
    } catch (erro) {
      // status 0 = nem chegou ao servidor
      if (erro instanceof HttpErrorResponse && erro.status === 0) this.offline.set(true);
      throw erro;
    }
  }

  /* ----- modo local ----- */

  // Lê o banco, aplica a operação e (se mudou algo) grava de volta.
  // Devolve cópias, como uma API de verdade faria.
  private async localmente<R>(operacao: (banco: Banco) => R, grava = false): Promise<R> {
    const banco = this.lerBanco();
    const resultado = operacao(banco);
    if (grava) localStorage.setItem(CHAVE_BANCO, JSON.stringify(banco));
    return resultado === undefined ? resultado : structuredClone(resultado);
  }

  private lerBanco(): Banco {
    const bruto = localStorage.getItem(CHAVE_BANCO);
    if (bruto) {
      try {
        return JSON.parse(bruto) as Banco;
      } catch {
        // corrompido: recomeça pelos dados iniciais
      }
    }
    return structuredClone(seed) as unknown as Banco;
  }

  private criarLocal(banco: Banco, colecao: string, item: Partial<Item>): Item | { ok: true } {
    // POST /reset do api/server.js: volta aos dados iniciais
    if (colecao === 'reset') {
      for (const chave of Object.keys(banco)) delete banco[chave];
      Object.assign(banco, structuredClone(seed));
      return { ok: true };
    }
    const lista = (banco[colecao] ??= []);
    let id = item.id;
    if (id === undefined || id === null || id === '') {
      // como o json-server: próximo número livre
      id = lista.reduce((maior, atual) => Math.max(maior, Number(atual.id) || 0), 0) + 1;
    } else if (lista.some(atual => String(atual.id) === String(id))) {
      throw new Error(`${colecao}/${id} já existe`);
    }
    const novo = { ...item, id } as Item;
    lista.push(novo);
    return novo;
  }
}
