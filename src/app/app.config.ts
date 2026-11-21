import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { DadosService } from './core/services/dados.service';
import { TemaService } from './core/services/tema.service';
import { ProdutosService } from './core/services/produtos.service';
import { SessaoService } from './core/services/sessao.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),    // conversa com a API (json-server)
    provideRouter(
      routes,
      withComponentInputBinding(),   // :id da rota chega como input() no componente
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      withViewTransitions()          // fade entre páginas
    ),
    // antes da primeira tela: aplica o tema (sem piscar) e busca o catálogo e os usuários na API
    provideAppInitializer(async () => {
      const produtos = inject(ProdutosService);
      const sessao = inject(SessaoService);
      inject(TemaService).aplicar();
      inject(DadosService).garantirDrop();
      try {
        await Promise.all([produtos.carregar(), sessao.carregarUsuarios()]);
      } catch {
        // API desligada: o app abre mesmo assim e mostra o aviso no topo
      }
    })
  ]
};
