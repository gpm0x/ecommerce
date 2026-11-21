/* =========================================================
   API DO VERSO — json-server em cima do arquivo api/db.json
   Sem MySQL, sem Supabase: o "banco" é o próprio db.json.

   Rodar:  npm run api   (ou "npm run dev" para subir API + site)
   Rotas:  http://localhost:3000/produtos, /usuarios, /pedidos,
           /carrinhos, /favoritos, /cupons, /colecoes
           (GET, POST, PUT, PATCH e DELETE em cada uma)
   Extra:  POST /reset  -> volta o db.json para o db.seed.json
   ========================================================= */
const jsonServer = require('json-server');
const fs = require('fs');
const path = require('path');

const PORTA = 3000;
const DB = path.join(__dirname, 'db.json');
const SEED = path.join(__dirname, 'db.seed.json');

// primeira vez (ou db.json apagado): começa pelos dados iniciais
if (!fs.existsSync(DB)) fs.copyFileSync(SEED, DB);

const server = jsonServer.create();
const router = jsonServer.router(DB);

server.use(jsonServer.defaults()); // CORS, logs e corpo JSON

// Botão "Limpar e recriar" do dashboard
server.post('/reset', (_req, res) => {
  fs.copyFileSync(SEED, DB);
  router.db.read();
  res.json({ ok: true });
});

server.use(router);

// Editou o db.json à mão com a API ligada? Ele é relido sozinho,
// sem reiniciar o servidor (o --watch do json-server reinicia e derruba requisições).
fs.watchFile(DB, { interval: 500 }, () => {
  try {
    router.db.read();
  } catch (erro) {
    console.log('  db.json com JSON inválido, mantendo os dados anteriores:', erro.message);
  }
});

server.listen(PORTA, () => {
  console.log(`\n  API do VERSO em http://localhost:${PORTA}  (dados: api/db.json)\n`);
});
