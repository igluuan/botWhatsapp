export const helpResponse = (): string => {
  return [
    "🤖 *O que eu sei fazer:*",
    "",
    "*Registrar gasto*",
    "→ uber 20",
    "→ mercado 120 no débito",
    "→ almocei 35",
    "",
    "*Registrar receita*",
    "→ recebi 3000 salário",
    "",
    "*Consultar*",
    "→ quanto gastei hoje?",
    "→ gastos da semana",
    "→ extrato",
    "",
    "*Editar ou corrigir*",
    "→ muda categoria #a1b2c3d4 pra transporte",
    "→ corrige valor #a1b2c3d4 pra 35",
    "→ apaga #a1b2c3d4",
  ].join("\n");
};
