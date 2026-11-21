import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessaoService } from '../services/sessao.service';

// DIFERENCIAL 4: rotas protegidas.
// Sem login, vai para /login?voltar=<página> e volta depois de entrar.
export const exigirLogin: CanActivateFn = (_rota, estado) => {
  if (inject(SessaoService).usuario()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { voltar: estado.url } });
};

// Só o administrador entra; cliente logado volta para a home.
export const exigirAdmin: CanActivateFn = (_rota, estado) => {
  const usuario = inject(SessaoService).usuario();
  const router = inject(Router);
  if (usuario?.tipo === 'admin') return true;
  if (!usuario) return router.createUrlTree(['/login'], { queryParams: { voltar: estado.url } });
  return router.createUrlTree(['/']);
};
