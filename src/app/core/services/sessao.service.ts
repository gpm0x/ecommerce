import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { ApiService } from './api.service';
import { Sessao, Usuario } from '../models';

/* ===== SESSÃO E USUÁRIOS =====
   Usuários: coleção "usuarios" do api/db.json.
   Sessão (quem está logado neste navegador): localStorage. */
@Injectable({ providedIn: 'root' })
export class SessaoService {
  private storage = inject(StorageService);
  private api = inject(ApiService);

  readonly usuario = computed(() => this.storage.ler<Sessao>('verso_sessao'));
  // só o id: não muda quando outras chaves do localStorage mudam
  readonly idUsuario = computed(() => this.usuario()?.id ?? null);
  readonly ehAdmin = computed(() => this.usuario()?.tipo === 'admin');

  readonly usuarios = signal<Usuario[]>([]);
  readonly clientes = computed(() => this.usuarios().filter(u => u.tipo !== 'admin'));

  async carregarUsuarios(): Promise<void> {
    this.usuarios.set(await this.api.listar<Usuario>('usuarios'));
  }

  buscarPorEmail(email: string): Usuario | null {
    return this.usuarios().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  // Cadastra um usuário novo (o json-server gera o id)
  async cadastrar(dados: Omit<Usuario, 'id'>): Promise<Usuario> {
    const novo = await this.api.criar<Usuario>('usuarios', dados);
    this.usuarios.update(lista => [...lista, novo]);
    return novo;
  }

  async login(email: string, senha: string): Promise<boolean> {
    await this.carregarUsuarios(); // pega contas criadas em outro navegador
    const usuario = this.buscarPorEmail(email);
    if (!usuario || usuario.senha !== senha) return false;
    const { senha: _, ...sessao } = usuario; // a sessão nunca guarda a senha
    this.storage.salvar('verso_sessao', sessao);
    return true;
  }

  logout(): void {
    this.storage.apagar('verso_sessao');
  }
}
