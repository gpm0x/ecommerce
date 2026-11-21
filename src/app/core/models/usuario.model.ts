export type TipoUsuario = 'admin' | 'cliente';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string;
  tipo: TipoUsuario;
}

// A sessão guarda só o necessário — nunca a senha
export type Sessao = Omit<Usuario, 'senha'>;
