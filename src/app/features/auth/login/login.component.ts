import { Component, ElementRef, OnDestroy, computed, inject, input, signal, viewChild, afterNextRender, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SessaoService } from '../../../core/services/sessao.service';
import { ToastService } from '../../../core/services/toast.service';
import { CONSUMIDORES_EXEMPLO, CONTAS_DEMO } from '../../../core/config/loja.config';
import { emailValido, forcaDaSenha, problemaDaSenha, problemaDoEmail, regrasDaSenha } from '../../../core/validators/conta.validators';
import { ReanimarDirective } from '../../../shared/directives/reanimar.directive';
import { RevelarDirective } from '../../../shared/directives/revelar.directive';

/* --- LOGIN / CADASTRO ---
   REQUISITO 1 + DIFERENCIAL: validação no código, erro na tela (sem alert). */
@Component({
  selector: 'app-login',
  imports: [FormsModule, ReanimarDirective, RevelarDirective],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  // estilos sem encapsulamento: classes como .btn e .card atravessam componentes,
  // como no CSS original
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnDestroy {
  private sessao = inject(SessaoService);
  private toast = inject(ToastService);
  private router = inject(Router);

  // ?voltar=/carrinho e ?aba=criar chegam como inputs (withComponentInputBinding)
  readonly voltar = input<string>();
  readonly aba = input<string>();

  readonly cadastro = signal(false);
  readonly contasDemo = CONTAS_DEMO;

  /* --- entrar --- */
  readonly loginEmail = signal('');
  readonly loginSenha = signal('');
  readonly erroLogin = signal('');
  readonly brilho = signal(0); // brilho nos campos preenchidos pelo acesso rápido

  /* --- criar conta --- */
  readonly cadNome = signal('');
  readonly cadEmail = signal('');
  readonly cadSenha = signal('');
  readonly cadSenha2 = signal('');
  readonly avisoEmail = signal('');
  readonly erroCadastro = signal('');

  // senha: marca cada regra cumprida e mostra a força enquanto digita
  readonly regras = computed(() => regrasDaSenha(this.cadSenha()));
  readonly forca = computed(() => forcaDaSenha(this.cadSenha()));
  readonly senhaInvalida = computed(() => this.cadSenha() !== '' && this.forca().classe !== 'forte');

  /* --- modal de acesso rápido --- */
  readonly modalVisivel = signal(false);
  readonly modalAberto = signal(false);
  private modal = viewChild<ElementRef<HTMLElement>>('modal');
  private btnEntrar = viewChild.required<ElementRef<HTMLButtonElement>>('btnEntrar');
  private campoCadEmail = viewChild.required<ElementRef<HTMLInputElement>>('campoCadEmail');
  private campoCadSenha = viewChild.required<ElementRef<HTMLInputElement>>('campoCadSenha');
  private focoAnterior: HTMLElement | null = null;

  constructor() {
    afterNextRender(() => {
      // veio do botão "Criar conta" do carrinho: abre direto na aba de cadastro
      const querCriarConta = this.aba() === 'criar';
      if (querCriarConta) this.cadastro.set(true);
      if (this.voltar() === '/carrinho') {
        this.toast.mostrar(querCriarConta
          ? 'Crie sua conta para finalizar o pedido. O carrinho fica guardado.'
          : 'Entre na sua conta para finalizar o pedido. O carrinho fica guardado.');
      }
      // o acesso rápido abre sozinho (menos quando a pessoa veio para se cadastrar)
      if (!querCriarConta) this.abrirModal();
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('sem-rolagem');
  }

  async entrar(evento: Event): Promise<void> {
    evento.preventDefault();
    const email = this.loginEmail().trim();
    if (!emailValido(email)) { this.erroLogin.set('Digite um e-mail válido.'); return; }
    if (this.loginSenha().length < 6) { this.erroLogin.set('A senha tem no mínimo 6 caracteres.'); return; }
    try {
      if (!await this.sessao.login(email, this.loginSenha())) { this.erroLogin.set('E-mail ou senha não conferem.'); return; }
    } catch {
      this.erroLogin.set('Não foi possível falar com a API. Ela está ligada?');
      return;
    }

    this.erroLogin.set('');
    this.toast.mostrar('Bem-vindo de volta!');
    setTimeout(() => this.irParaDestino(), 600);
  }

  // e-mail: avisa ao sair do campo e, depois disso, a cada letra digitada
  conferirEmail(): string {
    const problema = problemaDoEmail(this.cadEmail().trim());
    this.avisoEmail.set(problema);
    return problema;
  }

  emailDigitado(): void {
    if (this.avisoEmail()) this.conferirEmail();
  }

  async criarConta(evento: Event): Promise<void> {
    evento.preventDefault();
    const nome = this.cadNome().trim();
    const email = this.cadEmail().trim();
    const senha = this.cadSenha();
    const problemaEmail = this.conferirEmail();

    if (nome.length < 2) { this.erroCadastro.set('Escreva seu nome.'); return; }
    if (problemaEmail) { this.erroCadastro.set(problemaEmail); this.campoCadEmail().nativeElement.focus(); return; }
    if (problemaDaSenha(senha)) { this.erroCadastro.set(problemaDaSenha(senha)); this.campoCadSenha().nativeElement.focus(); return; }
    if (senha !== this.cadSenha2()) { this.erroCadastro.set('As duas senhas não são iguais.'); return; }

    try {
      await this.sessao.carregarUsuarios(); // confere contas criadas em outro navegador
      if (this.sessao.buscarPorEmail(email)) { this.erroCadastro.set('Esse e-mail já tem conta.'); return; }
      // grava na coleção "usuarios" do api/db.json (o id é gerado pela API)
      await this.sessao.cadastrar({ nome, email, senha, tipo: 'cliente' });
      await this.sessao.login(email, senha);
    } catch {
      this.erroCadastro.set('Não foi possível falar com a API. Ela está ligada?');
      return;
    }

    this.erroCadastro.set('');
    this.toast.mostrar('Conta criada. Boas compras!');
    setTimeout(() => this.irParaDestino(), 600);
  }

  // atalho pra apresentação: enche o cadastro com um consumidor pronto
  preencherExemplo(): void {
    const exemplo = CONSUMIDORES_EXEMPLO[Math.floor(Math.random() * CONSUMIDORES_EXEMPLO.length)];
    let email = exemplo.email;
    let n = 2;
    // se esse e-mail já virou conta, ganha um número no fim (ana2@..., ana3@...)
    while (this.sessao.buscarPorEmail(email)) {
      email = exemplo.email.replace('@', n + '@');
      n++;
    }
    this.cadNome.set(exemplo.nome);
    this.cadEmail.set(email);
    this.cadSenha.set(exemplo.senha);
    this.cadSenha2.set(exemplo.senha);
    this.erroCadastro.set('');
    this.conferirEmail();
    this.toast.mostrar('Dados de exemplo prontos. Senha: ' + exemplo.senha);
  }

  private irParaDestino(): void {
    const voltar = this.voltar();
    if (voltar) { this.router.navigateByUrl(voltar); return; }
    // o administrador cai direto no dashboard
    this.router.navigateByUrl(this.sessao.ehAdmin() ? '/admin' : '/');
  }

  /* --- ACESSO RÁPIDO DE DEMONSTRAÇÃO --- */

  abrirModal(): void {
    this.focoAnterior = document.activeElement as HTMLElement;
    this.modalVisivel.set(true);
    document.body.classList.add('sem-rolagem');
    // um quadro depois, para a transição de entrada acontecer
    requestAnimationFrame(() => {
      this.modalAberto.set(true);
      this.modal()?.nativeElement.querySelector<HTMLElement>('.perfil-demo')?.focus();
    });
  }

  fecharModal(focarEm?: HTMLElement): void {
    this.modalAberto.set(false);
    document.body.classList.remove('sem-rolagem');
    setTimeout(() => this.modalVisivel.set(false), 260);
    (focarEm || this.focoAnterior)?.focus();
  }

  // só PREENCHE os campos: quem entra de verdade é o botão "Entrar"
  escolherPerfil(conta: typeof CONTAS_DEMO[number]): void {
    this.cadastro.set(false);
    this.loginEmail.set(conta.email);
    this.loginSenha.set(conta.senha);
    this.erroLogin.set('');
    this.brilho.update(v => v + 1);
    this.fecharModal(this.btnEntrar().nativeElement);
    this.toast.mostrar('Perfil ' + conta.rotulo + ' preenchido. Confira e clique em Entrar.');
  }

  // Esc fecha; Tab fica preso dentro do modal
  teclaNoModal(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') { this.fecharModal(); return; }
    if (evento.key !== 'Tab') return;
    const lista = this.modal()!.nativeElement.querySelectorAll<HTMLElement>('button:not([disabled])');
    const primeiro = lista[0];
    const ultimo = lista[lista.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
  }
}
