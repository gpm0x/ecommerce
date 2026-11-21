import { Routes } from '@angular/router';
import { exigirAdmin, exigirLogin } from './core/guards/auth.guard';

// Cada página antiga (index.html, pages/*.html) virou uma rota.
// loadComponent: o código de cada página só é baixado quando ela é aberta.
export const routes: Routes = [
  { path: '', title: 'VERSO — Streetwear direto da rua',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'produtos', title: 'Catálogo — VERSO',
    loadComponent: () => import('./features/catalogo/catalogo.component').then(m => m.CatalogoComponent) },
  { path: 'produto/:id', title: 'Produto — VERSO',
    loadComponent: () => import('./features/produto-detalhe/produto-detalhe.component').then(m => m.ProdutoDetalheComponent) },
  { path: 'carrinho', title: 'Carrinho — VERSO',
    loadComponent: () => import('./features/carrinho/carrinho.component').then(m => m.CarrinhoComponent) },
  { path: 'favoritos', title: 'Favoritos — VERSO', canActivate: [exigirLogin],
    loadComponent: () => import('./features/favoritos/favoritos.component').then(m => m.FavoritosComponent) },
  { path: 'login', title: 'Entrar ou criar conta — VERSO',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'admin', title: 'Dashboard — VERSO', canActivate: [exigirAdmin],
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent) },
  { path: 'relatorio', title: 'Relatório — VERSO', canActivate: [exigirAdmin],
    loadComponent: () => import('./features/relatorio/relatorio.component').then(m => m.RelatorioComponent) },
  { path: '**', redirectTo: '' }
];
