/* ===== VALIDADORES DE CONTA =====
   Regras de e-mail e senha usadas no login e no cadastro. */

// Devolve o que está errado no e-mail, ou "" se estiver certo.
export function problemaDoEmail(email: string): string {
  const arroba = email.indexOf('@');
  const dominio = email.slice(arroba + 1);
  if (email === '') return 'Digite seu e-mail.';
  if (email.indexOf(' ') !== -1) return 'E-mail inválido: não pode ter espaços.';
  if (arroba === -1) return 'E-mail inválido: está faltando o @ (ex.: voce@email.com).';
  if (email.indexOf('@', arroba + 1) !== -1) return 'E-mail inválido: use só um @.';
  if (arroba === 0) return 'E-mail inválido: falta o nome antes do @.';
  const ponto = dominio.lastIndexOf('.');
  if (ponto < 1 || ponto === dominio.length - 1) {
    return 'E-mail inválido: falta o domínio depois do @ (ex.: @gmail.com).';
  }
  return '';
}

export function emailValido(email: string): boolean {
  return problemaDoEmail(email) === '';
}

export interface RegrasSenha { tamanho: boolean; maiuscula: boolean; especial: boolean; }

// Padrão da senha: 6+ caracteres, 1 letra maiúscula e 1 caractere especial
export function regrasDaSenha(senha: string): RegrasSenha {
  return {
    tamanho: senha.length >= 6,
    maiuscula: /[A-ZÀ-Ý]/.test(senha),
    especial: /[^A-Za-zÀ-ÿ0-9\s]/.test(senha)
  };
}

export function forcaDaSenha(senha: string): { classe: string; texto: string } {
  const r = regrasDaSenha(senha);
  const cumpridas = Number(r.tamanho) + Number(r.maiuscula) + Number(r.especial);
  if (cumpridas === 3) return { classe: 'forte', texto: 'Senha forte: segue o padrão.' };
  if (senha.length < 5 || cumpridas <= 1) return { classe: 'muito-fraca', texto: 'Senha muito fraca: não segue o padrão.' };
  return { classe: 'fraca', texto: 'Senha fraca: não segue o padrão.' };
}

// Devolve a mensagem de erro da senha, ou "" se ela seguir o padrão.
export function problemaDaSenha(senha: string): string {
  const r = regrasDaSenha(senha);
  const faltando: string[] = [];
  if (!r.tamanho) faltando.push('mínimo de 6 caracteres');
  if (!r.maiuscula) faltando.push('uma letra maiúscula');
  if (!r.especial) faltando.push('um caractere especial');
  if (faltando.length === 0) return '';
  return forcaDaSenha(senha).texto + ' Falta: ' + faltando.join(', ') + '.';
}
