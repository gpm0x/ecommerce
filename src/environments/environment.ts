// PRODUÇÃO (ng build / Vercel): não há json-server no ar.
// apiUrl vazio liga o "modo local" do ApiService: as mesmas rotas
// (/produtos, /usuarios, /pedidos...) respondidas no próprio navegador,
// começando pelos dados de api/db.seed.json e gravando no localStorage.
export const environment = {
  apiUrl: ''
};
